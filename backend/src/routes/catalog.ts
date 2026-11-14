import { Router } from 'express';
import { ProductApproval, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { serializeProduct } from '../utils/serializers.js';

export const catalogRouter = Router();
const publicProductInclude = {
  seller: { select: { id: true, fullName: true, businessName: true, phone: true, whatsAppNumber: true } },
  reviews: { select: { rating: true } },
} as const;
const paginationSchema = z.object({ take: z.coerce.number().int().min(1).max(100).default(50), skip: z.coerce.number().int().min(0).max(100_000).default(0) });

// Public catalog endpoints must never allow callers to opt out of approval filtering.
catalogRouter.get('/products', async (req, res, next) => {
  try {
    const query = z.object({
      category: z.string().trim().max(120).optional(),
      search: z.string().trim().max(200).optional(),
      sellerId: z.string().trim().max(128).optional(),
      take: paginationSchema.shape.take,
      skip: paginationSchema.shape.skip,
    }).parse(req.query);
    const products = await prisma.product.findMany({
      where: {
        approvalStatus: ProductApproval.APPROVED,
        ...(query.category ? { category: query.category } : {}),
        ...(query.sellerId ? { sellerId: query.sellerId } : {}),
        ...(query.search ? { OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
        ] } : {}),
      },
      include: publicProductInclude,
      orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip,
    });
    return res.json(products.map(serializeProduct));
  } catch (error) { return next(error); }
});

catalogRouter.get('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, approvalStatus: ProductApproval.APPROVED },
      include: { ...publicProductInclude, reviews: { include: { buyer: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } } },
    });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    return res.json(serializeProduct(product));
  } catch (error) { return next(error); }
});

catalogRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { approvalStatus: ProductApproval.APPROVED } } } } },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) { return next(error); }
});

catalogRouter.get('/products/:id/reviews', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, approvalStatus: ProductApproval.APPROVED }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const query = paginationSchema.parse(req.query);
    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id }, include: { buyer: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }, take: query.take, skip: query.skip,
    });
    return res.json(reviews);
  } catch (error) { return next(error); }
});

catalogRouter.post('/products/:id/reviews', requireAuth, allowRoles(Role.BUYER), async (req, res, next) => {
  try {
    const body = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().min(1).max(2000) }).strict().parse(req.body);
    const product = await prisma.product.findFirst({ where: { id: req.params.id, approvalStatus: ProductApproval.APPROVED }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const purchase = await prisma.orderItem.findFirst({ where: { productId: product.id, order: { buyerId: req.authUser!.id, status: 'delivered' } }, select: { id: true } });
    if (!purchase) return res.status(403).json({ error: 'A completed purchase is required to review this product.' });
    const review = await prisma.productReview.create({ data: { productId: product.id, buyerId: req.authUser!.id, rating: body.rating, comment: body.comment }, include: { buyer: { select: { fullName: true } } } });
    return res.status(201).json(review);
  } catch (error) { return next(error); }
});

catalogRouter.post('/products/:id/reports', requireAuth, allowRoles(Role.BUYER), async (req, res, next) => {
  try {
    const body = z.object({ reason: z.string().trim().min(2).max(200), details: z.string().trim().min(2).max(2000) }).strict().parse(req.body);
    const product = await prisma.product.findFirst({ where: { id: req.params.id, approvalStatus: ProductApproval.APPROVED }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const report = await prisma.productReport.create({ data: { productId: product.id, reporterId: req.authUser!.id, reason: body.reason, details: body.details } });
    return res.status(201).json(report);
  } catch (error) { return next(error); }
});
