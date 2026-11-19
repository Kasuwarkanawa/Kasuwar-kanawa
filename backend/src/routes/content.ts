import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { adminOnly } from '../middleware/auth.js';

export const contentRouter = Router();
contentRouter.get('/announcements', async (_req, res, next) => {
  try { return res.json(await prisma.announcement.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } })); }
  catch (error) { return next(error); }
});
contentRouter.get('/advertisements', async (_req, res, next) => {
  try { return res.json(await prisma.advertisement.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })); }
  catch (error) { return next(error); }
});
contentRouter.post('/newsletter', async (req, res, next) => {
  try { const { email } = z.object({ email: z.string().trim().email().max(254) }).parse(req.body); const subscription = await prisma.newsletterSubscription.upsert({ where: { email: email.toLowerCase() }, update: {}, create: { email: email.toLowerCase() } }); return res.status(201).json({ success: true, id: subscription.id }); }
  catch (error) { return next(error); }
});
const announcementSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(5000), type: z.string().trim().max(40).default('info'), isPublished: z.boolean().default(false) });
const advertisementSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().max(2000), badge: z.string().max(80).optional(), image: z.string().trim().min(1).max(1000), linkText: z.string().max(100).optional(), linkUrl: z.string().max(1000).optional(), discountTag: z.string().max(80).optional(), isActive: z.boolean().default(true) });
contentRouter.get('/admin/announcements', ...adminOnly, async (_req, res, next) => { try { return res.json(await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } })); } catch (error) { return next(error); } });
contentRouter.post('/admin/announcements', ...adminOnly, async (req, res, next) => { try { return res.status(201).json(await prisma.announcement.create({ data: announcementSchema.parse(req.body) })); } catch (error) { return next(error); } });
contentRouter.patch('/admin/announcements/:id', ...adminOnly, async (req, res, next) => { try { return res.json(await prisma.announcement.update({ where: { id: req.params.id }, data: announcementSchema.partial().parse(req.body) })); } catch (error) { return next(error); } });
contentRouter.delete('/admin/announcements/:id', ...adminOnly, async (req, res, next) => { try { await prisma.announcement.delete({ where: { id: req.params.id } }); return res.json({ success: true }); } catch (error) { return next(error); } });
contentRouter.get('/admin/advertisements', ...adminOnly, async (_req, res, next) => { try { return res.json(await prisma.advertisement.findMany({ orderBy: { createdAt: 'desc' } })); } catch (error) { return next(error); } });
contentRouter.post('/admin/advertisements', ...adminOnly, async (req, res, next) => { try { return res.status(201).json(await prisma.advertisement.create({ data: advertisementSchema.parse(req.body) })); } catch (error) { return next(error); } });
contentRouter.patch('/admin/advertisements/:id', ...adminOnly, async (req, res, next) => { try { return res.json(await prisma.advertisement.update({ where: { id: req.params.id }, data: advertisementSchema.partial().parse(req.body) })); } catch (error) { return next(error); } });
contentRouter.delete('/admin/advertisements/:id', ...adminOnly, async (req, res, next) => { try { await prisma.advertisement.delete({ where: { id: req.params.id } }); return res.json({ success: true }); } catch (error) { return next(error); } });
contentRouter.get('/admin/newsletter', ...adminOnly, async (_req, res, next) => { try { return res.json(await prisma.newsletterSubscription.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })); } catch (error) { return next(error); } });


const flashSaleBaseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  discountPercentage: z.number().int().min(1).max(100),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  productIds: z.array(z.string().trim().min(1).max(128)).min(1).max(100),
  isActive: z.boolean().default(false),
});
const flashSaleSchema = flashSaleBaseSchema.refine((value) => new Date(value.endTime) > new Date(value.startTime), {
  message: 'Flash sale end time must be after its start time.',
  path: ['endTime'],
});

