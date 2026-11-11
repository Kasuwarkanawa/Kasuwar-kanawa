import React from 'react';
import { Sparkles, BadgeCheck } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface NewProductsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const NewProductsSection: React.FC<NewProductsSectionProps> = ({
  products,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) => {
  return (
    <section id="new-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#E6007E] rounded-full inline-block" />
            <h2 className="text-xl sm:text-2xl font-black text-[#0B172E] tracking-tight flex items-center gap-2">
              <span>New Products</span>
              <Sparkles className="w-5 h-5 text-[#E6007E]" />
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 ml-4.5">
            Sabuwar Shigo – Fresh stock arrivals with guaranteed manufacturer warranty
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
          <BadgeCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>100% Verified Authentic</span>
        </div>
      </div>

      {/* Product Cards Grid: Exactly 2 per row on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
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
