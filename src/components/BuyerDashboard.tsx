import React, { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Edit2,
  X,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { User, Order, OrderStatus } from '../types';
import { db } from '../db/database';
import { formatPrice } from '../utils/format';

interface BuyerDashboardProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  onClose: () => void;
  onContinueShopping: () => void;
}

const ORDER_STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Pending Orders', value: 'pending_order' },
  { label: 'Pending Payments', value: 'pending_payment' },
  { label: 'Pending Verification', value: 'pending_verification' },
  { label: 'Payment Confirmed', value: 'payment_confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Dispatched', value: 'dispatched' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  user,
  onUpdateUser,
  onClose,
  onContinueShopping,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedStatusTab, setSelectedStatusTab] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>(db.getOrders(user.id));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(user.fullName);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAddress, setEditAddress] = useState(user.address);
  const [editArea, setEditArea] = useState(user.area);
  const [editCity, setEditCity] = useState(user.city);
  const [editState, setEditState] = useState(user.state);

  // Payment Confirmation input for pending orders
  const [senderName, setSenderName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const refreshOrders = () => {
    setOrders(db.getOrders(user.id));
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.updateUserProfile(user.id, {
      fullName: editFullName,
      phone: editPhone,
      address: editAddress,
      area: editArea,
      city: editCity,
      state: editState,
    });
    if (updated) {
      onUpdateUser(updated);
      setIsEditingProfile(false);
    }
  };

  const handleConfirmPayment = (orderId: string) => {
    if (!senderName.trim() || !transactionRef.trim()) return;
    const updated = db.confirmPaymentByBuyer(orderId, senderName, transactionRef);
    if (updated) {
      setConfirmSuccess(true);
      refreshOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      setTimeout(() => {
        setConfirmSuccess(false);
        setSenderName('');
        setTransactionRef('');
      }, 2500);
    }
  };

  const handleSimulateAdminApproval = (orderId: string) => {
    const updated = db.adminApprovePayment(orderId);
    if (updated) {
      refreshOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatusTab === 'all') return true;
    return o.status === selectedStatusTab;
  });

  const getStatusBadge = (status: OrderStatus, order?: Order) => {
    switch (status) {
      case 'pending':
      case 'pending_order':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">Pending</span>;
      case 'pending_payment':
        return <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full">Pending Payment</span>;
      case 'pending_verification':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">Pending Verification</span>;
      case 'payment_confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">Payment Confirmed</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">Processing</span>;
      case 'dispatched':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">Dispatched</span>;
      case 'delivered':
        return <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full">Delivered</span>;
      case 'cancelled':
        return <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">Cancelled</span>;
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200">
            {order?.adminRejectionReason ? 'Payment Rejected' : 'Rejected'}
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200 animate-in zoom-in-95 duration-200 my-4 max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#0B172E] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E6007E] text-white flex items-center justify-center font-black text-lg shadow-sm">
              {user.fullName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg">{user.fullName}</h2>
                <span className="bg-white/10 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/30 uppercase">
                  {user.accountType} Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {user.email} • {user.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshOrders}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-3.5 transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-3.5 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Buyer Profile & Address</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: BUYER ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Order Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                {ORDER_STATUS_TABS.map((tab) => {
                  const count =
                    tab.value === 'all'
                      ? orders.length
                      : orders.filter((o) => o.status === tab.value).length;

                  return (
                    <button
                      key={tab.value}
                      onClick={() => setSelectedStatusTab(tab.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        selectedStatusTab === tab.value
                          ? 'bg-[#E6007E] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-1.5 opacity-80 tabular-nums">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No orders in this category</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Browse our authentic collections, flash deals, and northern traditional attire!
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onContinueShopping();
                    }}
                    className="mt-4 px-5 py-2 bg-[#E6007E] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#D00071] transition-all cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredOrders.map((order) => {
                    const isExpanded = selectedOrder?.id === order.id;
                    const sellerWhatsApp = (order.sellerWhatsApp || '2349060938835').replace(/[^0-9]/g, '');
                    const orderMsg = encodeURIComponent(
                      `Salam, I am contacting you regarding my Kasuwar Kanawa Order #${order.orderNumber}. Can you give me an update?`
                    );

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                      >
                        {/* Order Summary Strip */}
                        <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-sm text-[#0B172E]">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            {getStatusBadge(order.status, order)}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-[#E6007E] tabular-nums">
                              {formatPrice(order.totalAmount)}
                            </span>
                            <button
                              onClick={() => setSelectedOrder(isExpanded ? null : order)}
                              className="text-xs font-bold text-[#0B172E] hover:text-[#E6007E] underline cursor-pointer"
                            >
                              {isExpanded ? 'Hide Details' : 'View Order Details & Track'}
                            </button>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="p-4 space-y-2.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">
                                  {item.product.name}
                                </h4>
                                <div className="text-slate-500 text-[11px] flex gap-2 flex-wrap">
                                  {item.selectedColor && (
                                    <span>Color: <strong>{item.selectedColor}</strong></span>
                                  )}
                                  {item.selectedSize && (
                                    <span>Size: <strong>{item.selectedSize}</strong></span>
                                  )}
                                  <span>Qty: <strong>{item.quantity}</strong></span>
                                </div>
                              </div>
                              <span className="font-bold text-[#0B172E] tabular-nums">
                                {formatPrice(item.product.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Expanded Details & Tracking Timeline */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/80 border-t border-slate-200 text-xs space-y-4 animate-in fade-in duration-200">
                            {/* 8. PAYMENT CONFIRMATION SECTION (OPay or COD) */}
                            {order.paymentMethod === 'opay' && (
                              <div className="p-4 bg-white rounded-xl border border-pink-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#E6007E]" />
                                    <span className="font-black text-sm text-[#0B172E]">
                                      OPay Bank Transfer Information
                                    </span>
                                  </div>
                                  {order.status === 'rejected' ? (
                                    <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                      <span>Payment Rejected</span>
                                    </span>
                                  ) : order.paymentConfirmation.verifiedByAdmin || order.status === 'payment_confirmed' ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Payment Confirmed</span>
                                    </span>
                                  ) : (
                                    <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Pending Verification</span>
                                    </span>
                                  )}
                                </div>

                                {order.status === 'rejected' && (
                                  <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-xl space-y-1">
                                    <div className="font-bold flex items-center gap-1.5 text-red-800">
                                      <AlertCircle className="w-4 h-4 text-red-600" />
                                      <span>Payment Rejected by Super Admin</span>
                                    </div>
                                    <p className="text-[11px] text-red-700">
                                      {order.adminRejectionReason || 'The payment transfer could not be verified in the official OPay ledger.'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 pt-1">
                                      Please contact support or re-submit transfer details below with a valid reference.
                                    </p>
                                  </div>
                                )}

                                {/* Bank Account Box */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-pink-50/50 border border-pink-100 text-xs">
                                  <div>
                                    <span className="block text-slate-400 text-[10px]">Bank Name</span>
                                    <span className="font-extrabold text-slate-800">OPay</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 text-[10px]">Account Name</span>
                                    <span className="font-extrabold text-slate-800">RAMATU SAIDU</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 text-[10px]">Account Number</span>
                                    <span className="font-mono font-black text-[#E6007E] text-sm">7066300079</span>
                                  </div>
                                </div>

                                {/* Buyer Payment Confirmation Form if not yet confirmed */}
                                {!order.paymentConfirmation.confirmedByBuyer && (
                                  <div className="pt-2 border-t border-slate-100 space-y-2">
                                    <span className="font-bold text-slate-700 block">
                                      Confirm Your OPay Transfer:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        placeholder="Sender Account Name (e.g. Usman Bello)"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Transaction Ref (e.g. 261109...)"
                                        value={transactionRef}
                                        onChange={(e) => setTransactionRef(e.target.value)}
                                        className="p-2 text-xs border border-slate-300 rounded-lg bg-white"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmPayment(order.id)}
                                      className="w-full py-2 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold rounded-lg cursor-pointer"
                                    >
                                      Submit Payment Confirmation
                                    </button>
                                  </div>
                                )}

                                {confirmSuccess && (
                                  <div className="p-2 bg-green-50 text-green-800 font-bold rounded-lg text-xs">
                                    ✓ Payment confirmation submitted! Status updated to Pending Verification.
                                  </div>
                                )}

                                {/* Simulation Button for Super Admin Approval */}
                                {!order.paymentConfirmation.verifiedByAdmin && (
                                  <div className="p-2.5 bg-slate-100 rounded-lg flex items-center justify-between text-xs">
                                    <span className="text-slate-500">
                                      (Demo Test Tool: Simulate Super Admin Verification)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSimulateAdminApproval(order.id)}
                                      className="px-3 py-1 bg-[#0B172E] hover:bg-slate-800 text-white font-bold rounded text-[11px] cursor-pointer"
                                    >
                                      Approve Payment as Admin
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {order.paymentMethod === 'cod' && (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                                <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                                <div>
                                  <strong>Cash on Delivery (Kano State):</strong> Please have exact cash or POS ready when the dispatch rider arrives at your address.
                                </div>
                              </div>
                            )}

                            {/* 7. SHIPPING INFORMATION */}
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                              <h5 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#E6007E]" />
                                <span>Shipping & Delivery Destination</span>
                              </h5>
                              <p className="text-slate-600">
                                <strong>Recipient:</strong> {order.shippingAddress.fullName} ({order.shippingAddress.phoneNumber})
                              </p>
                              <p className="text-slate-600 mt-0.5">
                                <strong>Address:</strong> {order.shippingAddress.completeAddress}, {order.shippingAddress.area}, {order.shippingAddress.city}, {order.shippingAddress.state}
                              </p>
                            </div>

                            {/* Seller Rejection Banner */}
                            {order.sellerRejectionReason && (
                              <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-xl space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-red-800">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <span>Order Cancelled / Rejected by Seller</span>
                                </div>
                                <p className="text-[11px] text-red-700">{order.sellerRejectionReason}</p>
                              </div>
                            )}

                            {/* TRACKING TIMELINE */}
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                              <h5 className="font-bold text-slate-800">Order Tracking Timeline</h5>
                              <div className="space-y-3 relative pl-6 border-l-2 border-slate-200 ml-2">
                                {order.trackingTimeline.map((step, sIdx) => (
                                  <div key={sIdx} className="relative">
                                    <div
                                      className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${
                                        step.completed
                                          ? 'bg-[#E6007E] border-white ring-2 ring-[#E6007E]'
                                          : 'bg-white border-slate-300'
                                      }`}
                                    />
                                    <div className="flex items-baseline justify-between">
                                      <span
                                        className={`font-bold ${
                                          step.completed ? 'text-[#0B172E]' : 'text-slate-400'
                                        }`}
                                      >
                                        {step.title}
                                      </span>
                                      <span className="text-[10px] text-slate-400">{step.date}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">{step.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 9. WHATSAPP CONTACT LINK ON ORDERS */}
                            <div className="flex items-center justify-between pt-2">
                              <div className="text-slate-500">
                                Seller Contact: <strong>{order.sellerPhone}</strong>
                              </div>

                              <a
                                href={`https://wa.me/${sellerWhatsApp}?text=${orderMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageCircle className="w-4 h-4 fill-white" />
                                <span>Chat Seller on WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUYER PROFILE & ACCOUNT INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#0B172E]">Buyer Profile Information</h3>
                  <p className="text-xs text-slate-500">
                    Manage your personal information and default Kano delivery addresses.
                  </p>
                </div>

                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-[#E6007E] font-bold text-xs rounded-xl border border-pink-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Default Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Area</label>
                      <input
                        type="text"
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Information Card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm text-[#0B172E] border-b border-slate-200 pb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#E6007E]" />
                      <span>Account Information</span>
                    </h4>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Account Type:</span>
                      <span className="font-black text-[#E6007E] uppercase">{user.accountType}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="font-bold text-slate-800">{user.fullName}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Phone Number:</span>
                      <span className="font-mono font-bold text-slate-800">{user.phone}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Email Address:</span>
                      <span className="font-bold text-slate-800">{user.email}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Member Since:</span>
                      <span className="font-bold text-slate-800">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Saved Delivery Destination Card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm text-[#0B172E] border-b border-slate-200 pb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#E6007E]" />
                      <span>Default Kano Shipping Address</span>
                    </h4>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">{user.fullName}</span>
                      <span className="text-slate-600 block">{user.address}</span>
                      <span className="text-slate-500 block">
                        {user.area}, {user.city}, {user.state}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] block">{user.phone}</span>
                    </div>

                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-[11px] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Saved shipping address will auto-fill during your checkout.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
