import React from 'react';
import { Phone, Mail, CheckCircle2 } from 'lucide-react';

export const TopContactBar: React.FC = () => (
  <div className="bg-[#087A35] px-3 py-1.5 text-xs font-medium text-white sm:px-6 sm:text-sm">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Phone className="h-3.5 w-3.5 shrink-0" />
        <a href="tel:09060938835" className="font-semibold tracking-wide hover:underline">09060938835</a>
        <span className="opacity-80">|</span>
        <a href="tel:07066300079" className="font-semibold tracking-wide hover:underline">07066300079</a>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /><a href="mailto:wizardmaster979@gmail.com" className="hover:underline">wizardmaster979@gmail.com</a></div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold shadow-sm"><CheckCircle2 className="h-3.5 w-3.5" />24/7 Available</div>
      </div>
    </div>
  </div>
);
