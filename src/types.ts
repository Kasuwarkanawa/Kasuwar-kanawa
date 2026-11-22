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

export interface SellerFulfillment {
  id: string;
  orderId: string;
  sellerId: string;
  packageWeightKg: number;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  parcelCount: number;
  fulfillmentMethod: 'logistics_pickup' | 'centre_dropoff' | 'seller_delivery';
  pickupCentreId?: string | null;
  sellerNotes?: string;
  status: 'prepared' | 'awaiting_pickup' | 'received_at_centre' | 'handed_to_logistics' | 'seller_delivery';
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsPickupCentre {
  id: string;
  logisticsCompanyId: string;
  centreName: string;
  centreType: 'pickup' | 'dropoff' | 'both';
  contactName: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  area?: string;
  openingHours: string;
  isActive: boolean;
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
  profileImage?: string;
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
  deliveryFailureStatus?: 'none' | 'action_required' | 'retry_requested' | 'retry_approved' | 'refund_requested' | 'refund_approved' | 'refund_rejected' | 'retry_in_progress' | 'resolved';
  deliveryFailureReason?: string | null;
  deliveryFailureRequestedAction?: 'retry' | 'refund' | 'cancel' | null;
  deliveryFailureRequestNotes?: string | null;
  deliveryFailureRequestedAt?: string | null;
  deliveryFailureResolvedAt?: string | null;
  deliveryAttemptCount?: number;
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


export interface TransferPayout {
  id:string; orderId:string; sellerId:string; grossOrderAmount:number; commissionRate:number;
  commissionAmount:number; sellerPayoutAmount:number; sellerTransferReceiptPath?:string;
  sellerTransferredAt?:string; sellerAcceptedAt?:string;
  status:'awaiting_admin_payout'|'awaiting_seller_confirmation'|'completed'|'seller_receipt_rejected';
  adminNotes?:string; createdAt:string; updatedAt:string;
  order?:{id:string;orderNumber:string;subtotal:number;totalAmount:number;paymentMethod:'opay'|'cod';items:Array<{productSnapshot:any;quantity:number;unitPrice:number}>};
  seller?:{id:string;fullName:string;businessName?:string;phone:string;payoutBankName?:string;payoutAccountName?:string;payoutAccountNumber?:string};
}

export interface CODSettlement {
  id: string; orderId: string; logisticsCompanyId: string; sellerId: string;
  grossCollectedAmount: number; commissionRate: number; commissionAmount: number; sellerPayoutAmount: number;
  logisticsTransferReceiptPath?: string; sellerTransferReceiptPath?: string; logisticsTransferredAt?: string; logisticsConfirmedAt?: string; sellerTransferredAt?: string; sellerAcceptedAt?: string;
  status: 'awaiting_logistics_transfer' | 'awaiting_admin_logistics_confirmation' | 'awaiting_seller_payout' | 'awaiting_seller_confirmation' | 'completed' | 'logistics_receipt_rejected' | 'seller_receipt_rejected';
  adminNotes?: string;
  order?: { id: string; orderNumber: string; subtotal: number; deliveryFee: number; totalAmount: number; items: Array<{ productSnapshot: any; quantity: number; unitPrice: number }> };
  seller?: { id: string; fullName: string; businessName?: string; phone: string; payoutBankName?: string; payoutAccountName?: string; payoutAccountNumber?: string };
}
