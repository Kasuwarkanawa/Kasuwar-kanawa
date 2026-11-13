import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sellerOnly } from '../middleware/auth.js';
import { serializeProduct } from '../utils/serializers.js';

export const sellerRouter = Router();
sellerRouter.use(...sellerOnly);
const productSchema = z.object({
  name: z.string().trim().min(2).max(180), category: z.string().trim().min(1).max(120), price: z.number().positive(), originalPrice: z.number().nonnegative().optional(),
  discountPercentage: z.number().int().min(0).max(100).optional(), image: z.string().trim().min(1).max(1000), images: z.array(z.string().max(1000)).max(20).optional(),
  colors: z.array(z.string().max(80)).max(50).optional(), sizes: z.array(z.string().max(80)).max(50).optional(), variations: z.array(z.unknown()).max(100).optional(),
  badge: z.string().max(80).optional(), stockQuantity: z.number().int().min(0).max(100000).default(0), isFlashSale: z.boolean().optional(), isPopular: z.boolean().optional(),
  isNew: z.boolean().optional(), isSpecialOffer: z.boolean().optional(), description: z.string().max(10000).optional(),
});
const productData = (body: z.infer<typeof productSchema>) => ({ ...body, images: body.images ?? [], colors: body.colors ?? [], sizes: body.sizes ?? [], variations: body.variations ?? [], originalPrice: body.originalPrice ?? body.price });
sellerRouter.get('/profile', async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } }); return res.json({ user: user ? { id: user.id, fullName: user.fullName, businessName: user.businessName, email: user.email, phone: user.phone, whatsAppNumber: user.whatsAppNumber, address: user.address, businessAddress: user.businessAddress, city: user.city, state: user.state, area: user.area, productCategory: user.productCategory, profileImage: user.profileImage, status: user.status } : null }); }
  catch (error) { return next(error); }
});
sellerRouter.patch('/profile', async (req, res, next) => {
  try {
    const data = z.object({ fullName: z.string().trim().min(2).max(120).optional(), businessName: z.string().trim().min(1).max(120).optional(), whatsAppNumber: z.string().trim().min(7).max(24).optional(), address: z.string().trim().max(300).optional(), businessAddress: z.string().trim().max(300).optional(), city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(), productCategory: z.string().trim().max(120).optional(), profileImage: z.string().url().max(1000).optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.authUser!.id }, data });
    return res.json({ user: { id: user.id, fullName: user.fullName, businessName: user.businessName, email: user.email, phone: user.phone, whatsAppNumber: user.whatsAppNumber, address: user.address, businessAddress: user.businessAddress, city: user.city, state: user.state, area: user.area, productCategory: user.productCategory, profileImage: user.profileImage, status: user.status } });
  } catch (error) { return next(error); }
});
sellerRouter.get('/products', async (req, res, next) => {
  try { const products = await prisma.product.findMany({ where: { sellerId: req.authUser!.id }, include: { reviews: { select: { rating: true } } }, orderBy: { createdAt: 'desc' } }); return res.json(products.map(serializeProduct)); }
  catch (error) { return next(error); }
});
sellerRouter.post('/products', async (req, res, next) => {
  try { const body = productSchema.parse(req.body); const product = await prisma.product.create({ data: { ...productData(body), sellerId: req.authUser!.id, approvalStatus: 'PENDING_APPROVAL' } }); return res.status(201).json(serializeProduct(product)); }
  catch (error) { return next(error); }
});
sellerRouter.patch('/products/:id', async (req, res, next) => {
  try {
    const body = productSchema.partial().parse(req.body);
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, sellerId: req.authUser!.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found.' });
    const product = await prisma.product.update({ where: { id: existing.id }, data: { ...body, ...(body.images ? { images: body.images } : {}), ...(body.colors ? { colors: body.colors } : {}), ...(body.sizes ? { sizes: body.sizes } : {}), ...(body.variations ? { variations: body.variations as any } : {}), approvalStatus: 'PENDING_APPROVAL' } });
    return res.json(serializeProduct(product));
  } catch (error) { return next(error); }
});
sellerRouter.delete('/products/:id', async (req, res, next) => {
  try { const product = await prisma.product.findFirst({ where: { id: req.params.id, sellerId: req.authUser!.id } }); if (!product) return res.status(404).json({ error: 'Product not found.' }); await prisma.product.delete({ where: { id: product.id } }); return res.json({ success: true }); }
  catch (error) { return next(error); }
});
sellerRouter.post('/reports/buyers', async (req, res, next) => {
  try {
    const body = z.object({ buyerId: z.string(), orderId: z.string().optional(), reason: z.string().trim().min(2).max(200), details: z.string().trim().min(2).max(2000) }).parse(req.body);
    const order = body.orderId ? await prisma.order.findFirst({ where: { id: body.orderId, sellerId: req.authUser!.id, buyerId: body.buyerId } }) : null;
    if (body.orderId && !order) return res.status(404).json({ error: 'Matching order not found.' });
    const report = await prisma.buyerReport.create({ data: { sellerId: req.authUser!.id, buyerId: body.buyerId, orderId: order?.id, orderNumber: order?.orderNumber, reason: body.reason, details: body.details } });
    return res.status(201).json(report);
  } catch (error) { return next(error); }
});
sellerRouter.get('/reports/buyers', async (req, res, next) => {
  try { return res.json(await prisma.buyerReport.findMany({ where: { sellerId: req.authUser!.id }, orderBy: { createdAt: 'desc' } })); }
  catch (error) { return next(error); }
});
