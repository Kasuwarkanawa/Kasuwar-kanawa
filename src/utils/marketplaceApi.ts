import { Product, FlashSale, PromotionalAdvertisement, Announcement } from '../types';

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
        ...(init.body instanceof FormData || init.body instanceof Blob ? {} : { 'Content-Type': 'application/json' }),
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
  catalog: {
    list: (params: { search?: string; category?: string; take?: number; skip?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.category) query.set('category', params.category);
      if (params.take) query.set('take', String(params.take));
      if (params.skip) query.set('skip', String(params.skip));
      const suffix = query.toString();
      return request<Product[]>(`/products${suffix ? `?${suffix}` : ''}`);
    },
  },
  orders: {
    mine: () => request<any[]>('/orders/mine?take=100'),
    adminAll: () => request<any[]>('/orders/admin/all?take=100'),
    sellerMine: () => request<any[]>('/orders/seller/mine?take=100'),
    sellerStatus: (id: string, status: 'processing' | 'rejected', reason?: string) =>
      request<any>(`/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    logisticsHandoff: (id: string, logisticsCompanyName: string, trackingNumber: string, notes?: string) =>
      request<any>(`/orders/${encodeURIComponent(id)}/logistics-handoff`, {
        method: 'PATCH',
        body: JSON.stringify({ logisticsCompanyName, trackingNumber, notes }),
      }),
    approveOpay: (id: string, decision: 'approve' | 'reject', adminNotes?: string) =>
      request<any>(`/orders/admin/${encodeURIComponent(id)}/payment-verification`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, adminNotes }),
      }),
    approveCod: (id: string, decision: 'approve' | 'reject', adminNotes?: string) =>
      request<any>(`/orders/admin/${encodeURIComponent(id)}/cod-approval`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, adminNotes }),
      }),
    receiptUrl: (id: string) =>
      request<{ url: string; expiresIn: number }>(`/orders/admin/${encodeURIComponent(id)}/payment-receipt`),
    create: (data: {
      items: Array<{ productId: string; quantity: number; selectedColor?: string; selectedSize?: string; selectedVariation?: string }>;
      paymentMethod: 'opay' | 'cod';
      shippingAddress: { fullName: string; phoneNumber: string; state: string; city: string; area: string; completeAddress: string };
    }) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    confirmOpay: (id: string, senderName: string, transactionReference: string) =>
      request<any>(`/orders/${encodeURIComponent(id)}/payment-confirmation`, {
        method: 'POST',
        body: JSON.stringify({ senderName, transactionReference }),
      }),
    uploadReceipt: (id: string, file: File) =>
      request<any>(`/orders/${encodeURIComponent(id)}/payment-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      }),
  },
  content: {
    publicPromotions: () => request<PromotionalAdvertisement[]>('/content/advertisements'),
    publicFlashSales: () => request<FlashSale[]>('/content/flash-sales'),
    publicAnnouncements: () => request<Announcement[]>('/content/announcements'),
    adminPromotions: () => request<PromotionalAdvertisement[]>('/content/admin/advertisements'),
    createPromotion: (data: Omit<PromotionalAdvertisement, 'id' | 'createdAt'>) =>
      request<PromotionalAdvertisement>('/content/admin/advertisements', { method: 'POST', body: JSON.stringify(data) }),
    updatePromotion: (id: string, data: Partial<Omit<PromotionalAdvertisement, 'id' | 'createdAt'>>) =>
      request<PromotionalAdvertisement>(`/content/admin/advertisements/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePromotion: (id: string) =>
      request<{ success: boolean }>(`/content/admin/advertisements/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    adminFlashSales: () => request<FlashSale[]>('/content/admin/flash-sales'),
    createFlashSale: (data: Omit<FlashSale, 'id' | 'createdAt'>) =>
      request<FlashSale>('/content/admin/flash-sales', { method: 'POST', body: JSON.stringify(data) }),
    updateFlashSale: (id: string, data: Partial<Omit<FlashSale, 'id' | 'createdAt'>>) =>
      request<FlashSale>(`/content/admin/flash-sales/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteFlashSale: (id: string) =>
      request<{ success: boolean }>(`/content/admin/flash-sales/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    adminAnnouncements: () => request<Announcement[]>('/content/admin/announcements'),
  },
  adminProducts: {
    pending: () => request<Product[]>('/admin/products/pending?take=100'),
    setApproval: (id: string, status: 'APPROVED' | 'REJECTED') => request<Product>(`/admin/products/${encodeURIComponent(id)}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  },
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
