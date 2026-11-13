import { Router } from 'express';
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
  fullName: z.string().trim().min(2).max(120), businessName: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(7).max(24), whatsAppNumber: z.string().trim().max(24).optional(),
  email: z.string().trim().email().max(254), password: z.string().min(10).max(128),
  address: z.string().trim().max(300).optional(), businessAddress: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(),
  productCategory: z.string().trim().max(120).optional(), accountType: z.enum(['buyer', 'seller']), profileImage: z.string().url().max(1000).optional(),
});
const loginSchema = z.object({ identifier: z.string().trim().min(1).max(254), password: z.string().min(1).max(128) });
const emailNorm = (email: string) => email.trim().toLowerCase();
const phoneNorm = (phone: string) => phone.replace(/[\s()-]/g, '');
function setSessionCookie(res: import('express').Response, token: string, expires: Date) {
  res.cookie(env.SESSION_COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', expires, path: '/' });
}
async function createSession(userId: string, res: import('express').Response) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86400_000);
  await prisma.session.create({ data: { userId, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt } });
  setSessionCookie(res, token, expiresAt);
}
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (data.accountType === 'seller' && (!data.businessName || !data.productCategory)) return res.status(400).json({ error: 'Seller registration requires a business name and product category.' });
    const email = emailNorm(data.email); const phone = phoneNorm(data.phone);
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] }, select: { id: true } });
    if (existing) return res.status(409).json({ error: 'An account with this email or phone already exists.' });
    const role = data.accountType === 'seller' ? Role.SELLER : Role.BUYER;
    const user = await prisma.user.create({ data: {
      fullName: data.fullName, businessName: data.businessName, phone,
      whatsAppNumber: data.whatsAppNumber ? phoneNorm(data.whatsAppNumber) : phone,
      email, passwordHash: await bcrypt.hash(data.password, 12), address: data.address || data.businessAddress || '',
      businessAddress: role === Role.SELLER ? (data.businessAddress || data.address) : undefined,
      city: data.city || 'Kano City', state: data.state || 'Kano State', area: data.area || 'Kano Municipal',
      productCategory: data.productCategory, profileImage: data.profileImage, role,
      status: role === Role.BUYER ? AccountStatus.ACTIVE : AccountStatus.PENDING,
    } });
    if (role === Role.BUYER) await createSession(user.id, res);
    return res.status(201).json({ success: true, user: serializeUser(user), message: role === Role.SELLER ? 'Seller account awaits administrator approval.' : undefined });
  } catch (error) { return next(error); }
});
async function login(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction, expectedRole?: Role) {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const clean = identifier.includes('@') ? emailNorm(identifier) : phoneNorm(identifier);
    const user = await prisma.user.findFirst({ where: { OR: [{ email: clean }, { phone: clean }] } });
    if (!user || (expectedRole && user.role !== expectedRole) || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.status !== AccountStatus.ACTIVE) return res.status(403).json({ error: user.status === AccountStatus.PENDING ? 'Account approval is pending.' : `Account is ${user.status.toLowerCase()}.` });
    await createSession(user.id, res);
    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) { return next(error); }
}
authRouter.post('/login', (req, res, next) => login(req, res, next));
authRouter.post('/admin/login', (req, res, next) => login(req, res, next, Role.SUPER_ADMIN));
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } }); return user ? res.json({ user: serializeUser(user) }) : res.status(401).json({ error: 'Authentication required.' }); }
  catch (error) { return next(error); }
});
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await prisma.session.delete({ where: { id: req.sessionId! } });
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});
