import React from 'react';
import { Smartphone, Headphones, Shirt, Sparkles, Flame, Home, UtensilsCrossed, Watch, Building, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { db } from '../db/database';
import { Product } from '../types';
interface Props { selectedCategory:string|null; onSelectCategory:(id:string)=>void; products:Product[]; }
const ICONS:Record<string,React.ElementType>={Smartphone,Headphones,Shirt,Sparkles,Flame,Home,UtensilsCrossed,Watch,Building};
const COLORS=['bg-sky-100 text-sky-700','bg-pink-100 text-pink-700','bg-amber-100 text-amber-700','bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-orange-100 text-orange-700','bg-cyan-100 text-cyan-700','bg-rose-100 text-rose-700'];
export const CategoriesSection:React.FC<Props>=({selectedCategory,onSelectCategory,products})=>{
 const saved=db.getCategories();const categories=saved.length?saved:CATEGORIES;
 return <section id="categories-section" className="mx-auto my-6 w-full max-w-7xl px-3 sm:px-6">
  <div className="mb-4 flex items-end justify-between gap-2"><div><h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Shop by Category</h2><p className="mt-0.5 text-xs text-slate-500">Browse your favourite collections</p></div><button onClick={()=>onSelectCategory('all')} className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">See All <ArrowRight className="h-3.5 w-3.5"/></button></div>
  <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">{categories.map((cat,index)=>{const Icon=ICONS[cat.iconName]||Smartphone;const count=products.filter(p=>p.categoryId===cat.id||p.category===cat.id||p.category===cat.name).length;const selected=selectedCategory===cat.id;return <button key={cat.id} onClick={()=>onSelectCategory(selected?'all':cat.id)} className="group flex min-w-0 flex-col items-center text-center"><span className={`relative mb-2 flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-md transition group-hover:-translate-y-0.5 group-hover:shadow-lg sm:h-[72px] sm:w-[72px] ${COLORS[index%COLORS.length]} ${selected?'outline outline-2 outline-offset-2 outline-emerald-600':''}`}>{cat.image?<img src={cat.image} alt="" className="h-full w-full object-cover" onError={e=>{e.currentTarget.style.display='none';}}/>:<Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8}/>}</span><span className={`max-w-full text-[10px] font-extrabold leading-tight sm:text-xs ${selected?'text-emerald-700':'text-slate-800'}`}>{cat.name}</span><span className="mt-0.5 text-[9px] text-slate-400">{count} items</span></button>})}</div>
 </section>;
};
