import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingCart,
  Zap,
  ShieldAlert,
  Send,
  Check,
  AlertCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Product, ProductReview, CartItem, User } from '../types';
import { formatPrice } from '../utils/format';
import { marketplaceApi } from '../utils/marketplaceApi';
import { ImagePreview } from './ImagePreview';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
  currentUser: User | null;
  onRequireLogin: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  currentUser,
  onRequireLogin,
}) => {
  // Selected Variations state - all hooks must run unconditionally at the top
  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '');
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors && product.colors.length > 0 ? product.colors[0] : ''
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes && product.sizes.length > 0 ? product.sizes[0] : ''
  );
  const [selectedVariation, setSelectedVariation] = useState<string>(
    product?.variations && product.variations[0]?.options.length
      ? product.variations[0].options[0]
      : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Report Modal state
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('Counterfeit or fake product');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Animation state
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (!product) return;
    let active = true;
    setSelectedImage(product.image);
    setDescriptionExpanded(false);
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
    setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
    setSelectedVariation(product.variations && product.variations[0]?.options.length ? product.variations[0].options[0] : '');
    setQuantity(1);
    setReviews([]);
    setReviewError(null);
    setReviewSubmitted(false);
    setIsReporting(false);
    setReportSuccess(false);
    marketplaceApi.catalog.reviews(product.id)
      .then((items) => { if (active) setReviews(items); })
      .catch((error) => { if (active) setReviewError(error instanceof Error ? error.message : 'Unable to load product reviews.'); });
    return () => { active = false; };
  }, [product]);

  // Early return ONLY after all hooks have been declared unconditionally
  if (!isOpen || !product) return null;

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onRequireLogin(); return; }
    if (!newComment.trim()) return;
    try {
      const created = await marketplaceApi.catalog.submitReview(product.id, { rating: newRating, comment: newComment.trim() });
      setReviews((items) => [created, ...items]);
      setNewComment('');
      setReviewError(null);
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 3000);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unable to submit review. A delivered order is required.');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onRequireLogin(); return; }
    try {
      await marketplaceApi.catalog.report(product.id, { reason: reportReason, details: reportDetails });
      setReportSuccess(true);
      setTimeout(() => { setIsReporting(false); setReportSuccess(false); setReportDetails(''); }, 2500);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to submit product report.');
    }
  };

  const averageReviewRating = reviews.length ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)) : product.rating;

  const currentCartItem: CartItem = {
    id: `cart-${product.id}-${selectedColor}-${selectedSize}-${selectedVariation}`,
    product,
    quantity,
    selectedColor: selectedColor || undefined,
    selectedSize: selectedSize || undefined,
    selectedVariation: selectedVariation || undefined,
  };

  const handleAdd = () => {
    onAddToCart(currentCartItem);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const handleBuy = () => {
    onBuyNow(currentCartItem);
  };

  const allImages = [product.image, ...(product.images || [])];
  const uniqueImages = Array.from(new Set(allImages));
  const selectProductColor = (color: string) => {
    setSelectedColor(color);
    const index = (product.colors || []).indexOf(color);
    setSelectedImage(product.images?.[index] || product.image);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4">
      <ImagePreview src={selectedImage} alt={product.name} isOpen={imagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      <div className="relative bg-white w-full max-w-7xl rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200 animate-in zoom-in-95 duration-200 my-1 sm:my-3 max-h-[98vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-white text-[#0B172E] border-b border-slate-200 p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#E6007E] text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-md uppercase">
              Product Details
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-md">
              {product.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-[#E6007E] hover:bg-pink-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 sm:p-6 lg:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/70">
          {/* Main Grid: Gallery Left, Details Right */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-5 lg:gap-8 bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
            {/* Gallery Column */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-square w-full max-h-[620px] rounded-lg overflow-hidden bg-white border border-slate-200">
                {product.discountPercentage > 0 && (
                  <div className="absolute top-3 left-3 bg-[#E6007E] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md z-10">
                    -{product.discountPercentage}% OFF
                  </div>
                )}
                <button type="button" onClick={() => setImagePreviewOpen(true)} className="w-full h-full cursor-zoom-in focus:outline-none" aria-label={`Preview ${product.name} image`}>
                  <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
                </button>
              </div>

              {/* Thumbnails */}
              {uniqueImages.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {uniqueImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        selectedImage === img
                          ? 'border-[#E6007E] ring-2 ring-[#E6007E]/30 scale-102'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Seller details:</span>
                <span className="font-extrabold text-[#0B172E] text-right">{product.sellerBusinessName || product.sellerName || "Kasuwar Kanawa Merchant"}{product.sellerId && <span className="block text-[10px] text-slate-500 font-semibold">Seller ID: {product.sellerId}</span>}{product.sellerVerified && <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700"><ShieldCheck className="mr-1 h-3 w-3"/> VERIFIED SELLER</span>}</span>
              </div>
            </div>

            {/* Product Details & Selection Column */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {/* Title */}
                <h1 className="text-lg sm:text-xl font-black text-[#0B172E] leading-snug">
                  {product.name}
                </h1>

                {/* Ratings & Reviews Count */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(averageReviewRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">
                    {averageReviewRating} / 5.0
                  </span>
                  <span className="text-xs text-slate-400">
                    ({reviews.length || product.reviewsCount || 0} customer reviews)
                  </span>
                  <span className={product.stockQuantity === 0 || product.stockLeft === 0 || product.inStock === false ? "text-red-700 bg-red-50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200" : "text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200"}>
                    {product.stockQuantity === 0 || product.stockLeft === 0 || product.inStock === false ? "Out of stock" : product.stockQuantity != null || product.stockLeft != null || product.inStock === true ? "In stock" : "Availability: confirm with seller"}
                  </span>
                </div>

                {/* Pricing & Discount */}
                <div className="mt-3.5 p-4 rounded-lg bg-pink-50 border border-pink-200 flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-[#E6007E] tabular-nums">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through tabular-nums">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.discountPercentage > 0 && (
                    <span className="bg-[#0B172E] text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                      SAVE {product.discountPercentage}%
                    </span>
                  )}
                </div>

                {/* Description and full specifications share one See More control */}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
                  {product.description && (
                    <div className="p-3">
                      <div className="mb-1 text-xs font-black uppercase tracking-wide text-[#0B172E]">Product Description</div>
                      <p className={descriptionExpanded ? "text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line" : "text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-line"}>{product.description}</p>
                    </div>
                  )}
                  {descriptionExpanded && (
                    <div className="border-t border-slate-200">
                      <div className="bg-[#0B172E] px-3 py-2 text-xs font-black uppercase tracking-wide text-white">Full Product Specifications</div>
                      <div className="divide-y divide-slate-100 text-xs">
                        <div className="flex justify-between gap-3 px-3 py-2"><span className="font-semibold text-slate-500">Category</span><span className="text-right font-bold text-slate-800">{product.category}</span></div>
                        {!!product.colors?.length && <div className="flex justify-between gap-3 px-3 py-2"><span className="font-semibold text-slate-500">Available colours</span><span className="text-right font-bold text-slate-800">{product.colors.join(", ")}</span></div>}
                        {!!product.sizes?.length && <div className="flex justify-between gap-3 px-3 py-2"><span className="font-semibold text-slate-500">Sizes / Storage</span><span className="text-right font-bold text-slate-800">{product.sizes.join(", ")}</span></div>}
                        {(product.variations || []).map((variation, index) => <div key={index} className="flex justify-between gap-3 px-3 py-2"><span className="font-semibold text-slate-500">{variation.name}</span><span className="text-right font-bold text-slate-800">{variation.options.join(", ")}</span></div>)}
                        <div className="flex justify-between gap-3 px-3 py-2"><span className="font-semibold text-slate-500">Stock available</span><span className="text-right font-bold text-slate-800">{product.stockQuantity ?? product.stockLeft ?? (product.inStock === true ? "In stock" : product.inStock === false ? "Out of stock" : "Confirm with seller")}</span></div>
                        <div className="flex justify-between gap-3 px-3 py-2"><span className="font-semibold text-slate-500">Product ID</span><span className="text-right font-bold text-slate-800 break-all">{product.id}</span></div>
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={() => setDescriptionExpanded(value => !value)} aria-expanded={descriptionExpanded} className="w-full border-t border-slate-200 bg-pink-50 px-3 py-2.5 text-left text-sm font-black text-[#E6007E] hover:bg-pink-100">
                    {descriptionExpanded ? "See Less ↑" : "See More 👉"}
                  </button>
                </div>

                {/* 1. SELECT PRODUCT COLORS */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Color (Zaɓi Launi):{' '}
                      <span className="text-[#E6007E] font-black">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => selectProductColor(color)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedColor === color
                              ? 'bg-[#0B172E] text-white shadow-xs ring-2 ring-[#E6007E]'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SELECT PRODUCT SIZES */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-3.5">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Size / Storage (Zaɓi Girma):{' '}
                      <span className="text-[#E6007E] font-black">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-[#E6007E] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SELECT PRODUCT VARIATIONS */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mt-3.5">
                    {product.variations.map((v, i) => (
                      <div key={i} className="mb-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {v.name}:{' '}
                          <span className="text-[#E6007E] font-black">{selectedVariation}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedVariation(opt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedVariation === opt
                                  ? 'bg-[#0B172E] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-black text-slate-900 min-w-[28px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(quantity + 1, product.stockQuantity ?? product.stockLeft ?? Number.MAX_SAFE_INTEGER))} disabled={product.stockQuantity === 0 || product.stockLeft === 0 || quantity >= (product.stockQuantity ?? product.stockLeft ?? Number.MAX_SAFE_INTEGER)}
                      className="px-3 py-1 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Add to Cart and Buy Now */}
              <div className="pt-4 border-t border-slate-200 space-y-2 sticky bottom-0 bg-white/95 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={product.stockQuantity === 0 || product.stockLeft === 0 || product.inStock === false}
                    className="py-3 px-3 bg-pink-50 hover:bg-pink-100 active:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed text-[#E6007E] font-bold text-xs sm:text-sm rounded-xl border border-pink-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-extrabold">Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={product.stockQuantity === 0 || product.stockLeft === 0 || product.inStock === false}
                    className="py-3 px-3 bg-[#E6007E] hover:bg-[#D00071] active:bg-[#B80064] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Buy Now ({formatPrice(product.price * quantity)})</span>
                  </button>
                </div>

                {/* Report Product Trigger */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivery availability confirmed at checkout</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Check product return terms before purchase</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsReporting(!isReporting)}
                    className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report Product</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 11. REPORT PRODUCT FORM (IF OPENED) */}
          {isReporting && (
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl animate-in fade-in duration-150 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Report this Product to Super Admin CPanel</span>
                </div>
                <button
                  onClick={() => setIsReporting(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="p-3 bg-green-100 text-green-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Report submitted successfully. Super Admin CPanel is reviewing this item.</span>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Counterfeit or fake product">Counterfeit or fake product</option>
                      <option value="Incorrect price or misleading discount">Incorrect price or misleading discount</option>
                      <option value="Defective / expired item">Defective or expired item</option>
                      <option value="Seller uncontactable on WhatsApp/Phone">Seller uncontactable on WhatsApp/Phone</option>
                      <option value="Prohibited or offensive content">Prohibited or offensive content</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Additional Details
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Please provide details for the Super Admin..."
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-red-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReporting(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 10. PRODUCT COMMENTS AND RATINGS SECTION */}
          <div className="pt-6 border-t border-slate-200 space-y-4 bg-white rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0B172E] flex items-center gap-2">
                  <span>Customer Comments & Reviews</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                    {reviews.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real feedback from verified buyers across Kano & Arewa
                </p>
              </div>
            </div>

            {/* Write a Review Box */}
            <form onSubmit={handleAddReview} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Write a Product Review (Rubuta Ra'ayinka):
                </span>
                {/* Rating selection stars */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 mr-1">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 text-amber-400 hover:scale-115 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={2}
                placeholder={
                  currentUser
                    ? `Share your experience with this ${product.name}...`
                    : 'Please login to submit a review'
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!currentUser}
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#E6007E] focus:outline-hidden disabled:bg-slate-100"
              />

              {reviewSubmitted && (
                <div className="text-xs text-green-700 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Masha Allah! Your review has been published.</span>
                </div>
              )}
              {reviewError && <p role="alert" className="text-xs font-semibold text-red-600">{reviewError}</p>}

              <div className="flex justify-between items-center">
                {!currentUser ? (
                  <span className="text-xs text-[#E6007E] font-bold">
                    * You must sign in as a buyer to leave a review.
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Posting as: <strong className="text-slate-800">{currentUser.fullName}</strong>
                  </span>
                )}

                <button
                  type="submit"
                  disabled={!currentUser || currentUser.accountType !== 'buyer'}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D00071] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No reviews yet. Be the first to share your thoughts on this product!
                </p>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-pink-100 text-[#E6007E] font-black text-xs flex items-center justify-center">
                          {rev.buyerName.slice(0, 1)}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{rev.buyerName}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                          Verified Buyer
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    <div className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
