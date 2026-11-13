import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { serializeProduct } from '../utils/serializers.js';
import { AccountStatus, ProductApproval, Role } from '@prisma/client';
import { requireAuth, allowRoles } from '../middleware/auth.js';

export const catalogRouter = Router();
const productInclude = { seller: { select: { id: true, fullName: true, businessName: true, phone: true, whatsAppNumber: true } }, reviews: { select: { rating: true } } } as const;
catalogRouter.get('/products', async (req, res, next) => {
  try {
    const query = z.object({ category: z.string().optional(), search: z.string().optional(), sellerId: z.string().optional(), approvedOnly: z.coerce.boolean().default(true), take: z.coerce.number().int().min(1).max(100).default(50), skip: z.coerce.number().int().min(0).default(0) }).parse(req.query);
    const products = await prisma.product.findMany({ where: { ...(query.approvedOnly ? { approvalStatus: ProductApproval.APPROVED } : {}), ...(query.category ? { category: query.category } : {}), ...(query.sellerId ? { sellerId: query.sellerId } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { category: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] } : {}) }, include: productInclude, orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip });
    return res.json(products.map(serializeProduct));
  } catch (error) { return next(error); }
});
catalogRouter.get('/products/:id', async (req, res, next) => {
  try { const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { ...productInclude, reviews: { include: { buyer: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } } } }); if (!product || product.approvalStatus !== ProductApproval.APPROVED) return res.status(404).json({ error: 'Product not found.' }); return res.json(serializeProduct(product)); }
  catch (error) { return next(error); }
});
catalogRouter.get('/categories', async (_req, res, next) => { try { const cats = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } }); return res.json(cats.map(({ _count, ...cat }) => ({ ...cat, itemCount: _count.products }))); } catch (error) { return next(error); } });
catalogRouter.get('/products/:id/reviews', async (req, res, next) => { try { const reviews = await prisma.productReview.findMany({ where: { productId: req.params.id }, include: { buyer: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } }); return res.json(reviews.map(r => ({ id: r.id, productId: r.productId, buyerId: r.buyerId, buyerName: r.buyer.fullName, rating: r.rating, comment: r.comment, createdAt: r.createdAt }))); } catch (error) { return next(error); } });
catalogRouter.post('/products/:id/reviews', requireAuth, allowRoles(Role.BUYER), async (req, res, next) => {
  try { const body = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().min(1).max(2000) }).parse(req.body); const product = await prisma.product.findFirst({ where: { id: req.params.id, approvalStatus: ProductApproval.APPROVED } }); if (!product) return res.status(404).json({ error: 'Product not found.' }); const order = await prisma.order.findFirst({ where: { buyerId: req.authUser!.id, status: 'delivered', items: { some: { productId: product.id } } } }); if (!order) return res.status(403).json({ error: 'Only buyers who received this product can review it.' }); const review = await prisma.productReview.create({ data: { productId: product.id, buyerId: req.authUser!.id, rating: body.rating, comment: body.comment }, include: { buyer: { select: { fullName: true } } } }); return res.status(201).json({ id: review.id, productId: review.productId, buyerId: review.buyerId, buyerName: review.buyer.fullName, rating: review.rating, comment: review.comment, createdAt: review.createdAt }); }
  catch (error) { return next(error); }
});
catalogRouter.post('/products/:id/reports', requireAuth, allowRoles(Role.BUYER), async (req, res, next) => {
  try { const body = z.object({ reason: z.string().trim().min(2).max(200), details: z.string().trim().min(2).max(2000) }).parse(req.body); const p = await prisma.product.findUnique({ where: { id: req.params.id } }); if (!p) return res.status(404).json({ error: 'Product not found.' }); const report = await prisma.productReport.create({ data: { productId: p.id, reporterId: req.authUser!.id, ...body } }); return res.status(201).json(report); } catch (error) { return next(error); }
});
