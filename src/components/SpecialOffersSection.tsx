import React from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface SpecialOffersSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const SpecialOffersSection: React.FC<SpecialOffersSectionProps> = ({
  products,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) => {
  if (products.length === 0) return null;
  return (
    <section id="special-offers-section" className="mx-auto my-10 w-full max-w-[1440px] px-3 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-7 rounded-full bg-[#d6b45f] inline-block" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <span>Special Offers</span>
              <Gift className="w-5 h-5 text-emerald-700" />
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 ml-4.5">
            Exclusive bundle packages, tailor kits, and limited seasonal discounts
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save up to 35% Today</span>
        </div>
      </div>

      {/* Product Cards Grid: Exactly 2 per row on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </section>
  );
};
