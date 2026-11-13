import { Router, Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { AccountStatus, OtpChannel, Role } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { env, isProduction } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { generateOtp, hashOtp, sendOtp, verifyOtp } from '../services/otp.js';
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
function setSessionCookie(res: Response, token: string, expires: Date) {
  res.cookie(env.SESSION_COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', expires, path: '/' });
}
async function createSession(userId: string, res: Response) {
  const token = randomBytes(32).toString('base64url'); const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86400_000);
  await prisma.session.create({ data: { userId, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt } });
  setSessionCookie(res, token, expiresAt);
}
async function issueChallenge(email: string, phone: string, channel: OtpChannel, recipient: string) {
  const last = await prisma.verificationChallenge.findFirst({ where: { email, phone, channel, consumedAt: null }, orderBy: { createdAt: 'desc' } });
  if (last && Date.now() - last.lastSentAt.getTime() < env.OTP_RESEND_SECONDS * 1000) throw Object.assign(new Error('Please wait before requesting another verification code.'), { statusCode: 429 });
  const code = generateOtp();
  await prisma.verificationChallenge.updateMany({ where: { email, phone, channel, consumedAt: null }, data: { consumedAt: new Date() } });
  await prisma.verificationChallenge.create({ data: { email, phone, channel, codeHash: hashOtp(email, phone, channel, code), expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000), lastSentAt: new Date() } });
  await sendOtp(channel, recipient, code);
}
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (data.accountType === 'seller' && (!data.businessName || !data.productCategory)) return res.status(400).json({ error: 'Seller registration requires a business name and product category.' });
    const email = emailNorm(data.email); const phone = phoneNorm(data.phone);
    if (await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } })) return res.status(409).json({ error: 'An account with this email or phone already exists.' });
    const user = await prisma.user.create({ data: {
      fullName: data.fullName, businessName: data.businessName, phone, whatsAppNumber: data.whatsAppNumber ? phoneNorm(data.whatsAppNumber) : phone,
      email, passwordHash: await bcrypt.hash(data.password, 12), address: data.address || data.businessAddress || '',
      businessAddress: data.accountType === 'seller' ? (data.businessAddress || data.address) : undefined,
      city: data.city || 'Kano City', state: data.state || 'Kano State', area: data.area || 'Kano Municipal',
      productCategory: data.productCategory, profileImage: data.profileImage,
      role: data.accountType === 'seller' ? Role.SELLER : Role.BUYER, status: AccountStatus.PENDING,
    } });
    await issueChallenge(email, phone, OtpChannel.EMAIL, email);
    await issueChallenge(email, phone, OtpChannel.PHONE, phone);
    return res.status(202).json({ success: true, verificationRequired: ['email', 'phone'], message: 'Verification codes sent to your email and phone.' });
  } catch (error) { return next(error); }
});
authRouter.post('/register/verify', async (req, res, next) => {
  try {
    const data = z.object({ email: z.string().email(), phone: z.string().min(7), emailCode: z.string().regex(/^\d{6}$/), phoneCode: z.string().regex(/^\d{6}$/) }).parse(req.body);
    const email = emailNorm(data.email); const phone = phoneNorm(data.phone);
    const user = await prisma.user.findFirst({ where: { email, phone } });
    if (!user || user.status !== AccountStatus.PENDING) return res.status(404).json({ error: 'Pending registration was not found.' });
    const entries = [[OtpChannel.EMAIL, data.emailCode], [OtpChannel.PHONE, data.phoneCode]] as const;
    for (const [channel, code] of entries) {
      const challenge = await prisma.verificationChallenge.findFirst({ where: { email, phone, channel, consumedAt: null }, orderBy: { createdAt: 'desc' } });
      if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= env.OTP_MAX_ATTEMPTS) return res.status(400).json({ error: 'Verification code is expired or has reached its attempt limit.' });
      if (!verifyOtp(email, phone, channel, code, challenge.codeHash)) { await prisma.verificationChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } }); return res.status(400).json({ error: 'Verification code is incorrect.' }); }
      await prisma.verificationChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    }
    const activeStatus = user.role === Role.BUYER ? AccountStatus.ACTIVE : AccountStatus.PENDING;
    const verified = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, phoneVerified: true, status: activeStatus } });
    if (activeStatus === AccountStatus.ACTIVE) await createSession(user.id, res);
    return res.json({ success: true, user: serializeUser(verified), message: activeStatus === AccountStatus.PENDING ? 'Seller account awaits administrator approval.' : undefined });
  } catch (error) { return next(error); }
});
authRouter.post('/register/resend', async (req, res, next) => {
  try {
    const data = z.object({ email: z.string().email(), phone: z.string().min(7), channel: z.enum(['email', 'phone']) }).parse(req.body);
    const email = emailNorm(data.email); const phone = phoneNorm(data.phone);
    const user = await prisma.user.findFirst({ where: { email, phone, status: AccountStatus.PENDING } });
    if (!user) return res.status(404).json({ error: 'Pending registration was not found.' });
    const channel = data.channel === 'email' ? OtpChannel.EMAIL : OtpChannel.PHONE;
    await issueChallenge(email, phone, channel, channel === OtpChannel.EMAIL ? email : phone);
    return res.status(202).json({ success: true });
  } catch (error) { return next(error); }
});
async function login(req: Request, res: Response, next: NextFunction, expectedRole?: Role) {
  try {
    const { identifier, password } = loginSchema.parse(req.body); const clean = identifier.includes('@') ? emailNorm(identifier) : phoneNorm(identifier);
    const user = await prisma.user.findFirst({ where: { OR: [{ email: clean }, { phone: clean }] } });
    if (!user || (expectedRole && user.role !== expectedRole) || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials.' });
    if (user.status !== AccountStatus.ACTIVE) return res.status(403).json({ error: user.status === AccountStatus.PENDING ? 'Account verification or approval is pending.' : `Account is ${user.status.toLowerCase()}.` });
    if (!user.emailVerified || !user.phoneVerified) return res.status(403).json({ error: 'Email and phone verification are required.' });
    await createSession(user.id, res); return res.json({ success: true, user: serializeUser(user) });
  } catch (error) { return next(error); }
}
authRouter.post('/login', (req, res, next) => login(req, res, next));
authRouter.post('/admin/login', (req, res, next) => login(req, res, next, Role.SUPER_ADMIN));
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } }); return user ? res.json({ user: serializeUser(user) }) : res.status(401).json({ error: 'Authentication required.' }); }
  catch (error) { return next(error); }
});
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try { await prisma.session.delete({ where: { id: req.sessionId! } }); res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' }); return res.json({ success: true }); }
  catch (error) { return next(error); }
});
