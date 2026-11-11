import React, { useState } from 'react';
import { Star, ShoppingCart, Zap, Check, Eye } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) => {
  const [imageError, setImageError] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product);
  };

  const handleClickCard = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  return (
    <div
      onClick={handleClickCard}
      className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer"
    >
      {/* Top Media Area */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        {/* Discount Badge */}
        {product.discountPercentage > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-[#E6007E] text-white text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
            -{product.discountPercentage}%
          </div>
        )}

        {/* Special Badge if any */}
        {product.badge && (
          <div className="absolute top-2 right-2 z-10 bg-[#0B172E]/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {product.badge}
          </div>
        )}

        {/* Quick View Overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-xs text-[#0B172E] text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-[#E6007E]" />
            <span>View Details</span>
          </span>
        </div>

        {/* Product Image */}
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-pink-50 text-slate-400 p-4 text-center">
            <span className="text-2xl mb-1">🛍️</span>
            <span className="text-xs font-semibold text-slate-600 line-clamp-2">
              {product.name}
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Name */}
          <h3
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-[#E6007E] transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating Stars & Reviews */}
          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : i < product.rating
                      ? 'fill-amber-300/60 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
              {product.rating}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 tabular-nums">
              ({product.reviewsCount} reviews)
            </span>
          </div>

          {/* Price & Discount Section */}
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-black text-[#0B172E] tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Add to Cart and Buy Now */}
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {/* Add to Cart */}
          <button
            onClick={handleAdd}
            className="w-full py-2 px-2 bg-pink-50 hover:bg-pink-100 active:bg-pink-200 text-[#E6007E] font-bold text-xs rounded-lg border border-pink-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            aria-label={`Add ${product.name} to Cart`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600 font-extrabold">Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="truncate">Add to Cart</span>
              </>
            )}
          </button>

          {/* Buy Now */}
          <button
            onClick={handleBuy}
            className="w-full py-2 px-2 bg-[#E6007E] hover:bg-[#D00071] active:bg-[#B80064] text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            aria-label={`Buy ${product.name} Now`}
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span className="truncate">Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
