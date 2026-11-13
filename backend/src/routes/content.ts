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
