import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Package,
  CreditCard,
  Flag,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Building,
  Truck,
  MessageCircle,
  Phone,
  Search,
  Check,
  ShoppingBag,
  Zap,
  Tag,
  Megaphone,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Percent,
  Users,
  UserCheck,
  UserX,
  Store,
  ArrowRight,
  ExternalLink,
  Lock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Star,
  Layers,
  MapPin,
  Mail,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { authApi } from '../utils/authApi';
import { marketplaceApi } from '../utils/marketplaceApi';
import { UserAvatar } from './UserAvatar';
import { ProfileImageUploader } from './ProfileImageUploader';
import { SUPABASE_PUBLIC_KEY } from '../utils/apiConfig';
import {
  User,
  Product,
  Order,
  BuyerReport,
  ProductReport,
  SellerReport,
  OrderStatus,
  FlashSale,
  PromotionalAdvertisement,
  Announcement,
  Category,
  ProductReview,
  LogisticsCompany,
  DeliveryAgent,
  LogisticsShipment,
} from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
  currentUser?: User | null;
  onAdminLogin?: (user: User) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
  currentUser,
  onAdminLogin,
}) => {
  // State 1: Active Tab
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'users'
    | 'buyers'
    | 'sellers'
    | 'products'
    | 'payments'
    | 'orders'
    | 'categories'
    | 'flash_sales'
    | 'discounts'
    | 'ads'
    | 'reports'
    | 'deliveries'
    | 'logistics'
  >('dashboard');

  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingBackendProducts, setPendingBackendProducts] = useState<Product[]>([]);
  const [backendOrders, setBackendOrders] = useState<Order[]>([]);
  const [backendUsers, setBackendUsers] = useState<User[]>([]);
  const [backendCategories, setBackendCategories] = useState<Category[]>([]);
  const [backendAnnouncements, setBackendAnnouncements] = useState<Announcement[]>([]);
  const [backendOrdersError, setBackendOrdersError] = useState<string | null>(null);
  const [backendBuyerReports, setBackendBuyerReports] = useState<BuyerReport[]>([]);
  const [backendProductReports, setBackendProductReports] = useState<ProductReport[]>([]);
  const [backendSellerReports, setBackendSellerReports] = useState<SellerReport[]>([]);
  const [buyerReportsLoading, setBuyerReportsLoading] = useState(false);
  const [buyerReportsError, setBuyerReportsError] = useState<string | null>(null);
  const [receiptLinks, setReceiptLinks] = useState<Record<string, string>>({});
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null);
  const [pendingProductsLoading, setPendingProductsLoading] = useState(false);
  const [pendingProductsError, setPendingProductsError] = useState<string | null>(null);
  const [productDecisionBusy, setProductDecisionBusy] = useState<string | null>(null);
  const [backendFlashSales, setBackendFlashSales] = useState<FlashSale[]>([]);
  const [backendPromotions, setBackendPromotions] = useState<PromotionalAdvertisement[]>([]);
  const [backendApprovedProducts, setBackendApprovedProducts] = useState<Product[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [promotionSaving, setPromotionSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || currentUser?.accountType !== 'admin') return;
    let active = true;
    Promise.all([
      marketplaceApi.adminUsers.list({ take: 100 }),
      marketplaceApi.adminCategories.list(),
      marketplaceApi.content.adminAnnouncements(),
    ])
      .then(([users, categories, announcements]) => {
        if (!active) return;
        setBackendUsers(users as User[]);
        setBackendCategories(categories);
        setBackendAnnouncements(announcements);
      })
      .catch((error) => {
        if (active) showNotification(error instanceof Error ? error.message : 'Unable to load Admin records from Supabase.');
      });
    return () => { active = false; };
  }, [isOpen, currentUser?.id, currentUser?.accountType, refreshKey]);

  useEffect(() => {
    if (!isOpen || currentUser?.accountType !== 'admin') return;
    let active = true;
    setPendingProductsLoading(true);
    marketplaceApi.adminProducts.pending()
      .then((products) => { if (active) { setPendingBackendProducts(products); setPendingProductsError(null); } })
      .catch((error) => { if (active) setPendingProductsError(error instanceof Error ? error.message : 'Unable to load pending products.'); })
      .finally(() => { if (active) setPendingProductsLoading(false); });
    return () => { active = false; };
  }, [isOpen, currentUser?.id, currentUser?.accountType, refreshKey]);

  useEffect(() => {
    if (!isOpen || currentUser?.accountType !== 'admin') return;
    let active = true;
    marketplaceApi.orders.adminAll()
      .then((orders) => { if (active) { setBackendOrders(orders as Order[]); setBackendOrdersError(null); } })
      .catch((error) => { if (active) setBackendOrdersError(error instanceof Error ? error.message : 'Unable to load backend orders.'); });
    return () => { active = false; };
  }, [isOpen, currentUser?.id, currentUser?.accountType, refreshKey]);

  useEffect(() => {
    if (!isOpen || currentUser?.accountType !== 'admin') return;
    let active = true;
    setContentLoading(true);
    Promise.all([
      marketplaceApi.content.adminFlashSales(),
      marketplaceApi.content.adminPromotions(),
      marketplaceApi.catalog.list({ take: 100 }),
    ])
      .then(([sales, promotions, products]) => {
        if (!active) return;
        setBackendFlashSales(sales);
        setBackendPromotions(promotions);
        setBackendApprovedProducts(products);
        setContentError(null);
      })
      .catch((error) => {
        if (active) setContentError(error instanceof Error ? error.message : 'Unable to load promotional content from the database.');
      })
      .finally(() => { if (active) setContentLoading(false); });
    return () => { active = false; };
  }, [isOpen, currentUser?.id, currentUser?.accountType, refreshKey]);



  useEffect(() => {
    if (!isOpen || currentUser?.accountType !== 'admin' || activeTab !== 'reports') return;
    let active = true;
    setBuyerReportsLoading(true);
    marketplaceApi.adminReports.list()
      .then((data) => {
        if (!active) return;
        setBackendBuyerReports((data.buyers || []).map((report: any) => ({
          id: report.id,
          sellerId: report.seller?.id ?? report.sellerId,
          sellerName: report.seller?.fullName ?? 'Seller',
          sellerBusinessName: report.seller?.businessName ?? '',
          buyerId: report.buyer?.id ?? report.buyerId,
          buyerName: report.buyer?.fullName ?? 'Buyer',
          buyerPhone: report.buyer?.phone ?? '',
          orderNumber: report.orderNumber ?? undefined,
          reason: report.reason,
          details: report.details,
          status: report.status,
          adminNotes: report.adminNotes ?? undefined,
          createdAt: report.createdAt,
        })));
        setBackendProductReports((data.products || []).map((report: any) => ({
          id: report.id, productId: report.productId, productName: report.product?.name ?? 'Product',
          buyerId: report.reporter?.id ?? report.reporterId, buyerName: report.reporter?.fullName ?? 'Buyer',
          buyerPhone: report.reporter?.phone ?? '', reason: report.reason, details: report.details,
          status: report.status, adminNotes: report.adminNotes ?? undefined, createdAt: report.createdAt,
        })));
        setBackendSellerReports((data.sellers || []).map((report: any) => ({
          id: report.id, buyerId: report.buyer?.id ?? report.buyerId, buyerName: report.buyer?.fullName ?? 'Buyer',
          buyerPhone: '', sellerId: report.seller?.id ?? report.sellerId, sellerName: report.seller?.fullName ?? 'Seller',
          sellerBusinessName: report.seller?.businessName ?? '', orderNumber: report.orderNumber ?? undefined,
          reason: report.reason, details: report.details, status: report.status,
          adminNotes: report.adminNotes ?? undefined, createdAt: report.createdAt,
        })));
        setBuyerReportsError(null);
      })
      .catch((error) => {
        if (active) setBuyerReportsError(error instanceof Error ? error.message : 'Unable to load buyer reports from database.');
      })
      .finally(() => { if (active) setBuyerReportsLoading(false); });
    return () => { active = false; };
  }, [isOpen, currentUser?.id, currentUser?.accountType, activeTab, refreshKey]);

  // Authentication State for Super Admin Gate
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showFirstAdminSetup, setShowFirstAdminSetup] = useState(false);
  const [setupToken, setSetupToken] = useState('');
  const [setupFullName, setSetupFullName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'rejected'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentSubFilter, setPaymentSubFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('pending');
  const [reportSubTab, setReportSubTab] = useState<'product_reports' | 'buyer_reports' | 'seller_reports'>('product_reports');
  const [adsSubTab, setAdsSubTab] = useState<'banners' | 'announcements'>('banners');

  // Modal / Drawer Action States
  const [selectedBuyerForHistory, setSelectedBuyerForHistory] = useState<User | null>(null);
  const [selectedSellerForHistory, setSelectedSellerForHistory] = useState<User | null>(null);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const [backendProductReviews, setBackendProductReviews] = useState<ProductReview[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // User Management Modals
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userWhatsApp, setUserWhatsApp] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userBusinessName, setUserBusinessName] = useState('');
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [userStatus, setUserStatus] = useState<'active' | 'pending' | 'suspended' | 'rejected'>('active');
  const [userProfileImage, setUserProfileImage] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Product Management Modals
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Kasuwar Kwari');
  const [prodPrice, setProdPrice] = useState<number>(15000);
  const [prodOrigPrice, setProdOrigPrice] = useState<number>(20000);
  const [prodDiscountPercent, setProdDiscountPercent] = useState<number>(25);
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80');
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [productImageUploadError, setProductImageUploadError] = useState('');

  const [prodDescription, setProdDescription] = useState('');
  const [prodSellerId, setProdSellerId] = useState('usr-seller-1');

  const handleProductGalleryUpload = async (file?: File) => {
    if (!file) return;
    setProductImageUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProductImageUploadError('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProductImageUploadError('Image must be 5MB or smaller.');
      return;
    }
    setIsUploadingProductImage(true);
    try {
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `${crypto.randomUUID()}.${extension}`;
      const response = await fetch(`https://efirbpzfimzmpchsovbz.supabase.co/storage/v1/object/product-images/${fileName}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLIC_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}`,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: file,
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.message || detail.error || `Upload failed (${response.status}).`);
      }
      setProdImage(`https://efirbpzfimzmpchsovbz.supabase.co/storage/v1/object/public/product-images/${fileName}`);
    } catch (error) {
      setProductImageUploadError(error instanceof Error ? error.message : 'Could not upload image. Please try again.');
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  // Category Management Modals
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catHausaName, setCatHausaName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImage, setCatImage] = useState('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80');
  const [catIconName, setCatIconName] = useState('Shirt');

  // Flash Sale States
  const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(null);
  const [isCreatingFlashSale, setIsCreatingFlashSale] = useState(false);
  const [fsTitle, setFsTitle] = useState('Weekend Super Flash Sale');
  const [fsDescription, setFsDescription] = useState('Limited time discounts on selected hot products in Kano hubs.');
  const [fsDiscount, setFsDiscount] = useState<number>(25);
  const [fsStartTime, setFsStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [fsEndTime, setFsEndTime] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [fsProductIds, setFsProductIds] = useState<string[]>([]);
  const [fsIsActive, setFsIsActive] = useState(true);

  // Product Discounts States
  const [editingDiscountProduct, setEditingDiscountProduct] = useState<Product | null>(null);
  const [discOriginalPrice, setDiscOriginalPrice] = useState<number>(0);
  const [discPrice, setDiscPrice] = useState<number>(0);
  const [discPercentage, setDiscPercentage] = useState<number>(0);
  const [discIsSpecialOffer, setDiscIsSpecialOffer] = useState(false);
  const [discIsFlashSale, setDiscIsFlashSale] = useState(false);
  const [discountSearchQuery, setDiscountSearchQuery] = useState('');

  // Advertisements States
  const [editingAd, setEditingAd] = useState<PromotionalAdvertisement | null>(null);
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adBadge, setAdBadge] = useState('PROMO!');
  const [adDiscountTag, setAdDiscountTag] = useState('Save 20%');
  const [adImage, setAdImage] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80');
  const [adLinkText, setAdLinkText] = useState('Shop Now');
  const [adLinkUrl, setAdLinkUrl] = useState('#popular-products-section');
  const [adIsActive, setAdIsActive] = useState(true);

  // Announcements States
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [ancTitle, setAncTitle] = useState('');
  const [ancDescription, setAncDescription] = useState('');
  const [ancType, setAncType] = useState<'info' | 'discount' | 'alert' | 'event'>('discount');
  const [ancIsPublished, setAncIsPublished] = useState(true);

  const handleOpenCreatePromotion = () => {
    setEditingAd(null); setAdTitle(''); setAdDescription(''); setAdBadge('PROMO!');
    setAdDiscountTag('Save 20%'); setAdImage('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80');
    setAdLinkText('Shop Now'); setAdLinkUrl('#popular-products-section'); setAdIsActive(true); setIsCreatingAd(true);
  };

  const handleOpenEditPromotion = (ad: PromotionalAdvertisement) => {
    setEditingAd(ad); setAdTitle(ad.title); setAdDescription(ad.description); setAdBadge(ad.badge || 'PROMO!');
    setAdDiscountTag(ad.discountTag || ''); setAdImage(ad.image); setAdLinkText(ad.linkText || 'Shop Now');
    setAdLinkUrl(ad.linkUrl || '#popular-products-section'); setAdIsActive(ad.isActive); setIsCreatingAd(true);
  };

  const handleSavePromotion = async (event: React.FormEvent) => {
    event.preventDefault(); setPromotionSaving(true);
    const payload = { title: adTitle.trim(), description: adDescription.trim(), badge: adBadge.trim() || undefined,
      discountTag: adDiscountTag.trim() || undefined, image: adImage.trim(), linkText: adLinkText.trim() || 'Shop Now',
      linkUrl: adLinkUrl.trim() || '#popular-products-section', isActive: adIsActive };
    try {
      const saved = editingAd ? await marketplaceApi.content.updatePromotion(editingAd.id, payload) : await marketplaceApi.content.createPromotion(payload);
      setBackendPromotions((previous) => editingAd ? previous.map((item) => item.id === saved.id ? saved : item) : [saved, ...previous]);
      setIsCreatingAd(false); showNotification(editingAd ? 'Promotion updated in database.' : 'Promotion published to database.'); triggerRefresh();
    } catch (error) { showNotification(error instanceof Error ? error.message : 'Could not save promotion.'); }
    finally { setPromotionSaving(false); }
  };

  const handleTogglePromotion = async (ad: PromotionalAdvertisement) => {
    try {
      const updated = await marketplaceApi.content.updatePromotion(ad.id, { isActive: !ad.isActive });
      setBackendPromotions((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      showNotification(updated.isActive ? 'Promotion is now live.' : 'Promotion paused.'); triggerRefresh();
    } catch (error) { showNotification(error instanceof Error ? error.message : 'Could not update promotion status.'); }
  };

  const handleDeletePromotion = async (ad: PromotionalAdvertisement) => {
    if (!window.confirm(`Delete promotion "${ad.title}"?`)) return;
    try {
      await marketplaceApi.content.deletePromotion(ad.id);
      setBackendPromotions((previous) => previous.filter((item) => item.id !== ad.id));
      showNotification('Promotion deleted from database.'); triggerRefresh();
    } catch (error) { showNotification(error instanceof Error ? error.message : 'Could not delete promotion.'); }
  };

  // Payment Rejection State
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment transfer reference could not be verified in official OPay portal.');

  // Notification Toast in modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedBackendLogisticsStatuses, setSelectedBackendLogisticsStatuses] = useState<Record<string, 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed'>>({});
  const [logisticsUpdateBusy, setLogisticsUpdateBusy] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (!isOpen || !selectedProductForReviews) { setBackendProductReviews([]); return; }
    let active = true;
    marketplaceApi.catalog.reviews(selectedProductForReviews.id)
      .then((reviews) => { if (active) setBackendProductReviews(reviews); })
      .catch((error) => { if (active) showNotification(error instanceof Error ? error.message : 'Unable to load product reviews.'); });
    return () => { active = false; };
  }, [isOpen, selectedProductForReviews?.id]);

  if (!isOpen) return null;

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
    if (onDataChanged) onDataChanged();
  };

  // Check admin authorization
  const isSuperAdmin = currentUser?.accountType === 'admin';

  // Handle Admin Login Action
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const user = await authApi.loginAdmin({ identifier: adminUsername.trim(), password: adminPassword });
      if (onAdminLogin) onAdminLogin(user);
      triggerRefresh();
      showNotification(`Welcome back, ${user.fullName}! Super Admin access granted.`);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Super Admin authentication failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFirstAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUpAdmin(true);
    setLoginError(null);
    try {
      const user = await authApi.bootstrapAdmin({
        setupToken: setupToken.trim(),
        fullName: setupFullName.trim(),
        email: setupEmail.trim(),
        phone: setupPhone.trim(),
        password: setupPassword,
      });
      if (onAdminLogin) onAdminLogin(user);
      showNotification('First Super Admin account created successfully.');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'First Super Admin setup failed.');
    } finally {
      setIsSettingUpAdmin(false);
    }
  };

  // Data queries from database
  const allUsers = backendUsers;
  const allProducts = [...backendApprovedProducts, ...pendingBackendProducts];
  const allOrders = backendOrders;
  const allCategories = backendCategories;
  const productReports = backendProductReports;
  const buyerReports = backendBuyerReports;
  const sellerReports = backendSellerReports;
  const allFlashSales = backendFlashSales;
  const allAds = backendPromotions;
  const allAnnouncements = backendAnnouncements;
  const dispatchedAndDelivered = backendOrders.filter((order) => ['dispatched', 'delivered'].includes(order.status));
  const logisticsCompanies: LogisticsCompany[] = [];
  const logisticsAgents: DeliveryAgent[] = [];
  const logisticsShipments: LogisticsShipment[] = [];
  const pendingLogisticsCompanies = logisticsCompanies.filter((company) => company.approvalStatus === 'pending');
  const approvedLogisticsCompanies = logisticsCompanies.filter((company) => company.approvalStatus === 'approved');


  // Statistics calculation for Dashboard
  const buyersList = allUsers.filter((u) => u.accountType === 'buyer');
  const sellersList = allUsers.filter((u) => u.accountType === 'seller');
  const totalBuyers = buyersList.length;
  const totalSellers = sellersList.length;
  const totalProducts = allProducts.length;
  const totalOrders = allOrders.length;

  const totalPaidOrders = allOrders.filter(
    (o) =>
      o.status === 'payment_confirmed' ||
      o.paymentConfirmation?.verifiedByAdmin ||
      (o.paymentMethod === 'cod' && o.status === 'delivered')
  ).length;

  const pendingPayments = allOrders.filter(
    (o) =>
      o.paymentMethod === 'opay' &&
      (o.status === 'pending_verification' ||
        (!o.paymentConfirmation?.verifiedByAdmin && o.status !== 'rejected' && o.status !== 'cancelled'))
  );

  const deliveredOrders = allOrders.filter((o) => o.status === 'delivered').length;
  const pendingOrders = allOrders.filter(
    (o) =>
      o.status === 'pending' ||
      o.status === 'pending_order' ||
      o.status === 'pending_payment' ||
      o.status === 'pending_verification'
  ).length;

  // Payments Filtering
  const opayOrders = allOrders.filter((o) => o.paymentMethod === 'opay');
  const filteredPayments = opayOrders.filter((ord) => {
    if (paymentSubFilter === 'pending') {
      return (
        ord.status === 'pending_verification' ||
        (!ord.paymentConfirmation?.verifiedByAdmin && ord.status !== 'rejected' && ord.status !== 'cancelled')
      );
    }
    if (paymentSubFilter === 'confirmed') {
      return ord.paymentConfirmation?.verifiedByAdmin || ord.status === 'payment_confirmed';
    }
    if (paymentSubFilter === 'rejected') {
      return ord.status === 'rejected';
    }
    return true;
  });

  // Orders Filtering
  const filteredOrders = allOrders.filter((ord) => {
    const matchesStatus = orderStatusFilter === 'all' ? true : ord.status === orderStatusFilter;
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.buyerPhone.includes(searchQuery) ||
      (ord.sellerName && ord.sellerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Users Filtering
  const filteredUsers = allUsers.filter((u) => {
    const matchesRole = userRoleFilter === 'all' ? true : u.accountType === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' ? true : (u.status || 'active') === userStatusFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      (u.businessName && u.businessName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesStatus && matchesSearch;
  });

  // Products Filtering
  const filteredProducts = allProducts.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sellerName && p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // ================= HANDLERS =================

  // User Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFullName('');
    setUserEmail('');
    setUserPhone('');
    setUserWhatsApp('');
    setUserAddress('');
    setUserBusinessName('');
    setUserRole('buyer');
    setUserStatus('active');
    setUserProfileImage('');
    setIsAddingUser(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserFullName(u.fullName);
    setUserEmail(u.email);
    setUserPhone(u.phone);
    setUserWhatsApp(u.whatsAppNumber || '');
    setUserAddress(u.address || '');
    setUserBusinessName(u.businessName || '');
    setUserRole(u.accountType);
    setUserStatus(u.status || 'active');
    setUserProfileImage(u.profileImage || '');
    setIsAddingUser(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) {
      try {
        if (userPassword.length < 12) {
          showNotification('Set a strong temporary password with at least 12 characters.');
          return;
        }
        const result = await marketplaceApi.adminUsers.create({
          fullName: userFullName,
          email: userEmail,
          phone: userPhone,
          password: userPassword,
          accountType: userRole,
          ...(userRole === 'seller' ? { businessName: userBusinessName, productCategory: userBusinessName ? 'General Merchandise' : undefined } : {}),
          address: userAddress,
        });
        setBackendUsers((previous) => [result.user as User, ...previous]);
        setUserPassword('');
        showNotification(userRole === 'seller' ? 'Seller created. Seller account is pending approval.' : 'Buyer account created successfully.');
        setIsAddingUser(false);
        triggerRefresh();
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to create user account.');
      }
      return;
    }
    try {
      const result = await marketplaceApi.adminUsers.updateProfile(editingUser.id, {
        fullName: userFullName,
        email: userEmail,
        phone: userPhone,
        whatsAppNumber: userWhatsApp || userPhone,
        address: userAddress,
        businessName: userBusinessName || null,
        profileImage: userProfileImage.trim() || null,
      });
      setBackendUsers((previous) => previous.map((user) => user.id === editingUser.id ? result.user as User : user));
      showNotification(`User ${userFullName} updated successfully!`);
      setIsAddingUser(false);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to update user profile.');
    }
  };

  const handleDeleteUser = (_id: string, name: string) => {
    showNotification(`Permanent deletion is disabled for ${name}. Suspend the account instead to preserve the audit trail.`);
  };

  const handleSetUserStatus = async (id: string, status: 'active' | 'suspended' | 'rejected' | 'approved') => {
    const apiStatus = status === 'approved' || status === 'active' ? 'ACTIVE' : status === 'suspended' ? 'SUSPENDED' : 'REJECTED';
    try {
      const result = await marketplaceApi.adminUsers.setStatus(id, apiStatus);
      setBackendUsers((previous) => previous.map((user) => user.id === id ? result.user as User : user));
      showNotification(`User status changed to "${status.toUpperCase()}".`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to update account status.');
    }
  };

  // Product Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Kasuwar Kwari');
    setProdPrice(15000);
    setProdOrigPrice(20000);
    setProdDiscountPercent(25);
    setProdImage('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80');
    setProdDescription('High quality product direct from Kano central wholesale market.');
    setProdSellerId(sellersList[0]?.id || 'usr-seller-1');
    setIsAddingProduct(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price);
    setProdOrigPrice(p.originalPrice || p.price);
    setProdDiscountPercent(p.discountPercentage || 0);
    setProdImage(p.image);
    setProdDescription(p.description || '');
    setProdSellerId(p.sellerId || 'usr-seller-1');
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) {
      try {
        const created = await marketplaceApi.adminProducts.create({
          name: prodName, category: prodCategory, price: Number(prodPrice),
          originalPrice: Number(prodOrigPrice), discountPercentage: Number(prodDiscountPercent),
          image: prodImage, description: prodDescription, stockQuantity: 0, sellerId: prodSellerId,
        });
        setBackendApprovedProducts((items) => [created, ...items]);
        showNotification('Product created and published to the marketplace.');
        setIsAddingProduct(false);
        triggerRefresh();
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to create product.');
      }
      return;
    }
    try {
      const updated = await marketplaceApi.adminProducts.update(editingProduct.id, {
        name: prodName, category: prodCategory, price: Number(prodPrice),
        originalPrice: Number(prodOrigPrice), discountPercentage: Number(prodDiscountPercent),
        image: prodImage, description: prodDescription,
      });
      setBackendApprovedProducts((items) => items.map((item) => item.id === updated.id ? updated : item));
      setPendingBackendProducts((items) => items.map((item) => item.id === updated.id ? updated : item));
      showNotification(`Product "${prodName}" updated in Supabase.`);
      setIsAddingProduct(false);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to update product.');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Remove product "${name}" from the public marketplace?`)) return;
    try {
      await marketplaceApi.adminProducts.remove(id);
      setBackendApprovedProducts((items) => items.filter((item) => item.id !== id));
      setPendingBackendProducts((items) => items.filter((item) => item.id !== id));
      showNotification(`Product "${name}" removed from the public marketplace.`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to remove product.');
    }
  };

  const handleApproveProduct = async (id: string, approve: boolean) => {
    const backendProduct = pendingBackendProducts.some((product) => product.id === id);
    if (backendProduct) {
      setProductDecisionBusy(id);
      try {
        await marketplaceApi.adminProducts.setApproval(id, approve ? 'APPROVED' : 'REJECTED');
        setPendingBackendProducts((items) => items.filter((product) => product.id !== id));
        showNotification(approve ? 'Product approved and published to the public marketplace.' : 'Product rejected.');
        triggerRefresh();
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to update product approval.');
      } finally {
        setProductDecisionBusy(null);
      }
      return;
    }
    showNotification('This product is not in the Supabase pending-approval queue. Refresh the Admin panel and try again.');
  };

  const handleLoadBackendReceipt = async (orderId: string) => {
    setReceiptBusy(orderId);
    try {
      const result = await marketplaceApi.orders.receiptUrl(orderId);
      setReceiptLinks((previous) => ({ ...previous, [orderId]: result.url }));
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to open payment receipt.');
    } finally {
      setReceiptBusy(null);
    }
  };

  // Payment Handlers (OPay)
  const handleConfirmPayment = async (orderId: string) => {
    if (backendOrders.some((order) => order.id === orderId)) {
      try {
        const updated = await marketplaceApi.orders.approveOpay(orderId, 'approve') as Order;
        setBackendOrders((items) => items.map((order) => order.id === orderId ? updated : order));
        showNotification('Payment confirmed by Super Admin. Buyer and Seller order status updated.');
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to verify payment.');
      }
      return;
    }
    showNotification('This order is not in the Supabase order list. Refresh and try again.');
  };

  const handleOpenRejectPayment = (order: Order) => {
    setRejectingOrder(order);
    setRejectionReason('Payment transfer reference could not be verified in official OPay portal.');
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectingOrder) return;
    if (backendOrders.some((order) => order.id === rejectingOrder.id)) {
      try {
        const updated = await marketplaceApi.orders.approveOpay(rejectingOrder.id, 'reject', rejectionReason) as Order;
        setBackendOrders((items) => items.map((order) => order.id === rejectingOrder.id ? updated : order));
        showNotification('Payment rejected. Buyer will see the rejection status.');
        setRejectingOrder(null);
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to reject payment.');
      }
      return;
    }
    showNotification('This order is not in the Supabase order list. Refresh and try again.');
  };

  // Order Handlers
  const handleApproveOrder = async (orderId: string) => {
    if (backendOrders.some((order) => order.id === orderId)) {
      try {
        const updated = await marketplaceApi.orders.approveCod(orderId, 'approve') as Order;
        setBackendOrders((items) => items.map((order) => order.id === orderId ? updated : order));
        showNotification('COD order approved. Seller can now see Buyer delivery details.');
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to approve COD order.');
      }
      return;
    }
    showNotification('This COD order is not in the Supabase order list. Refresh and try again.');
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = window.prompt('Enter reason for rejecting this order:', 'Order rejected by Super Admin in CPanel.');
    if (!reason) return;
    if (backendOrders.some((order) => order.id === orderId)) {
      try {
        const updated = await marketplaceApi.orders.approveCod(orderId, 'reject', reason) as Order;
        setBackendOrders((items) => items.map((order) => order.id === orderId ? updated : order));
        showNotification('COD order rejected.');
      } catch (error) {
        showNotification(error instanceof Error ? error.message : 'Unable to reject COD order.');
      }
      return;
    }
    showNotification('This COD order is not in the Supabase order list. Refresh and try again.');
  };

  const handleBackendLogisticsUpdate = async (order: Order) => {
    const status = selectedBackendLogisticsStatuses[order.id];
    if (!status) {
      showNotification('Select the next logistics status first.');
      return;
    }
    const notes = window.prompt('Enter the verified logistics update / note:');
    if (!notes?.trim()) return;
    setLogisticsUpdateBusy(order.id);
    try {
      const updated = await marketplaceApi.orders.updateLogisticsStatus(order.id, status, notes.trim()) as Order;
      setBackendOrders((items) => items.map((item) => item.id === order.id ? updated : item));
      setSelectedBackendLogisticsStatuses((items) => {
        const next = { ...items };
        delete next[order.id];
        return next;
      });
      showNotification('Logistics progress saved. Buyer and Seller can now see the updated tracking timeline.');
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to save logistics progress.');
    } finally {
      setLogisticsUpdateBusy(null);
    }
  };

  // Category Handlers (Kano Markets)
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatHausaName('');
    setCatDescription('');
    setCatImage('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80');
    setCatIconName('Building');
    setIsAddingCategory(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatHausaName(cat.hausaName || '');
    setCatDescription(cat.description || '');
    setCatImage(cat.image);
    setCatIconName(cat.iconName);
    setIsAddingCategory(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: catName, hausaName: catHausaName, description: catDescription, image: catImage, iconName: catIconName };
    try {
      const saved = editingCategory
        ? await marketplaceApi.adminCategories.update(editingCategory.id, payload)
        : await marketplaceApi.adminCategories.create(payload);
      setBackendCategories((items) => editingCategory
        ? items.map((item) => item.id === saved.id ? saved : item)
        : [...items, saved]);
      showNotification(`Category "${catName}" saved in Supabase.`);
      setIsAddingCategory(false);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to save category.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove category "${name}"?`)) return;
    try {
      await marketplaceApi.adminCategories.remove(id);
      setBackendCategories((items) => items.filter((item) => item.id !== id));
      showNotification(`Category "${name}" removed from Supabase.`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to remove category.');
    }
  };

  // Flash Sale Handlers
  const handleOpenCreateFlashSale = () => {
    setEditingFlashSale(null);
    setFsTitle('Kano Grand Flash Sale');
    setFsDescription('Massive price drops on smartphones and traditional fabrics!');
    setFsDiscount(25);
    setFsStartTime(new Date().toISOString().slice(0, 16));
    setFsEndTime(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
    setFsProductIds(backendApprovedProducts.slice(0, 4).map((p) => p.id));
    setFsIsActive(true);
    setIsCreatingFlashSale(true);
  };

  const handleOpenEditFlashSale = (fs: FlashSale) => {
    setEditingFlashSale(fs);
    setFsTitle(fs.title);
    setFsDescription(fs.description || '');
    setFsDiscount(fs.discountPercentage);
    setFsStartTime(new Date(fs.startTime).toISOString().slice(0, 16));
    setFsEndTime(new Date(fs.endTime).toISOString().slice(0, 16));
    setFsProductIds(fs.productIds || []);
    setFsIsActive(fs.isActive);
    setIsCreatingFlashSale(true);
  };

  const handleSaveFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fsProductIds.length === 0) { showNotification('Select at least one approved product for the Flash Sale.'); return; }
    if (new Date(fsEndTime) <= new Date(fsStartTime)) { showNotification('Flash Sale end time must be after its start time.'); return; }
    const payload = {
      title: fsTitle.trim(),
      description: fsDescription.trim(),
      discountPercentage: Number(fsDiscount),
      startTime: new Date(fsStartTime).toISOString(),
      endTime: new Date(fsEndTime).toISOString(),
      productIds: fsProductIds.filter((id) => backendApprovedProducts.some((product) => product.id === id)),
      isActive: fsIsActive,
    };
    try {
      const saved = editingFlashSale
        ? await marketplaceApi.content.updateFlashSale(editingFlashSale.id, payload)
        : await marketplaceApi.content.createFlashSale(payload);
      setBackendFlashSales((previous) => editingFlashSale
        ? previous.map((sale) => sale.id === saved.id ? saved : sale)
        : [saved, ...previous]);
      setIsCreatingFlashSale(false);
      showNotification(editingFlashSale ? 'Flash Sale updated in database.' : 'Flash Sale saved to database.');
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not save Flash Sale.');
    }
  };

  const handleDeleteFlashSale = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Flash Sale?')) return;
    try {
      await marketplaceApi.content.deleteFlashSale(id);
      setBackendFlashSales((previous) => previous.filter((sale) => sale.id !== id));
      showNotification('Flash Sale deleted from database.');
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not delete Flash Sale.');
    }
  };

  // Discount Handlers
  const handleOpenEditDiscount = (prod: Product) => {
    setEditingDiscountProduct(prod);
    const orig = prod.originalPrice || prod.price;
    setDiscOriginalPrice(orig);
    setDiscPrice(prod.price);
    setDiscPercentage(prod.discountPercentage || 0);
    setDiscIsSpecialOffer(prod.isSpecialOffer || false);
    setDiscIsFlashSale(prod.isFlashSale || false);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscountProduct) return;
    try {
      const updated = await marketplaceApi.adminProducts.update(editingDiscountProduct.id, {
        originalPrice: Number(discOriginalPrice),
        price: Number(discPrice),
        discountPercentage: Number(discPercentage),
        isSpecialOffer: discIsSpecialOffer,
        isFlashSale: discIsFlashSale,
      });
      setBackendApprovedProducts((items) => items.map((item) => item.id === updated.id ? updated : item));
      showNotification(`Discount applied to "${editingDiscountProduct.name}" in Supabase.`);
      setEditingDiscountProduct(null);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to save product discount.');
    }
  };

  const handleRemoveDiscount = async (prodId: string) => {
    const product = allProducts.find((item) => item.id === prodId);
    if (!product) return;
    try {
      const updated = await marketplaceApi.adminProducts.update(prodId, {
        price: product.originalPrice || product.price,
        originalPrice: product.originalPrice || product.price,
        discountPercentage: 0,
        isSpecialOffer: false,
        isFlashSale: false,
      });
      setBackendApprovedProducts((items) => items.map((item) => item.id === updated.id ? updated : item));
      showNotification('Product discount removed from Supabase.');
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to remove product discount.');
    }
  };

  // Report Actions
  const handleUpdateProductReport = async (reportId: string, status: 'approved' | 'rejected' | 'resolved') => {
    try {
      const adminNotes = `Report marked ${status} by Super Admin.`;
      await marketplaceApi.adminReports.update('product', reportId, status, adminNotes);
      setBackendProductReports((previous) => previous.map((report) => report.id === reportId ? { ...report, status, adminNotes } : report));
      showNotification(`Product report marked ${status} in database.`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not update product report.');
    }
  };

  const handleUpdateBuyerReport = async (reportId: string, status: 'approved' | 'rejected' | 'resolved') => {
    try {
      const adminNotes = `Report marked ${status} by Super Admin.`;
      await marketplaceApi.adminReports.update('buyer', reportId, status, adminNotes);
      setBackendBuyerReports((previous) => previous.map((report) => report.id === reportId ? { ...report, status, adminNotes } : report));
      showNotification(`Buyer report marked ${status} in database.`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not update buyer report.');
    }
  };

  const handleUpdateSellerReport = async (reportId: string, status: 'approved' | 'rejected' | 'resolved') => {
    try {
      const adminNotes = `Report marked ${status} by Super Admin.`;
      await marketplaceApi.adminReports.update('seller', reportId, status, adminNotes);
      setBackendSellerReports((previous) => previous.map((report) => report.id === reportId ? { ...report, status, adminNotes } : report));
      showNotification(`Seller report marked ${status} in database.`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not update seller report.');
    }
  };

  // Quick action: Suspend reported user
  const handleSuspendReportedUser = async (userId: string, name: string) => {
    if (!window.confirm(`Suspend account of "${name}"?`)) return;
    try {
      await marketplaceApi.adminUsers.setStatus(userId, 'SUSPENDED');
      showNotification(`Account of ${name} has been suspended in the database.`);
      triggerRefresh();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not suspend this account.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col min-h-0 max-h-[94vh] max-h-[94dvh] animate-in zoom-in-95 duration-200">
        
        {/* ============================================================ */}
        {/* 1. SUPER ADMIN LOGIN GATE (If not authenticated as admin) */}
        {/* ============================================================ */}
        {!isSuperAdmin ? (
          <div className="flex flex-col flex-1">
            {/* Header */}
            <div className="bg-[#0B172E] text-white p-5 flex items-center justify-between border-b border-[#1b2b4e]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E6007E] rounded-xl text-white shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Super Admin CPanel Authentication</h3>
                  <p className="text-xs text-slate-300">KASUWAR KANAWA • AREWA SAI DAN AREWA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Login Box */}
            <div className="flex-1 p-6 sm:p-10 flex items-center justify-center bg-slate-50">
              <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#0B172E] text-[#E6007E] rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md border-2 border-[#E6007E]">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-[#0B172E]">Super Admin Access Only</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please authenticate with your Super Admin credentials to access Central CPanel controls.
                  </p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username or Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Enter your Super Admin email or phone"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Super Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 bg-[#E6007E] hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Token...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authenticate & Enter CPanel</span>
                      </>
                    )}
                  </button>

                </form>

                <div className="mt-5 border-t border-slate-200 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setShowFirstAdminSetup((value) => !value); setLoginError(null); }}
                    className="text-xs font-black text-[#E6007E] hover:underline"
                  >
                    {showFirstAdminSetup ? 'Return to Super Admin login' : 'First-time Super Admin registration'}
                  </button>
                </div>

                {showFirstAdminSetup && (
                  <form onSubmit={handleFirstAdminSetup} className="mt-4 space-y-3 border-t border-pink-100 pt-4">
                    <div>
                      <h3 className="text-sm font-black text-[#0B172E]">Create the first Super Admin</h3>
                      <p className="mt-1 text-[11px] text-slate-500">This one-time setup is protected by the private setup token configured in Supabase.</p>
                    </div>
                    <input required value={setupToken} onChange={(e) => setSetupToken(e.target.value)} type="password" autoComplete="off" placeholder="Supabase first-admin setup token" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E6007E] focus:outline-hidden" />
                    <input required value={setupFullName} onChange={(e) => setSetupFullName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E6007E] focus:outline-hidden" />
                    <input required type="email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="Admin email address" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E6007E] focus:outline-hidden" />
                    <input required type="tel" value={setupPhone} onChange={(e) => setSetupPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E6007E] focus:outline-hidden" />
                    <input required minLength={12} type="password" autoComplete="new-password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} placeholder="Strong password (at least 12 characters)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E6007E] focus:outline-hidden" />
                    <button type="submit" disabled={isSettingUpAdmin} className="w-full rounded-xl bg-[#0B172E] px-4 py-3 text-xs font-black text-white shadow-md disabled:opacity-60">
                      {isSettingUpAdmin ? 'Creating secure Super Admin account…' : 'Create First Super Admin'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* 2. FULL AUTHORIZED SUPER ADMIN CPANEL */
          /* ============================================================ */
          <>
            {/* Header */}
            <div className="bg-[#0B172E] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#1b2b4e]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E6007E] rounded-xl text-white shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg tracking-wide">Super Admin CPanel Control</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E6007E] text-white uppercase">
                      Central Authority
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    KASUWAR KANAWA • High-Security Marketplace Administration
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-semibold text-emerald-400">
                  ● Admin Active: {currentUser?.fullName}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  title="Close CPanel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dashboard Summary Preview: keep key figures visible before the navigation grid */}
            {activeTab === 'dashboard' && (
              <div className="bg-white px-3 sm:px-4 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Users', value: allUsers.length, tab: 'users' },
                    { label: 'Buyers', value: totalBuyers, tab: 'buyers' },
                    { label: 'Sellers', value: totalSellers, tab: 'sellers' },
                    { label: 'Orders', value: totalOrders, tab: 'orders' },
                  ].map((item) => (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => setActiveTab(item.tab as any)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-[#E6007E] transition-colors"
                    >
                      <p className="text-[11px] font-bold text-slate-500">{item.label}</p>
                      <p className="text-xl font-black text-[#0B172E]">{item.value}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Menu Grid (All 13 Comprehensive Tabs) */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 shrink-0 max-h-[34dvh] overflow-y-auto overscroll-contain [touch-action:pan-y]">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 text-xs font-bold">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Layers, badge: null },
                { id: 'users', label: 'Users', icon: Users, badge: allUsers.length },
                { id: 'buyers', label: 'Buyers', icon: UserCheck, badge: totalBuyers },
                { id: 'sellers', label: 'Sellers', icon: Store, badge: totalSellers },
                { id: 'products', label: 'Products', icon: Package, badge: totalProducts },
                { id: 'payments', label: 'OPay & Payments', icon: CreditCard, badge: pendingPayments.length },
                { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: totalOrders },
                { id: 'categories', label: 'Categories', icon: Building, badge: allCategories.length },
                { id: 'flash_sales', label: 'Flash Sales', icon: Zap, badge: allFlashSales.length },
                { id: 'discounts', label: 'Discounts', icon: Percent, badge: allProducts.filter(p => (p.discountPercentage || 0) > 0).length },
                { id: 'ads', label: 'Ads & Broadcast', icon: Megaphone, badge: allAds.length + allAnnouncements.length },
                { id: 'reports', label: 'Reports', icon: Flag, badge: productReports.length + buyerReports.length + sellerReports.length },
                { id: 'deliveries', label: 'Delivery Monitor', icon: Truck, badge: dispatchedAndDelivered.length },
                { id: 'logistics', label: 'Logistics Management', icon: Truck, badge: null },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative min-h-[88px] rounded-xl border p-3 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#E6007E] text-[#E6007E] bg-white shadow-md ring-1 ring-[#E6007E]/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#E6007E]/50 hover:text-[#E6007E] hover:shadow-sm'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="leading-tight">{tab.label}</span>
                    {tab.badge !== null && (
                      <span
                        className={`absolute top-2 right-2 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive
                            ? 'bg-[#E6007E] text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              </div>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
              <div className="bg-[#0B172E] text-white py-2 px-4 text-xs font-bold border-b border-pink-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#E6007E]" />
                  <span>{toastMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-4 [touch-action:pan-y]">
              
              {/* ============================================================ */}
              {/* TAB 1: ADMIN DASHBOARD (2. ADMIN DASHBOARD - 8 Stat Cards) */}
              {/* ============================================================ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-[#0B172E] to-[#16274a] text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black">Super Admin Control Hub</h2>
                      <p className="text-xs text-slate-300 mt-1">
                        Real-time overview of Kasuwar Kanawa operations, payments, and Kano commercial hubs.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('payments')}
                        className="px-3 py-1.5 bg-[#E6007E] hover:bg-pink-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Verify Payments ({pendingPayments.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 8 Statistics Cards (Phase 8 Section 2 Specification) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {/* 1. Total Buyers */}
                    <div
                      onClick={() => setActiveTab('buyers')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#E6007E] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Total Buyers</span>
                        <UserCheck className="w-4 h-4 text-pink-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0B172E]">{totalBuyers}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Registered Customers</p>
                    </div>

                    {/* 2. Total Sellers */}
                    <div
                      onClick={() => setActiveTab('sellers')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Total Sellers</span>
                        <Store className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0B172E]">{totalSellers}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Approved Merchants</p>
                    </div>

                    {/* 3. Total Products */}
                    <div
                      onClick={() => setActiveTab('products')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Total Products</span>
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0B172E]">{totalProducts}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Listed Marketplace Items</p>
                    </div>

                    {/* 4. Total Orders */}
                    <div
                      onClick={() => setActiveTab('orders')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Total Orders</span>
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0B172E]">{totalOrders}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">All Time Placed</p>
                    </div>

                    {/* 5. Total Paid Orders */}
                    <div
                      onClick={() => setActiveTab('orders')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Total Paid Orders</span>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-emerald-600">{totalPaidOrders}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Verified & Settled</p>
                    </div>

                    {/* 6. Pending Payments */}
                    <div
                      onClick={() => setActiveTab('payments')}
                      className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs hover:border-amber-500 transition-all cursor-pointer bg-amber-50/20"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold text-amber-700">Pending Payments</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-2xl font-black text-amber-600">{pendingPayments.length}</div>
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5">Needs Super Admin Action</p>
                    </div>

                    {/* 7. Delivered Orders */}
                    <div
                      onClick={() => setActiveTab('deliveries')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Delivered Orders</span>
                        <Truck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-[#0B172E]">{deliveredOrders}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Completed Parcels</p>
                    </div>

                    {/* 8. Pending Orders */}
                    <div
                      onClick={() => setActiveTab('orders')}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-500 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold">Pending Orders</span>
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-blue-600">{pendingOrders}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">In Processing / Transit</p>
                    </div>
                  </div>

                  {/* Kano Commercial Markets Strip */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-xs text-[#0B172E] uppercase tracking-wider">
                        Active Kano Market Hubs (Phase 8 Specification)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        className="text-xs font-bold text-[#E6007E] hover:underline cursor-pointer"
                      >
                        Manage Markets &rarr;
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {allCategories.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center"
                        >
                          <span className="block text-xs font-black text-[#0B172E]">{c.name}</span>
                          <span className="block text-[10px] text-slate-500 truncate">{c.hausaName}</span>
                          <span className="text-[10px] font-bold text-[#E6007E] mt-1 inline-block">
                            {c.itemCount} Items
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: USER MANAGEMENT (3. USER MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#E6007E] focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                      >
                        <option value="all">All Roles</option>
                        <option value="buyer">Buyers Only</option>
                        <option value="seller">Sellers Only</option>
                        <option value="admin">Admins Only</option>
                      </select>

                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value as any)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                      </select>


                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" onClick={() => {
                      setEditingUser(null); setUserFullName(''); setUserEmail(''); setUserPhone('');
                      setUserWhatsApp(''); setUserAddress(''); setUserBusinessName(''); setUserRole('buyer');
                      setUserStatus('active'); setUserPassword(''); setIsAddingUser(true);
                    }} className="rounded-lg bg-[#E6007E] px-4 py-2 text-xs font-black text-white">
                      <Plus className="mr-1 inline h-3.5 w-3.5" /> Add Buyer / Seller
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0B172E] text-white text-[11px] uppercase">
                        <tr>
                          <th className="p-3">User & Contact</th>
                          <th className="p-3">Account Type</th>
                          <th className="p-3">Location / Market</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar user={u} size="md" showBadge />
                                <div>
                                  <div className="font-bold text-[#0B172E]">{u.fullName}</div>
                                  <div className="text-[11px] text-slate-500">{u.email}</div>
                                  <div className="text-[11px] text-slate-600 font-semibold">{u.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.accountType === 'seller'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : u.accountType === 'admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-pink-100 text-pink-800'
                                }`}
                              >
                                {u.accountType}
                              </span>
                              {u.businessName && (
                                <div className="text-[10px] text-slate-500 font-bold mt-1">
                                  {u.businessName}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="text-slate-700">{u.city || 'Kano'}, {u.area}</div>
                              <div className="text-[10px] text-slate-400">{u.address}</div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.status === 'active' || !u.status
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : u.status === 'suspended'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {u.status || 'active'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {u.status !== 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetUserStatus(u.id, 'active')}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-[10px] font-bold cursor-pointer"
                                  title="Approve / Activate"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetUserStatus(u.id, 'suspended')}
                                  className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-[10px] font-bold cursor-pointer"
                                  title="Suspend User"
                                >
                                  Suspend
                                </button>
                              )}
                              {u.status !== 'rejected' && (
                                <button type="button" onClick={() => handleSetUserStatus(u.id, 'rejected')}
                                  className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-[10px] font-bold cursor-pointer"
                                  title="Reject User">Reject</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: BUYER MANAGEMENT (4. BUYER MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'buyers' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#0B172E]">Registered Buyers Directory</h3>
                      <p className="text-xs text-slate-500">Monitor purchase metrics, delivery rates, and order history.</p>
                    </div>
                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
                      Total Buyers: {totalBuyers}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {buyersList.map((buyer) => {
                      const buyerOrders = backendOrders.filter((order) => order.buyerId === buyer.id);
                      const stats = { totalOrders: buyerOrders.length, paidOrders: buyerOrders.filter((order) => order.paymentConfirmation?.verifiedByAdmin === true || order.paymentConfirmation?.adminApproved === true).length, pendingOrders: buyerOrders.filter((order) => ['pending_order','pending_payment','pending_verification'].includes(order.status)).length, totalProductsPurchased: buyerOrders.reduce((sum, order) => sum + order.items.reduce((n, item) => n + item.quantity, 0), 0), totalSpent: buyerOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0) };
                      return (
                        <div
                          key={buyer.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <UserAvatar user={buyer} size="lg" showBadge />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-sm text-[#0B172E]">{buyer.fullName}</h4>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(buyer)}
                                      className="text-slate-400 hover:text-[#E6007E] p-0.5 cursor-pointer"
                                      title="Edit Buyer Profile & Picture"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-500">{buyer.email}</p>
                                  <p className="text-xs font-semibold text-slate-700">{buyer.phone}</p>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  buyer.status === 'active' || !buyer.status
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {buyer.status || 'active'}
                              </span>
                            </div>

                            <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700">Delivery Address: </span>
                              {buyer.address || 'Kano Municipal, Kano State'}
                            </div>

                            {/* Purchase Statistics */}
                            <div className="grid grid-cols-4 gap-2 text-center mt-3 pt-3 border-t border-slate-100">
                              <div className="bg-blue-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Orders</span>
                                <span className="font-black text-sm text-blue-700">{stats.totalOrders}</span>
                              </div>
                              <div className="bg-emerald-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Paid</span>
                                <span className="font-black text-sm text-emerald-700">{stats.paidOrders}</span>
                              </div>
                              <div className="bg-amber-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Pending</span>
                                <span className="font-black text-sm text-amber-700">{stats.pendingOrders}</span>
                              </div>
                              <div className="bg-purple-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Items</span>
                                <span className="font-black text-sm text-purple-700">{stats.totalProductsPurchased}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">
                              Total Spent: <strong className="text-[#0B172E]">₦{stats.totalSpent.toLocaleString()}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedBuyerForHistory(buyer)}
                              className="px-3 py-1.5 bg-[#0B172E] hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
                              <span>Purchase History</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: SELLER MANAGEMENT (5. SELLER MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'sellers' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#0B172E]">Verified Merchant Sellers Directory</h3>
                      <p className="text-xs text-slate-500">View sales metrics, WhatsApp communication links, and product counts.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Total Sellers: {totalSellers}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sellersList.map((seller) => {
                      const sellerOrders = backendOrders.filter((order) => order.sellerId === seller.id);
                      const sellerProducts = allProducts.filter((product) => product.sellerId === seller.id);
                      const deliveredOrders = sellerOrders.filter((order) => order.status === 'delivered');
                      const stats = { totalProductsListed: sellerProducts.length, totalProductsSold: deliveredOrders.reduce((sum, order) => sum + order.items.reduce((n, item) => n + item.quantity, 0), 0), totalOrders: sellerOrders.length, deliveredOrders: deliveredOrders.length, totalRevenue: deliveredOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0) };
                      return (
                        <div
                          key={seller.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <UserAvatar user={seller} size="lg" showBadge />
                                <div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase inline-block mb-1">
                                    {seller.productCategory || 'Kano Merchant'}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-sm text-[#0B172E]">{seller.businessName || seller.fullName}</h4>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(seller)}
                                      className="text-slate-400 hover:text-[#E6007E] p-0.5 cursor-pointer"
                                      title="Edit Merchant Profile & Picture"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-700">Proprietor: {seller.fullName}</p>
                                  <p className="text-xs text-slate-500">{seller.email}</p>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  seller.status === 'active' || !seller.status
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {seller.status || 'active'}
                              </span>
                            </div>

                            <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-700">Address: </span>
                                {seller.businessAddress || seller.address || 'Kasuwar Kwari, Kano'}
                              </div>
                              <div className="flex items-center gap-3 pt-1">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {seller.phone}
                                </span>
                                {seller.whatsAppNumber && (
                                  <a
                                    href={`https://wa.me/${seller.whatsAppNumber.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3 text-emerald-500" />
                                    <span>WhatsApp Direct</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Seller Performance Metrics */}
                            <div className="grid grid-cols-4 gap-2 text-center mt-3 pt-3 border-t border-slate-100">
                              <div className="bg-blue-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Products</span>
                                <span className="font-black text-sm text-blue-700">{stats.totalProductsListed}</span>
                              </div>
                              <div className="bg-emerald-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Sold</span>
                                <span className="font-black text-sm text-emerald-700">{stats.totalProductsSold}</span>
                              </div>
                              <div className="bg-purple-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Orders</span>
                                <span className="font-black text-sm text-purple-700">{stats.totalOrders}</span>
                              </div>
                              <div className="bg-emerald-50/60 p-2 rounded-lg">
                                <span className="block text-[10px] font-bold text-slate-500">Delivered</span>
                                <span className="font-black text-sm text-emerald-700">{stats.deliveredOrders}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {seller.status !== 'active' && (
                                <button type="button" onClick={() => handleSetUserStatus(seller.id, 'approved')}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white">Approve Seller</button>
                              )}
                              {seller.status === 'active' && (
                                <button type="button" onClick={() => handleSetUserStatus(seller.id, 'suspended')}
                                  className="rounded-lg bg-amber-100 px-3 py-1.5 text-[10px] font-black text-amber-800">Suspend</button>
                              )}
                              {seller.status !== 'rejected' && (
                                <button type="button" onClick={() => handleSetUserStatus(seller.id, 'rejected')}
                                  className="rounded-lg bg-red-100 px-3 py-1.5 text-[10px] font-black text-red-700">Reject</button>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500">
                                Revenue: <strong className="text-emerald-700">₦{stats.totalRevenue.toLocaleString()}</strong>
                              </span>
                              <button type="button" onClick={() => setSelectedSellerForHistory(seller)}
                                className="flex items-center gap-1 rounded-lg bg-[#0B172E] px-3 py-1.5 text-xs font-bold text-white">
                                <Store className="h-3.5 w-3.5 text-emerald-400" /><span>Sales History</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 5: PRODUCT MANAGEMENT (6. PRODUCT MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button type="button" onClick={handleOpenAddProduct} className="rounded-lg bg-[#E6007E] px-4 py-2 text-xs font-black text-white">
                      <Plus className="mr-1 inline h-3.5 w-3.5" /> Add Product
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products by title, category, seller..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#E6007E] focus:outline-hidden"
                      />
                    </div>


                  </div>

                  {/* Server-backed Seller submissions awaiting approval */}
                  <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Seller Approval Queue</h3>
                        <p className="text-[11px] text-slate-600">Products submitted through Seller Dashboard. Approval publishes them to the public store.</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-800">{pendingBackendProducts.length} pending</span>
                    </div>
                    {pendingProductsLoading && <p className="text-xs text-slate-600">Loading pending submissions…</p>}
                    {pendingProductsError && <p className="text-xs font-semibold text-red-700">{pendingProductsError}</p>}
                    {!pendingProductsLoading && !pendingProductsError && pendingBackendProducts.length === 0 && (
                      <p className="rounded-lg border border-dashed border-amber-300 bg-white/70 p-4 text-center text-xs text-slate-600">No Seller submissions are waiting for approval.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pendingBackendProducts.map((product) => (
                        <article key={product.id} className="rounded-lg border border-amber-200 bg-white p-3 flex gap-3">
                          <img src={product.image} alt={product.name} className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase text-pink-600">{product.category}</p>
                            <h4 className="text-xs font-black text-slate-900">{product.name}</h4>
                            <p className="mt-1 text-xs font-bold text-pink-700">₦{product.price.toLocaleString()}</p>
                            <p className="mt-1 text-[10px] text-slate-600">Seller: {product.sellerName || product.sellerBusinessName || 'Marketplace seller'}</p>
                            {product.description && <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{product.description}</p>}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button type="button" disabled={productDecisionBusy === product.id} onClick={() => void handleApproveProduct(product.id, true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-50">
                                {productDecisionBusy === product.id ? 'Saving…' : 'Approve & Publish'}
                              </button>
                              <button type="button" disabled={productDecisionBusy === product.id} onClick={() => void handleApproveProduct(product.id, false)} className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black text-white disabled:opacity-50">
                                Reject
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  {/* Existing locally managed product records */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-black text-pink-600 uppercase block">
                                {p.category}
                              </span>
                              <h4 className="font-black text-xs text-[#0B172E] line-clamp-1">{p.name}</h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="font-extrabold text-xs text-[#E6007E]">
                                  ₦{p.price.toLocaleString()}
                                </span>
                                {p.originalPrice && p.originalPrice > p.price && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    ₦{p.originalPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                Seller: <strong>{p.sellerName || 'Alhaji Danladi Merchant'}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
                            <div className="flex items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  p.isApproved !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {p.isApproved !== false ? 'Approved' : 'Pending Approval'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedProductForReviews(p)}
                              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>Ratings & Comments</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          {p.isApproved === false ? (
                            <button
                              type="button"
                              onClick={() => handleApproveProduct(p.id, true)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-black cursor-pointer"
                            >
                              Approve Product
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApproveProduct(p.id, false)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold cursor-pointer"
                            >
                              Revoke Approval
                            </button>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 6: PAYMENT MANAGEMENT (7. PAYMENT MANAGEMENT - OPAY & COD) */}
              {/* ============================================================ */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  {/* Official Super Admin OPay Verification Card */}
                  <div className="bg-gradient-to-r from-emerald-950 via-[#0B172E] to-[#0B172E] text-white p-4 rounded-xl border border-emerald-500/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Official Account
                        </span>
                        <h4 className="font-black text-sm text-white">OPay Bank Transfer Verification Console</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Bank: <strong className="text-emerald-400">OPay</strong> • Account Name: <strong className="text-white">RAMATU SAIDU</strong> • Account Number: <strong className="text-emerald-400 tracking-wider">7066300079</strong>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      Supported: <strong>OPay Bank Transfer</strong> & <strong>Cash on Delivery (COD)</strong>
                    </span>
                  </div>

                  {/* Sub Filters */}
                  <div className="flex gap-2 border-b border-slate-200 pb-2">
                    {[
                      { id: 'pending', label: `Pending Verification (${pendingPayments.length})` },
                      { id: 'confirmed', label: 'Confirmed Payments' },
                      { id: 'rejected', label: 'Rejected Payments' },
                      { id: 'all', label: 'All Payments' },
                    ].map((sf) => (
                      <button
                        key={sf.id}
                        type="button"
                        onClick={() => setPaymentSubFilter(sf.id as any)}
                        className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                          paymentSubFilter === sf.id
                            ? 'bg-[#E6007E] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sf.label}
                      </button>
                    ))}
                  </div>

                  {/* Payments List */}
                  <div className="space-y-3">
                    {filteredPayments.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No records found for this payment filter.</p>
                      </div>
                    ) : (
                      filteredPayments.map((ord) => {
                        const isVerified = ord.paymentConfirmation?.verifiedByAdmin;
                        const isRejected = ord.status === 'rejected';

                        return (
                          <div
                            key={ord.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isVerified
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : isRejected
                                ? 'bg-red-50/40 border-red-200'
                                : 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-300/40'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div>
                                <span className="font-black text-xs text-[#0B172E] mr-2">
                                  Order #{ord.orderNumber}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {new Date(ord.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-[#E6007E]">
                                  ₦{ord.totalAmount.toLocaleString()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isVerified
                                      ? 'bg-emerald-600 text-white'
                                      : isRejected
                                      ? 'bg-red-600 text-white'
                                      : 'bg-amber-500 text-white animate-pulse'
                                  }`}
                                >
                                  {isVerified
                                    ? 'Payment Confirmed'
                                    : isRejected
                                    ? 'Payment Rejected'
                                    : 'Pending Verification'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs">
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Buyer Information
                                </span>
                                <span className="font-bold text-[#0B172E] block">{ord.buyerName}</span>
                                <span className="text-slate-600 block">{ord.buyerPhone}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{ord.buyerEmail}</span>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Seller Information
                                </span>
                                <span className="font-bold text-[#0B172E] block">{ord.sellerBusinessName || ord.sellerName}</span>
                                <span className="text-slate-600 block">{ord.sellerPhone}</span>
                                <a
                                  href={`https://wa.me/${ord.sellerWhatsApp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-500" />
                                  <span>WhatsApp Merchant</span>
                                </a>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Transfer Reference
                                </span>
                                <span className="font-mono font-bold text-xs text-[#0B172E] block">
                                  {ord.paymentConfirmation.transactionReference || 'OPAY-TRANSFER'}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  Sender: {ord.paymentConfirmation.senderName || ord.buyerName}
                                </span>
                                {backendOrders.some((item) => item.id === ord.id) && (
                                  <div className="mt-2">
                                    {ord.paymentConfirmation.receiptPath ? (
                                      receiptLinks[ord.id] ? (
                                        <a href={receiptLinks[ord.id]} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-700 underline">
                                          Open private receipt (expires in 5 minutes)
                                        </a>
                                      ) : (
                                        <button type="button" onClick={() => handleLoadBackendReceipt(ord.id)} disabled={receiptBusy === ord.id} className="rounded-lg bg-blue-100 px-2.5 py-1.5 text-[11px] font-bold text-blue-800 disabled:opacity-50">
                                          {receiptBusy === ord.id ? 'Loading receipt…' : 'View uploaded receipt'}
                                        </button>
                                      )
                                    ) : (
                                      <span className="text-[10px] font-semibold text-amber-700">Buyer has not uploaded a receipt yet.</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Verification Controls (Only Super Admin can verify bank transfer payments) */}
                            {!isVerified && !isRejected && (
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectPayment(ord)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Reject Payment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(ord.id)}
                                  disabled={backendOrders.some((item) => item.id === ord.id) && !ord.paymentConfirmation.receiptPath}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-black rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Confirm OPay Payment</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 7: ORDER MANAGEMENT (8. ORDER MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {backendOrdersError && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{backendOrdersError} Some saved local order records may still appear.</div>}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search order #, buyer, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#E6007E] focus:outline-hidden"
                      />
                    </div>

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-bold"
                    >
                      <option value="all">All Statuses ({allOrders.length})</option>
                      <option value="pending_order">New / Pending</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="payment_confirmed">Payment Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-black text-xs text-[#0B172E] mr-2">
                              Order #{ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ord.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#E6007E]">
                              ₦{ord.totalAmount.toLocaleString()}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Buyer Info</span>
                            <span className="font-bold text-[#0B172E] block">{ord.buyerName}</span>
                            <span className="text-slate-600 block">{ord.buyerPhone}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{ord.shippingAddress.completeAddress}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Seller Info</span>
                            <span className="font-bold text-[#0B172E] block">{ord.sellerBusinessName || ord.sellerName}</span>
                            <span className="text-slate-600 block">{ord.sellerPhone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Method</span>
                            <span className="font-bold text-[#0B172E] block uppercase">{ord.paymentMethod === 'opay' ? 'OPay Bank Transfer' : 'Cash on Delivery (COD)'}</span>
                            <span className="text-[10px] text-emerald-600 font-bold block">
                              {ord.paymentConfirmation.verifiedByAdmin ? '● Verified' : '○ Not Verified'}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 space-y-2">
                          {backendOrders.some((item) => item.id === ord.id) ? (
                            <>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wide text-sky-900">Backend Logistics Tracking</span>
                                <span className="text-[10px] font-bold text-emerald-700">
                                  {ord.logisticsCompanyName ? `Carrier: ${ord.logisticsCompanyName}` : 'Awaiting Seller hand-off'}
                                </span>
                              </div>
                              {ord.trackingNumber ? (
                                <>
                                  <div className="text-xs text-slate-700">
                                    Tracking number: <strong>{ord.trackingNumber}</strong>
                                    <span className="ml-2 text-sky-800">Status: <strong>{(ord.logisticsStatus || 'handed_to_logistics').replaceAll('_', ' ')}</strong></span>
                                  </div>
                                  {ord.status !== 'delivered' && ord.status !== 'cancelled' && ord.status !== 'rejected' && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <select
                                        value={selectedBackendLogisticsStatuses[ord.id] || ''}
                                        onChange={(event) => setSelectedBackendLogisticsStatuses((previous) => ({ ...previous, [ord.id]: event.target.value as 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' }))}
                                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                                      >
                                        <option value="">Select next tracking status</option>
                                        {(ord.logisticsStatus === 'handed_to_logistics'
                                          ? ['picked_up', 'in_transit', 'failed']
                                          : ord.logisticsStatus === 'picked_up'
                                            ? ['in_transit', 'failed']
                                            : ord.logisticsStatus === 'in_transit'
                                              ? ['out_for_delivery', 'failed']
                                              : ord.logisticsStatus === 'out_for_delivery'
                                                ? ['delivered', 'failed']
                                                : ord.logisticsStatus === 'failed'
                                                  ? ['in_transit', 'out_for_delivery']
                                                  : []).map((status) => (
                                                    <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                                                  ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleBackendLogisticsUpdate(ord)}
                                        disabled={!selectedBackendLogisticsStatuses[ord.id] || logisticsUpdateBusy === ord.id}
                                        className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                                      >
                                        {logisticsUpdateBusy === ord.id ? 'Saving…' : 'Save Tracking Update'}
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-[10px] text-amber-700">Seller must finish processing and record the carrier name and tracking number before Admin can update delivery progress.</p>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wide text-sky-900">Legacy Logistics Assignment</span>
                                <span className={`text-[10px] font-bold ${ord.logisticsCompanyId ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {ord.logisticsCompanyName ? `Assigned: ${ord.logisticsCompanyName}` : 'Not assigned'}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                  value={selectedLogisticsAssignments[ord.id] ?? ord.logisticsCompanyId ?? ''}
                                  onChange={(event) => setSelectedLogisticsAssignments((previous) => ({ ...previous, [ord.id]: event.target.value }))}
                                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                                  disabled={ord.status !== 'dispatched'}
                                >
                                  <option value="">Select approved logistics company</option>
                                  {approvedLogisticsCompanies.map((company) => (
                                    <option key={company.id} value={company.id}>{company.companyName}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleAssignOrderToLogistics(ord.id, ord.logisticsCompanyId)}
                                  disabled={ord.status !== 'dispatched'}
                                  className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {ord.logisticsCompanyId ? 'Update Logistics' : 'Assign Logistics'}
                                </button>
                                {ord.logisticsCompanyId && (
                                  <button type="button" onClick={() => handleUnassignOrderFromLogistics(ord.id)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600">
                                    Remove
                                  </button>
                                )}
                              </div>
                              {ord.status !== 'dispatched' && <p className="text-[10px] text-amber-700">Seller must complete Processing and mark this order Ready for Dispatch before legacy logistics assignment.</p>}
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(ord)}
                            className="text-[#E6007E] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Order Details ({ord.items.length} items)</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {ord.status !== 'rejected' && ord.status !== 'delivered' && (
                              backendOrders.some((item) => item.id === ord.id)
                                ? ord.paymentMethod === 'cod' && ord.status === 'pending_order' && (
                                    <>
                                      <button type="button" onClick={() => handleRejectOrder(ord.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[10px] font-bold cursor-pointer">Reject COD</button>
                                      <button type="button" onClick={() => handleApproveOrder(ord.id)} className="px-2.5 py-1 bg-[#0B172E] hover:bg-slate-800 text-white rounded-md text-[10px] font-black cursor-pointer">Approve COD & Release Buyer Details</button>
                                    </>
                                  )
                                : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectOrder(ord.id)}
                                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[10px] font-bold cursor-pointer"
                                      >
                                        Reject Order
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveOrder(ord.id)}
                                        className="px-2.5 py-1 bg-[#0B172E] hover:bg-slate-800 text-white rounded-md text-[10px] font-black cursor-pointer"
                                      >
                                        Approve Order
                                      </button>
                                    </>
                                  )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 8: CATEGORY MANAGEMENT (9. CATEGORY MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#0B172E]">Kano Commercial Market Categories</h3>
                      <p className="text-xs text-slate-500">
                        1. Kasuwar Kwari • 2. Kasuwar Singa • 3. Kasuwar Kurmi • 4. Kasuwar Farm Center • 5. Wasu Kasuwanni
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      className="px-3 py-1.5 bg-[#E6007E] hover:bg-pink-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allCategories.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-32 object-cover rounded-lg mb-2.5 border border-slate-100"
                          />
                          <h4 className="font-black text-sm text-[#0B172E]">{c.name}</h4>
                          <span className="text-xs font-bold text-pink-600 block">{c.hausaName}</span>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600">{c.itemCount} Products</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCategory(c)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 9: FLASH SALES (10. FLASH SALES MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'flash_sales' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#0B172E]">Flash Sales Promotions Engine</h3>
                      <p className="text-xs text-slate-500">Create countdown flash deals with automatic expiry.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenCreateFlashSale}
                      className="px-3 py-1.5 bg-[#E6007E] hover:bg-pink-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Flash Sale</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {allFlashSales.map((fs) => (
                      <div
                        key={fs.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#0B172E]">{fs.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                fs.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {fs.isActive ? 'Active on Homepage' : 'Inactive'}
                            </span>
                            <span className="bg-[#E6007E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              Save {fs.discountPercentage}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{fs.description}</p>
                          <div className="text-[11px] text-slate-400">
                            Starts: {new Date(fs.startTime).toLocaleString()} • Ends: {new Date(fs.endTime).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFlashSale(fs)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFlashSale(fs.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 10: PRODUCT DISCOUNTS (3. PRODUCT DISCOUNTS) */}
              {/* ============================================================ */}
              {activeTab === 'discounts' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#0B172E]">Product Discount Configuration</h3>
                      <p className="text-xs text-slate-500">Apply original vs discounted prices and discount badges.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allProducts.map((p) => {
                      const hasDiscount = (p.discountPercentage || 0) > 0;
                      return (
                        <div
                          key={p.id}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <h4 className="font-black text-xs text-[#0B172E] line-clamp-1">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-extrabold text-xs text-[#E6007E]">₦{p.price.toLocaleString()}</span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-[10px] text-slate-400 line-through">₦{p.originalPrice.toLocaleString()}</span>
                              )}
                              {hasDiscount && (
                                <span className="bg-pink-100 text-[#E6007E] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                  -{p.discountPercentage}%
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDiscount(p)}
                              className="px-2.5 py-1 bg-[#E6007E] hover:bg-pink-700 text-white rounded-md text-[10px] font-black cursor-pointer"
                            >
                              Set Discount
                            </button>
                            {hasDiscount && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDiscount(p.id)}
                                className="p-1 bg-red-50 text-red-600 rounded-md cursor-pointer"
                                title="Remove Discount"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 11: ADVERTISEMENTS & ANNOUNCEMENTS (11. ADVERTISEMENTS AND ANNOUNCEMENTS) */}
              {/* ============================================================ */}
              {activeTab === 'ads' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setAdsSubTab('banners')}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all ${
                        adsSubTab === 'banners' ? 'bg-[#0B172E] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Promotional Ad Banners ({allAds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdsSubTab('announcements')}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all ${
                        adsSubTab === 'announcements' ? 'bg-[#0B172E] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Broadcast Announcements ({allAnnouncements.length})
                    </button>
                  </div>

                  {adsSubTab === 'banners' ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button type="button" onClick={handleOpenCreatePromotion} className="rounded-lg bg-[#E6007E] px-3 py-2 text-xs font-black text-white flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Create Promo</button>
                      </div>
                      {contentLoading && <p className="text-xs text-slate-500">Loading promotions from database…</p>}
                      {contentError && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{contentError}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allAds.map((ad) => (
                        <div key={ad.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
                          <img src={ad.image} alt={ad.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                          <span className="text-[10px] font-black text-pink-600 uppercase block">{ad.badge}</span>
                          <h4 className="font-black text-xs text-[#0B172E]">{ad.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{ad.description}</p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className={`text-[10px] font-bold ${ad.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {ad.isActive ? '● Live on Homepage' : '○ Inactive'}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleTogglePromotion(ad)}
                              className="text-[10px] font-bold text-slate-600 hover:text-[#E6007E] cursor-pointer"
                            >
                              Toggle Status
                            </button>
                          </div>
                          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                            <button type="button" onClick={() => handleOpenEditPromotion(ad)} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">Edit</button>
                            <button type="button" onClick={() => void handleDeletePromotion(ad)} className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allAnnouncements.map((anc) => (
                        <div key={anc.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                          <div>
                            <span className="bg-[#E6007E] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase inline-block mb-1">
                              {anc.type || 'Announcement'}
                            </span>
                            <h4 className="font-black text-xs text-[#0B172E]">{anc.title}</h4>
                            <p className="text-xs text-slate-600">{anc.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await marketplaceApi.content.updateAnnouncement(anc.id, { isPublished: !anc.isPublished });
                                setBackendAnnouncements((items) => items.map((item) => item.id === anc.id ? { ...item, isPublished: !item.isPublished } : item));
                                triggerRefresh();
                              } catch (error) {
                                showNotification(error instanceof Error ? error.message : 'Unable to update announcement.');
                              }
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                              anc.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {anc.isPublished ? 'Published' : 'Unpublished'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 12: REPORT MANAGEMENT (12. REPORT MANAGEMENT) */}
              {/* ============================================================ */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="flex gap-2 border-b border-slate-200 pb-2">
                    {[
                      { id: 'product_reports', label: `Product Flags (${productReports.length})` },
                      { id: 'buyer_reports', label: `Buyer Reports (${buyerReports.length})` },
                      { id: 'seller_reports', label: `Seller Reports (${sellerReports.length})` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setReportSubTab(st.id as any)}
                        className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-all ${
                          reportSubTab === st.id ? 'bg-[#E6007E] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Render based on report subtab */}
                  {reportSubTab === 'product_reports' && (
                    <div className="space-y-3">
                      {buyerReportsLoading && <div className="text-xs font-bold text-slate-500">Loading reports from database...</div>}
                      {buyerReportsError && <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{buyerReportsError}</div>}
                      {productReports.length === 0 ? (
                        <div className="text-center py-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl">
                          No product reports filed.
                        </div>
                      ) : (
                        productReports.map((rep) => (
                          <div key={rep.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-xs text-[#0B172E]">{rep.productName}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                                {rep.status}
                              </span>
                            </div>
                            <p className="text-xs text-red-600 font-bold">Reason: {rep.reason}</p>
                            <p className="text-xs text-slate-600">{rep.details}</p>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleUpdateProductReport(rep.id, 'rejected')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold cursor-pointer"
                              >
                                Reject Report
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateProductReport(rep.id, 'approved')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-black cursor-pointer"
                              >
                                Approve Report (Flag Product)
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {reportSubTab === 'buyer_reports' && (
                    <div className="space-y-3">
                      {buyerReportsLoading && <div className="text-xs font-bold text-slate-500">Loading buyer reports from database...</div>}
                      {buyerReportsError && <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{buyerReportsError}</div>}
                      {!buyerReportsLoading && !buyerReportsError && buyerReports.length === 0 && (
                        <div className="text-center py-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl">No buyer reports filed.</div>
                      )}
                      {buyerReports.map((br) => (
                        <div key={br.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0B172E]">Reported Buyer: {br.buyerName}</span>
                            <span className="text-[10px] font-bold text-slate-500">Phone: {br.buyerPhone}</span>
                          </div>
                          <p className="text-xs text-red-600 font-bold">{br.reason}</p>
                          <p className="text-xs text-slate-600">{br.details}</p>
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleSuspendReportedUser(br.buyerId, br.buyerName)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold cursor-pointer"
                            >
                              Suspend Buyer Account
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBuyerReport(br.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold cursor-pointer"
                            >
                              Resolve Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {reportSubTab === 'seller_reports' && (
                    <div className="space-y-3">
                      {buyerReportsLoading && <div className="text-xs font-bold text-slate-500">Loading reports from database...</div>}
                      {buyerReportsError && <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{buyerReportsError}</div>}
                      {sellerReports.length === 0 && !buyerReportsLoading && <div className="text-center py-8 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl">No seller reports filed.</div>}
                      {sellerReports.map((sr) => (
                        <div key={sr.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0B172E]">Reported Seller: {sr.sellerName}</span>
                            <span className="text-[10px] font-bold text-slate-500">Business: {sr.sellerBusinessName}</span>
                          </div>
                          <p className="text-xs text-red-600 font-bold">{sr.reason}</p>
                          <p className="text-xs text-slate-600">{sr.details}</p>
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleSuspendReportedUser(sr.sellerId, sr.sellerName)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold cursor-pointer"
                            >
                              Suspend Seller Account
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSellerReport(sr.id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold cursor-pointer"
                            >
                              Resolve Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* Backend logistics console: all shipment records and status changes come from Supabase. */}
              {activeTab === 'logistics' && (
                <div className="space-y-4">
                  <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-[#0B172E]">Logistics Company Applications</h3>
                        <p className="text-xs text-slate-500">Approve, reject or suspend logistics companies registered on Kasuwar Kanawa.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-black">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Pending: {backendUsers.filter((u) => u.accountType === 'logistics' && u.status === 'pending').length}</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Approved: {backendUsers.filter((u) => u.accountType === 'logistics' && u.status === 'active').length}</span>
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-800">Suspended / Rejected: {backendUsers.filter((u) => u.accountType === 'logistics' && (u.status === 'suspended' || u.status === 'rejected')).length}</span>
                      </div>
                    </div>
                    {backendUsers.filter((u) => u.accountType === 'logistics').length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <Truck className="mx-auto mb-2 h-7 w-7 text-slate-400" />
                        <p className="text-sm font-bold text-slate-700">No logistics company applications yet.</p>
                        <p className="mt-1 text-xs text-slate-500">New company registrations will appear here for Super Admin review.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {backendUsers.filter((u) => u.accountType === 'logistics').map((company) => (
                          <article key={company.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#E6007E]"><Truck className="h-5 w-5" /></div>
                                <div className="min-w-0">
                                  <h4 className="truncate text-sm font-black text-[#0B172E]">{company.businessName || company.fullName}</h4>
                                  <p className="text-[11px] text-slate-500">Contact: {company.fullName}</p>
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${company.status === 'active' ? 'bg-emerald-100 text-emerald-800' : company.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{company.status || 'unknown'}</span>
                            </div>
                            <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                              <p><strong>Email:</strong> {company.email}</p>
                              <p><strong>Phone:</strong> {company.phone}</p>
                              <p><strong>Address:</strong> {company.businessAddress || company.address || 'Not provided'}</p>
                              <p><strong>Location:</strong> {[company.area, company.city, company.state].filter(Boolean).join(', ')}</p>
                              <p><strong>Registered:</strong> {new Date(company.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                              {company.status !== 'active' && company.status !== 'rejected' && (
                                <button type="button" onClick={() => void handleSetUserStatus(company.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white">Approve Company</button>
                              )}
                              {company.status !== 'suspended' && company.status !== 'rejected' && (
                                <button type="button" onClick={() => void handleSetUserStatus(company.id, 'suspended')} className="rounded-lg bg-amber-100 px-3 py-2 text-[10px] font-black text-amber-800">Suspend</button>
                              )}
                              {company.status !== 'rejected' && (
                                <button type="button" onClick={() => void handleSetUserStatus(company.id, 'rejected')} className="rounded-lg bg-red-100 px-3 py-2 text-[10px] font-black text-red-700">Reject</button>
                              )}
                              {(company.status === 'suspended' || company.status === 'rejected') && (
                                <button type="button" onClick={() => void handleSetUserStatus(company.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white">Restore & Approve</button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                  <div className="rounded-2xl bg-[#0B172E] p-5 text-white">
                    <h2 className="text-xl font-black">Logistics & Live Tracking</h2>
                    <p className="mt-1 text-xs text-slate-300">Seller records the carrier and tracking number. Super Admin verifies every progress update here.</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white/10 p-2"><strong className="block text-xl">{backendOrders.filter((o) => !!o.trackingNumber).length}</strong><span className="text-[10px] text-slate-200">Shipments</span></div>
                      <div className="rounded-lg bg-white/10 p-2"><strong className="block text-xl">{backendOrders.filter((o) => o.status === 'dispatched').length}</strong><span className="text-[10px] text-slate-200">In Transit</span></div>
                      <div className="rounded-lg bg-white/10 p-2"><strong className="block text-xl">{backendOrders.filter((o) => o.status === 'delivered').length}</strong><span className="text-[10px] text-slate-200">Delivered</span></div>
                    </div>
                  </div>
                  {backendOrders.filter((o) => !!o.trackingNumber).length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No seller hand-offs have been recorded yet.</div>
                  ) : backendOrders.filter((o) => !!o.trackingNumber).map((order) => (
                    <div key={order.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div><strong className="text-sm text-[#0B172E]">Order #{order.orderNumber}</strong><p className="text-xs text-slate-500">{order.logisticsCompanyName} · {order.trackingNumber}</p></div>
                        <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-black uppercase text-[#E6007E]">{String(order.logisticsStatus || order.status).replace(/_/g,' ')}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 p-3"><strong className="block text-slate-800">{order.buyerName}</strong><span className="text-slate-500">{order.buyerPhone}</span><p className="mt-1 text-slate-600">{order.shippingAddress?.completeAddress}, {order.shippingAddress?.city}</p></div>
                        <div className="rounded-lg bg-slate-50 p-3"><strong className="block text-slate-800">{order.sellerBusinessName || order.sellerName}</strong><span className="text-slate-500">Order total: ₦{Number(order.totalAmount).toLocaleString()}</span><p className="mt-1 text-slate-500">Last updated: {new Date(order.updatedAt || order.createdAt).toLocaleString()}</p></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select value={selectedBackendLogisticsStatuses[order.id] || ''} onChange={(e) => setSelectedBackendLogisticsStatuses((prev) => ({...prev,[order.id]:e.target.value as any}))} className="min-w-0 flex-1 rounded-lg border border-slate-300 p-2 text-xs">
                          <option value="">Select next tracking status</option>
                          <option value="picked_up">Picked up</option><option value="in_transit">In transit</option><option value="out_for_delivery">Out for delivery</option><option value="delivered">Delivered</option><option value="failed">Delivery attempt failed</option>
                        </select>
                        <button type="button" disabled={logisticsUpdateBusy===order.id} onClick={() => void handleBackendLogisticsUpdate(order)} className="rounded-lg bg-[#E6007E] px-4 py-2 text-xs font-black text-white disabled:opacity-50">{logisticsUpdateBusy===order.id?'Saving…':'Save tracking update'}</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                        {(order.trackingTimeline || []).map((step:any,index:number)=><span key={index} className={`rounded-md px-2 py-1 text-[10px] font-bold ${step.completed?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-500'}`}>{step.title}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 13: DELIVERY MONITORING (13. DELIVERY MONITORING) */}
              {/* ============================================================ */}
              {activeTab === 'deliveries' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-[#0B172E]">Live Transit & Delivery Tracking Console</h3>
                      <p className="text-xs text-slate-500">
                        Real-time updates as sellers mark orders as Dispatched or Delivered.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Dispatched/Delivered: {dispatchedAndDelivered.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dispatchedAndDelivered.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                        <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-600">No active dispatched or delivered orders yet.</p>
                      </div>
                    ) : (
                      dispatchedAndDelivered.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                              <span className="font-black text-xs text-[#0B172E]">
                                Order #{ord.orderNumber}
                              </span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                Status: <strong className="uppercase text-emerald-700">{ord.status}</strong>
                              </span>
                            </div>
                            <span className="text-xs font-black text-[#E6007E]">
                              ₦{ord.totalAmount.toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Destination Delivery Address</span>
                              <span className="font-bold text-[#0B172E] block">{ord.buyerName}</span>
                              <span className="text-slate-600 block">{ord.shippingAddress.completeAddress}</span>
                              <span className="text-slate-500 block">Phone: {ord.buyerPhone}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Fulfilling Merchant</span>
                              <span className="font-bold text-[#0B172E] block">{ord.sellerBusinessName || ord.sellerName}</span>
                              <span className="text-slate-600 block">Phone: {ord.sellerPhone}</span>
                              <span className="text-[10px] text-slate-400 block">
                                Updated: {new Date(ord.updatedAt || ord.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Tracking Steps Preview */}
                          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Delivery Timeline</span>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              {ord.trackingTimeline.map((step, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 rounded-md font-bold ${
                                    step.completed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {step.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: ADD / EDIT USER DIALOG */}
      {/* ============================================================ */}
      {isAddingUser && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-[#0B172E]">
                {editingUser ? 'Edit User Profile' : 'Create Buyer / Seller Account'}
              </h3>
              <button onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs max-h-[80vh] overflow-y-auto pr-1">
              {/* Profile Image Uploader for Super Admin */}
              <ProfileImageUploader
                value={userProfileImage}
                onChange={setUserProfileImage}
                name={userFullName || 'User'}
                role={userRole}
                label="User Profile Picture / Store Logo"
                helperText="Upload or replace photo. Auto-optimized (max 512x512 WebP, <200KB)."
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={userWhatsApp}
                    onChange={(e) => setUserWhatsApp(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password (minimum 12 characters)</label>
                  <input type="password" required minLength={12} autoComplete="new-password" value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller (Merchant)</option>

                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {userRole === 'seller' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={userBusinessName}
                    onChange={(e) => setUserBusinessName(e.target.value)}
                    placeholder="e.g. Danladi Textiles Hub"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address in Kano</label>
                <input
                  type="text"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  placeholder="e.g. Shop 42, Kasuwar Kwari, Kano"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingProductImage}
                  className="px-4 py-1.5 bg-[#E6007E] text-white font-bold rounded-lg disabled:opacity-50"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: BUYER PURCHASE HISTORY DRAWER */}
      {/* ============================================================ */}
      {selectedBuyerForHistory && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-black text-sm text-[#0B172E]">Purchase History: {selectedBuyerForHistory.fullName}</h3>
                <p className="text-xs text-slate-500">{selectedBuyerForHistory.phone} • {selectedBuyerForHistory.email}</p>
              </div>
              <button onClick={() => setSelectedBuyerForHistory(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {backendOrders.filter((order) => order.buyerId === selectedBuyerForHistory.id).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No orders on record for this customer.</p>
              ) : (
                backendOrders.filter((order) => order.buyerId === selectedBuyerForHistory.id).map((o) => (
                  <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#0B172E]">Order #{o.orderNumber}</span>
                      <span className="text-[#E6007E]">₦{o.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Date: {new Date(o.createdAt).toLocaleString()} • Method: {o.paymentMethod.toUpperCase()}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700">
                      Status: <span className="uppercase text-pink-600">{o.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: SELLER SALES HISTORY DRAWER */}
      {/* ============================================================ */}
      {selectedSellerForHistory && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-black text-sm text-[#0B172E]">Sales History: {selectedSellerForHistory.businessName || selectedSellerForHistory.fullName}</h3>
                <p className="text-xs text-slate-500">Merchant Phone: {selectedSellerForHistory.phone}</p>
              </div>
              <button onClick={() => setSelectedSellerForHistory(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {backendOrders.filter((order) => order.sellerId === selectedSellerForHistory.id).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No sales orders on record for this merchant.</p>
              ) : (
                backendOrders.filter((order) => order.sellerId === selectedSellerForHistory.id).map((o) => (
                  <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#0B172E]">Order #{o.orderNumber} - {o.buyerName}</span>
                      <span className="text-emerald-700">₦{o.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Payment: {o.paymentMethod.toUpperCase()} • Status: <strong className="uppercase">{o.status}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ADD / EDIT PRODUCT DIALOG */}
      {/* ============================================================ */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-[#0B172E]">
                {editingProduct ? 'Edit Product' : 'Add New Marketplace Product'}
              </h3>
              <button onClick={() => setIsAddingProduct(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Market</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Phones & Tablets">Phones & Tablets</option>
                    <option value="Electronics & Audio">Electronics & Audio</option>
                    <option value="Kano Shadda & Kaftan">Kano Shadda & Kaftan</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Seller</label>
                  <select
                    value={prodSellerId}
                    onChange={(e) => setProdSellerId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    {sellersList.map((s) => (
                      <option key={s.id} value={s.id}>{s.businessName || s.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (₦)</label>
                  <input
                    type="number"
                    value={prodOrigPrice}
                    onChange={(e) => setProdOrigPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={prodDiscountPercent}
                    onChange={(e) => setProdDiscountPercent(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-bold text-slate-700 mb-1">Product Image</label>
                <div className="flex flex-wrap items-center gap-3">
                  <img src={prodImage} alt="Product preview" className="h-24 w-24 rounded-xl border border-slate-200 object-cover bg-slate-50" />
                  <div className="flex flex-col gap-2">
                    <label className={`inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#E6007E] px-4 py-2 text-sm font-bold text-white ${isUploadingProductImage ? 'pointer-events-none opacity-60' : ''}`}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {isUploadingProductImage ? 'Uploading image...' : 'Upload from Gallery'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={isUploadingProductImage}
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          void handleProductGalleryUpload(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <span className="text-xs text-slate-500">JPG, PNG or WebP • Maximum 5MB</span>
                  </div>
                </div>
                {productImageUploadError && <p role="alert" className="text-sm font-semibold text-red-600">{productImageUploadError}</p>}
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold text-slate-600">Or enter an image URL</summary>
                  <input
                    type="url"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 p-2"
                    placeholder="https://example.com/product-image.jpg"
                  />
                </details>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E6007E] text-white font-bold rounded-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: PRODUCT REVIEWS & COMMENTS DIALOG */}
      {/* ============================================================ */}
      {selectedProductForReviews && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-black text-sm text-[#0B172E]">Customer Reviews & Ratings</h3>
                <p className="text-xs text-slate-500">{selectedProductForReviews.name}</p>
              </div>
              <button onClick={() => setSelectedProductForReviews(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {backendProductReviews.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No reviews submitted yet for this product.</p>
              ) : (
                backendProductReviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B172E]">{rev.buyerName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: ADD / EDIT CATEGORY (5 KANO MARKETS) */}
      {/* ============================================================ */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-[#0B172E]">
                {editingCategory ? 'Edit Kano Market' : 'Add New Market / Category'}
              </h3>
              <button onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Market / Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Kasuwar Kwari"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hausa Subtitle / Description</label>
                <input
                  type="text"
                  value={catHausaName}
                  onChange={(e) => setCatHausaName(e.target.value)}
                  placeholder="e.g. Kasuwar Yadudduka & Shadda"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  required
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E6007E] text-white font-bold rounded-lg"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatingAd && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSavePromotion} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2"><h3 className="font-black text-sm text-[#0B172E]">{editingAd ? 'Edit Promotion' : 'Create Promotion'}</h3><button type="button" onClick={() => setIsCreatingAd(false)} className="text-slate-500"><X className="h-5 w-5" /></button></div>
            <label className="block text-xs font-bold text-slate-700">Promotion title<input required maxLength={200} value={adTitle} onChange={(e) => setAdTitle(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
            <label className="block text-xs font-bold text-slate-700">Description<textarea required maxLength={2000} value={adDescription} onChange={(e) => setAdDescription(e.target.value)} className="mt-1 w-full rounded-lg border p-2" rows={3} /></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-700">Badge<input value={adBadge} onChange={(e) => setAdBadge(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-xs font-bold text-slate-700">Discount tag<input value={adDiscountTag} onChange={(e) => setAdDiscountTag(e.target.value)} placeholder="Save 20%" className="mt-1 w-full rounded-lg border p-2" /></label></div>
            <label className="block text-xs font-bold text-slate-700">Image URL<input required type="url" value={adImage} onChange={(e) => setAdImage(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-700">Button text<input value={adLinkText} onChange={(e) => setAdLinkText(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-xs font-bold text-slate-700">Button link<input value={adLinkUrl} onChange={(e) => setAdLinkUrl(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label></div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={adIsActive} onChange={(e) => setAdIsActive(e.target.checked)} /> Publish promotion immediately</label>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsCreatingAd(false)} className="rounded-lg border px-4 py-2 text-xs font-bold">Cancel</button><button type="submit" disabled={promotionSaving} className="rounded-lg bg-[#E6007E] px-4 py-2 text-xs font-black text-white disabled:opacity-50">{promotionSaving ? 'Saving…' : 'Save Promotion'}</button></div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 7: CREATE / EDIT FLASH SALE DIALOG */}
      {/* ============================================================ */}
      {isCreatingFlashSale && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-[#0B172E]">
                {editingFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
              </h3>
              <button onClick={() => setIsCreatingFlashSale(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFlashSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Flash Sale Title</label>
                <input
                  type="text"
                  required
                  value={fsTitle}
                  onChange={(e) => setFsTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={fsDescription}
                  onChange={(e) => setFsDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    required
                    value={fsDiscount}
                    onChange={(e) => setFsDiscount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={fsIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setFsIsActive(e.target.value === 'active')}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="active">Active on Homepage</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={fsStartTime}
                    onChange={(e) => setFsStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={fsEndTime}
                    onChange={(e) => setFsEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Choose approved products for this Flash Sale</label>
                {backendApprovedProducts.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 p-3 text-amber-800">No approved backend products are available yet. Approve seller products first.</p>
                ) : (
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                    {backendApprovedProducts.map((product) => (
                      <label key={product.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-50">
                        <input type="checkbox" checked={fsProductIds.includes(product.id)} onChange={(event) => setFsProductIds((previous) => event.target.checked ? [...previous, product.id] : previous.filter((id) => id !== product.id))} />
                        <span className="min-w-0 flex-1 truncate">{product.name}</span>
                        <span className="shrink-0 text-slate-500">₦{Number(product.price).toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingFlashSale(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E6007E] text-white font-bold rounded-lg"
                >
                  Save Flash Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 8: EDIT PRODUCT DISCOUNT DIALOG */}
      {/* ============================================================ */}
      {editingDiscountProduct && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-[#0B172E]">Set Product Discount</h3>
              <button onClick={() => setEditingDiscountProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="space-y-3 text-xs">
              <p className="font-bold text-slate-700">{editingDiscountProduct.name}</p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Original Regular Price (₦)</label>
                <input
                  type="number"
                  required
                  value={discOriginalPrice}
                  onChange={(e) => setDiscOriginalPrice(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discounted Sale Price (₦)</label>
                <input
                  type="number"
                  required
                  value={discPrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setDiscPrice(newPrice);
                    if (discOriginalPrice > 0) {
                      const pct = Math.round(((discOriginalPrice - newPrice) / discOriginalPrice) * 100);
                      setDiscPercentage(pct > 0 ? pct : 0);
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  value={discPercentage}
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    setDiscPercentage(pct);
                    if (discOriginalPrice > 0) {
                      setDiscPrice(Math.round(discOriginalPrice * (1 - pct / 100)));
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDiscountProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E6007E] text-white font-bold rounded-lg"
                >
                  Apply Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 9: PAYMENT REJECTION REASON DIALOG */}
      {/* ============================================================ */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-red-600">Reject OPay Bank Transfer</h3>
              <button onClick={() => setRejectingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                You are rejecting payment verification for <strong>Order #{rejectingOrder.orderNumber}</strong> from buyer <strong>{rejectingOrder.buyerName}</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectPayment}
                  className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 10: FULL ORDER DETAILS DRAWER */}
      {/* ============================================================ */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-black text-sm text-[#0B172E]">Order Details #{selectedOrderDetails.orderNumber}</h3>
                <p className="text-xs text-slate-500">Placed on {new Date(selectedOrderDetails.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-[#0B172E] block">Delivery Address:</span>
                <p className="text-slate-600">{selectedOrderDetails.shippingAddress.fullName}</p>
                <p className="text-slate-600">{selectedOrderDetails.shippingAddress.completeAddress}, {selectedOrderDetails.shippingAddress.area}, {selectedOrderDetails.shippingAddress.city}</p>
                <p className="text-slate-600 font-semibold">Phone: {selectedOrderDetails.shippingAddress.phoneNumber}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#0B172E] block">Items in Order:</span>
                {selectedOrderDetails.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800 block">{it.product.name}</span>
                      <span className="text-[10px] text-slate-500">Qty: {it.quantity} • {it.selectedColor || ''} {it.selectedSize || ''}</span>
                    </div>
                    <span className="font-black text-[#0B172E]">₦{(it.product.price * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border-t">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold">₦{selectedOrderDetails.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Fee:</span>
                  <span className="font-bold">₦{selectedOrderDetails.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#E6007E] pt-1 border-t">
                  <span>Total Amount:</span>
                  <span>₦{selectedOrderDetails.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
