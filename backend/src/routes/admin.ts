import { Router } from 'express';
import { AccountStatus, ProductApproval, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { adminOnly } from '../middleware/auth.js';
import { serializeProduct, serializeUser } from '../utils/serializers.js';

export const adminRouter = Router();
adminRouter.use(...adminOnly);
const pageQuery = z.object({ take: z.coerce.number().int().min(1).max(100).default(50), skip: z.coerce.number().int().min(0).max(100_000).default(0) });
adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [buyers, sellers, pendingSellers, products, pendingProducts, orders, productReports, buyerReports, sellerReports] = await Promise.all([
      prisma.user.count({ where: { role: Role.BUYER } }), prisma.user.count({ where: { role: Role.SELLER } }),
      prisma.user.count({ where: { role: Role.SELLER, status: AccountStatus.PENDING } }), prisma.product.count(),
      prisma.product.count({ where: { approvalStatus: ProductApproval.PENDING_APPROVAL } }), prisma.order.count(),
      prisma.productReport.count({ where: { status: 'pending' } }), prisma.buyerReport.count({ where: { status: 'pending' } }), prisma.sellerReport.count({ where: { status: 'pending' } }),
    ]);
    return res.json({ buyers, sellers, pendingSellers, products, pendingProducts, orders, pendingReports: productReports + buyerReports + sellerReports });
  } catch (error) { return next(error); }
});
adminRouter.get('/users', async (req, res, next) => {
  try {
    const query = pageQuery.extend({ role: z.nativeEnum(Role).optional(), status: z.nativeEnum(AccountStatus).optional() }).parse(req.query);
    const users = await prisma.user.findMany({ where: { role: query.role, status: query.status }, orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip });
    return res.json(users.map(serializeUser));
  } catch (error) { return next(error); }
});
adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'REJECTED']) }).strict().parse(req.body);
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.role === Role.SUPER_ADMIN) return res.status(403).json({ error: 'Super Admin status cannot be changed through this endpoint.' });
    const user = await prisma.user.update({ where: { id: target.id }, data: { status } });
    if (status !== AccountStatus.ACTIVE) await prisma.session.deleteMany({ where: { userId: user.id } });
    return res.json({ user: serializeUser(user) });
  } catch (error) { return next(error); }
});
adminRouter.get('/products/pending', async (req, res, next) => {
  try {
    const query = pageQuery.parse(req.query);
    const products = await prisma.product.findMany({
      where: { approvalStatus: ProductApproval.PENDING_APPROVAL },
      include: { seller: { select: { id: true, fullName: true, businessName: true } }, reviews: { select: { rating: true } } },
      orderBy: { createdAt: 'asc' }, take: query.take, skip: query.skip,
    });
    return res.json(products.map(serializeProduct));
  } catch (error) { return next(error); }
});
adminRouter.patch('/products/:id/approval', async (req, res, next) => {
  try {
    const body = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).strict().parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { approvalStatus: body.status }, include: { seller: { select: { id: true, fullName: true, businessName: true } } } });
    return res.json(serializeProduct(product));
  } catch (error) { return next(error); }
});
adminRouter.get('/reports', async (req, res, next) => {
  try {
    const query = pageQuery.extend({ status: z.enum(['pending', 'reviewed', 'resolved', 'approved', 'rejected']).optional() }).parse(req.query);
    const [products, buyers, sellers] = await Promise.all([
      prisma.productReport.findMany({ where: { status: query.status }, include: { product: true, reporter: { select: { id: true, fullName: true, phone: true } } }, orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip }),
      prisma.buyerReport.findMany({ where: { status: query.status }, include: { buyer: { select: { id: true, fullName: true, phone: true } }, seller: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip }),
      prisma.sellerReport.findMany({ where: { status: query.status }, include: { buyer: { select: { id: true, fullName: true } }, seller: { select: { id: true, fullName: true, phone: true } } }, orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip }),
    ]);
    return res.json({ products, buyers, sellers });
  } catch (error) { return next(error); }
});
adminRouter.patch('/reports/:type/:id', async (req, res, next) => {
  try {
    const { status, adminNotes } = z.object({ status: z.enum(['pending', 'reviewed', 'resolved', 'approved', 'rejected']), adminNotes: z.string().trim().max(2000).optional() }).strict().parse(req.body);
    if (req.params.type === 'product') return res.json(await prisma.productReport.update({ where: { id: req.params.id }, data: { status, adminNotes } }));
    if (req.params.type === 'buyer') return res.json(await prisma.buyerReport.update({ where: { id: req.params.id }, data: { status, adminNotes } }));
    if (req.params.type === 'seller') return res.json(await prisma.sellerReport.update({ where: { id: req.params.id }, data: { status, adminNotes } }));
    return res.status(400).json({ error: 'Report type must be product, buyer, or seller.' });
  } catch (error) { return next(error); }
});
