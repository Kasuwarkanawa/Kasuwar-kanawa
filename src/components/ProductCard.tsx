import React, { useState } from 'react';
import { Star, ShoppingCart, Zap, Check, Eye, BadgeCheck, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
import { ImagePreview } from './ImagePreview';

interface ProductCardProps { product:Product; onAddToCart:(product:Product)=>void; onBuyNow:(product:Product)=>void; onViewDetails?:(product:Product)=>void; compact?:boolean; }
export const ProductCard:React.FC<ProductCardProps>=({product,onAddToCart,onBuyNow,onViewDetails,compact=false})=>{
 const [imageError,setImageError]=useState(false); const [previewOpen,setPreviewOpen]=useState(false); const [addedAnimation,setAddedAnimation]=useState(false);
 const isOutOfStock=product.stockQuantity===0||product.stockLeft===0||product.inStock===false;
 const handleAdd=(e:React.MouseEvent)=>{e.stopPropagation();if(product.colors?.length){onViewDetails?.(product);return;}onAddToCart(product);setAddedAnimation(true);setTimeout(()=>setAddedAnimation(false),1200);};
 const handleBuy=(e:React.MouseEvent)=>{e.stopPropagation();if(product.colors?.length){onViewDetails?.(product);return;}onBuyNow(product);};
 return <article onClick={()=>onViewDetails?.(product)} className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_16px_rgba(15,45,30,.045)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_14px_34px_rgba(15,75,45,.12)]">
  <div className={`relative w-full overflow-hidden bg-[#f5f7f3] ${compact?'aspect-[4/3]':'aspect-square'}`}>
   {product.discountPercentage>0&&<span className="absolute left-2 top-2 z-10 rounded-md bg-[#b83b32] px-2 py-1 text-[9px] font-black text-white shadow sm:text-[10px]">-{product.discountPercentage}%</span>}
   {product.isNew&&<span className="absolute right-2 top-2 z-10 rounded-md bg-[#e7c56f] px-2 py-1 text-[9px] font-black text-[#183c2c]">NEW</span>}
   {product.badge&&!product.isNew&&<span className="absolute right-2 top-2 z-10 rounded-md bg-[#0b5639] px-2 py-1 text-[9px] font-black text-white">{product.badge}</span>}
   {!imageError?<img src={product.image} alt={product.name} referrerPolicy="no-referrer" onError={()=>setImageError(true)} loading="lazy" onClick={e=>{e.stopPropagation();setPreviewOpen(true);}} className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.04]"/>:<div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><ShoppingCart className="h-8 w-8"/><span className="px-2 text-center text-[10px] font-bold">{product.name}</span></div>}
   <button type="button" onClick={e=>{e.stopPropagation();setPreviewOpen(true);}} className="absolute bottom-2 right-2 rounded-full bg-white/95 p-2 text-slate-700 shadow-md transition hover:text-emerald-700" aria-label="View full image"><Eye className="h-4 w-4"/></button>
   {product.sellerVerified&&<span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[8px] font-black text-emerald-800 shadow sm:text-[9px]"><BadgeCheck className="h-3 w-3"/> Verified seller</span>}
  </div>
  <div className="flex flex-1 flex-col p-2.5 sm:p-3">
   <h3 className="line-clamp-2 min-h-[2.3em] text-[11px] font-bold leading-snug text-slate-800 transition group-hover:text-emerald-800 sm:text-sm" title={product.name}>{product.name}</h3>
   <div className="mt-1.5 flex items-center gap-1"><div className="flex items-center text-amber-400">{[...Array(5)].map((_,i)=><Star key={i} className={`h-3 w-3 ${i<Math.floor(product.rating)?'fill-amber-400 text-amber-400':i<product.rating?'fill-amber-200 text-amber-400':'text-slate-200'}`}/>)}</div><span className="text-[9px] font-bold text-slate-600">{product.rating||'New'}</span><span className="text-[9px] text-slate-400">({product.reviewsCount||0})</span></div>
   <div className="mt-2 flex flex-wrap items-baseline gap-1.5"><span className="text-sm font-black tracking-tight text-[#0b5136] sm:text-base">{formatPrice(product.price)}</span>{product.originalPrice>product.price&&<span className="text-[10px] text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>}</div>
   <div className="mt-1 text-[9px] font-semibold">{isOutOfStock?<span className="text-red-600">Out of stock</span>:product.sellerActive?<span className="text-emerald-700">Seller active</span>:<span className="text-slate-400">Available to order</span>}</div>
   {!compact&&<div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
    <button onClick={handleAdd} disabled={isOutOfStock} className="inline-flex min-w-0 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-1.5 py-2 text-[10px] font-extrabold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-40">{addedAnimation?<><Check className="h-3.5 w-3.5"/> Added</>:<><ShoppingCart className="h-3.5 w-3.5"/> Add</>}</button>
    <button onClick={handleBuy} disabled={isOutOfStock} className="inline-flex min-w-0 items-center justify-center gap-1 rounded-lg bg-[#0b5639] px-1.5 py-2 text-[10px] font-extrabold text-white transition hover:bg-[#073d2c] disabled:opacity-40"><Zap className="h-3.5 w-3.5"/> Buy now</button>
   </div>}
  </div>
  <ImagePreview src={product.image} alt={product.name} isOpen={previewOpen} onClose={()=>setPreviewOpen(false)}/>
 </article>;
};
