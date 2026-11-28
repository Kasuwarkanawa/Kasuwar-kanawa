import React from 'react';
import { Sparkles, ChevronRight, Percent, ArrowUpRight } from 'lucide-react';
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
  const activeAds = promotions && promotions.length > 0 ? promotions : [];
  const mainAd = activeAds[0];
  const secondaryAds = activeAds.slice(1, 3);

  // Do not display placeholder promotions or coupon codes when admins have not published an ad.
  if (!mainAd) return null;

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
    <section id="discount-ads-section" className="mx-auto my-10 w-full max-w-[1440px] space-y-6 px-3 sm:px-6">
      {/* Large, clearly visible main promotion artwork */}
      {mainAd?.image && <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-100 bg-[#073d2c] shadow-xl"><img src={mainAd.image} alt={`${mainAd.title} promotion banner`} className="block max-h-[420px] w-full object-contain" loading="eager" /></div>}

      {/* Main Promo Banner matching Reference Image */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#073d2c] via-[#0b6846] to-[#124b36] border border-[#d6b45f]/40 p-5 sm:p-7 text-white shadow-xl">
        {/* Curved pink/blue glow lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d6b45f]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Gift Boxes & Headline */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Gift Box Graphic or Banner Image */}
            <div className="relative flex items-center justify-center shrink-0">
              {mainAd?.image ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-pink-500 to-amber-400 border-2 border-yellow-200 shadow-lg flex items-center justify-center"><Sparkles className="w-7 h-7 text-white" /></div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg border-2 border-yellow-200 flex items-center justify-center transform -rotate-3">
                  <div className="absolute inset-y-0 w-3 bg-[#d6b45f]" />
                  <div className="absolute inset-x-0 h-3 bg-[#d6b45f]" />
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
                <span className="bg-[#d6b45f] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
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

          {/* Right: Action Button */}
          <div className="flex w-full items-center justify-center md:w-auto">
            <button
              onClick={() => handleLinkClick(mainAd.linkUrl)}
              className="w-full sm:w-auto px-7 py-3 bg-[#d6b45f] hover:bg-[#D00071] active:scale-95 text-white font-black text-sm rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{mainAd.linkText || 'Start Shopping'}</span>
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
                  : 'bg-gradient-to-r from-[#0b6846] to-[#073d2c] border-emerald-300/20'
              }`}
            >
              <div className="z-10 max-w-[65%]">
                <div className="inline-flex items-center gap-1 bg-pink-500/20 text-[#f0d58a] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mb-2">
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

              <div className="w-32 h-28 sm:w-44 sm:h-32 rounded-xl overflow-hidden border-2 border-white/20 shadow-md shrink-0 bg-slate-900">
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-contain"
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
