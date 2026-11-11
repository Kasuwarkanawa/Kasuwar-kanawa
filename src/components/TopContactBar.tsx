import React from 'react';
import { Phone, Mail, CheckCircle2 } from 'lucide-react';

export const TopContactBar: React.FC = () => {
  return (
    <div className="bg-[#E6007E] text-white text-xs sm:text-sm font-medium py-1.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Phone numbers */}
        <div className="flex items-center gap-2 flex-wrap">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <a
            href="tel:09060938835"
            className="hover:underline font-semibold tracking-wide"
          >
            09060938835
          </a>
          <span className="opacity-80">|</span>
          <a
            href="tel:07066300079"
            className="hover:underline font-semibold tracking-wide"
          >
            07066300079
          </a>
        </div>

        {/* Center / Right: Email & 24/7 Availability badge */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <a
              href="mailto:wizardmaster979@gmail.com"
              className="hover:underline text-xs sm:text-sm"
            >
              wizardmaster979@gmail.com
            </a>
          </div>

          <div className="bg-[#00C853] text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 fill-white text-[#00C853]" />
            <span>24/7 Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};
