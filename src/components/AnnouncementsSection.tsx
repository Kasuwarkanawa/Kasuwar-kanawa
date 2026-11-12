import React, { useState, useEffect } from 'react';
import { Megaphone, Sparkles, AlertCircle, Info, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ announcements }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (isDismissed || announcements.length === 0) return null;

  const current = announcements[currentIndex] || announcements[0];

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'discount':
        return (
          <span className="bg-[#E6007E] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3" /> Special Offer
          </span>
        );
      case 'alert':
        return (
          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <AlertCircle className="w-3 h-3" /> Important
          </span>
        );
      case 'event':
        return (
          <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Megaphone className="w-3 h-3" /> Market Event
          </span>
        );
      default:
        return (
          <span className="bg-[#0B172E] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Info className="w-3 h-3" /> Announcement
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0 px-3 sm:px-6 pt-3 pb-1">
      <div className="relative min-w-0 max-w-full overflow-hidden rounded-xl bg-gradient-to-r from-pink-50 via-white to-blue-50 border border-pink-200/90 shadow-xs p-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 transition-all">
        {/* Left Icon and Content */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-[#E6007E]/10 text-[#E6007E] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 animate-bounce" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0 sm:shrink-0">
              <div className="shrink-0">{getTypeBadge(current.type)}</div>
              <h4 className="min-w-0 flex-1 sm:flex-initial font-extrabold text-xs sm:text-sm text-[#0B172E] truncate">
                {current.title}
              </h4>
            </div>
            <p className="min-w-0 text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:truncate font-medium">
              {current.description}
            </p>
          </div>
        </div>

        {/* Navigation Controls if multiple */}
        <div className="flex items-center gap-1 shrink-0">
          {announcements.length > 1 && (
            <div className="flex items-center gap-0.5 text-slate-400 mr-1">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                className="p-1 hover:text-[#0B172E] cursor-pointer"
                title="Previous Announcement"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                {currentIndex + 1}/{announcements.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                className="p-1 hover:text-[#0B172E] cursor-pointer"
                title="Next Announcement"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            title="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
