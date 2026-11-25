import React from 'react';
import { ArrowRight, Zap, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';
import { Product, FlashSale } from '../types';

interface Props { products?: Product[]; activeFlashSale?: FlashSale | null; }

export const MainPromotionalBanner: React.FC<Props> = ({ products = [], activeFlashSale }) => {
  const featured = products.slice(0, 3);
  const hasImage = Boolean(activeFlashSale?.bannerImage);
  return (
    <section aria-label="Kasuwar Kanawa featured promotion" className="w-full px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="relative mx-auto grid min-h-[330px] max-w-[1440px] overflow-hidden rounded-[28px] bg-[#073d2c] shadow-[0_24px_70px_rgba(4,50,34,.2)] md:min-h-[430px] md:grid-cols-[1.05fr_.95fr]">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{backgroundImage:'radial-gradient(circle at 10% 10%,rgba(218,177,78,.28),transparent 30%),radial-gradient(circle at 85% 85%,rgba(255,255,255,.12),transparent 28%)'}} />
        <div className="relative z-10 flex flex-col items-start justify-center px-6 py-9 text-white sm:px-10 md:px-14 md:py-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e5c16b]/50 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f4d98e] sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-[#f4d98e] shadow-[0_0_12px_#f4d98e]" /> Arewa Sai Dan Arewa
          </div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-100/80 sm:text-sm">Your trusted Northern Nigeria marketplace</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            {activeFlashSale?.title || 'Shop smarter. Buy with confidence.'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/85 sm:text-base">
            {activeFlashSale?.description || 'Discover phones, fashion, home essentials and more from sellers across Kano and beyond.'}
          </p>
          {activeFlashSale?.discountPercentage ? <div className="mt-4 inline-flex rounded-xl bg-[#e6bf63] px-4 py-2 text-sm font-black text-[#173b2b]">Up to {activeFlashSale.discountPercentage}% OFF</div> : null}
          <a href="#all-products-section" className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#e6bf63] px-6 py-3.5 text-sm font-black text-[#153b2a] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#f1d58b]">
            Explore marketplace <ArrowRight className="h-4 w-4" />
          </a>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold text-white/75 sm:text-xs">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#e6bf63]"/> Trusted marketplace</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-[#e6bf63]"/> Delivery options</span>
            <span className="inline-flex items-center gap-1.5"><ShoppingBag className="h-4 w-4 text-[#e6bf63]"/> Local sellers</span>
          </div>
        </div>
        <div className="relative flex min-h-[220px] items-center justify-center px-5 pb-8 md:min-h-full md:px-8 md:py-8">
          {hasImage ? (
            <div className="absolute inset-4 overflow-hidden rounded-2xl border border-white/20 shadow-2xl md:inset-7">
              <img src={activeFlashSale!.bannerImage} alt={activeFlashSale?.title || 'Marketplace promotion'} className="h-full w-full object-cover" />
            </div>
          ) : (
            <>
              <div className="absolute h-56 w-56 rounded-full border border-[#e6bf63]/30 md:h-80 md:w-80" />
              <div className="absolute h-72 w-72 rounded-full border border-white/10 md:h-[26rem] md:w-[26rem]" />
              <div className="relative z-10 flex h-[250px] w-[145px] rotate-[-7deg] items-center justify-center rounded-[30px] border-[5px] border-[#d8d8d2] bg-[#101916] p-2 shadow-[0_30px_60px_rgba(0,0,0,.45)] md:h-[330px] md:w-[190px]">
                <div className="absolute top-1.5 z-20 h-3 w-14 rounded-full bg-black" />
                <div className="h-full w-full overflow-hidden rounded-[21px] bg-[#f7f8f4]">
                  <div className="flex h-9 items-center justify-between bg-[#075b3c] px-2 text-[7px] font-black text-white"><span>KASUWAR KANAWA</span><ShoppingBag className="h-3 w-3"/></div>
                  <div className="m-2 rounded-lg bg-gradient-to-br from-[#075b3c] to-[#13835b] p-2 text-white"><span className="text-[6px] font-bold uppercase tracking-widest text-[#f2d68c]">Arewa Sai Dan Arewa</span><div className="mt-1 text-[13px] font-black leading-tight">Shop Local.<br/>Shop Better.</div><div className="mt-2 rounded bg-[#e6bf63] px-2 py-1 text-center text-[6px] font-black text-[#153b2a]">EXPLORE NOW</div></div>
                  <div className="grid grid-cols-2 gap-1 px-2">{featured.length ? featured.map(p=><div key={p.id} className="overflow-hidden rounded-md bg-white p-1 shadow-sm"><img src={p.image} alt={p.name} className="h-12 w-full object-contain"/><div className="mt-1 line-clamp-1 text-[6px] font-bold text-slate-700">{p.name}</div></div>) : <div className="col-span-2 flex h-20 items-center justify-center text-[#075b3c]"><ShoppingBag className="h-8 w-8"/></div>}</div>
                  <div className="mt-2 border-t border-slate-200 px-2 py-2 text-center text-[6px] font-bold text-[#075b3c]">HOME　 CATEGORIES　 CART　 ACCOUNT</div>
                </div>
              </div>
              <div className="absolute bottom-8 right-4 rounded-2xl border border-white/20 bg-white/95 p-3 text-[#123d2d] shadow-xl sm:right-10 md:bottom-12"><div className="flex items-center gap-2"><span className="rounded-lg bg-[#e6bf63]/30 p-2"><Zap className="h-4 w-4"/></span><div><div className="text-[9px] font-black uppercase tracking-wider">Marketplace deals</div><div className="text-xs font-extrabold">Fresh finds daily</div></div></div></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
