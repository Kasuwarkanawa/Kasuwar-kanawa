import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { buyerOnly } from '../middleware/auth.js';

export const buyerRouter = Router();
buyerRouter.use(...buyerOnly);
buyerRouter.get('/profile', async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } }); if (!user) return res.status(404).json({ error: 'User not found.' }); const { passwordHash: _secret, ...safe } = user; return res.json({ user: safe }); }
  catch (error) { return next(error); }
});
buyerRouter.patch('/profile', async (req, res, next) => {
  try {
    const data = z.object({ fullName: z.string().trim().min(2).max(120).optional(), phone: z.string().trim().min(7).max(24).optional(), address: z.string().trim().max(300).optional(), city: z.string().trim().max(100).optional(), state: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(), profileImage: z.string().url().max(1000).optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.authUser!.id }, data: { ...data, phone: data.phone?.replace(/[\s()-]/g, '') } });
    const { passwordHash: _secret, ...safe } = user; return res.json({ user: safe });
  } catch (error) { return next(error); }
});
buyerRouter.post('/reports/sellers', async (req, res, next) => {
  try {
    const body = z.object({ sellerId: z.string(), orderId: z.string().optional(), reason: z.string().trim().min(2).max(200), details: z.string().trim().min(2).max(2000) }).parse(req.body);
    const order = body.orderId ? await prisma.order.findFirst({ where: { id: body.orderId, buyerId: req.authUser!.id, sellerId: body.sellerId } }) : null;
    if (body.orderId && !order) return res.status(404).json({ error: 'Matching order not found.' });
    const report = await prisma.sellerReport.create({ data: { buyerId: req.authUser!.id, sellerId: body.sellerId, orderId: order?.id, orderNumber: order?.orderNumber, reason: body.reason, details: body.details } });
    return res.status(201).json(report);
  } catch (error) { return next(error); }
});
buyerRouter.get('/reports/sellers', async (req, res, next) => {
  try { return res.json(await prisma.sellerReport.findMany({ where: { buyerId: req.authUser!.id }, orderBy: { createdAt: 'desc' } })); }
  catch (error) { return next(error); }
});
