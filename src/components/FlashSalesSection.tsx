import React, { useState, useEffect } from 'react';
import { Zap, Timer } from 'lucide-react';
import { Product, FlashSale } from '../types';
import { ProductCard } from './ProductCard';

interface FlashSalesSectionProps {
  products: Product[];
  activeFlashSale?: FlashSale | null;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const FlashSalesSection: React.FC<FlashSalesSectionProps> = ({
  products,
  activeFlashSale,
  onAddToCart,
  onBuyNow,
  onViewDetails,
}) => {
  // Compute remaining seconds based on activeFlashSale.endTime
  const calculateRemainingSeconds = (): number => {
    if (!activeFlashSale || !activeFlashSale.isActive) return 0;
    const end = new Date(activeFlashSale.endTime).getTime();
    const now = Date.now();
    const diff = Math.floor((end - now) / 1000);
    return diff > 0 ? diff : 0;
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemainingSeconds());

  useEffect(() => {
    setTimeLeft(calculateRemainingSeconds());
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeFlashSale?.endTime, activeFlashSale?.isActive]);

  // If no active flash sale, or timer reached 0 (automatically ended), do not display
  if (!activeFlashSale || !activeFlashSale.isActive || timeLeft <= 0 || products.length === 0) {
    return null;
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section id="flash-sales-section" className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
      {/* Flash Sales Banner Header */}
      <div className="bg-gradient-to-r from-[#E6007E] via-[#FF007F] to-[#0B172E] rounded-2xl p-3 sm:p-5 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Zap className="w-7 h-7 text-yellow-300 fill-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                {activeFlashSale.title || 'FLASH SALES'}
              </h2>
              {activeFlashSale.discountPercentage > 0 && (
                <span className="bg-yellow-400 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full">
                  Up to {activeFlashSale.discountPercentage}% OFF
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-yellow-200">
              {activeFlashSale.description || 'Limited Time Only! Grab Unbeatable Deals'}
            </p>
          </div>
        </div>

        {/* Live Countdown Timer Block */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#0B172E]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-pink-300">
            <Timer className="w-4 h-4 text-yellow-400" />
            <span>Ends in:</span>
          </div>

          <div className="flex items-center gap-1 text-white font-mono font-black text-base sm:text-xl">
            <div className="bg-[#E6007E] px-2 py-0.5 rounded-md min-w-[32px] text-center shadow-xs">
              {pad(hours)}
            </div>
            <span className="text-yellow-400">:</span>
            <div className="bg-[#E6007E] px-2 py-0.5 rounded-md min-w-[32px] text-center shadow-xs">
              {pad(minutes)}
            </div>
            <span className="text-yellow-400">:</span>
            <div className="bg-[#E6007E] px-2 py-0.5 rounded-md min-w-[32px] text-center shadow-xs">
              {pad(seconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Product Cards Grid: Exactly 2 per row on mobile */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
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
