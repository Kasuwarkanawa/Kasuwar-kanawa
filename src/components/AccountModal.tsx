import React, { useState } from 'react';
import { X, User, Phone, MapPin, Package, Heart, LogOut } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0B172E] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E6007E] text-white flex items-center justify-center font-bold text-base shadow-xs">
              UK
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Usman Kano</h3>
              <p className="text-xs text-pink-200">usmannafiu46688@gmail.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 text-xs font-bold bg-slate-50">
          <button
            onClick={() => setTab('profile')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'profile'
                ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'orders'
                ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders (2)
          </button>
          <button
            onClick={() => setTab('wishlist')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'wishlist'
                ? 'bg-white text-[#E6007E] border-b-2 border-[#E6007E]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Items
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs text-slate-700 space-y-4">
          {tab === 'profile' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#E6007E]" />
                <div>
                  <span className="block text-[10px] text-slate-400">Phone Number</span>
                  <span className="font-bold text-slate-900">09060938835</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#E6007E]" />
                <div>
                  <span className="block text-[10px] text-slate-400">Default Delivery Address</span>
                  <span className="font-bold text-slate-900">
                    No. 14 Bompai Road, Nassarawa GRA, Kano
                  </span>
                </div>
              </div>

              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                <span className="text-xs font-bold text-[#E6007E] block mb-1">
                  Arewa VIP Club Member
                </span>
                <span className="text-[11px] text-slate-600">
                  Enjoy priority dispatch in Kano Municipal, Fagge & Dala.
                </span>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-slate-900">#KN-842910</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Delivered
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">Redmi Note 12 (128GB)</div>
                <div className="flex justify-between mt-1 text-[11px]">
                  <span className="text-slate-400">Nov 8, 2026</span>
                  <span className="font-black text-[#0B172E]">₦195,000</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-slate-900">#KN-791044</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    In Transit
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">Kano Brocade Shadda VIP (5 Yds)</div>
                <div className="flex justify-between mt-1 text-[11px]">
                  <span className="text-slate-400">Nov 9, 2026</span>
                  <span className="font-black text-[#0B172E]">₦48,000</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'wishlist' && (
            <div className="text-center py-6 text-slate-500">
              <Heart className="w-8 h-8 text-pink-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No saved items yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click on any product to bookmark for later.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Close Account View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
