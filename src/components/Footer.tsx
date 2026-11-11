import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (catId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory }) => {
  return (
    <footer className="bg-[#0B172E] text-white pt-10 pb-6 border-t-4 border-[#E6007E] relative mt-16">
      {/* Decorative Ribbon Bar matching reference image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B172E] via-purple-950 to-[#0B172E] border border-pink-500/30 py-4 px-6 text-center shadow-lg">
          {/* Curved pink accent underlines */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <span className="text-yellow-400 text-lg sm:text-xl">★</span>
            <h2 className="text-base sm:text-2xl font-black italic tracking-wide text-white drop-shadow-sm">
              Kasuwar Kano – Arewa Sai Dan Arewa
            </h2>
            <span className="text-yellow-400 text-lg sm:text-xl">★</span>
          </div>
          <div className="w-48 sm:w-80 h-1 bg-gradient-to-r from-transparent via-[#E6007E] to-transparent mx-auto mt-2 rounded-full" />
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800 text-xs sm:text-sm">
        {/* Brand & Mission */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-black text-white">KASUWAR</span>
            <span className="text-xl font-black text-[#E6007E]">KANAWA</span>
          </div>
          <div className="inline-block bg-[#E6007E] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3">
            AREWA SAI DAN AREWA
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Leading northern digital marketplace connecting Kano merchants with customers nationwide.
            Authentic traditional fabrics, latest smartphones, home essentials, and Arabian perfumes.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Verified Northern Merchants</span>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-pink-300 mb-4">
            Popular Categories
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li>
              <button
                onClick={() => onSelectCategory('phones')}
                className="hover:text-[#E6007E] transition-colors cursor-pointer"
              >
                Smartphones & Tablets (Redmi, Samsung, Tecno)
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('shadda')}
                className="hover:text-[#E6007E] transition-colors cursor-pointer"
              >
                Kano Brocade Shadda & Kaftan Fabric
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('electronics')}
                className="hover:text-[#E6007E] transition-colors cursor-pointer"
              >
                Solar Standing Fans & Power Banks
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('perfumes')}
                className="hover:text-[#E6007E] transition-colors cursor-pointer"
              >
                Arabian Royal Oud & Turaren Wuta
              </button>
            </li>
            <li>
              <button
                onClick={() => onSelectCategory('fashion')}
                className="hover:text-[#E6007E] transition-colors cursor-pointer"
              >
                Kano Royal Leather Slippers & Caps
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Support & Kano Hub */}
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-pink-300 mb-4">
            Customer Support
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-[#E6007E] shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-white">Direct Hotlines:</span>
                <a href="tel:09060938835" className="hover:underline text-slate-200">
                  09060938835
                </a>
                <span className="mx-1">/</span>
                <a href="tel:07066300079" className="hover:underline text-slate-200">
                  07066300079
                </a>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-[#E6007E] shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-white">Email Desk:</span>
                <a href="mailto:wizardmaster979@gmail.com" className="hover:underline text-slate-200">
                  wizardmaster979@gmail.com
                </a>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#E6007E] shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-white">Main Fulfillment Center:</span>
                <span>Kano Municipal & Fagge Commercial Center, Kano State</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Fast Delivery Kano LGAs */}
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-pink-300 mb-4">
            Kano Fast Delivery Zones
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Same-day and next-day express motorcycle delivery dispatched to:
          </p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              'Fagge',
              'Kano Municipal',
              'Nassarawa GRA',
              'Dala',
              'Gwale',
              'Tarauni',
              'Kumbotso',
              'Ungogo',
              'Sabon Gari',
              'Kasuwar Kwari',
            ].map((lga, i) => (
              <span
                key={i}
                className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700"
              >
                {lga}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright & Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <p>
          © {new Date().getFullYear()} KASUWAR KANAWA. All rights reserved. Arewa Sai Dan Arewa.
        </p>
        <p className="flex items-center gap-1">
          <span>Crafted with pride for Kano & Northern Nigeria</span>
          <Heart className="w-3.5 h-3.5 text-[#E6007E] fill-[#E6007E]" />
        </p>
      </div>
    </footer>
  );
};
