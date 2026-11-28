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
  <nav aria-label="Product categories" className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
   {visibleCategories.map((cat,index)=>{const Icon=ICONS[cat.iconName]||Smartphone;const count=products.filter(p=>p.categoryId===cat.id||p.category===cat.id||p.category.trim().toLocaleLowerCase()===cat.name.trim().toLocaleLowerCase()).length;const selected=selectedCategory===cat.id;return <button key={cat.id} onClick={()=>onSelectCategory(selected?'all':cat.id)} aria-pressed={selected} className={"flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-2.5 text-left transition sm:px-4 "+(selected?"border-[#F2D27A] bg-[#F2D27A] text-[#0B172E] shadow-md":"border-white/20 bg-white/10 text-white hover:bg-white/20")}>
    {cat.image?<img src={cat.image} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover"/>:<span className={"flex h-9 w-9 items-center justify-center rounded-full "+PASTELS[index%PASTELS.length]}><Icon className="h-4 w-4"/></span>}
    <span className="min-w-0"><span className="block max-w-[150px] truncate text-xs font-black sm:text-sm">{cat.name}</span><span className={"block text-[10px] "+(selected?"text-slate-700":"text-white/70")}>{count} products</span></span>
   </button>})}
  </nav>
 </section>;
};
