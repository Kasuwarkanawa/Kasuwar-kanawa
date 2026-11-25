import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { Product, FlashSale } from '../types';
interface Props { products?: Product[]; activeFlashSale?: FlashSale | null; }
export const MainPromotionalBanner: React.FC<Props> = ({ products = [], activeFlashSale }) => {
 const featured=products.slice(0,3); const hasImage=Boolean(activeFlashSale?.bannerImage);
 return <section aria-label="Flash Sale promotion" className="mx-auto mt-3 w-full max-w-7xl px-3 sm:px-6">
  <div className="relative isolate min-h-[158px] overflow-hidden rounded-2xl bg-gradient-to-r from-[#f6dc16] via-[#f21b59] to-[#593be5] shadow-lg sm:min-h-[230px]">
   {hasImage && <img src={activeFlashSale!.bannerImage} alt={activeFlashSale?.title || 'Kasuwar Kanawa Flash Sale'} className="absolute inset-0 h-full w-full object-cover"/>}
   {!hasImage && <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,.42),transparent_28%),linear-gradient(115deg,#f4df24_0%,#f22b50_48%,#593be5_100%)]"/>}
   <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/10"/>
   <div className="relative z-10 flex min-h-[158px] items-center justify-between gap-2 px-4 py-4 text-white sm:min-h-[230px] sm:px-8">
    <div className="max-w-[58%] drop-shadow-md"><div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-900 sm:text-xs"><Zap className="h-3.5 w-3.5 fill-current"/> {activeFlashSale?.title || 'FLASH SALE'}</div>
     <h1 className="mt-2 text-2xl font-black leading-none sm:text-5xl">{activeFlashSale?.discountPercentage ? `Up to ${activeFlashSale.discountPercentage}% OFF` : 'UP TO 70% OFF'}</h1>
     <p className="mt-1.5 line-clamp-2 text-[10px] font-bold sm:mt-3 sm:text-base">{activeFlashSale?.description || 'Amazing deals on phones, fashion and everyday essentials'}</p>
     <a href="#all-products-section" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-[10px] font-black shadow-lg sm:mt-5 sm:px-6 sm:py-3 sm:text-sm">Shop Now <ArrowRight className="h-3.5 w-3.5"/></a>
    </div>
    {!hasImage && <div className="flex w-[42%] items-center justify-center gap-1 sm:gap-3">{featured.length?featured.map((p,i)=><div key={p.id} className={`flex h-[92px] w-[31%] items-center justify-center overflow-hidden rounded-xl border-2 border-white/70 bg-white/90 p-1 shadow-xl sm:h-40 ${i===1?'scale-110':''}`}><img src={p.image} alt={p.name} className="h-full w-full object-contain"/></div>):<div className="text-6xl drop-shadow-xl sm:text-8xl">🛍️</div>}</div>}
   </div>
   {activeFlashSale?.endTime && <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[8px] font-bold text-white sm:text-xs">LIMITED TIME</div>}
  </div>
 </section>;
};
