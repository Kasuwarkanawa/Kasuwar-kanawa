import { Role, User } from '@prisma/client';

export function serializeUser(user: User) {
  const { passwordHash: _passwordHash, role, ...safe } = user;
  return { ...safe, accountType: role === Role.BUYER ? 'buyer' : role === Role.SELLER ? 'seller' : 'admin' };
}

export function serializeProduct(product: any) {
  const { price, originalPrice, stockQuantity, approvalStatus, seller, reviews, ...rest } = product;
  const reviewsCount = reviews?.length ?? product.reviewsCount ?? 0;
  const rating = reviews?.length ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length : Number(product.rating ?? 0);
  return {
    ...rest, price: Number(price), originalPrice: Number(originalPrice), stockQuantity,
    stockLeft: stockQuantity, inStock: stockQuantity > 0,
    isApproved: approvalStatus === 'APPROVED',
    approvalStatus: approvalStatus === 'APPROVED' ? 'approved' : approvalStatus === 'REJECTED' ? 'rejected' : 'pending_approval',
    rating: Number(rating.toFixed(1)), reviewsCount,
    ...(seller ? { sellerId: seller.id, sellerName: seller.fullName, sellerBusinessName: seller.businessName, sellerPhone: seller.phone, sellerWhatsApp: seller.whatsAppNumber } : {}),
  };
}

export function serializeOrder(order: any) {
  return {
    ...order,
    subtotal: Number(order.subtotal), deliveryFee: Number(order.deliveryFee), totalAmount: Number(order.totalAmount),
    items: order.items.map((item: any) => ({
      id: item.id, quantity: item.quantity, selectedColor: item.selectedColor,
      selectedSize: item.selectedSize, selectedVariation: item.selectedVariation,
      product: { ...item.productSnapshot, price: Number(item.unitPrice) },
    })),
    trackingTimeline: order.trackingTimeline.map((step: any) => ({ title: step.title, date: step.dateLabel, completed: step.completed, description: step.description })),
  };
}
