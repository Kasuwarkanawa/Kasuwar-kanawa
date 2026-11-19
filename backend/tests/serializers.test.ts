import { describe, expect, it } from 'vitest';
import { serializeProduct } from '../src/utils/serializers.js';

describe('public product serialization', () => {
  it('keeps merchant identity but never exposes a seller phone or WhatsApp number', () => {
    const product = serializeProduct({
      id: 'product-1',
      name: 'Sample product',
      price: 12000,
      originalPrice: 15000,
      stockQuantity: 4,
      approvalStatus: 'APPROVED',
      seller: {
        id: 'seller-1',
        fullName: 'Sample Seller',
        businessName: 'Sample Store',
        phone: '08000000000',
        whatsAppNumber: '2348000000000',
      },
      reviews: [],
    });

    expect(product.sellerId).toBe('seller-1');
    expect(product.sellerName).toBe('Sample Seller');
    expect(product.sellerBusinessName).toBe('Sample Store');
    expect(product).not.toHaveProperty('sellerPhone');
    expect(product).not.toHaveProperty('sellerWhatsApp');
  });
});
