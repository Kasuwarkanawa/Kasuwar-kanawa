import React from 'react';
import { Home, ShoppingCart, MessageCircle, UserRound } from 'lucide-react';

interface Props {
  onHome: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({ onHome, onOpenCart, onOpenAccount }) => (
  <nav aria-label="Mobile quick navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-5px_22px_rgba(15,23,42,0.10)] backdrop-blur md:hidden">
    <button onClick={onHome} className="flex flex-col items-center gap-1 py-1 text-emerald-700"><Home className="h-5 w-5 fill-emerald-100" /><span className="text-[10px] font-bold">Home</span></button>
    <button onClick={onOpenCart} className="flex flex-col items-center gap-1 py-1 text-slate-700"><ShoppingCart className="h-5 w-5" /><span className="text-[10px] font-semibold">Cart</span></button>
    <a href="https://wa.me/2349060938835" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 py-1 text-slate-700"><MessageCircle className="h-5 w-5" /><span className="text-[10px] font-semibold">Chat</span></a>
    <button onClick={onOpenAccount} className="flex flex-col items-center gap-1 py-1 text-slate-700"><UserRound className="h-5 w-5" /><span className="text-[10px] font-semibold">Account</span></button>
  </nav>
);
