import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { formatPrice } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
}) => {
  if (!isOpen) return null;

  // 3. AUTOMATIC PRICE CALCULATION
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalOriginal = items.reduce(
    (sum, item) =>
      sum + (item.product.originalPrice > item.product.price ? item.product.originalPrice : item.product.price) * item.quantity,
    0
  );

  const totalDiscount = Math.max(0, totalOriginal - subtotal);
  const freeDeliveryThreshold = 25000;
  const shippingCharge = subtotal >= freeDeliveryThreshold ? 0 : items.length > 0 ? 1500 : 0;
  const finalOrderTotal = subtotal + shippingCharge;

  const progressToFreeDelivery = Math.min(
    100,
    Math.round((subtotal / freeDeliveryThreshold) * 100)
  );
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-[#0B172E] text-white flex items-center justify-between border-b border-[#1b2b4e]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E6007E] rounded-xl text-white shadow-xs">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">Shopping Cart</h3>
                <span className="text-xs text-pink-200 font-medium">
                  {items.length} {items.length === 1 ? 'product' : 'products'} • Kasuwar Kanawa
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Kano Free Delivery Threshold Banner */}
          <div className="p-3.5 bg-pink-50/90 border-b border-pink-100 text-xs">
            {remainingForFree > 0 ? (
              <p className="text-slate-700 font-medium">
                Add <span className="font-bold text-[#E6007E]">{formatPrice(remainingForFree)}</span> more to qualify for{' '}
                <strong className="text-emerald-700">FREE Kano Delivery!</strong>
              </p>
            ) : (
              <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>🎉 FREE Delivery Unlocked across Kano State!</span>
              </p>
            )}
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#E6007E] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressToFreeDelivery}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-[#E6007E] mb-3">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="font-bold text-base text-slate-800">Your shopping cart is empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Discover flash sales, authentic Kano shadda, gadgets and special offers!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-5 py-2.5 bg-[#E6007E] text-white text-xs font-bold rounded-xl hover:bg-[#D00071] transition-all cursor-pointer shadow-xs"
                >
                  Start Shopping Now
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemTotal = item.product.price * item.quantity;
                const hasDiscount = item.product.originalPrice > item.product.price;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2.5"
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover bg-white shrink-0 border border-slate-200 shadow-2xs"
                      />

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                            {item.product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                            title="Remove product"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Selected Color, Size & Variation (Section 1) */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                          {item.selectedColor && (
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold">
                              Color: <strong className="text-slate-900">{item.selectedColor}</strong>
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold">
                              Size: <strong className="text-slate-900">{item.selectedSize}</strong>
                            </span>
                          )}
                          {item.selectedVariation && (
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold">
                              Opt: <strong className="text-slate-900">{item.selectedVariation}</strong>
                            </span>
                          )}
                        </div>

                        {/* Price & Discount */}
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="text-xs font-black text-[#0B172E]">
                            {formatPrice(item.product.price)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatPrice(item.product.originalPrice)}
                              </span>
                              <span className="text-[9px] font-black bg-pink-100 text-[#E6007E] px-1 py-0.2 rounded-sm">
                                -{item.product.discountPercentage}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Individual Product Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      {/* Quantity Management (- / +) */}
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 font-black text-slate-900 min-w-[28px] text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Individual Product Total */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Item Total</span>
                        <span className="text-sm font-black text-[#E6007E] tabular-nums">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. AUTOMATIC PRICE CALCULATION SUMMARY & CHECKOUT BUTTON */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3.5 shadow-lg">
              {/* Detailed Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Product Price:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Product Discounts:</span>
                    </span>
                    <span className="font-bold tabular-nums">-{formatPrice(totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Shipping Charge (Kano Delivery):</span>
                  </span>
                  <span className={`font-bold tabular-nums ${shippingCharge === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Final Order Total:
                  </span>
                  <span className="text-xl font-black text-[#E6007E] tabular-nums">
                    {formatPrice(finalOrderTotal)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Action */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedCheckout();
                }}
                className="w-full py-3.5 bg-[#E6007E] hover:bg-[#D00071] active:scale-98 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to Checkout ({formatPrice(finalOrderTotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                <span>🔒 Secure checkout • OPay Bank Transfer & Cash on Delivery supported</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
