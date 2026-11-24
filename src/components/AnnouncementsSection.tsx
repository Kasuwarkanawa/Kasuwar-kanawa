import React, { useState } from 'react';
import { Megaphone, Sparkles, AlertCircle, Info, X } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ announcements }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Show only the first published announcement. The homepage has one broadcast strip,
  // not a second rotating/static announcement bar.
  const current = announcements[0];

  if (isDismissed || !current) return null;

  const palette = current.type === 'alert'
    ? { shell: 'from-rose-950 via-red-900 to-orange-900', badge: 'bg-rose-500 text-white', glow: 'bg-orange-300/20', text: 'text-rose-50', label: 'IMPORTANT ALERT' }
    : current.type === 'discount'
    ? { shell: 'from-fuchsia-950 via-pink-800 to-amber-700', badge: 'bg-amber-300 text-fuchsia-950', glow: 'bg-yellow-200/20', text: 'text-pink-50', label: 'SPECIAL OFFER' }
    : current.type === 'event'
    ? { shell: 'from-violet-950 via-purple-800 to-indigo-700', badge: 'bg-violet-300 text-violet-950', glow: 'bg-sky-200/20', text: 'text-violet-50', label: 'MARKET EVENT' }
    : { shell: 'from-sky-950 via-blue-900 to-cyan-800', badge: 'bg-cyan-300 text-sky-950', glow: 'bg-white/15', text: 'text-sky-50', label: 'ANNOUNCEMENT' };

  const TypeIcon = current.type === 'alert' ? AlertCircle : current.type === 'discount' ? Sparkles : current.type === 'event' ? Megaphone : Info;

  return (
    <section className="w-full px-0 sm:px-4 py-2" aria-label="Live marketplace broadcast">
      <style>{`
        @keyframes kasuwarBroadcastMarquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .kasuwar-broadcast-track {
          display: inline-flex;
          align-items: center;
          min-width: max-content;
          white-space: nowrap;
          animation: kasuwarBroadcastMarquee 24s linear infinite;
          will-change: transform;
        }
        .kasuwar-broadcast-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .kasuwar-broadcast-track { animation: none; white-space: normal; min-width: 0; }
        }
      `}</style>
      <div className={`relative flex min-h-[58px] items-center gap-3 overflow-hidden border-y border-white/15 bg-gradient-to-r ${palette.shell} px-3 py-3 text-white shadow-lg sm:rounded-2xl sm:border`}>
        <div className={`pointer-events-none absolute -right-5 -top-10 h-28 w-28 rounded-full blur-2xl ${palette.glow}`} />
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider shadow-md sm:text-xs ${palette.badge}`}>
            <Megaphone className="h-4 w-4" />
            <span className="hidden xs:inline">LIVE</span>
            <span>{palette.label}</span>
          </span>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className={`kasuwar-broadcast-track gap-4 text-sm font-bold sm:text-base ${palette.text}`}>
            <span className="font-black">{current.title}</span>
            <span className="opacity-80">✦</span>
            <span>{current.description}</span>
            <span className="opacity-80">✦</span>
            <span className="font-black">{current.title}</span>
            <span className="opacity-80">✦</span>
            <span>{current.description}</span>
          </div>
        </div>
        <button type="button" onClick={() => setIsDismissed(true)} className="relative z-10 shrink-0 rounded-full bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white" title="Dismiss broadcast" aria-label="Dismiss broadcast">
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
