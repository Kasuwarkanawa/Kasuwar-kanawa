import React, { useState } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building,
  DollarSign,
  Search,
  Filter,
  Check,
  Flag,
  User as UserIcon,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { User, Product, Order, OrderStatus, BuyerReport } from '../types';
import { db } from '../db/database';
import { UserAvatar } from './UserAvatar';
import { ProfileImageUploader } from './ProfileImageUploader';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  seller: User;
  onProductUpdated?: () => void;
  onOpenSuperAdmin?: () => void;
}

const SAMPLE_PRODUCT_IMAGES = [
  { name: 'Redmi Note 12', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80' },
  { name: 'Brocade Shadda', url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Smartwatch Ultra', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
  { name: 'Earbuds Wireless', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80' },
  { name: 'Power Bank', url: 'https://images.unsplash.com/photo-1609592807786-814a055964f7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Embroidered Cap', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80' },
];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  isOpen,
  onClose,
  seller,
  onProductUpdated,
  onOpenSuperAdmin,
}) => {
  const [currentSeller, setCurrentSeller] = useState<User>(seller);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'history' | 'reports'>('overview');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Modals inside Seller Dashboard
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reportingOrder, setReportingOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [sellerRejectionReason, setSellerRejectionReason] = useState('Item is temporarily out of stock in our Kano store.');

  // Add / Edit Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Kano Shadda & Kaftan');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodImage, setProdImage] = useState(SAMPLE_PRODUCT_IMAGES[0].url);
  const [prodDescription, setProdDescription] = useState('');
  const [prodColors, setProdColors] = useState('White, Blue, Gold');
  const [prodSizes, setProdSizes] = useState('M, L, XL');
  const [prodVariations, setProdVariations] = useState('Standard, Premium Edition');

  // Report Buyer Form State
  const [reportReason, setReportReason] = useState('Unreachable phone number after multiple dispatch attempts');
  const [reportDetails, setReportDetails] = useState('');

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
    if (onProductUpdated) onProductUpdated();
  };

  if (!isOpen) return null;

  // Retrieve fresh seller data
  const stats = db.getSellerStats(seller.id);
  const sellerProducts = db.getProducts({ sellerId: seller.id });
  const sellerOrders = db.getSellerOrders(seller.id);
  const buyerReports = db.getBuyerReports(seller.id);

  // Filter orders
  const filteredOrders = sellerOrders.filter((ord) => {
    const matchesFilter = orderFilter === 'all' ? true : ord.status === orderFilter;
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchOrderQuery.toLowerCase()) ||
      ord.buyerName.toLowerCase().includes(searchOrderQuery.toLowerCase()) ||
      ord.buyerPhone.includes(searchOrderQuery);
    return matchesFilter && matchesSearch;
  });

  // Filter products
  const filteredProducts = sellerProducts.filter((p) =>
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  // Handle Add Product Submit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      db.updateProduct(editingProduct.id, {
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        originalPrice: Number(prodOriginalPrice || prodPrice),
        stockQuantity: Number(prodStock),
        stockLeft: Number(prodStock),
        image: prodImage,
        description: prodDescription,
        colors: prodColors.split(',').map((c) => c.trim()).filter(Boolean),
        sizes: prodSizes.split(',').map((s) => s.trim()).filter(Boolean),
        variations: prodVariations
          ? [{ name: 'Option', options: prodVariations.split(',').map((v) => v.trim()).filter(Boolean) }]
          : undefined,
      });
    } else {
      db.addProduct({
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        originalPrice: Number(prodOriginalPrice || prodPrice),
        discountPercentage:
          prodOriginalPrice > prodPrice
            ? Math.round(((prodOriginalPrice - prodPrice) / prodOriginalPrice) * 100)
            : 0,
        rating: 5.0,
        reviewsCount: 0,
        image: prodImage,
        description: prodDescription,
        stockQuantity: Number(prodStock),
        colors: prodColors.split(',').map((c) => c.trim()).filter(Boolean),
        sizes: prodSizes.split(',').map((s) => s.trim()).filter(Boolean),
        variations: prodVariations
          ? [{ name: 'Option', options: prodVariations.split(',').map((v) => v.trim()).filter(Boolean) }]
          : undefined,
        sellerId: seller.id,
        sellerName: seller.fullName,
        sellerBusinessName: seller.businessName || `${seller.fullName}'s Enterprise`,
        sellerPhone: seller.phone,
        sellerWhatsApp: seller.whatsAppNumber || seller.phone,
        isApproved: false,
        approvalStatus: 'pending_approval',
      });
    }

    setShowAddProductModal(false);
    setEditingProduct(null);
    triggerRefresh();
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory(seller.productCategory || 'Kano Shadda & Kaftan');
    setProdPrice(15000);
    setProdOriginalPrice(20000);
    setProdStock(15);
    setProdImage(SAMPLE_PRODUCT_IMAGES[0].url);
    setProdDescription('High quality authentic product sourced from Kano commercial hubs.');
    setProdColors('White, Navy Blue, Golden');
    setProdSizes('Medium, Large, XL');
    setProdVariations('Standard Retail, Premium Packaging');
    setShowAddProductModal(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdPrice(prod.price);
    setProdOriginalPrice(prod.originalPrice);
    setProdStock(prod.stockQuantity || prod.stockLeft || 10);
    setProdImage(prod.image);
    setProdDescription(prod.description || '');
    setProdColors((prod.colors || []).join(', '));
    setProdSizes((prod.sizes || []).join(', '));
    setProdVariations(prod.variations?.[0]?.options.join(', ') || '');
    setShowAddProductModal(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      db.deleteProduct(productId);
      triggerRefresh();
    }
  };

  // Order Lifecycle Handlers
  const handleAcceptOrder = (orderId: string) => {
    db.sellerAcceptOrder(orderId);
    triggerRefresh();
  };

  const handleDispatchOrder = (orderId: string) => {
    db.sellerDispatchOrder(orderId);
    triggerRefresh();
  };

  const handleDeliverOrder = (orderId: string) => {
    db.sellerDeliverOrder(orderId);
    triggerRefresh();
  };

  const handleOpenSellerReject = (ord: Order) => {
    setRejectingOrder(ord);
    setSellerRejectionReason('Item is temporarily out of stock in our Kano store.');
  };

  const handleConfirmSellerReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    db.sellerRejectOrder(rejectingOrder.id, sellerRejectionReason);
    setRejectingOrder(null);
    triggerRefresh();
  };

  // Submit Buyer Report
  const handleSubmitBuyerReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingOrder) return;

    db.submitBuyerReport({
      sellerId: seller.id,
      sellerName: seller.fullName,
      sellerBusinessName: seller.businessName || 'Seller Store',
      buyerId: reportingOrder.buyerId,
      buyerName: reportingOrder.buyerName,
      buyerPhone: reportingOrder.buyerPhone,
      orderNumber: reportingOrder.orderNumber,
      reason: reportReason,
      details: reportDetails,
    });

    setReportingOrder(null);
    setReportDetails('');
    alert('Buyer report submitted successfully to Super Admin for verification.');
    triggerRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-slate-50 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] border border-slate-200">
        
        {/* Top Header */}
        <div className="bg-[#0B172E] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2b4e]">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentSeller} size="lg" showBadge />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide">{currentSeller.businessName || currentSeller.fullName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6007E] text-white uppercase tracking-wider">
                  Verified Seller
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Seller Dashboard • Kasuwar Kanawa <span className="text-pink-300">(Arewa Sai Dan Arewa)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSuperAdmin && (
              <button
                type="button"
                onClick={onOpenSuperAdmin}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Open Super Admin CPanel to approve products and verify OPay transfers"
              >
                <ShieldCheck className="w-4 h-4 text-[#E6007E]" />
                <span className="hidden sm:inline">Admin Approvals</span>
              </button>
            )}

            <button
              type="button"
              onClick={triggerRefresh}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Card / Quick Info Bar */}
        <div className="bg-white px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <UserIcon className="w-3.5 h-3.5 text-[#E6007E]" />
              <strong className="text-slate-900">{seller.fullName}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{seller.phone}</span>
            </span>
            {seller.whatsAppNumber && (
              <a
                href={`https://wa.me/${seller.whatsAppNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp: {seller.whatsAppNumber}
              </a>
            )}
            <span className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{seller.businessAddress || seller.address}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-200">
              Category: {currentSeller.productCategory || 'General Merchandise'}
            </span>
            <button
              type="button"
              onClick={() => setShowLogoModal(true)}
              className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-[#E6007E] font-bold rounded-lg text-[11px] border border-pink-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Update merchant profile picture or store logo"
            >
              <UserAvatar user={currentSeller} size="xs" />
              <span>Update Logo / Picture</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-5 flex overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#E6007E] text-[#E6007E] bg-pink-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-[#E6007E] text-[#E6007E] bg-pink-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Management ({sellerProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#E6007E] text-[#E6007E] bg-pink-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Management ({sellerOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-[#E6007E] text-[#E6007E] bg-pink-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Sales & Revenue History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-[#E6007E] text-[#E6007E] bg-pink-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Buyer Reports ({buyerReports.length})</span>
          </button>
        </div>

        {/* Dashboard Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sales History & Performance Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Products</div>
                  <div className="text-2xl font-black text-[#0B172E] mt-1">{stats.totalProductsListed}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#E6007E]" /> In Store Catalog
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Products Sold</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{stats.totalProductsSold}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">Units Delivered</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalOrders}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Customer Requests</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Orders</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{stats.paidOrders}</div>
                  <div className="text-[10px] text-blue-600 font-medium mt-1">Verified / Paid</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Orders</div>
                  <div className="text-2xl font-black text-amber-500 mt-1">{stats.pendingOrders}</div>
                  <div className="text-[10px] text-amber-600 font-medium mt-1">Action Needed</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</div>
                  <div className="text-xl font-black text-[#E6007E] mt-1">₦{stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Gross Earnings</div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Store Status Card */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#0B172E]">Seller Store Status</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-700">
                      Active Merchant
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Business Name:</span>
                      <strong className="text-slate-800">{seller.businessName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kano Market Hub:</span>
                      <strong className="text-slate-800">{seller.area}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Approved Products:</span>
                      <strong className="text-green-600">
                        {sellerProducts.filter((p) => p.isApproved !== false && p.approvalStatus !== 'pending_approval').length}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending Approval:</span>
                      <strong className="text-amber-600">
                        {sellerProducts.filter((p) => p.approvalStatus === 'pending_approval').length}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="w-full py-2.5 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload New Product</span>
                  </button>
                </div>

                {/* Recent Orders Overview */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#0B172E]">Recent Customer Orders</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#E6007E] hover:underline cursor-pointer"
                    >
                      View All Orders ({sellerOrders.length}) →
                    </button>
                  </div>

                  {sellerOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No orders recorded yet. New buyer orders will appear here automatically.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sellerOrders.slice(0, 3).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#0B172E]">{ord.orderNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                ord.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : ord.status === 'dispatched'
                                  ? 'bg-blue-100 text-blue-700'
                                  : ord.status === 'processing'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {ord.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              Buyer: <strong className="text-slate-700">{ord.buyerName}</strong> • {ord.items.length} item(s)
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-slate-900">₦{ord.totalAmount.toLocaleString()}</div>
                            <span className="text-[10px] text-slate-400">{ord.paymentMethod.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PRODUCT MANAGEMENT TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search your products by name or category..."
                      value={searchProductQuery}
                      onChange={(e) => setSearchProductQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Showing <strong>{filteredProducts.length}</strong> product(s)
                  </span>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="py-2 px-4 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* Products List Table / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      You haven't added any products yet, or your search filter didn't match.
                    </p>
                    <button
                      type="button"
                      onClick={openAddProduct}
                      className="py-2 px-4 bg-[#E6007E] text-white text-xs font-bold rounded-xl"
                    >
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-[#0B172E]">{prod.name}</h4>
                              
                              {/* Approval Status Badge */}
                              {prod.approvalStatus === 'approved' || (prod.isApproved !== false && prod.approvalStatus !== 'pending_approval') ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Live & Approved
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending Admin Approval
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5">
                              Category: <span className="font-semibold text-slate-700">{prod.category}</span> • Stock Available:{' '}
                              <strong className={Number(prod.stockLeft || prod.stockQuantity || 0) < 5 ? 'text-red-600' : 'text-slate-800'}>
                                {prod.stockLeft ?? prod.stockQuantity ?? 10} units
                              </strong>
                            </p>

                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <span className="font-black text-[#E6007E]">₦{prod.price.toLocaleString()}</span>
                              {prod.originalPrice > prod.price && (
                                <span className="text-slate-400 line-through text-[11px]">
                                  ₦{prod.originalPrice.toLocaleString()}
                                </span>
                              )}
                              {prod.discountPercentage > 0 && (
                                <span className="px-1.5 py-0.2 bg-pink-100 text-[#E6007E] font-black text-[10px] rounded-md">
                                  -{prod.discountPercentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => openEditProduct(prod)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. ORDER MANAGEMENT TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Order Status Filters */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search order # or buyer name..."
                      value={searchOrderQuery}
                      onChange={(e) => setSearchOrderQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <strong>{filteredOrders.length}</strong> matching orders
                  </div>
                </div>

                {/* Filter Pill Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: 'all', label: 'All Orders' },
                    { id: 'pending_order', label: 'New Orders' },
                    { id: 'pending_payment', label: 'Pending Payments' },
                    { id: 'pending_verification', label: 'Pending Verification' },
                    { id: 'payment_confirmed', label: 'Payment Confirmed' },
                    { id: 'processing', label: 'Processing' },
                    { id: 'dispatched', label: 'Dispatched' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'cancelled', label: 'Cancelled' },
                    { id: 'rejected', label: 'Rejected' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setOrderFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        orderFilter === filter.id
                          ? 'bg-[#E6007E] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Listing */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No orders in this status</p>
                  <p className="text-xs text-slate-400">There are no customer orders matching your selected status filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord) => {
                    const isOpay = ord.paymentMethod === 'opay';
                    const isOpayVerified = ord.paymentConfirmation?.verifiedByAdmin;
                    const canProcess = !isOpay || isOpayVerified;

                    return (
                      <div
                        key={ord.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                      >
                        {/* Order Header Bar */}
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-[#0B172E] text-sm">{ord.orderNumber}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{new Date(ord.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Payment Status Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                                isOpay
                                  ? isOpayVerified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isOpay ? (
                                isOpayVerified ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>OPay: Payment Confirmed (Verified by Admin)</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>OPay: Awaiting Super Admin Verification</span>
                                  </>
                                )
                              ) : (
                                <>
                                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Cash on Delivery (COD)</span>
                                </>
                              )}
                            </span>

                            {/* Order Status Badge */}
                            <span className="px-2.5 py-1 bg-[#0B172E] text-white rounded-full font-bold text-[11px] capitalize">
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Order Details Body */}
                        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                          {/* 1. Buyer & Shipping Info */}
                          <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4">
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block">
                              Buyer & Delivery Information
                            </span>
                            <div className="font-bold text-slate-800 text-sm">{ord.buyerName}</div>
                            <div className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ord.buyerPhone}</span>
                            </div>

                            {/* WhatsApp Buyer Link (Section 8) */}
                            <div className="pt-1">
                              <a
                                href={`https://wa.me/234${ord.buyerPhone.replace(/^0+/, '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Hello ${ord.buyerName}, this is ${seller.businessName || seller.fullName} from Kasuwar Kanawa regarding your order ${ord.orderNumber}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Chat with Buyer on WhatsApp</span>
                              </a>
                            </div>

                            <div className="text-slate-500 text-[11px] pt-2">
                              <div className="font-semibold text-slate-700">Delivery Address:</div>
                              <div>{ord.shippingAddress?.completeAddress || 'Kano Address'}</div>
                              <div>{ord.shippingAddress?.area}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state}</div>
                            </div>
                          </div>

                          {/* 2. Items in Order */}
                          <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4">
                            <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block">
                              Ordered Products ({ord.items.length})
                            </span>
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                              {ord.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5">
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{item.product.name}</div>
                                    <div className="text-[11px] text-slate-500">
                                      Qty: <strong>{item.quantity}</strong> • ₦{item.product.price.toLocaleString()} each
                                    </div>
                                    {(item.selectedColor || item.selectedSize) && (
                                      <div className="text-[10px] text-slate-400">
                                        {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-slate-900 text-sm">
                              <span>Total Order Amount:</span>
                              <span className="text-[#E6007E]">₦{ord.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* 3. Lifecycle Controls & Status Actions */}
                          <div className="space-y-3 flex flex-col justify-between">
                            <div>
                              <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                                Order Delivery Actions
                              </span>

                              {/* Rule 6 Warning for unverified OPay transfer */}
                              {isOpay && !isOpayVerified && (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] mb-3 flex items-start gap-1.5">
                                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                  <span>
                                    <strong>Awaiting Admin Verification:</strong> Super Admin must verify this OPay transfer before you can prepare and dispatch the product.
                                  </span>
                                </div>
                              )}

                              {/* Step Action Buttons */}
                              <div className="space-y-2">
                                {ord.status !== 'delivered' && ord.status !== 'cancelled' && ord.status !== 'rejected' && (
                                  <>
                                    {ord.status !== 'processing' && ord.status !== 'dispatched' && (
                                      <div className="space-y-1.5">
                                        <button
                                          type="button"
                                          disabled={!canProcess}
                                          onClick={() => handleAcceptOrder(ord.id)}
                                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                            canProcess
                                              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer'
                                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                          }`}
                                        >
                                          <Check className="w-4 h-4" />
                                          <span>Accept & Start Processing</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenSellerReject(ord)}
                                          className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer transition-all"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                          <span>Reject Order</span>
                                        </button>
                                      </div>
                                    )}

                                    {ord.status === 'processing' && (
                                      <div className="space-y-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleDispatchOrder(ord.id)}
                                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                                        >
                                          <Truck className="w-4 h-4" />
                                          <span>Mark as Dispatched</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenSellerReject(ord)}
                                          className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer transition-all"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                          <span>Cancel / Reject Order</span>
                                        </button>
                                      </div>
                                    )}

                                    {ord.status === 'dispatched' && (
                                      <div className="space-y-1.5">
                                        {ord.dispatchedAt && (
                                          <div className="text-[10px] text-blue-700 font-medium text-center">
                                            Dispatched at: {new Date(ord.dispatchedAt).toLocaleString()}
                                          </div>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleDeliverOrder(ord.id)}
                                          className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          <span>Mark as Delivered</span>
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}

                                {ord.status === 'delivered' && (
                                  <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-bold text-center space-y-1">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span>Delivered Successfully to Buyer</span>
                                    </div>
                                    {ord.deliveredAt && (
                                      <div className="text-[10px] text-green-700 font-normal">
                                        {new Date(ord.deliveredAt).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {ord.status === 'rejected' && (
                                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs space-y-1">
                                    <div className="font-bold flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                      <span>Order / Payment Rejected</span>
                                    </div>
                                    {ord.adminRejectionReason && (
                                      <p className="text-[11px] text-red-700">
                                        Admin: {ord.adminRejectionReason}
                                      </p>
                                    )}
                                    {ord.sellerRejectionReason && (
                                      <p className="text-[11px] text-red-700">
                                        Seller: {ord.sellerRejectionReason}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Section 9: Report Suspicious / Fraudulent Buyer Button */}
                            <div className="pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setReportingOrder(ord)}
                                className="text-red-500 hover:text-red-700 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                <span>Report Buyer to Super Admin</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. SALES & REVENUE HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Completed Sales</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">₦{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-[11px] text-slate-500 mt-1">Fulfilled through Kasuwar Kanawa</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Units Dispatched</span>
                  <div className="text-2xl font-black text-[#0B172E] mt-1">{stats.totalProductsSold} items</div>
                  <p className="text-[11px] text-slate-500 mt-1">Across all order types</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fulfilled Deliveries</span>
                  <div className="text-2xl font-black text-blue-600 mt-1">{stats.deliveredOrders} orders</div>
                  <p className="text-[11px] text-slate-500 mt-1">Successful customer handoffs</p>
                </div>
              </div>

              {/* Completed Orders List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-black text-sm text-[#0B172E]">
                  Completed Sales Record
                </div>
                <div className="divide-y divide-slate-100">
                  {sellerOrders
                    .filter((o) => o.status === 'delivered')
                    .map((ord) => (
                      <div key={ord.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-black text-slate-800">{ord.orderNumber}</div>
                          <div className="text-slate-500 text-[11px]">
                            Delivered to {ord.buyerName} ({ord.shippingAddress?.area})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-emerald-600 text-sm">₦{ord.totalAmount.toLocaleString()}</div>
                          <span className="text-[10px] text-slate-400">{ord.paymentMethod.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  {sellerOrders.filter((o) => o.status === 'delivered').length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No completed orders yet. Delivered orders will appear here in your sales ledger.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. BUYER REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-[#0B172E]">Buyer Reports to Super Admin</h3>
                  <p className="text-xs text-slate-500">
                    Track reported fraudulent, uncontactable, or problematic buyers.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {buyerReports.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                    No buyer reports submitted. You can report suspicious buyers directly from the Order Management tab.
                  </div>
                ) : (
                  buyerReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-800">
                          Report on: <span className="text-red-600">{rep.buyerName}</span> ({rep.buyerPhone})
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          Status: {rep.status.toUpperCase()}
                        </span>
                      </div>
                      {rep.orderNumber && (
                        <div className="text-slate-500 text-[11px]">Order Number: {rep.orderNumber}</div>
                      )}
                      <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-slate-700">
                        <strong className="block text-red-700 mb-0.5">Reason: {rep.reason}</strong>
                        {rep.details}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Logged on: {new Date(rep.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL: ADD / EDIT PRODUCT */}
        {showAddProductModal && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="bg-[#0B172E] text-white p-4 flex items-center justify-between">
                <h3 className="font-black text-sm">
                  {editingProduct ? 'Edit Product' : 'Add New Product to Store'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-3.5 text-xs">
                {/* Note about Super Admin approval requirement */}
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-pink-900 text-xs">
                  <strong>Notice:</strong> As required by Kasuwar Kanawa policy, all newly submitted products remain in{' '}
                  <span className="underline font-bold">Pending Approval</span> status until the Super Admin verifies and activates them for the marketplace.
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austrian Brocade Shadda VIP (5 Yards)"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Product Category</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E] bg-white"
                    >
                      <option value="Kano Shadda & Kaftan">Kano Shadda & Kaftan</option>
                      <option value="Phones & Gadgets">Phones & Gadgets</option>
                      <option value="Men's Fashion & Caps">Men's Fashion & Caps</option>
                      <option value="Women's Abayas & Veils">Women's Abayas & Veils</option>
                      <option value="Electronics & Appliances">Electronics & Appliances</option>
                      <option value="Shoes & Leather Bags">Shoes & Leather Bags</option>
                      <option value="Provisions & Groceries">Provisions & Groceries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Stock Quantity Available</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={prodStock}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price (₦)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Original Price before discount (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={prodOriginalPrice}
                      onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E]"
                    />
                  </div>
                </div>

                {/* Sample Image Quick Selector or Custom URL */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Image URL or Sample Asset</label>
                  <input
                    type="text"
                    required
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E] mb-2"
                  />
                  <div className="text-[11px] text-slate-500 mb-1">Or choose a high quality sample photo:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SAMPLE_PRODUCT_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProdImage(img.url)}
                        className={`rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          prodImage === img.url ? 'border-[#E6007E] ring-2 ring-pink-300' : 'border-slate-200'
                        }`}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-12 object-cover" />
                        <span className="block text-[9px] truncate p-0.5 text-center bg-slate-50 font-bold">
                          {img.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Describe authentic features, fabric quality, warranty..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-[#E6007E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Available Colors</label>
                    <input
                      type="text"
                      placeholder="White, Blue, Gold"
                      value={prodColors}
                      onChange={(e) => setProdColors(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Available Sizes</label>
                    <input
                      type="text"
                      placeholder="5 Yards, L, XL"
                      value={prodSizes}
                      onChange={(e) => setProdSizes(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Variations</label>
                    <input
                      type="text"
                      placeholder="Standard, Deluxe"
                      value={prodVariations}
                      onChange={(e) => setProdVariations(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#E6007E] hover:bg-[#D00071] text-white font-bold cursor-pointer shadow-md"
                  >
                    {editingProduct ? 'Save Changes' : 'Submit Product for Approval'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: REPORT BUYER */}
        {reportingOrder && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="bg-red-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Report Suspicious or Fraudulent Buyer</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReportingOrder(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitBuyerReport} className="p-5 space-y-3 text-xs">
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900">
                  Reporting: <strong>{reportingOrder.buyerName}</strong> ({reportingOrder.buyerPhone}) for Order{' '}
                  <strong>{reportingOrder.orderNumber}</strong>.
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Unreachable phone number after multiple dispatch attempts">
                      Unreachable phone number after multiple dispatch attempts
                    </option>
                    <option value="Rejected Cash on Delivery without valid reason">
                      Rejected Cash on Delivery without valid reason
                    </option>
                    <option value="Fraudulent transaction reference or fake screenshot">
                      Fraudulent transaction reference or fake screenshot
                    </option>
                    <option value="Abusive or threatening communication on WhatsApp">
                      Abusive or threatening communication on WhatsApp
                    </option>
                    <option value="Fake address provided in Kano municipal / rural area">
                      Fake address provided in Kano municipal / rural area
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Additional Incident Details</label>
                  <textarea
                    rows={3}
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide details about what happened, dispatch attempts, dates..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-red-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingOrder(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer"
                  >
                    Submit Report to Super Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REJECT ORDER MODAL (Phase 6 Section 6) */}
        {rejectingOrder && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="bg-[#0B172E] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#E6007E]" />
                  <h3 className="font-bold text-sm">Reject / Cancel Customer Order</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmSellerReject} className="p-5 space-y-3 text-xs">
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900">
                  Order <strong>{rejectingOrder.orderNumber}</strong> • Buyer: <strong>{rejectingOrder.buyerName}</strong>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Rejection Reason</label>
                  <select
                    value={sellerRejectionReason}
                    onChange={(e) => setSellerRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white mb-2"
                  >
                    <option value="Item is temporarily out of stock in our Kano store.">
                      Item is temporarily out of stock in our Kano store
                    </option>
                    <option value="Unable to deliver to customer location in this dispatch cycle.">
                      Unable to deliver to customer location in this dispatch cycle
                    </option>
                    <option value="Customer requested order cancellation.">
                      Customer requested order cancellation
                    </option>
                    <option value="Item variation / color chosen is currently unavailable.">
                      Item variation / color chosen is currently unavailable
                    </option>
                  </select>
                  <textarea
                    rows={2}
                    required
                    value={sellerRejectionReason}
                    onChange={(e) => setSellerRejectionReason(e.target.value)}
                    placeholder="Enter notes for buyer and admin..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingOrder(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Confirm Order Rejection</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Update Merchant Logo / Profile Picture */}
        {showLogoModal && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-[#0B172E]">
                  Update Store Logo & Profile Picture
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ProfileImageUploader
                value={currentSeller.profileImage || ''}
                onChange={(url) => {
                  const updated = db.updateUserProfile(currentSeller.id, {
                    profileImage: url.trim() || undefined,
                  });
                  if (updated) {
                    setCurrentSeller(updated);
                    triggerRefresh();
                  }
                }}
                name={currentSeller.businessName || currentSeller.fullName}
                role={currentSeller.accountType}
                label="Merchant Store Logo / Profile Photo"
                helperText="Upload or change store logo. Auto-optimized (max 512x512 WebP, <200KB)."
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="px-4 py-2 bg-[#0B172E] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
