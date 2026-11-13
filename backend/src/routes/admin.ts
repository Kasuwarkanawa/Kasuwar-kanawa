import { Router } from 'express';
import { z } from 'zod';
import { AccountStatus, ProductApproval, Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { adminOnly } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializers.js';

export const adminRouter = Router();
adminRouter.use(...adminOnly);
adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [buyers, sellers, pendingSellers, products, pendingProducts, orders, reports] = await Promise.all([
      prisma.user.count({ where: { role: Role.BUYER } }), prisma.user.count({ where: { role: Role.SELLER } }),
      prisma.user.count({ where: { role: Role.SELLER, status: AccountStatus.PENDING } }), prisma.product.count(),
      prisma.product.count({ where: { approvalStatus: ProductApproval.PENDING_APPROVAL } }), prisma.order.count(),
      prisma.productReport.count({ where: { status: 'pending' } }),
    ]);
    return res.json({ buyers, sellers, pendingSellers, products, pendingProducts, orders, pendingReports: reports });
  } catch (error) { return next(error); }
});
adminRouter.get('/users', async (req, res, next) => {
  try {
    const query = z.object({ role: z.nativeEnum(Role).optional(), status: z.nativeEnum(AccountStatus).optional(), take: z.coerce.number().int().min(1).max(100).default(50), skip: z.coerce.number().int().min(0).default(0) }).parse(req.query);
    const users = await prisma.user.findMany({ where: { role: query.role, status: query.status }, orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip });
    return res.json(users.map(serializeUser));
  } catch (error) { return next(error); }
});
adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'REJECTED']) }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
    if (status !== 'ACTIVE') await prisma.session.deleteMany({ where: { userId: user.id } });
    return res.json({ user: serializeUser(user) });
  } catch (error) { return next(error); }
});
adminRouter.get('/products/pending', async (_req, res, next) => {
  try { return res.json(await prisma.product.findMany({ where: { approvalStatus: ProductApproval.PENDING_APPROVAL }, include: { seller: { select: { id: true, fullName: true, businessName: true } } }, orderBy: { createdAt: 'asc' } })); }
  catch (error) { return next(error); }
});
adminRouter.patch('/products/:id/approval', async (req, res, next) => {
  try {
    const body = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { approvalStatus: body.status } });
    return res.json(product);
  } catch (error) { return next(error); }
});
adminRouter.get('/reports', async (req, res, next) => {
  try {
    const status = req.query.status ? z.enum(['pending', 'reviewed', 'resolved', 'approved', 'rejected']).parse(req.query.status) : undefined;
    const [products, buyers, sellers] = await Promise.all([
      prisma.productReport.findMany({ where: { status }, include: { product: true, reporter: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.buyerReport.findMany({ where: { status }, include: { buyer: { select: { id: true, fullName: true } }, seller: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.sellerReport.findMany({ where: { status }, include: { buyer: { select: { id: true, fullName: true } }, seller: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } }),
    ]);
    return res.json({ products, buyers, sellers });
  } catch (error) { return next(error); }
});
adminRouter.patch('/reports/:type/:id', async (req, res, next) => {
  try {
    const { status, adminNotes } = z.object({ status: z.enum(['pending', 'reviewed', 'resolved', 'approved', 'rejected']), adminNotes: z.string().trim().max(2000).optional() }).parse(req.body);
    const model = req.params.type === 'product' ? prisma.productReport : req.params.type === 'buyer' ? prisma.buyerReport : req.params.type === 'seller' ? prisma.sellerReport : null;
    if (!model) return res.status(400).json({ error: 'Report type must be product, buyer, or seller.' });
    return res.json(await model.update({ where: { id: req.params.id }, data: { status, adminNotes } }));
  } catch (error) { return next(error); }
});
