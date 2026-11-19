import { randomBytes } from 'node:crypto';
import { uploadPaymentReceipt, createPaymentReceiptUrl } from '../lib/paymentReceiptStorage.js';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { adminOnly, buyerOnly, requireAuth, sellerOnly } from '../middleware/auth.js';
import { serializeOrder } from '../utils/serializers.js';

export const ordersRouter = Router();
const orderInclude = { items: true, trackingTimeline: { orderBy: { sortOrder: 'asc' as const } } };
const shippingSchema = z.object({
  fullName: z.string().trim().min(2).max(120), phoneNumber: z.string().trim().min(7).max(24),
  state: z.string().trim().min(1).max(100), city: z.string().trim().min(1).max(100),
  area: z.string().trim().min(1).max(100), completeAddress: z.string().trim().min(5).max(500),
}).strict();
const itemSchema = z.object({
  productId: z.string().min(1), quantity: z.number().int().min(1).max(100),
  selectedColor: z.string().trim().max(120).optional(), selectedSize: z.string().trim().max(120).optional(),
  selectedVariation: z.string().trim().max(120).optional(),
}).strict();
const pagingSchema = z.object({ take: z.coerce.number().int().min(1).max(100).default(50), skip: z.coerce.number().int().min(0).max(100_000).default(0) });
const paymentValue = (value: Prisma.JsonValue) => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
const fail = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });
const orderNumber = () => `KN-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
const formatDate = (date: Date) => date.toLocaleString('en-NG');

ordersRouter.post('/', ...buyerOnly, async (req, res, next) => {
  try {
    const data = z.object({
      items: z.array(itemSchema).min(1).max(50), paymentMethod: z.nativeEnum(PaymentMethod), shippingAddress: shippingSchema,
    }).strict().parse(req.body);
    const order = await prisma.$transaction(async tx => {
      const buyer = await tx.user.findUniqueOrThrow({ where: { id: req.authUser!.id } });
      const ids = [...new Set(data.items.map(item => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: ids }, approvalStatus: 'APPROVED' }, include: { seller: true } });
      if (products.length !== ids.length) throw fail('A product is no longer available.', 409);
      const productsById = new Map(products.map(product => [product.id, product]));
      const lines = data.items.map(input => ({ input, product: productsById.get(input.productId)! }));
      if (new Set(products.map(product => product.sellerId)).size !== 1) throw fail('Please place separate orders for products from different sellers.', 400);
      const quantityByProduct = new Map<string, number>();
      for (const { input } of lines) quantityByProduct.set(input.productId, (quantityByProduct.get(input.productId) ?? 0) + input.quantity);
      for (const [productId, quantity] of quantityByProduct) {
        const changed = await tx.product.updateMany({ where: { id: productId, approvalStatus: 'APPROVED', stockQuantity: { gte: quantity } }, data: { stockQuantity: { decrement: quantity } } });
        if (changed.count !== 1) throw fail('Requested quantity is no longer available in stock.', 409);
      }
      const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.input.quantity, 0);
      const deliveryFee = subtotal >= 25_000 ? 0 : 1_500;
      const seller = lines[0]!.product.seller;
      const now = new Date();
      const number = orderNumber();
      const status = data.paymentMethod === PaymentMethod.opay ? OrderStatus.pending_payment : OrderStatus.pending_order;
      const opay = data.paymentMethod === PaymentMethod.opay;
      const paymentConfirmation = {
        method: data.paymentMethod, bankName: opay ? 'OPay' : 'Cash on Delivery',
        accountName: opay ? 'RAMATU SAIDU' : 'Cash on Delivery', accountNumber: opay ? '7066300079' : '',
        confirmedByBuyer: false, verifiedByAdmin: false,
      };
      return tx.order.create({
        data: {
          orderNumber: number, buyerId: buyer.id, sellerId: seller.id,
          buyerName: buyer.fullName, buyerEmail: buyer.email, buyerPhone: buyer.phone,
          sellerName: seller.fullName, sellerBusinessName: seller.businessName ?? '', sellerPhone: seller.phone,
          sellerWhatsApp: seller.whatsAppNumber ?? seller.phone,
          subtotal, deliveryFee, totalAmount: subtotal + deliveryFee,
          shippingAddress: data.shippingAddress as Prisma.InputJsonValue,
          paymentMethod: data.paymentMethod, status,
          paymentConfirmation: paymentConfirmation as Prisma.InputJsonValue,
          items: { create: lines.map(({ input, product }) => ({
            productId: product.id, quantity: input.quantity, selectedColor: input.selectedColor,
            selectedSize: input.selectedSize, selectedVariation: input.selectedVariation,
            unitPrice: product.price,
            productSnapshot: { id: product.id, name: product.name, category: product.category, image: product.image, images: product.images, price: Number(product.price), sellerId: product.sellerId, sellerName: seller.fullName, sellerBusinessName: seller.businessName } as Prisma.InputJsonValue,
          })) },
          trackingTimeline: { create: [
            { title: 'Order Placed', dateLabel: formatDate(now), completed: true, description: `Order ${number} placed.`, sortOrder: 0 },
            { title: opay ? 'Payment Pending' : 'Order Pending', dateLabel: formatDate(now), completed: false, description: opay ? 'Submit transfer details for Super Admin verification.' : 'Awaiting seller acceptance.', sortOrder: 1 },
            { title: 'Processing', dateLabel: '', completed: false, description: 'Seller will prepare your order.', sortOrder: 2 },
            { title: 'Dispatched', dateLabel: '', completed: false, description: 'Order will be handed to dispatch.', sortOrder: 3 },
            { title: 'Delivered', dateLabel: '', completed: false, description: 'Order will be delivered to your address.', sortOrder: 4 },
          ] },
        }, include: orderInclude,
      });
    });
    return res.status(201).json(serializeOrder(order));
  } catch (error) { return next(error); }
});

ordersRouter.get('/mine', ...buyerOnly, async (req, res, next) => {
  try {
    const page = pagingSchema.parse(req.query);
    const orders = await prisma.order.findMany({ where: { buyerId: req.authUser!.id }, include: orderInclude, orderBy: { createdAt: 'desc' }, take: page.take, skip: page.skip });
    return res.json(orders.map(serializeOrder));
  } catch (error) { return next(error); }
});
ordersRouter.get('/seller/mine', ...sellerOnly, async (req, res, next) => {
  try {
    const page = pagingSchema.parse(req.query);
    const orders = await prisma.order.findMany({ where: { sellerId: req.authUser!.id }, include: orderInclude, orderBy: { createdAt: 'desc' }, take: page.take, skip: page.skip });
    return res.json(orders.map(serializeOrder));
  } catch (error) { return next(error); }
});
ordersRouter.get('/admin/all', ...adminOnly, async (req, res, next) => {
  try {
    const page = pagingSchema.parse(req.query);
    const orders = await prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' }, take: page.take, skip: page.skip });
    return res.json(orders.map(serializeOrder));
  } catch (error) { return next(error); }
});
ordersRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { OR: [{ id: req.params.id }, { orderNumber: req.params.id }] }, include: orderInclude });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (req.authUser!.role !== 'SUPER_ADMIN' && order.buyerId !== req.authUser!.id && order.sellerId !== req.authUser!.id) return res.status(404).json({ error: 'Order not found.' });
    return res.json(serializeOrder(order));
  } catch (error) { return next(error); }
});

ordersRouter.post('/:id/payment-confirmation', ...buyerOnly, async (req, res, next) => {
  try {
    const data = z.object({ senderName: z.string().trim().min(2).max(120), transactionReference: z.string().trim().min(3).max(160) }).strict().parse(req.body);
    const order = await prisma.order.findFirst({ where: { id: req.params.id, buyerId: req.authUser!.id } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const paymentConfirmationStatuses: OrderStatus[] = [OrderStatus.pending_payment, OrderStatus.pending_verification, OrderStatus.rejected];
    if (order.paymentMethod !== PaymentMethod.opay || !paymentConfirmationStatuses.includes(order.status)) {
      return res.status(409).json({ error: 'Payment confirmation is not available for this order.' });
    }
    const now = new Date();
    const oldPayment = paymentValue(order.paymentConfirmation);
    const paymentConfirmation = { ...oldPayment, senderName: data.senderName, transactionReference: data.transactionReference, confirmedByBuyer: true, confirmedAt: now.toISOString(), verifiedByAdmin: false, verifiedAt: null, adminNotes: null };
    const updated = await prisma.$transaction(async tx => {
      const changed = await tx.order.updateMany({ where: { id: order.id, buyerId: req.authUser!.id, status: order.status }, data: { status: OrderStatus.pending_verification, paymentConfirmation: paymentConfirmation as Prisma.InputJsonValue } });
      if (changed.count !== 1) throw fail('Order has changed; reload and try again.', 409);
      await tx.orderTrackingStep.updateMany({ where: { orderId: order.id, sortOrder: 1 }, data: { title: 'Payment Pending Verification', dateLabel: formatDate(now), completed: false, description: 'Transfer details submitted for Super Admin verification.' } });
      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    });
    return res.json(serializeOrder(updated));
  } catch (error) { return next(error); }
});


ordersRouter.post('/:id/payment-receipt', ...buyerOnly, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, buyerId: req.authUser!.id } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.paymentMethod !== PaymentMethod.opay || ![OrderStatus.pending_payment, OrderStatus.pending_verification, OrderStatus.rejected].includes(order.status)) return res.status(409).json({ error: 'Receipt upload is not available for this order.' });
    const contentType = req.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const bytes = Buffer.isBuffer(req.body) ? req.body as Buffer : Buffer.alloc(0);
    if (!allowed.includes(contentType) || bytes.length < 12 || bytes.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Upload JPG, PNG, WEBP or PDF up to 5 MB.' });
    const valid = contentType === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216
      : contentType === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : contentType === 'image/webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
      : bytes.toString('ascii', 0, 5) === '%PDF-';
    if (!valid) return res.status(400).json({ error: 'File content does not match its selected type.' });
    const ext = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'pdf';
    const path = order.id + '/' + randomBytes(16).toString('hex') + '.' + ext;
    await uploadPaymentReceipt(path, bytes, contentType);
    const previous = paymentValue(order.paymentConfirmation);
    const now = new Date();
    const paymentConfirmation = { ...previous, receiptPath: path, receiptMimeType: contentType, receiptUploadedAt: now.toISOString(), confirmedByBuyer: true, verifiedByAdmin: false, verifiedAt: null, adminNotes: null };
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.pending_verification, paymentConfirmation: paymentConfirmation as Prisma.InputJsonValue }, include: orderInclude });
    await prisma.orderTrackingStep.updateMany({ where: { orderId: order.id, sortOrder: 1 }, data: { title: 'Receipt Submitted', dateLabel: formatDate(now), completed: false, description: 'Payment receipt submitted for Admin verification.' } });
    return res.json(serializeOrder(updated));
  } catch (error) { return next(error); }
});

ordersRouter.get('/admin/:id/payment-receipt', ...adminOnly, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const path = paymentValue(order.paymentConfirmation).receiptPath;
    if (typeof path !== 'string' || !path.startsWith(order.id + '/')) return res.status(404).json({ error: 'Payment receipt not found.' });
    return res.json({ url: await createPaymentReceiptUrl(path), expiresIn: 300 });
  } catch (error) { return next(error); }
});

ordersRouter.patch('/admin/:id/cod-approval', ...adminOnly, async (req, res, next) => {
  try {
    const body = z.object({ decision: z.enum(['approve', 'reject']), adminNotes: z.string().trim().min(2).max(1000).optional() }).strict().parse(req.body);
    if (body.decision === 'reject' && !body.adminNotes) return res.status(400).json({ error: 'A rejection reason is required.' });
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.paymentMethod !== PaymentMethod.cod || order.status !== OrderStatus.pending_order) return res.status(409).json({ error: 'COD order is not awaiting Admin approval.' });
    const now = new Date();
    const previous = paymentValue(order.paymentConfirmation);
    const approved = body.decision === 'approve';
    const updated = await prisma.$transaction(async tx => {
      const changed = await tx.order.updateMany({ where: { id: order.id, status: OrderStatus.pending_order }, data: { status: approved ? OrderStatus.pending_order : OrderStatus.rejected, paymentConfirmation: { ...previous, adminApproved: approved, adminApprovedAt: now.toISOString(), adminNotes: body.adminNotes ?? null } as Prisma.InputJsonValue, ...(approved ? {} : { adminRejectionReason: body.adminNotes }) } });
      if (changed.count !== 1) throw fail('Order has changed; reload and try again.', 409);
      if (!approved) for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      await tx.orderTrackingStep.updateMany({ where: { orderId: order.id, sortOrder: 1 }, data: { title: approved ? 'COD Order Approved' : 'COD Order Rejected', dateLabel: formatDate(now), completed: approved, description: body.adminNotes ?? 'Cash on Delivery order approved by Admin.' } });
      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    });
    return res.json(serializeOrder(updated));
  } catch (error) { return next(error); }
});

ordersRouter.patch('/:id/status', ...sellerOnly, async (req, res, next) => {
  try {
    const { status, reason } = z.object({ status: z.enum(['processing', 'dispatched', 'delivered', 'rejected']), reason: z.string().trim().max(1000).optional() }).strict().parse(req.body);
    const order = await prisma.order.findFirst({ where: { id: req.params.id, sellerId: req.authUser!.id }, include: orderInclude });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (status === 'rejected' && !reason) return res.status(400).json({ error: 'A reason is required to reject an order.' });
    const payment = paymentValue(order.paymentConfirmation);
    if (order.paymentMethod === PaymentMethod.opay && status !== 'rejected' && (order.status !== OrderStatus.payment_confirmed || payment.verifiedByAdmin !== true)) {
      return res.status(409).json({ error: 'OPay payment must be verified by Super Admin before fulfillment.' });
    }
    const allowed: Record<string, OrderStatus[]> = {
      processing: [OrderStatus.pending_order, OrderStatus.payment_confirmed],
      dispatched: [OrderStatus.processing], delivered: [OrderStatus.dispatched],
      rejected: [OrderStatus.pending_order, OrderStatus.pending_payment, OrderStatus.pending_verification, OrderStatus.payment_confirmed],
    };
    const allowedStatuses = allowed[status];
    if (!allowedStatuses || !allowedStatuses.includes(order.status)) return res.status(409).json({ error: `Cannot change order from ${order.status} to ${status}.` });
    const now = new Date();
    const nextStatus = status as OrderStatus;
    const trackingSort = status === 'processing' ? 2 : status === 'dispatched' ? 3 : status === 'delivered' ? 4 : 1;
    const updated = await prisma.$transaction(async tx => {
      const changes: Prisma.OrderUpdateManyMutationInput = {
        status: nextStatus,
        ...(status === 'rejected' ? { sellerRejectionReason: reason } : {}),
        ...(status === 'dispatched' ? { dispatchedAt: now } : {}),
        ...(status === 'delivered' ? { deliveredAt: now } : {}),
      };
      const changed = await tx.order.updateMany({ where: { id: order.id, sellerId: req.authUser!.id, status: order.status }, data: changes });
      if (changed.count !== 1) throw fail('Order has changed; reload and try again.', 409);
      if (status === 'rejected') {
        for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      }
      await tx.orderTrackingStep.updateMany({ where: { orderId: order.id, sortOrder: trackingSort }, data: { title: status === 'rejected' ? 'Order Rejected' : status[0]!.toUpperCase() + status.slice(1), dateLabel: formatDate(now), completed: status !== 'rejected', description: reason || `Order ${status}.` } });
      if (status === 'delivered') await tx.orderTrackingStep.updateMany({ where: { orderId: order.id, sortOrder: { lt: trackingSort } }, data: { completed: true } });
      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    });
    return res.json(serializeOrder(updated));
  } catch (error) { return next(error); }
});

ordersRouter.post('/:id/cancel', ...buyerOnly, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, buyerId: req.authUser!.id }, include: orderInclude });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const cancellableStatuses: OrderStatus[] = [OrderStatus.pending_order, OrderStatus.pending_payment, OrderStatus.pending_verification];
    if (!cancellableStatuses.includes(order.status)) return res.status(409).json({ error: 'This order can no longer be cancelled.' });
    const now = new Date();
    const cancelled = await prisma.$transaction(async tx => {
      const changed = await tx.order.updateMany({ where: { id: order.id, buyerId: req.authUser!.id, status: order.status }, data: { status: OrderStatus.cancelled } });
      if (changed.count !== 1) throw fail('Order has changed; reload and try again.', 409);
      for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      await tx.orderTrackingStep.create({ data: { orderId: order.id, title: 'Order Cancelled', dateLabel: formatDate(now), completed: true, description: 'Order cancelled by buyer before fulfillment.', sortOrder: 10 } });
      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    });
    return res.json(serializeOrder(cancelled));
  } catch (error) { return next(error); }
});

ordersRouter.patch('/admin/:id/payment-verification', ...adminOnly, async (req, res, next) => {
  try {
    const { decision, adminNotes } = z.object({ decision: z.enum(['approve', 'reject']), adminNotes: z.string().trim().min(2).max(1000).optional() }).strict().parse(req.body);
    if (decision === 'reject' && !adminNotes) return res.status(400).json({ error: 'A reason is required to reject payment.' });
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const previous = paymentValue(order.paymentConfirmation);
    if (order.paymentMethod !== PaymentMethod.opay || order.status !== OrderStatus.pending_verification || previous.confirmedByBuyer !== true) {
      return res.status(409).json({ error: 'Order is not awaiting OPay payment verification.' });
    }
    const now = new Date();
    const approved = decision === 'approve';
    const paymentConfirmation = { ...previous, verifiedByAdmin: approved, verifiedAt: now.toISOString(), adminNotes: adminNotes ?? null };
    const updated = await prisma.$transaction(async tx => {
      const changed = await tx.order.updateMany({ where: { id: order.id, status: OrderStatus.pending_verification }, data: { status: approved ? OrderStatus.payment_confirmed : OrderStatus.rejected, paymentConfirmation: paymentConfirmation as Prisma.InputJsonValue, ...(approved ? {} : { adminRejectionReason: adminNotes }) } });
      if (changed.count !== 1) throw fail('Order has changed; reload and try again.', 409);
      if (!approved) for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
      await tx.orderTrackingStep.updateMany({ where: { orderId: order.id, sortOrder: 1 }, data: { title: approved ? 'Payment Confirmed' : 'Payment Rejected', dateLabel: formatDate(now), completed: approved, description: adminNotes ?? 'Payment verified by Super Admin.' } });
      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    });
    return res.json(serializeOrder(updated));
  } catch (error) { return next(error); }
});
