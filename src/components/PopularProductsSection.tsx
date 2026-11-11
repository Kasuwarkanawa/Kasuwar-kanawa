import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface PopularProductsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const PopularProductsSection: React.FC<PopularProductsSectionProps> = ({
  products,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) => {
  return (
    <section id="popular-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-[#E6007E] rounded-full inline-block" />
            <h2 className="text-xl sm:text-2xl font-black text-[#0B172E] tracking-tight flex items-center gap-2">
              <span>Popular Products</span>
              <TrendingUp className="w-5 h-5 text-[#E6007E]" />
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 ml-4.5">
            Kayayyakin da aka fi buƙata – Most purchased by customers across Kano & Arewa
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>Hot Selling</span>
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
