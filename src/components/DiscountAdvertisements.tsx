import React, { useState } from 'react';
import { Sparkles, ChevronRight, Copy, Check, Percent, ArrowUpRight } from 'lucide-react';
import { PromotionalAdvertisement } from '../types';

interface DiscountAdvertisementsProps {
  promotions?: PromotionalAdvertisement[];
  onStartShopping: () => void;
  onSelectCategory: (catId: string) => void;
}

export const DiscountAdvertisements: React.FC<DiscountAdvertisementsProps> = ({
  promotions,
  onStartShopping,
  onSelectCategory,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeAds = promotions && promotions.length > 0 ? promotions : [];
  const mainAd = activeAds[0];
  const secondaryAds = activeAds.slice(1, 3);

  const handleLinkClick = (url?: string) => {
    if (!url) {
      onStartShopping();
      return;
    }
    if (url.startsWith('#')) {
      const el = document.getElementById(url.replace('#', ''));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (url.includes('shadda')) {
      onSelectCategory('shadda');
    } else if (url.includes('electronics')) {
      onSelectCategory('electronics');
    } else {
      onStartShopping();
    }
  };

  return (
    <section id="discount-ads-section" className="max-w-7xl mx-auto px-4 sm:px-6 my-8 space-y-6">
      {/* Main Promo Banner matching Reference Image */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B172E] via-[#102347] to-[#0B172E] border-2 border-pink-500/40 p-5 sm:p-7 text-white shadow-xl">
        {/* Curved pink/blue glow lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Gift Boxes & Headline */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Gift Box Graphic or Banner Image */}
            <div className="relative flex items-center justify-center shrink-0">
              {mainAd?.image ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-yellow-200 shadow-lg">
                  <img
                    src={mainAd.image}
                    alt={mainAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg border-2 border-yellow-200 flex items-center justify-center transform -rotate-3">
                  <div className="absolute inset-y-0 w-3 bg-[#E6007E]" />
                  <div className="absolute inset-x-0 h-3 bg-[#E6007E]" />
                  <Sparkles className="w-7 h-7 text-white relative z-10 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              )}
            </div>

            {/* Promo Text */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-5xl font-black italic text-yellow-300 tracking-tight drop-shadow-md">
                  {mainAd?.badge || 'Promo!'}
                </span>
                <span className="bg-[#E6007E] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                  {mainAd?.discountTag || 'Weekend Special'}
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-white mt-1">
                {mainAd?.title || 'Shop More, Save More!'}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-yellow-200/90 max-w-xl">
                {mainAd?.description || 'Amazing Deals, Unbeatable Prices on All Collections across Kano Commercial Hubs.'}
              </p>
            </div>
          </div>

          {/* Right: Action Button & Coupon Code */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => copyCoupon('KANO2026')}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-pink-200 hover:text-white"
            >
              <span>Code:</span>
              <span className="font-mono text-yellow-300 font-extrabold tracking-wider">
                KANO2026
              </span>
              {copiedCode === 'KANO2026' ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-pink-300" />
              )}
            </button>

            <button
              onClick={() => handleLinkClick(mainAd?.linkUrl)}
              className="w-full sm:w-auto px-7 py-3 bg-[#E6007E] hover:bg-[#D00071] active:scale-95 text-white font-black text-sm rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{mainAd?.linkText || 'Start Shopping'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Promotional Advertisements Grid */}
      {secondaryAds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryAds.map((ad, idx) => (
            <div
              key={ad.id}
              className={`relative overflow-hidden rounded-2xl text-white p-5 shadow-md flex items-center justify-between gap-3 border ${
                idx % 2 === 0
                  ? 'bg-gradient-to-r from-[#0B172E] to-slate-800 border-slate-700'
                  : 'bg-gradient-to-r from-pink-900/90 to-[#0B172E] border-pink-700/40'
              }`}
            >
              <div className="z-10 max-w-[65%]">
                <div className="inline-flex items-center gap-1 bg-pink-500/20 text-pink-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mb-2">
                  <Percent className="w-3 h-3" />
                  <span>{ad.badge || ad.discountTag || 'Special Deal'}</span>
                </div>
                <h4 className="text-base sm:text-lg font-black leading-tight text-white">
                  {ad.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {ad.description}
                </p>
                <button
                  type="button"
                  onClick={() => handleLinkClick(ad.linkUrl)}
                  className="mt-3 text-xs font-bold text-yellow-300 hover:text-yellow-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{ad.linkText || 'Explore Deals'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-md shrink-0 bg-slate-900">
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
