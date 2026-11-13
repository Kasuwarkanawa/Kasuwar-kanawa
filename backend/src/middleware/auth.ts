import { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { AccountStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

export interface AuthenticatedUser { id: string; role: Role; status: AccountStatus; fullName: string; email: string; phone: string }
declare global { namespace Express { interface Request { authUser?: AuthenticatedUser; sessionId?: string } } }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (!token || typeof token !== 'string') return res.status(401).json({ error: 'Authentication required.' });
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!session || session.expiresAt <= new Date() || session.user.status !== AccountStatus.ACTIVE) {
      if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
      return res.status(401).json({ error: 'Session is invalid or expired.' });
    }
    req.authUser = { id: session.user.id, role: session.user.role, status: session.user.status, fullName: session.user.fullName, email: session.user.email, phone: session.user.phone };
    req.sessionId = session.id;
    return next();
  } catch (error) { return next(error); }
}
export function allowRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.authUser.role)) return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    return next();
  };
}
export const buyerOnly = [requireAuth, allowRoles(Role.BUYER)];
export const sellerOnly = [requireAuth, allowRoles(Role.SELLER)];
export const adminOnly = [requireAuth, allowRoles(Role.SUPER_ADMIN)];
