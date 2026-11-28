import React from 'react';
import { Smartphone, Headphones, Shirt, Sparkles, Flame, Home, UtensilsCrossed, Watch, Building, ArrowRight, Grid3X3, ShoppingBasket } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { db } from '../db/database';
import { Product } from '../types';
interface Props { selectedCategory:string|null; onSelectCategory:(id:string)=>void; products:Product[]; }
const ICONS:Record<string,React.ElementType>={Smartphone,Headphones,Shirt,Sparkles,Flame,Home,UtensilsCrossed,Watch,Building,ShoppingBasket};
const PASTELS=['bg-[#DCEEFF] text-[#2563a8]','bg-[#FADBD8] text-[#a43f53]','bg-[#FDEBD0] text-[#98621b]','bg-[#FCF3CF] text-[#9b7a12]','bg-[#e5f2df] text-[#28723c]','bg-[#eee6fb] text-[#6944a0]'];
export const CategoriesSection:React.FC<Props>=({selectedCategory,onSelectCategory,products})=>{
 const saved=db.getCategories();const all=saved.length?saved:CATEGORIES;
 const visibleCategories=all.filter(cat=>products.some(product=>
  product.categoryId===cat.id||
  product.category===cat.id||
  product.category.trim().toLocaleLowerCase()===cat.name.trim().toLocaleLowerCase()
 ));
 return <section id="categories-section" className="mx-auto my-10 w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
  <div className="mb-7 flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#F2D27A]">Explore the marketplace</p><h2 className="mt-1 text-2xl font-black tracking-tight !text-white sm:text-3xl">Shop by category</h2><p className="mt-1 text-sm text-[#C4D8CC]">Find products from trusted sellers across Arewa</p></div><button onClick={()=>onSelectCategory('all')} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-xs font-extrabold text-[#13622B] shadow-sm hover:bg-emerald-50"><Grid3X3 className="h-4 w-4"/>All products<ArrowRight className="h-3 w-3"/></button></div>
  <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-6 lg:gap-x-7">
   {visibleCategories.map((cat,index)=>{const Icon=ICONS[cat.iconName]||Smartphone;const count=products.filter(p=>p.categoryId===cat.id||p.category===cat.id||p.category===cat.name).length;const selected=selectedCategory===cat.id;return <button key={cat.id} onClick={()=>onSelectCategory(selected?'all':cat.id)} aria-pressed={selected} className="group flex min-w-0 flex-col items-center text-center">
    <span className={"relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full ring-4 ring-white shadow-[0_7px_22px_rgba(19,98,43,.10)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-xl sm:h-[112px] sm:w-[112px] lg:h-[132px] lg:w-[132px] "+PASTELS[index%PASTELS.length]+(selected?" outline outline-3 outline-[#13622B] outline-offset-4":"")}>{cat.image?<img src={cat.image} alt={cat.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110"/>:<Icon className="h-10 w-10 sm:h-12 sm:w-12"/>}<span className="absolute inset-0 rounded-full bg-gradient-to-t from-black/15 to-transparent"/></span>
    <span className={"mt-3 max-w-[145px] text-xs font-black leading-snug sm:text-sm "+(selected?"!text-[#F2D27A]":"!text-white")}>{cat.name}</span><span className="mt-1 text-[10px] font-medium text-[#B7CDBF]">{count} products</span>
   </button>})}
  </div>
 </section>;
};
