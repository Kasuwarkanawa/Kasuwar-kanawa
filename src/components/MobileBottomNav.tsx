import React from 'react';
import { Home, ShoppingCart, MessageCircle, UserRound } from 'lucide-react';

interface Props {
  onHome: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

const itemBase = "flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-all active:scale-95";
const iconBase = "flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5";

export const MobileBottomNav: React.FC<Props> = ({ onHome, onOpenCart, onOpenAccount }) => (
  <nav aria-label="Mobile quick navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-emerald-100 bg-gradient-to-r from-white via-[#fffdf7] to-[#f1faf3] px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-10px_32px_rgba(13,72,42,.16)] backdrop-blur-xl md:hidden">
    <button onClick={onHome} className={itemBase + " text-[#13622B]"}>
      <span className={iconBase + " bg-gradient-to-br from-[#d8f5df] to-[#a9e6ba] text-[#13622B]"}><Home className="h-6 w-6 fill-white/60 stroke-[2.5]" /></span>
      <span className="text-[11px] font-extrabold">Home</span>
    </button>
    <button onClick={onOpenCart} className={itemBase + " text-[#a45b08]"}>
      <span className={iconBase + " bg-gradient-to-br from-[#fff0c7] to-[#ffd98a] text-[#9a5a05]"}><ShoppingCart className="h-6 w-6 stroke-[2.5]" /></span>
      <span className="text-[11px] font-bold">Cart</span>
    </button>
    <a href="https://wa.me/2349060938835" target="_blank" rel="noreferrer" className={itemBase + " text-[#137c67]"}>
      <span className={iconBase + " bg-gradient-to-br from-[#d8f8ee] to-[#a6ead7] text-[#087a62]"}><MessageCircle className="h-6 w-6 stroke-[2.5]" /></span>
      <span className="text-[11px] font-bold">Chat</span>
    </a>
    <button onClick={onOpenAccount} className={itemBase + " text-[#8051a4]"}>
      <span className={iconBase + " bg-gradient-to-br from-[#f0e3ff] to-[#d9c0f7] text-[#70409a]"}><UserRound className="h-6 w-6 stroke-[2.5]" /></span>
      <span className="text-[11px] font-bold">Account</span>
    </button>
  </nav>
);
