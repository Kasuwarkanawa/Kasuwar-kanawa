import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  User as UserIcon,
  Truck,
  CreditCard,
  Copy,
  Check,
  Clock,
  ArrowRight,
  AlertCircle,
  Tag,
  Plus,
  Minus,
} from 'lucide-react';
import { CartItem, User, Order } from '../types';
import { db } from '../db/database';
import { marketplaceApi } from '../utils/marketplaceApi';
import { formatPrice } from '../utils/format';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  onOpenDashboard: () => void;
  onUpdateCartItem?: (id: string, updates: Partial<CartItem>) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
  currentUser,
  onOrderSuccess,
  onOpenDashboard,
}) => {
  // Local editable items state to satisfy Section 4 (allow adjusting color, size, variation, quantity during checkout)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(initialItems);

  // Sync when initialItems change
  useEffect(() => {
    setCheckoutItems(initialItems);
  }, [initialItems]);

  // Shipping form fields (Section 5)
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [state, setState] = useState(currentUser?.state || 'Kano State');
  const [city, setCity] = useState(currentUser?.city || 'Kano City');
  const [area, setArea] = useState(currentUser?.area || 'Kano Municipal');
  const [completeAddress, setCompleteAddress] = useState(currentUser?.address || '');
  const [shippingQuote, setShippingQuote] = useState<{ companyId: string; companyName: string; deliveryFee: number; freeDelivery: boolean; state: string; city: string; subtotal: number } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Payment method (Section 7: Only OPay Bank Transfer & Cash on Delivery)
  const [paymentMethod, setPaymentMethod] = useState<'opay' | 'cod'>('opay');
  const [senderName, setSenderName] = useState(currentUser?.fullName || '');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Flow states
  const [step, setStep] = useState<'summary' | 'opay_confirm' | 'success'>('summary');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName);
      if (!phoneNumber) setPhoneNumber(currentUser.phone);
      if (!state) setState(currentUser.state || 'Kano State');
      if (!city) setCity(currentUser.city || 'Kano City');
      if (!area) setArea(currentUser.area || 'Kano Municipal');
      if (!completeAddress) setCompleteAddress(currentUser.address || '');
      if (!senderName) setSenderName(currentUser.fullName);
    }
  }, [currentUser]);

  const quoteSubtotal = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  useEffect(() => {
    if (!isOpen || checkoutItems.length === 0 || !state.trim() || !city.trim()) {
      setShippingQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }
    let cancelled = false;
    setShippingQuote(null);
    setQuoteError(null);
    setQuoteLoading(true);
    marketplaceApi.shipping.quote(state.trim(), city.trim(), quoteSubtotal)
      .then(quote => { if (!cancelled) setShippingQuote(quote); })
      .catch(error => { if (!cancelled) setQuoteError(error instanceof Error ? error.message : 'Delivery is not available for this location.'); })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, state, city, quoteSubtotal, checkoutItems.length]);

  if (!isOpen) return null;

  // 3. AUTOMATIC PRICE CALCULATION
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalOriginal = checkoutItems.reduce(
    (sum, item) =>
      sum + (item.product.originalPrice > item.product.price ? item.product.originalPrice : item.product.price) * item.quantity,
    0
  );

  const totalDiscount = Math.max(0, totalOriginal - subtotal);
  const shippingCharge = shippingQuote ? shippingQuote.deliveryFee : 0;
  const grandTotal = subtotal + shippingCharge;

  // Quantity updates in checkout
  const handleItemQuantity = (id: string, delta: number) => {
    setCheckoutItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Variation updates in checkout (Section 4)
  const handleItemVariation = (id: string, field: 'selectedColor' | 'selectedSize' | 'selectedVariation', val: string) => {
    setCheckoutItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Section 8: Copy Account Number (7066300079)
  const handleCopyAccount = () => {
    navigator.clipboard.writeText('7066300079');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Create orders through the authenticated backend. Prices and stock are recalculated server-side.
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser || currentUser.accountType !== 'buyer') {
      setErrorMessage('Please sign in with your Buyer account before placing an order.');
      return;
    }
    if (!fullName.trim() || !phoneNumber.trim() || !state.trim() || !city.trim() || !area.trim() || !completeAddress.trim()) {
      setErrorMessage('Please fill in all required shipping address fields before proceeding.');
      return;
    }
    if (checkoutItems.length === 0) {
      setErrorMessage('Your checkout basket is empty. Please add items to checkout.');
      return;
    }
    if (quoteLoading || !shippingQuote || shippingQuote.state.trim().toLowerCase() !== state.trim().toLowerCase() || shippingQuote.city.trim().toLowerCase() !== city.trim().toLowerCase() || Number(shippingQuote.subtotal) !== Number(subtotal)) {
      setErrorMessage(quoteError || 'Please wait for the delivery fee to be confirmed for your address before placing the order.');
      return;
    }
    if (checkoutItems.some((item) => !item.product.id || item.product.id.startsWith('sample-') || item.product.id.startsWith('prod-'))) {
      setErrorMessage('One or more items are not linked to the live marketplace catalogue. Remove them and add the products again from the live store.');
      return;
    }
    const sellerIds = new Set(checkoutItems.map((item) => item.product.sellerId).filter(Boolean));
    if (sellerIds.size > 1) {
      setErrorMessage('Your basket contains products from different sellers. Please place separate orders for each seller by checking out one seller’s products at a time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await marketplaceApi.orders.create({
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          selectedVariation: item.selectedVariation,
        })),
        paymentMethod,
        shippingAddress: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          state: state.trim(),
          city: city.trim(),
          area: area.trim(),
          completeAddress: completeAddress.trim(),
        },
      }) as Order;

      setCreatedOrder(order);
      if (paymentMethod === 'opay') {
        setStep('opay_confirm');
      } else {
        db.clearCart();
        onOrderSuccess(order);
        setStep('success');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to place your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record the buyer's OPay transfer details with the backend for Admin verification.
  const handleConfirmOPayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;

    if (!senderName.trim() || !transactionRef.trim()) {
      setErrorMessage('Please enter the exact sender name and OPay transaction reference from your transfer receipt.');
      return;
    }
    if (!paymentReceipt) {
      setErrorMessage('Please attach your OPay transfer receipt (JPG, PNG, WEBP or PDF) before confirming payment.');
      return;
    }
    if (paymentReceipt.size > 5 * 1024 * 1024) {
      setErrorMessage('Receipt file must be 5 MB or smaller.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const updatedOrder = await marketplaceApi.orders.confirmOpay(
        createdOrder.id,
        senderName.trim(),
        transactionRef.trim(),
      ) as Order;
      const receiptOrder = await marketplaceApi.orders.uploadReceipt(createdOrder.id, paymentReceipt) as Order;
      setCreatedOrder(receiptOrder);
      db.clearCart();
      onOrderSuccess(receiptOrder);
      setStep('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit payment confirmation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0B172E] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#1b2b4e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E6007E] rounded-xl text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {step === 'summary'
                  ? 'Checkout & Order Summary'
                  : step === 'opay_confirm'
                  ? 'OPay Bank Transfer Payment'
                  : 'Order Confirmed!'}
              </h3>
              <p className="text-xs text-pink-200 font-medium">KASUWAR KANAWA • AREWA SAI DAN AREWA</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CHECKOUT SUMMARY & SHIPPING & PAYMENT METHOD */}
        {step === 'summary' && (
          <form onSubmit={handlePlaceOrder} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 6. CHECKOUT SUMMARY: Ordered Products with variation & quantity pickers (Section 4 & 6) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-xs text-[#0B172E] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#E6007E]" />
                  <span>Items in Your Order ({checkoutItems.length})</span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Review variations & quantities
                </span>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3"
                  >
                    <img
                      src={item.selectedColor ? (item.product.images?.[(item.product.colors || []).indexOf(item.selectedColor) + 1] || (item.product.images?.length === item.product.colors?.length ? item.product.images[(item.product.colors || []).indexOf(item.selectedColor)] : undefined) || item.product.image) : item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0 self-start"
                    />

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{item.product.name}</h4>
                        <span className="font-black text-[#E6007E] text-xs shrink-0">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>

                      {/* Section 4: Interactive variation selectors */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {/* Color Selector */}
                        {item.product.colors && item.product.colors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Sample:</span>
                            <select
                              value={item.selectedColor || item.product.colors[0]}
                              onChange={(e) => handleItemVariation(item.id, 'selectedColor', e.target.value)}
                              className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 text-[11px]"
                            >
                              {item.product.colors.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Size Selector */}
                        {item.product.sizes && item.product.sizes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Size:</span>
                            <select
                              value={item.selectedSize || item.product.sizes[0]}
                              onChange={(e) => handleItemVariation(item.id, 'selectedSize', e.target.value)}
                              className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 text-[11px]"
                            >
                              {item.product.sizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Variation Selector */}
                        {item.product.variations?.find((variation) => !variation.name.startsWith('spec:'))?.options.length && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Opt:</span>
                            <select
                              value={item.selectedVariation || item.product.variations.find((variation) => !variation.name.startsWith('spec:'))!.options[0]}
                              onChange={(e) => handleItemVariation(item.id, 'selectedVariation', e.target.value)}
                              className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 text-[11px]"
                            >
                              {item.product.variations.find((variation) => !variation.name.startsWith('spec:'))!.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span>Unit Price: <strong>{formatPrice(item.product.price)}</strong></span>

                        {/* Quantity management (- / +) */}
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleItemQuantity(item.id, -1)}
                            className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 font-bold"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 py-0.5 font-black text-slate-900 text-xs min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantity(item.id, 1)}
                            className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 font-bold"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. SHIPPING INFORMATION (Strictly Required) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                <MapPin className="w-4 h-4 text-[#E6007E]" />
                <span className="font-extrabold text-xs text-[#0B172E] uppercase tracking-wider">
                  Shipping Information (Bayanin Isarwa) *
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (Cikakken Suna) *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Nafiu Bello"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (Lambar Waya) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 09060938835"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Area in Kano *</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Kano Municipal">Kano Municipal</option>
                    <option value="Fagge">Fagge (Kasuwar Kwari)</option>
                    <option value="Nassarawa">Nassarawa GRA</option>
                    <option value="Dala">Dala (Kurmi Market)</option>
                    <option value="Gwale">Gwale / Kabuga</option>
                    <option value="Tarauni">Tarauni</option>
                    <option value="Kumbotso">Kumbotso</option>
                    <option value="Ungogo">Ungogo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Delivery Address (Cikakken Adireshi) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. No. 14 Bompai Road, Nassarawa GRA, Kano"
                  value={completeAddress}
                  onChange={(e) => setCompleteAddress(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden"
                />
              </div>
            </div>

            {/* 7. PAYMENT METHOD SELECTION (Only OPay Bank Transfer and Cash on Delivery!) */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Payment Method (Hanyar Biyan Kuɗi) *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('opay')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                    paymentMethod === 'opay'
                      ? 'border-[#E6007E] bg-pink-50 text-[#E6007E] ring-2 ring-[#E6007E]/40'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-4 h-4 text-[#E6007E]" />
                    <span>OPay Bank Transfer</span>
                  </div>
                  <span className="text-[10px] font-normal text-slate-500 block leading-tight">
                    Fast transfer to official OPay account: RAMATU SAIDU
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#E6007E] bg-pink-50 text-[#E6007E] ring-2 ring-[#E6007E]/40'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <span className="text-[10px] font-normal text-slate-500 block leading-tight">
                    Pay upon package delivery anywhere in Kano
                  </span>
                </button>
              </div>
            </div>

            {/* 6. ORDER FINANCIAL SUMMARY */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Total Product Price):</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatPrice(subtotal)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Product Discount:</span>
                  <span className="font-bold tabular-nums">-{formatPrice(totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping Charge ({shippingQuote?.companyName || 'Delivery'}):</span>
                <span className={`font-bold tabular-nums ${shippingCharge === 0 && shippingQuote ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {quoteLoading ? 'Calculating…' : shippingQuote ? (shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)) : 'Unavailable'}
                </span>
              </div>
              {quoteError && <p className="text-[11px] text-red-600">{quoteError}</p>}
              {shippingQuote && <p className="text-[11px] text-slate-500">Delivery available to {shippingQuote.city}, {shippingQuote.state}.</p>}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-black text-slate-900 uppercase">Total Amount Payable:</span>
                <span className="text-base font-black text-[#E6007E] tabular-nums">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* 6. CONFIRM ORDER BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting || checkoutItems.length === 0 || quoteLoading || !shippingQuote}
              className="w-full py-3.5 bg-[#E6007E] hover:bg-[#D00071] active:scale-98 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {paymentMethod === 'opay'
                  ? `Proceed to OPay Transfer (${formatPrice(grandTotal)})`
                  : `Confirm Order - Cash on Delivery (${formatPrice(grandTotal)})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OPAY BANK TRANSFER CHECKOUT (Section 8) */}
        {step === 'opay_confirm' && createdOrder && (
          <form onSubmit={handleConfirmOPayPayment} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[85vh] text-xs">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Order <strong>#{createdOrder.orderNumber}</strong> placed! Please transfer <strong>{formatPrice(createdOrder.totalAmount)}</strong> to the OPay account below.
              </span>
            </div>

            {/* Section 8: OPay Account Information Box (Account Name: RAMATU SAIDU, Account Number: 7066300079, Bank: OPay) */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-[#E6007E]/50 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  Official OPay Account Details
                </span>
                <span className="bg-[#E6007E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Verified OPay Merchant
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-baseline py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Bank:</span>
                  <span className="font-black text-slate-900 text-sm">OPay</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Account Name:</span>
                  <span className="font-black text-slate-900 text-sm">RAMATU SAIDU</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-semibold">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-[#E6007E] tracking-wider">
                      7066300079
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="px-2.5 py-1 rounded-lg bg-pink-100 hover:bg-pink-200 text-[#E6007E] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-slate-600 font-black">Total Amount Payable:</span>
                  <span className="text-base font-black text-[#E6007E]">
                    {formatPrice(createdOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <label className="block text-xs font-bold text-slate-800">
                Upload Transfer Receipt (Required)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-100 file:px-3 file:py-2 file:font-bold file:text-[#E6007E]"
              />
              <p className="text-[10px] text-slate-500">JPG, PNG, WEBP or PDF • Maximum 5 MB. Receipt is stored privately for Admin verification.</p>
              {paymentReceipt && <p className="text-[11px] font-semibold text-emerald-700">Selected: {paymentReceipt.name}</p>}
            </div>

            {/* Buyer Payment Confirmation Inputs */}
            <div className="space-y-3 pt-1">
              <span className="block text-xs font-bold text-slate-800">
                Confirm Your Transfer (Tabbatar da Biyan Kuɗi):
              </span>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sender Account Name (Sunan Mai Tura Kuɗi)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usman Nafiu Bello"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Transaction Reference / Session ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. OPAY-TRX-83921094"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#E6007E]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <strong>Super Admin Verification Notice:</strong>
                <p>
                  Upon clicking Confirm Payment, your order payment status will become{' '}
                  <span className="underline font-bold">Pending Verification</span>. Super Admin will verify the OPay receipt in the central CPanel before the order is dispatched.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !paymentReceipt}
                className="w-full py-3.5 bg-[#E6007E] hover:bg-[#D00071] disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Receipt…' : 'Confirm Payment'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION (Section 8 & 9) */}
        {step === 'success' && createdOrder && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your order number is <strong className="text-[#0B172E] text-sm">{createdOrder.orderNumber}</strong>.
              </p>
            </div>

            {/* Status Information */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800 uppercase">
                  {createdOrder.paymentMethod === 'opay' ? 'OPay Bank Transfer' : 'Cash on Delivery (COD)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-extrabold text-amber-600 capitalize">
                  {createdOrder.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {createdOrder.shippingAddress.completeAddress}, {createdOrder.shippingAddress.area}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-bold">Total Payable:</span>
                <span className="font-black text-[#E6007E] text-sm">
                  {formatPrice(createdOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDashboard();
                }}
                className="flex-1 py-3 bg-[#0B172E] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
              >
                View in Buyer Dashboard
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
