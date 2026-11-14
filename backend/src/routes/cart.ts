import { Router } from 'express';
import { ProductApproval } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { buyerOnly } from '../middleware/auth.js';
import { serializeProduct } from '../utils/serializers.js';

export const cartRouter = Router();
cartRouter.use(...buyerOnly);
const itemInclude = { product: { include: { seller: { select: { id: true, fullName: true, businessName: true, phone: true, whatsAppNumber: true } }, reviews: { select: { rating: true } } } } } as const;
const optionSchema = z.string().trim().max(120).optional();
const cartItemInput = z.object({
  productId: z.string().min(1), quantity: z.number().int().min(1).max(100),
  selectedColor: optionSchema, selectedSize: optionSchema, selectedVariation: optionSchema,
}).strict();

async function getCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: itemInclude, orderBy: { id: 'asc' } } } });
  return {
    items: (cart?.items ?? []).map(item => ({
      id: item.id, quantity: item.quantity, selectedColor: item.selectedColor,
      selectedSize: item.selectedSize, selectedVariation: item.selectedVariation,
      product: serializeProduct(item.product),
    })),
  };
}
cartRouter.get('/', async (req, res, next) => {
  try { return res.json(await getCart(req.authUser!.id)); }
  catch (error) { return next(error); }
});
cartRouter.post('/items', async (req, res, next) => {
  try {
    const data = cartItemInput.parse(req.body);
    const result = await prisma.$transaction(async tx => {
      const product = await tx.product.findFirst({ where: { id: data.productId, approvalStatus: ProductApproval.APPROVED } });
      if (!product) return { error: 'Product not found or unavailable.' as const, status: 404 };
      if (product.stockQuantity < data.quantity) return { error: 'Requested quantity is not available in stock.' as const, status: 409 };
      const cart = await tx.cart.upsert({ where: { userId: req.authUser!.id }, create: { userId: req.authUser!.id }, update: {} });
      const match = await tx.cartItem.findFirst({ where: {
        cartId: cart.id, productId: product.id,
        selectedColor: data.selectedColor ?? null, selectedSize: data.selectedSize ?? null,
        selectedVariation: data.selectedVariation ?? null,
      } });
      if (match) {
        if (match.quantity + data.quantity > product.stockQuantity) return { error: 'Requested quantity is not available in stock.' as const, status: 409 };
        await tx.cartItem.update({ where: { id: match.id }, data: { quantity: match.quantity + data.quantity } });
      } else {
        await tx.cartItem.create({ data: {
          cartId: cart.id, productId: product.id, quantity: data.quantity,
          selectedColor: data.selectedColor, selectedSize: data.selectedSize, selectedVariation: data.selectedVariation,
        } });
      }
      return { ok: true as const };
    });
    if ('error' in result) return res.status(result.status).json({ error: result.error });
    return res.status(201).json(await getCart(req.authUser!.id));
  } catch (error) { return next(error); }
});
cartRouter.patch('/items/:id', async (req, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(1).max(100) }).strict().parse(req.body);
    const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, cart: { userId: req.authUser!.id } }, include: { product: true } });
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });
    if (item.product.approvalStatus !== ProductApproval.APPROVED || item.product.stockQuantity < quantity) {
      return res.status(409).json({ error: 'Product is unavailable or requested quantity exceeds stock.' });
    }
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return res.json(await getCart(req.authUser!.id));
  } catch (error) { return next(error); }
});
cartRouter.delete('/items/:id', async (req, res, next) => {
  try {
    const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, cart: { userId: req.authUser!.id } }, select: { id: true } });
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });
    await prisma.cartItem.delete({ where: { id: item.id } });
    return res.json(await getCart(req.authUser!.id));
  } catch (error) { return next(error); }
});
cartRouter.delete('/', async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.authUser!.id }, select: { id: true } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.json({ items: [] });
  } catch (error) { return next(error); }
});
