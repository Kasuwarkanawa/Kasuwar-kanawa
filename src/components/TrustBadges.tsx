import React from 'react';
import { ShieldCheck, Wallet, Truck, Headset } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: ShieldCheck,
      title: 'Secure Shopping',
      subtitle: 'Shop with Confidence',
      iconColor: 'text-[#00C853]',
      bgAccent: 'bg-emerald-50 border-emerald-100',
    },
    {
      icon: Wallet,
      title: 'Multiple Payments',
      subtitle: 'Pay Your Way',
      iconColor: 'text-sky-600',
      bgAccent: 'bg-sky-50 border-sky-100',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      subtitle: 'Get It Fast in Kano',
      iconColor: 'text-[#0B172E]',
      bgAccent: 'bg-slate-50 border-slate-200',
    },
    {
      icon: Headset,
      title: '24/7 Support',
      subtitle: "We're Always Here",
      iconColor: 'text-[#E6007E]',
      bgAccent: 'bg-pink-50 border-pink-100',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div
              key={index}
              className={`p-3.5 sm:p-4 rounded-2xl border ${badge.bgAccent} shadow-xs hover:shadow-md transition-shadow flex items-center gap-3 bg-white`}
            >
              <div className={`p-2.5 rounded-xl ${badge.bgAccent} shrink-0`}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${badge.iconColor}`} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#0B172E] truncate">
                  {badge.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate font-medium">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
