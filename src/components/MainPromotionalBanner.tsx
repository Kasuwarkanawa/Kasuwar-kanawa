import React from 'react';
import { ShoppingCart, CheckCircle2, ChevronRight, Flame } from 'lucide-react';
import { Product } from '../types';

interface MainPromotionalBannerProps {
  onShopNow: (productName: string) => void;
  onAddToCart: (product: Product) => void;
  featuredProduct?: Product;
}

export const MainPromotionalBanner: React.FC<MainPromotionalBannerProps> = ({
  onShopNow,
  onAddToCart,
  featuredProduct,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-[#E6007E] to-purple-800 text-white shadow-xl rounded-2xl mx-3 sm:mx-6 my-4">
      {/* Background neon aesthetic rings and glow */}
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-pink-400/30 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 -bottom-24 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Column: Hero Copy & Feature Badges */}
        <div className="flex-1 max-w-xl text-left z-10">
          {/* Badge: Brand New */}
          <div className="inline-flex items-center gap-1.5 bg-[#FFD700] text-slate-900 font-black text-xs sm:text-sm px-3.5 py-1 rounded-full shadow-md mb-4 transform -rotate-1 hover:rotate-0 transition-transform">
            <span>BRAND NEW</span>
            <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white drop-shadow-md">
            REDMI <br className="hidden sm:inline" />
            <span className="text-yellow-300 drop-shadow-sm">NOTE 12</span>
          </h1>

          <p className="mt-2 text-base sm:text-xl font-bold text-pink-100 tracking-wide">
            Powerful • Stylish • Affordable
          </p>

          {/* Key Bullet Features */}
          <div className="mt-5 space-y-2 text-xs sm:text-base font-semibold text-white/95">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white text-[#E6007E] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ✓
              </div>
              <span>Super AMOLED Display</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white text-[#E6007E] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ✓
              </div>
              <span>108MP Ultra-Clear Camera</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white text-[#E6007E] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ✓
              </div>
              <span>5000mAh Long Lasting Battery</span>
            </div>
          </div>

          {/* Price & Action Button */}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                if (featuredProduct) {
                  onAddToCart(featuredProduct);
                } else {
                  onShopNow('Redmi Note 12');
                }
              }}
              className="bg-white hover:bg-yellow-300 text-[#0B172E] font-black text-sm sm:text-base px-6 sm:px-8 py-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
            >
              <ShoppingCart className="w-5 h-5 text-[#E6007E] group-hover:scale-110 transition-transform" />
              <span>Shop Now</span>
              <ChevronRight className="w-4 h-4 text-slate-800" />
            </button>

            <div className="bg-[#0B172E]/80 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2">
              <span className="text-[10px] text-pink-200 block uppercase font-bold tracking-wider">
                Special Promo Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-yellow-300">
                  ₦195,000
                </span>
                <span className="text-xs sm:text-sm line-through text-slate-300">
                  ₦245,000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Imagery with Promotional Callout */}
        <div className="relative flex-1 flex items-center justify-center max-w-lg w-full">
          {/* Top Right "Get it Now! at the Best Price!" Banner */}
          <div className="absolute -top-3 right-2 sm:right-6 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-900 font-black text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg z-20 transform rotate-2 animate-bounce">
            Get it Now! at the Best Price!
          </div>

          {/* Stylized Promo Display Showcase */}
          <div className="relative w-full max-w-md aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/40 bg-gradient-to-tr from-[#0B172E] via-purple-900 to-pink-600 p-4 flex flex-col justify-between">
            {/* Background glowing circle */}
            <div className="absolute inset-0 bg-radial from-pink-500/40 via-transparent to-transparent pointer-events-none" />

            {/* Embedded Reference Visual or Interactive Fallback */}
            <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
              <img
                src="/assets/aistudio/1794313848781_f3e76200.png"
                alt="Redmi Note 12 Promotion"
                className="w-full h-full object-cover object-top hover:scale-102 transition-transform duration-300"
                onError={(e) => {
                  // If asset fails to load, gracefully hide this and keep the gradient backdrop
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Bottom info banner inside card */}
            <div className="relative z-10 bg-black/75 backdrop-blur-md rounded-xl p-2 text-center text-xs font-bold text-pink-200 border border-white/20 mt-2 shadow-sm">
              Official 12-Month Warranty • Available in Kano State
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
