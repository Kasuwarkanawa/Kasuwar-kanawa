import { Product } from '../types';

const viteEnv = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string; DEV?: boolean } }).env;
const configuredApiUrl = viteEnv?.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || (viteEnv?.DEV ? 'http://localhost:4000/api' : '/api')).replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('Unable to reach Kasuwar Kanawa services. Check the connection and try again.');
  }

  const result = await response.json().catch(() => null) as (T & { error?: string; message?: string }) | null;
  if (!response.ok) {
    throw new Error(result?.error || result?.message || `Marketplace request failed (${response.status}).`);
  }
  return result as T;
}

export type SellerProductInput = Pick<Product, 'name' | 'category' | 'price' | 'image'> &
  Partial<Pick<Product, 'originalPrice' | 'discountPercentage' | 'images' | 'colors' | 'sizes' | 'variations' | 'badge' | 'stockQuantity' | 'isFlashSale' | 'isPopular' | 'isNew' | 'isSpecialOffer' | 'description'>>;

export const marketplaceApi = {
  sellerProducts: {
    list: () => request<Product[]>('/seller/products'),
    create: (product: SellerProductInput) => request<Product>('/seller/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
    update: (id: string, product: Partial<SellerProductInput>) => request<Product>(`/seller/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    }),
    remove: (id: string) => request<{ success: boolean }>(`/seller/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  },
};
