import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Sparkles, ShieldCheck, Bell } from 'lucide-react';
import { db } from '../db/database';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    setTimeout(() => {
      const res = db.subscribeNewsletter(email);
      setIsSubmitting(false);
      setStatusMessage(res.message);
      setIsSuccess(res.success);
      if (res.success) {
        setEmail('');
      }
    }, 300);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 my-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B172E] via-[#102246] to-[#0B172E] p-6 sm:p-10 border border-slate-800 shadow-xl text-white">
        
        {/* Background Decorative Circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#E6007E]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Text Content */}
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#E6007E]" />
              <span>Arewa Market Updates</span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white">
              Never Miss Kano Market Deals & Special Offers
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              Ku Sami Sabbin Rangwame & Sanarwar Kasuwar Kanawa Kai Tsaye. Get weekly price drops from Kasuwar Kwari, Singa, Kurmi, and Farm Center delivered to your inbox.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mt-4 text-[11px] text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-pink-400" />
                <span>Instant Flash Sale Alerts</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Spam Guarantee</span>
              </span>
            </div>
          </div>

          {/* Right Form Box */}
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-[#0B172E] placeholder:text-slate-400 rounded-xl border border-white/20 focus:border-[#E6007E] focus:outline-hidden transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 bg-[#E6007E] hover:bg-pink-700 active:bg-pink-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Feedback Message */}
            {statusMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
