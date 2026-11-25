import React from 'react';
import { Search, ShoppingCart, Smartphone, Shirt, Home, Sparkles, ArrowRight, Star } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
export const MainPromotionalBanner: React.FC<{products?:Product[]}> = ({products=[]}) => {
 const preview=products.slice(0,2);
 return <section aria-label="Kasuwar Kanawa marketplace banner" className="mx-auto my-4 w-full max-w-7xl px-3 sm:px-6">
  <div className="relative isolate overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#064b28] via-[#087a35] to-[#0a9b4b] px-5 py-7 text-white shadow-xl sm:px-9 sm:py-10">
   <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-lime-300/25 blur-3xl"/><div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl"/>
   <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_.9fr]">
    <div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[.16em] text-lime-100 sm:text-xs"><Sparkles className="h-4 w-4"/> AREWA SAI DAN AREWA</span>
     <h1 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl">Shop Smart.<br/><span className="text-lime-200">Shop Easy.</span></h1>
     <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-emerald-50 sm:text-base">Discover phones, fashion, home essentials and more from trusted sellers across Kano and Arewa.</p>
     <a href="#all-products-section" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-lime-100">Start Shopping <ArrowRight className="h-4 w-4"/></a>
     <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold text-white/90"><span>✓ Trusted sellers</span><span>✓ Great prices</span><span>✓ Kano & nationwide</span></div>
    </div>
    <div className="relative mx-auto w-full max-w-[290px] sm:max-w-[340px]"><div className="absolute -inset-6 rounded-[3rem] bg-lime-200/20 blur-2xl"/>
     <div className="relative rotate-[3deg] rounded-[2.6rem] border-[7px] border-slate-900 bg-slate-900 p-1.5 shadow-[0_25px_70px_rgba(0,0,0,.45)]"><div className="overflow-hidden rounded-[2rem] bg-white text-slate-900">
      <div className="flex items-center justify-between px-4 pb-2 pt-3 text-[9px] font-bold"><span>9:41</span><span>● ● ▰</span></div>
      <div className="flex items-center justify-between px-3 py-2"><div className="flex items-center gap-2"><div className="rounded-lg bg-emerald-700 p-2 text-white"><ShoppingCart className="h-4 w-4"/></div><div className="leading-tight"><b className="block text-[12px] text-emerald-900">KASUWAR</b><b className="block text-[15px] text-amber-600">KANAWA</b></div></div><span className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">☰</span></div>
      <div className="mx-3 flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-[10px] text-slate-400"><Search className="h-3.5 w-3.5"/> Search products...</div>
      <div className="mx-3 mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-300 via-rose-500 to-blue-600 p-3 text-white"><div className="text-[10px] font-black uppercase text-slate-900">Limited time deals</div><div className="text-2xl font-black leading-none">FLASH SALE</div><div className="mt-1 text-xs font-bold">Shop great deals today</div><span className="mt-2 inline-block rounded-full bg-red-600 px-3 py-1 text-[9px] font-black">SHOP NOW</span></div>
      <div className="grid grid-cols-4 gap-1 px-2 py-3 text-center">{[{I:Smartphone,t:'Phones'},{I:Shirt,t:'Fashion'},{I:Home,t:'Home'},{I:Sparkles,t:'Beauty'}].map(({I,t})=><div key={t}><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><I className="h-5 w-5"/></div><span className="mt-1 block text-[8px] font-bold">{t}</span></div>)}</div>
      <div className="flex items-center justify-between px-3 pb-2"><b className="text-xs">Popular Products</b><span className="text-[9px] font-bold text-emerald-700">See All →</span></div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">{preview.length?preview.map(p=><div key={p.id} className="overflow-hidden rounded-xl border border-slate-100 p-2"><div className="flex h-20 items-center justify-center bg-slate-50"><img src={p.image} alt={p.name} className="h-full w-full object-contain"/></div><b className="mt-1 block line-clamp-1 text-[9px]">{p.name}</b><b className="text-[10px] text-emerald-800">{formatPrice(p.price)}</b><div className="flex items-center gap-0.5 text-[8px] text-amber-400"><Star className="h-2.5 w-2.5 fill-current"/>{p.rating||'New'}</div></div>):[0,1].map(n=><div key={n} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex h-16 items-center justify-center text-3xl">{n===0?'📱':'👕'}</div><div className="mt-2 h-2 rounded bg-slate-200"/></div>)}</div>
      <div className="flex justify-around border-t border-slate-100 py-2 text-[8px] font-bold text-emerald-800"><span>⌂ Home</span><span>🛒 Cart</span><span>◉ Chat</span><span>♙ Account</span></div>
     </div></div><div className="absolute -bottom-4 -left-8 rounded-2xl border border-white/30 bg-white/95 px-4 py-2 text-xs font-black text-emerald-800 shadow-xl">AREWA • ONLINE MARKET</div>
    </div>
   </div>
  </div>
 </section>;
};
