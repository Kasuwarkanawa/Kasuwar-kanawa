import React from 'react';
import { Smartphone, Headphones, Shirt, Sparkles, Flame, Home, UtensilsCrossed, Watch, Building, ArrowRight, Grid3X3 } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { db } from '../db/database';
import { Product } from '../types';

interface Props { selectedCategory:string|null; onSelectCategory:(id:string)=>void; products:Product[]; }
const ICONS:Record<string,React.ElementType>={Smartphone,Headphones,Shirt,Sparkles,Flame,Home,UtensilsCrossed,Watch,Building};
export const CategoriesSection:React.FC<Props>=({selectedCategory,onSelectCategory,products})=>{
 const saved=db.getCategories(); const all=saved.length?saved:CATEGORIES;
 return <section id="categories-section" className="mx-auto my-8 w-full max-w-[1440px] px-3 sm:px-6">
  <div className="mb-5 flex items-end justify-between gap-3">
   <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-700">Find what you need</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Shop by category</h2><p className="mt-1 text-xs text-slate-500">Explore collections from trusted local sellers</p></div>
   <button onClick={()=>onSelectCategory('all')} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-[11px] font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-50"><Grid3X3 className="h-4 w-4"/> All products <ArrowRight className="h-3 w-3"/></button>
  </div>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
   {all.map((cat,index)=>{const Icon=ICONS[cat.iconName]||Smartphone;const count=products.filter(p=>p.categoryId===cat.id||p.category===cat.id||p.category===cat.name).length;const selected=selectedCategory===cat.id;return <button key={cat.id} onClick={()=>onSelectCategory(selected?'all':cat.id)} className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${selected?'border-emerald-600 bg-emerald-50 shadow-md':'border-slate-100 bg-white shadow-sm hover:border-emerald-200'}`}>
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf5ef] text-emerald-800 sm:h-14 sm:w-14">{cat.image?<img src={cat.image} alt={cat.name} className="h-full w-full object-cover"/>:<Icon className="h-6 w-6"/>}</span>
    <span className="min-w-0 flex-1"><span className="block line-clamp-2 text-xs font-black text-slate-900 sm:text-sm">{cat.name}</span><span className="mt-1 block text-[10px] font-medium text-slate-500">{count} products</span></span><ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700"/>
   </button>})}
  </div>
 </section>;
};
