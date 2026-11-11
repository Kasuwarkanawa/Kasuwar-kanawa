import React, { useState, useEffect } from 'react';
import { Megaphone, ChevronRight, Bell } from 'lucide-react';

const ANNOUNCEMENTS = [
  'Free delivery across Kano (Fagge, Kano Municipal, Nassarawa, Gwale, Dala, Tarauni) on orders over ₦25,000!',
  'Direct phone order line: 09060938835 | 07066300079 – Pay on Delivery available in Kano state.',
  'Ramadan & Sallah Early Bird Specials: Up to 50% discount on Kano Shadda, Kaftans & Arabian Oud.',
  'Daily Flash Sales updated live: Grab authentic electronics and smartphones before stock runs out!',
];

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#0B172E] via-[#1E293B] to-[#0B172E] text-white border-b border-pink-500/20 py-2 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#E6007E] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider animate-pulse">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcement</span>
          </div>
        </div>

        {/* Dynamic Rotating Announcement Text */}
        <div className="flex-1 overflow-hidden">
          <div
            key={currentIndex}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300 flex items-center gap-2 text-slate-200 font-medium truncate"
          >
            <Bell className="w-3.5 h-3.5 text-yellow-400 shrink-0 hidden sm:block" />
            <span className="truncate">{ANNOUNCEMENTS[currentIndex]}</span>
          </div>
        </div>

        {/* Right Call-to-Action Link */}
        <a
          href="#flash-sales-section"
          className="shrink-0 hidden md:flex items-center gap-1 text-[11px] font-bold text-pink-300 hover:text-white transition-colors"
        >
          <span>View Daily Deals</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
