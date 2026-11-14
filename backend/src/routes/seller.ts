import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sellerOnly } from '../middleware/auth.js';
import { serializeProduct } from '../utils/serializers.js';

export const sellerRouter = Router();
sellerRouter.use(...sellerOnly);
const productSchema = z.object({
  name: z.string().trim().min(2).max(180), category: z.string().trim().min(1).max(120), price: z.number().positive(),
  originalPrice: z.number().nonnegative().optional(), discountPercentage: z.number().int().min(0).max(100).optional(),
  image: z.string().trim().min(1).max(1000), images: z.array(z.string().max(1000)).max(20).optional(),
  colors: z.array(z.string().max(80)).max(50).optional(), sizes: z.array(z.string().max(80)).max(50).optional(), variations: z.array(z.unknown()).max(100).optional(),
  badge: z.string().max(80).nullable().optional(), stockQuantity: z.number().int().min(0).max(100000).optional(),
  isFlashSale: z.boolean().optional(), isPopular: z.boolean().optional(), isNew: z.boolean().optional(), isSpecialOffer: z.boolean().optional(), description: z.string().max(10000).optional(),
}).strict();
const productInclude = { reviews: { select: { rating: true } } } as const;
const safeSeller = (user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>) => ({
  id: user.id, fullName: user.fullName, businessName: user.businessName, email: user.email, phone: user.phone,
  whatsAppNumber: user.whatsAppNumber, address: user.address, businessAddress: user.businessAddress,
  city: user.city, state: user.state, area: user.area, productCategory: user.productCategory,
  profileImage: user.profileImage, role: user.role, status: user.status, createdAt: user.createdAt, updatedAt: user.updatedAt,
});
sellerRouter.get('/profile', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
    return user ? res.json({ user: safeSeller(user) }) : res.status(404).json({ error: 'User not found.' });
  } catch (error) { return next(error); }
});
sellerRouter.patch('/profile', async (req, res, next) => {
  try {
    const data = z.object({
      fullName: z.string().trim().min(2).max(120).optional(), businessName: z.string().trim().min(1).max(120).optional(),
      whatsAppNumber: z.string().trim().min(7).max(24).optional(), address: z.string().trim().max(300).optional(),
      businessAddress: z.string().trim().max(300).optional(), city: z.string().trim().max(100).optional(),
      state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(),
      productCategory: z.string().trim().max(120).optional(), profileImage: z.string().url().max(1000).nullable().optional(),
    }).strict().refine(value => Object.keys(value).length > 0, 'At least one profile field is required.').parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.authUser!.id },
      data: { ...data, ...(data.whatsAppNumber ? { whatsAppNumber: data.whatsAppNumber.replace(/[\s()-]/g, '') } : {}) },
    });
    return res.json({ user: safeSeller(user) });
  } catch (error) { return next(error); }
});
sellerRouter.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ where: { sellerId: req.authUser!.id }, include: productInclude, orderBy: { createdAt: 'desc' } });
    return res.json(products.map(serializeProduct));
  } catch (error) { return next(error); }
});
sellerRouter.post('/products', async (req, res, next) => {
  try {
    const body = productSchema.extend({
      name: productSchema.shape.name, category: productSchema.shape.category, price: productSchema.shape.price,
      image: productSchema.shape.image, stockQuantity: z.number().int().min(0).max(100000).default(0),
    }).parse(req.body);
    const product = await prisma.product.create({ data: {
      name: body.name, category: body.category, price: body.price, originalPrice: body.originalPrice ?? 0,
      discountPercentage: body.discountPercentage ?? 0, image: body.image, images: body.images ?? [],
      colors: body.colors ?? [], sizes: body.sizes ?? [], variations: body.variations ?? [], badge: body.badge,
      stockQuantity: body.stockQuantity, isFlashSale: body.isFlashSale ?? false, isPopular: body.isPopular ?? false,
      isNew: body.isNew ?? false, isSpecialOffer: body.isSpecialOffer ?? false, description: body.description ?? '',
      sellerId: req.authUser!.id, approvalStatus: 'PENDING_APPROVAL',
    }, include: productInclude });
    return res.status(201).json(serializeProduct(product));
  } catch (error) { return next(error); }
});
sellerRouter.patch('/products/:id', async (req, res, next) => {
  try {
    const body = productSchema.partial().refine(value => Object.keys(value).length > 0, 'At least one product field is required.').parse(req.body);
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, sellerId: req.authUser!.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found.' });
    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: { ...body, ...(body.images ? { images: body.images } : {}), ...(body.colors ? { colors: body.colors } : {}), ...(body.sizes ? { sizes: body.sizes } : {}), ...(body.variations ? { variations: body.variations as never } : {}), approvalStatus: 'PENDING_APPROVAL' },
      include: productInclude,
    });
    return res.json(serializeProduct(updated));
  } catch (error) { return next(error); }
});
sellerRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, sellerId: req.authUser!.id } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    await prisma.product.delete({ where: { id: product.id } });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});
sellerRouter.post('/reports/buyers', async (req, res, next) => {
  try {
    const body = z.object({ buyerId: z.string().min(1), orderId: z.string().min(1).optional(), reason: z.string().trim().min(2).max(200), details: z.string().trim().min(2).max(2000) }).strict().parse(req.body);
    const buyer = await prisma.user.findFirst({ where: { id: body.buyerId, role: 'BUYER' }, select: { id: true } });
    if (!buyer) return res.status(404).json({ error: 'Buyer not found.' });
    const order = body.orderId ? await prisma.order.findFirst({ where: { id: body.orderId, sellerId: req.authUser!.id, buyerId: buyer.id } }) : null;
    if (body.orderId && !order) return res.status(404).json({ error: 'Matching order not found.' });
    const report = await prisma.buyerReport.create({ data: { sellerId: req.authUser!.id, buyerId: buyer.id, orderId: order?.id, orderNumber: order?.orderNumber, reason: body.reason, details: body.details } });
    return res.status(201).json(report);
  } catch (error) { return next(error); }
});
sellerRouter.get('/reports/buyers', async (req, res, next) => {
  try { return res.json(await prisma.buyerReport.findMany({ where: { sellerId: req.authUser!.id }, orderBy: { createdAt: 'desc' } })); }
  catch (error) { return next(error); }
});
