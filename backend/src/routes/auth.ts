import { Router, type Request, type Response, type NextFunction } from 'express';
import { AccountStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env, isProduction } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializers.js';

export const authRouter = Router();
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120), businessName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(24), whatsAppNumber: z.string().trim().min(7).max(24).optional(),
  email: z.string().trim().email().max(254), password: z.string().min(10).max(128),
  address: z.string().trim().max(300).optional(), businessAddress: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(),
  productCategory: z.string().trim().max(120).optional(), accountType: z.enum(['buyer', 'seller']), profileImage: z.string().url().max(1000).optional(),
}).strict();
const loginSchema = z.object({ identifier: z.string().trim().min(1).max(254), password: z.string().min(1).max(128) }).strict();
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string) => value.replace(/[\s()-]/g, '');
const cookieOptions = (expires?: Date) => ({
  httpOnly: true, secure: isProduction, sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax', path: '/' as const,
  ...(expires ? { expires } : {}),
});
async function issueSession(userId: string, res: Response) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  await prisma.session.create({ data: { userId, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt } });
  res.cookie(env.SESSION_COOKIE_NAME, token, cookieOptions(expiresAt));
}

// Both account roles use password-only signup. The role is derived from accountType,
// never accepted from a role field, and Super Admin cannot be self-registered.
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const role = data.accountType === 'seller' ? Role.SELLER : Role.BUYER;
    if (role === Role.SELLER && (!data.businessName || !data.productCategory)) {
      return res.status(400).json({ error: 'Seller registration requires a business name and product category.' });
    }
    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);
    if (await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] }, select: { id: true } })) {
      return res.status(409).json({ error: 'An account with this email or phone already exists.' });
    }
    const user = await prisma.user.create({ data: {
      fullName: data.fullName, businessName: role === Role.SELLER ? data.businessName : undefined,
      phone, whatsAppNumber: data.whatsAppNumber ? normalizePhone(data.whatsAppNumber) : phone,
      email, passwordHash: await bcrypt.hash(data.password, 12),
      address: data.address || data.businessAddress || '',
      businessAddress: role === Role.SELLER ? (data.businessAddress || data.address) : undefined,
      city: data.city || 'Kano City', state: data.state || 'Kano State', area: data.area || 'Kano Municipal',
      productCategory: role === Role.SELLER ? data.productCategory : undefined,
      profileImage: data.profileImage, role,
      status: role === Role.BUYER ? AccountStatus.ACTIVE : AccountStatus.PENDING,
    } });
    if (role === Role.BUYER) await issueSession(user.id, res);
    return res.status(201).json({ success: true, user: serializeUser(user), ...(role === Role.SELLER ? { message: 'Seller account awaits administrator approval.' } : {}) });
  } catch (error) { return next(error); }
});

async function login(req: Request, res: Response, next: NextFunction, expectedRole?: Role) {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const clean = identifier.includes('@') ? normalizeEmail(identifier) : normalizePhone(identifier);
    const user = await prisma.user.findFirst({ where: { OR: [{ email: clean }, { phone: clean }] } });
    // Do a password hash check even for unknown/wrong-role accounts to reduce timing leaks.
    const hashToCheck = user?.passwordHash ?? '$2a$12$C6UzMDM.H6dfI/f/IKcEe.5JYKoM2e9sX.YXxTzFNtNrdL7vG4S5e';
    const passwordMatches = await bcrypt.compare(password, hashToCheck).catch(() => false);
    if (!user || (expectedRole && user.role !== expectedRole) || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (user.status !== AccountStatus.ACTIVE) {
      return res.status(403).json({ error: user.status === AccountStatus.PENDING ? 'Account approval is pending.' : `Account is ${user.status.toLowerCase()}.` });
    }
    await issueSession(user.id, res);
    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) { return next(error); }
}
// Keep /login for existing clients and provide explicit role-specific routes.
authRouter.post('/login', (req, res, next) => login(req, res, next));
authRouter.post('/buyer/login', (req, res, next) => login(req, res, next, Role.BUYER));
authRouter.post('/seller/login', (req, res, next) => login(req, res, next, Role.SELLER));
authRouter.post('/admin/login', (req, res, next) => login(req, res, next, Role.SUPER_ADMIN));

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
    return user ? res.json({ user: serializeUser(user) }) : res.status(401).json({ error: 'Authentication required.' });
  } catch (error) { return next(error); }
});
// Logout is idempotent: revoke any presented session and always clear the cookie.
authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (typeof token === 'string' && token.length >= 32 && token.length <= 128) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await prisma.session.deleteMany({ where: { tokenHash } });
    }
    res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions());
    return res.json({ success: true });
  } catch (error) { return next(error); }
});
