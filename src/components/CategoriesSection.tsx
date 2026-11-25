import React from 'react';
import { Smartphone, Headphones, Shirt, Sparkles, Flame, Home, UtensilsCrossed, Watch, Building, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { db } from '../db/database';
import { Product } from '../types';
interface Props { selectedCategory:string|null; onSelectCategory:(id:string)=>void; products:Product[]; }
const ICONS:Record<string,React.ElementType>={Smartphone,Headphones,Shirt,Sparkles,Flame,Home,UtensilsCrossed,Watch,Building};
const COLORS=['bg-sky-100 text-sky-700','bg-pink-100 text-pink-700','bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700'];
export const CategoriesSection:React.FC<Props>=({selectedCategory,onSelectCategory,products})=>{
 const saved=db.getCategories();const all=saved.length?saved:CATEGORIES;
 const pick=(keys:string[],fallback:number)=>all.find(c=>keys.some(k=>`${c.id} ${c.name}`.toLowerCase().includes(k)))||all[fallback];
 const categories=[pick(['phone','mobile'],0),pick(['fashion','shadda','clothing','apparel'],3),pick(['home','kitchen'],5),pick(['beauty','health','perfume'],4)];
 const unique=categories.filter((c,i)=>c&&categories.findIndex(x=>x?.id===c.id)===i).slice(0,4);
 return <section id="categories-section" className="mx-auto my-4 w-full max-w-7xl px-3 sm:px-6">
  <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-base font-black tracking-tight text-slate-900 sm:text-xl">Shop by Category</h2><button onClick={()=>onSelectCategory('all')} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 sm:text-xs">See All <ArrowRight className="h-3.5 w-3.5"/></button></div>
  <div className="grid grid-cols-4 gap-2 sm:gap-4">{unique.map((cat,index)=>{const Icon=ICONS[cat.iconName]||Smartphone;const count=products.filter(p=>p.categoryId===cat.id||p.category===cat.id||p.category===cat.name).length;const selected=selectedCategory===cat.id;return <button key={cat.id} onClick={()=>onSelectCategory(selected?'all':cat.id)} className="group flex min-w-0 flex-col items-center text-center"><span className={`mb-1.5 flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-md sm:h-[76px] sm:w-[76px] ${COLORS[index%COLORS.length]} ${selected?'outline outline-2 outline-offset-2 outline-emerald-600':''}`}>{cat.image?<img src={cat.image} alt={cat.name} className="h-full w-full object-cover"/>:<Icon className="h-6 w-6 sm:h-8 sm:w-8"/>}</span><span className="line-clamp-2 text-[9px] font-extrabold leading-tight text-slate-800 sm:text-xs">{cat.name}</span><span className="mt-0.5 text-[8px] text-slate-400 sm:text-[10px]">{count} items</span></button>})}</div>
 </section>;
};
