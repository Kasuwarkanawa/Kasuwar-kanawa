import { Product, FlashSale, PromotionalAdvertisement, Announcement, BuyerReport, CartItem, Category, ProductReview, LogisticsCompany, DeliveryAgent, LogisticsShipment, Order, TransferPayout, LogisticsServiceArea, LogisticsPricing, LogisticsPickupCentre } from '../types';
import { API_BASE_URL, SUPABASE_PUBLIC_KEY } from './apiConfig';


async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        apikey: SUPABASE_PUBLIC_KEY,
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
    reviews: (productId: string) => request<ProductReview[]>(`/products/${encodeURIComponent(productId)}/reviews`),
    submitReview: (productId: string, data: { rating: number; comment: string }) => request<ProductReview>(`/products/${encodeURIComponent(productId)}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    report: (productId: string, data: { reason: string; details: string }) => request<any>(`/products/${encodeURIComponent(productId)}/reports`, { method: 'POST', body: JSON.stringify(data) }),
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
  categories: {
    list: () => request<Category[]>('/categories'),
  },
  adminCategories: {
    list: () => request<Category[]>('/admin/categories'),
    create: (data: Partial<Category> & { name: string }) => request<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) => request<Category>(`/admin/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ success: boolean }>(`/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  buyer: {
    profile: () => request<{ user: any }>('/buyer/profile'),
    updateProfile: (data: Record<string, unknown>) => request<{ user: any }>('/buyer/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  seller: {
    profile: () => request<{ user: any }>('/seller/profile'),
    updateProfile: (data: Record<string, unknown>) => request<{ user: any }>('/seller/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  cart: {
    list: () => request<{ items: CartItem[] }>('/cart'),
    add: (data: { productId: string; quantity: number; selectedColor?: string; selectedSize?: string; selectedVariation?: string }) =>
      request<{ success: boolean }>('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, quantity: number) =>
      request<{ success: boolean }>(`/cart/items/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
    remove: (id: string) =>
      request<{ success: boolean }>(`/cart/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    clear: () => request<{ items: CartItem[] }>('/cart', { method: 'DELETE' }),
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
    updateLogisticsStatus: (id: string, status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed', notes: string) =>
      request<any>(`/orders/admin/${encodeURIComponent(id)}/logistics-update`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    requestDeliveryFailureAction: (id: string, action: 'retry' | 'refund' | 'cancel', notes?: string) =>
      request<any>(`/orders/${encodeURIComponent(id)}/delivery-failure-request`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
    resolveDeliveryFailure: (id: string, decision: 'retry' | 'refund' | 'reject_refund' | 'cancel', notes: string) =>
      request<any>(`/orders/admin/${encodeURIComponent(id)}/delivery-failure-resolution`, { method: 'PATCH', body: JSON.stringify({ decision, notes }) }),
    assignLogistics: (id: string, logisticsCompanyId: string | null) =>
      request<{ success: boolean; order: Order }>(`/admin/orders/${encodeURIComponent(id)}/logistics-assignment`, {
        method: 'PATCH',
        body: JSON.stringify({ logisticsCompanyId }),
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
    createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => request<Announcement>('/content/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
    updateAnnouncement: (id: string, data: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => request<Announcement>(`/content/admin/announcements/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteAnnouncement: (id: string) => request<{ success: boolean }>(`/content/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  adminProducts: {
    create: (data: { name: string; category: string; price: number; originalPrice?: number; discountPercentage?: number; image: string; description?: string; stockQuantity: number; sellerId: string }) =>
      request<Product>('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    pending: () => request<Product[]>('/admin/products/pending?take=100'),
    update: (id: string, data: Partial<Product>) => request<Product>(`/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<{ success: boolean }>(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    setApproval: (id: string, status: 'APPROVED' | 'REJECTED') => request<Product>(`/admin/products/${encodeURIComponent(id)}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  },
  adminUsers: {
    create: (data: { fullName: string; email: string; phone: string; password: string; accountType: 'buyer' | 'seller'; businessName?: string; productCategory?: string; address?: string }) =>
      request<{ user: any }>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    list: (params: { role?: 'BUYER' | 'SELLER' | 'LOGISTICS'; status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'; take?: number; skip?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.role) query.set('role', params.role);
      if (params.status) query.set('status', params.status);
      if (params.take) query.set('take', String(params.take));
      if (params.skip) query.set('skip', String(params.skip));
      return request<any[]>(`/admin/users?${query.toString()}`);
    },
    updateProfile: (id: string, data: Record<string, unknown>) => request<{ user: any }>(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    setStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED') =>
      request<{ user: any }>(`/admin/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  codSettlement: {
    logisticsList: () => request<CODSettlement[]>('/logistics/cod-settlements'),
    remittanceAccount: () => request<{bankName:string;accountName:string;accountNumber:string}>('/logistics/remittance-account'),
    uploadLogisticsReceipt: (id:string,file:File) => request<CODSettlement>(`/logistics/cod-settlements/${encodeURIComponent(id)}/receipt`,{method:'POST',headers:{'Content-Type':file.type},body:file}),
    adminList: () => request<CODSettlement[]>('/admin/cod-settlements'),
    adminSettings: () => request<{bankName:string;accountName:string;accountNumber:string}>('/admin/payout-settings'),
    saveAdminSettings: (data:{bankName:string;accountName:string;accountNumber:string}) => request<any>('/admin/payout-settings',{method:'PATCH',body:JSON.stringify(data)}),
    logisticsReceiptUrl: (id:string) => request<{url:string}>('/admin/cod-settlements/'+encodeURIComponent(id)+'/logistics-receipt'),
    confirmLogistics: (id:string,decision:'confirm'|'reject',notes?:string) => request<CODSettlement>('/admin/cod-settlements/'+encodeURIComponent(id)+'/logistics-confirmation',{method:'PATCH',body:JSON.stringify({decision,notes})}),
    uploadSellerReceipt: (id:string,file:File) => request<CODSettlement>('/admin/cod-settlements/'+encodeURIComponent(id)+'/seller-receipt',{method:'POST',headers:{'Content-Type':file.type},body:file}),
    sellerList: () => request<CODSettlement[]>('/seller/cod-settlements'),
    sellerReceiptUrl: (id:string) => request<{url:string}>('/seller/cod-settlements/'+encodeURIComponent(id)+'/receipt'),
    acceptSellerPayment: (id:string) => request<CODSettlement>('/seller/cod-settlements/'+encodeURIComponent(id)+'/accept',{method:'POST'}),
    saveSellerBank: (data:{bankName:string;accountName:string;accountNumber:string}) => request<any>('/seller/payout-account',{method:'PATCH',body:JSON.stringify(data)}),
  },
  transferPayout: {
    adminList: () => request<TransferPayout[]>('/admin/transfer-payouts'),
    sellerList: () => request<TransferPayout[]>('/seller/transfer-payouts'),
    uploadAdminReceipt: (id:string,file:File) => request<TransferPayout>('/admin/transfer-payouts/'+encodeURIComponent(id)+'/receipt',{method:'POST',headers:{'Content-Type':file.type},body:file}),
    adminReceiptUrl: (id:string) => request<{url:string}>('/admin/transfer-payouts/'+encodeURIComponent(id)+'/receipt'),
    sellerReceiptUrl: (id:string) => request<{url:string}>('/seller/transfer-payouts/'+encodeURIComponent(id)+'/receipt'),
    acceptSellerPayment: (id:string) => request<TransferPayout>('/seller/transfer-payouts/'+encodeURIComponent(id)+'/accept',{method:'POST'}),
  },
  shipping: {
    quote: (state: string, city: string, subtotal: number) =>
      request<{ companyId: string; companyName: string; deliveryFee: number; freeDelivery: boolean; state: string; city: string; subtotal: number }>(`/shipping/quote?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}&subtotal=${encodeURIComponent(String(subtotal))}`),
  },
  logistics: {
    centres: () => request<LogisticsPickupCentre[]>('/logistics/centres'),
    addCentre: (data: Omit<LogisticsPickupCentre, 'id' | 'logisticsCompanyId' | 'isActive' | 'createdAt' | 'updatedAt'>) =>
      request<LogisticsPickupCentre>('/logistics/centres', { method: 'POST', body: JSON.stringify(data) }),
    updateCentre: (id: string, isActive: boolean) =>
      request<LogisticsPickupCentre>(`/logistics/centres/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    removeCentre: (id: string) =>
      request<{ success: boolean }>(`/logistics/centres/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    company: () => request<LogisticsCompany>('/logistics/company'),
    updateCompany: (data: { serviceAreas: LogisticsServiceArea[]; pricing: LogisticsPricing[] }) => request<LogisticsCompany>('/logistics/company', { method: 'PATCH', body: JSON.stringify(data) }),
    orders: () => request<Order[]>('/logistics/orders'),
    agents: () => request<DeliveryAgent[]>('/logistics/agents'),
    addAgent: (data: { fullName: string; phone: string; whatsAppNumber?: string; email?: string; vehicleType?: string; vehiclePlateNumber?: string; profileImage?: string }) =>
      request<DeliveryAgent>('/logistics/agents', { method: 'POST', body: JSON.stringify(data) }),
    updateAgent: (id: string, status: 'active' | 'inactive' | 'suspended') =>
      request<DeliveryAgent>(`/logistics/agents/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    removeAgent: (id: string) =>
      request<{ success: boolean }>(`/logistics/agents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    shipments: () => request<LogisticsShipment[]>('/logistics/shipments'),
    createShipment: (orderId: string, deliveryAgentId?: string) =>
      request<LogisticsShipment>('/logistics/shipments', { method: 'POST', body: JSON.stringify({ orderId, deliveryAgentId }) }),
    assignAgent: (shipmentId: string, deliveryAgentId: string | null) =>
      request<LogisticsShipment>(`/logistics/shipments/${encodeURIComponent(shipmentId)}/agent`, { method: 'PATCH', body: JSON.stringify({ deliveryAgentId }) }),
    updateShipmentStatus: (shipmentId: string, status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed', notes?: string) =>
      request<LogisticsShipment>(`/logistics/shipments/${encodeURIComponent(shipmentId)}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  },
  adminReports: {
    list: () => request<{ products: any[]; buyers: any[]; sellers: any[] }>('/admin/reports?take=100'),
    update: (type: 'product' | 'buyer' | 'seller', id: string, status: 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected', adminNotes?: string) =>
      request<any>(`/admin/reports/${type}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes }) }),
  },
  sellerReports: {
    buyerReports: () => request<Array<BuyerReport & { buyer?: { id: string; fullName: string; phone: string } }>>('/seller/reports/buyers'),
    reportBuyer: (data: { buyerId: string; orderId: string; reason: string; details: string }) =>
      request<BuyerReport>('/seller/reports/buyers', { method: 'POST', body: JSON.stringify(data) }),
  },
  sellerFulfillment: {
    list: () => request<any[]>('/seller/fulfillments'),
    centres: () => request<Array<{ id: string; centreName: string; address: string; state: string; city: string; area?: string; company?: { companyName: string } }>>('/seller/fulfillment-centres'),
    save: (orderId: string, data: { packageWeightKg: number; lengthCm?: number | null; widthCm?: number | null; heightCm?: number | null; parcelCount: number; fulfillmentMethod: 'logistics_pickup' | 'centre_dropoff' | 'seller_delivery'; pickupCentreId?: string; sellerNotes?: string }) =>
      request<any>(`/seller/orders/${encodeURIComponent(orderId)}/fulfillment`, { method: 'POST', body: JSON.stringify(data) }),
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