async function serializeFlashSale(sale: { id: string; title: string; description: string | null; discountPercentage: number; startTime: Date; endTime: Date; isActive: boolean; createdAt: Date; products: Array<{ productId: string }> }) {
  return {
    id: sale.id,
    title: sale.title,
    description: sale.description || undefined,
    discountPercentage: sale.discountPercentage,
    startTime: sale.startTime.toISOString(),
    endTime: sale.endTime.toISOString(),
    productIds: sale.products.map((item) => item.productId),
    isActive: sale.isActive,
    createdAt: sale.createdAt.toISOString(),
  };
}

contentRouter.get('/flash-sales', async (_req, res, next) => {
  try {
    const now = new Date();
    const sales = await prisma.flashSale.findMany({
      where: { isActive: true, startTime: { lte: now }, endTime: { gt: now } },
      include: { products: { select: { productId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json(await Promise.all(sales.map(serializeFlashSale)));
  } catch (error) { return next(error); }
});

contentRouter.get('/admin/flash-sales', ...adminOnly, async (_req, res, next) => {
  try {
    const sales = await prisma.flashSale.findMany({
      include: { products: { select: { productId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(await Promise.all(sales.map(serializeFlashSale)));
  } catch (error) { return next(error); }
});

contentRouter.post('/admin/flash-sales', ...adminOnly, async (req, res, next) => {
  try {
    const body = flashSaleSchema.parse(req.body);
    const productIds = [...new Set(body.productIds)];
    const validProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, approvalStatus: 'APPROVED' },
      select: { id: true },
    });
    if (validProducts.length !== productIds.length) {
      return res.status(400).json({ error: 'Every selected flash sale product must exist and be approved.' });
    }
    const sale = await prisma.flashSale.create({
      data: {
        title: body.title,
        description: body.description,
        discountPercentage: body.discountPercentage,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        isActive: body.isActive,
        products: { create: productIds.map((productId) => ({ product: { connect: { id: productId } } })) },
      },
      include: { products: { select: { productId: true } } },
    });
    return res.status(201).json(await serializeFlashSale(sale));
  } catch (error) { return next(error); }
});

contentRouter.patch('/admin/flash-sales/:id', ...adminOnly, async (req, res, next) => {
  try {
    const flashSaleId = req.params.id;
    if (!flashSaleId) return res.status(404).json({ error: 'Flash sale not found.' });
    const body = flashSaleBaseSchema.partial().parse(req.body);
    if (body.startTime && body.endTime && new Date(body.endTime) <= new Date(body.startTime)) {
      return res.status(400).json({ error: 'Flash sale end time must be after its start time.' });
    }
    const current = await prisma.flashSale.findUnique({ where: { id: flashSaleId }, select: { id: true, startTime: true, endTime: true } });
    if (!current) return res.status(404).json({ error: 'Flash sale not found.' });
    const startTime = body.startTime ? new Date(body.startTime) : current.startTime;
    const endTime = body.endTime ? new Date(body.endTime) : current.endTime;
    if (endTime <= startTime) return res.status(400).json({ error: 'Flash sale end time must be after its start time.' });
    if (body.productIds) {
      const productIds = [...new Set(body.productIds)];
      const validProducts = await prisma.product.findMany({ where: { id: { in: productIds }, approvalStatus: 'APPROVED' }, select: { id: true } });
      if (validProducts.length !== productIds.length) {
        return res.status(400).json({ error: 'Every selected flash sale product must exist and be approved.' });
      }
      await prisma.flashSaleProduct.deleteMany({ where: { flashSaleId } });
      if (productIds.length) {
        await prisma.flashSaleProduct.createMany({ data: productIds.map((productId) => ({ flashSaleId, productId })) });
      }
    }
    const sale = await prisma.flashSale.update({
      where: { id: flashSaleId },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.discountPercentage !== undefined ? { discountPercentage: body.discountPercentage } : {}),
        ...(body.startTime !== undefined ? { startTime: new Date(body.startTime) } : {}),
        ...(body.endTime !== undefined ? { endTime: new Date(body.endTime) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
      include: { products: { select: { productId: true } } },
    });
    return res.json(await serializeFlashSale(sale));
  } catch (error) { return next(error); }
});

contentRouter.delete('/admin/flash-sales/:id', ...adminOnly, async (req, res, next) => {
  try {
    await prisma.flashSale.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) { return next(error); }
});
