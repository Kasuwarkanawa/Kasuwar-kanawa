import React from 'react';
import { TrendingUp, Flame, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface PopularProductsSectionProps { products:Product[]; onAddToCart:(product:Product)=>void; onBuyNow:(product:Product)=>void; onViewDetails?:(product:Product)=>void; }
export const PopularProductsSection:React.FC<PopularProductsSectionProps>=({products,onAddToCart,onBuyNow,onViewDetails})=>{
 if(!products.length)return null;
 return <section id="popular-products-section" className="mx-auto my-10 w-full max-w-[1440px] px-3 sm:px-6">
  <div className="mb-5 flex items-end justify-between gap-3">
   <div><div className="mb-1 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-700"><TrendingUp className="h-4 w-4"/> Trending in the marketplace</div><h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Popular products</h2><p className="mt-1 text-xs text-slate-500">Discover items shoppers are checking out</p></div>
   <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-800"><Flame className="h-4 w-4"/> Popular picks</span>
  </div>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{products.map(product=><ProductCard compact key={product.id} product={product} onAddToCart={onAddToCart} onBuyNow={onBuyNow} onViewDetails={onViewDetails}/>)}</div>
 </section>;
};
