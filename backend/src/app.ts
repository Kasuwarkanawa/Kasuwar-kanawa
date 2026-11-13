import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { buyerRouter } from './routes/buyer.js';
import { sellerRouter } from './routes/seller.js';
import { adminRouter } from './routes/admin.js';
import { cartRouter } from './routes/cart.js';
import { catalogRouter } from './routes/catalog.js';
import { ordersRouter } from './routes/orders.js';
import { contentRouter } from './routes/content.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.get('/api/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; return res.json({ status: 'ok', database: 'connected' }); }
  catch { return res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/buyer', buyerRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api', catalogRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/content', contentRouter);
app.use(notFound);
app.use(errorHandler);
