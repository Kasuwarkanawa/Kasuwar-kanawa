export type AccountType = 'buyer' | 'seller' | 'logistics' | 'admin';

export interface User {
  id: string;
  fullName: string;
  businessName?: string;
  phone: string;
  whatsAppNumber?: string;
  email: string;
  password?: string;
  address: string;
  businessAddress?: string;
  city: string;
  state: string;
  area: string;
  productCategory?: string;
  accountType: AccountType;
  status?: 'active' | 'pending' | 'suspended' | 'rejected';
  profileImage?: string;
  logisticsCompanyId?: string;
  createdAt: string;
}


export type LogisticsApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type DeliveryStatus =
  | 'awaiting_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface LogisticsServiceArea {
  state: string;
  cities: string[];
  areas?: string[];
}

export interface LogisticsPricing {
  state: string;
  city: string;
  fee: number;
  currency?: 'NGN';
}

export interface LogisticsCompany {
  id: string;
  ownerUserId: string;
  companyName: string;
  logo?: string;
  contactName: string;
  phone: string;
  whatsAppNumber?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  serviceAreas: LogisticsServiceArea[];
  pricing: LogisticsPricing[];
  approvalStatus: LogisticsApprovalStatus;
  adminNotes?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAgent {
  id: string;
  logisticsCompanyId: string;
  fullName: string;
  phone: string;
  whatsAppNumber?: string;
  email?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface LogisticsShipment {
  id: string;
  trackingNumber: string;
  orderId: string;
  logisticsCompanyId: string;
  deliveryAgentId?: string;
  buyerId: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: ShippingAddress;
  deliveryFee: number;
  status: DeliveryStatus;
  trackingTimeline: TrackingStep[];
  pickupAt?: string;
  deliveredAt?: string;
  deliveryProofImage?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariation {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  createdAt?: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  variations?: ProductVariation[];
  badge?: string;
  inStock?: boolean;
  stockLeft?: number;
  stockQuantity?: number;
  isFlashSale?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isSpecialOffer?: boolean;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  sellerBusinessName?: string;
  isApproved?: boolean;
  approvalStatus?: 'approved' | 'pending_approval' | 'rejected';
}

export interface Category {
  id: string;
  name: string;
  hausaName?: string;
  description?: string;
  iconName: string;
  itemCount: number;
  image: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariation?: string;
}

export type OrderStatus =
  | 'pending'
  | 'pending_order'
  | 'pending_payment'
  | 'pending_verification'
  | 'payment_confirmed'
  | 'processing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  state: string;
  city: string;
  area: string;
  completeAddress: string;
}

export interface PaymentConfirmation {
  method: 'opay' | 'cod';
  bankName: string;
  accountName: string;
  accountNumber: string;
  senderName?: string;
  transactionReference?: string;
  confirmedByBuyer: boolean;
  confirmedAt?: string;
  verifiedByAdmin: boolean;
  adminApproved?: boolean;
  verifiedAt?: string;
  adminNotes?: string;
  receiptPath?: string;
  receiptMimeType?: string;
  receiptUploadedAt?: string;
}

export interface TrackingStep {
  title: string;
  date: string;
  completed: boolean;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: 'opay' | 'cod';
  status: OrderStatus;
  paymentConfirmation: PaymentConfirmation;
  trackingTimeline: TrackingStep[];
  sellerId?: string;
  sellerName?: string;
  sellerBusinessName?: string;
  sellerPhone: string;
  sellerWhatsApp: string;
  logisticsCompanyId?: string;
  logisticsCompanyName?: string;
  shipmentId?: string;
  trackingNumber?: string;
  deliveryAgentId?: string;
  adminRejectionReason?: string;
  sellerRejectionReason?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  logisticsCompanyName?: string;
  trackingNumber?: string;
  logisticsStatus?: 'handed_to_logistics' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductReport {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

export interface BuyerReport {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerBusinessName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  orderNumber?: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

export interface SellerReport {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerBusinessName: string;
  orderNumber?: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

export interface SellerSalesStats {
  totalProductsListed: number;
  totalProductsSold: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface FlashSale {
  id: string;
  title: string;
  description?: string;
  bannerImage?: string;
  discountPercentage: number;
  startTime: string; // ISO string
  endTime: string; // ISO string
  productIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PromotionalAdvertisement {
  id: string;
  title: string;
  description: string;
  badge?: string;
  image: string;
  linkText?: string;
  linkUrl?: string;
  discountTag?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type?: 'info' | 'alert' | 'discount' | 'event';
  isPublished: boolean;
  createdAt: string;
}
