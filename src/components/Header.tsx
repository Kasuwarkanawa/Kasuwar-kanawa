import React, { useState } from 'react';
import { Search, ShoppingBag, User as UserIcon, Menu, X, LogOut, Package, Shield, Store } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenDashboard: () => void;
  onOpenSellerDashboard?: () => void;
  onOpenAdminPanel?: () => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  cartCount,
  cartTotal,
  onOpenCart,
  currentUser,
  onOpenAuth,
  onOpenDashboard,
  onOpenSellerDashboard,
  onOpenAdminPanel,
  onLogout,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-100 shadow-xs relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-3 md:gap-8">
          {/* Logo Brand Lockup */}
          <a
            href="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 group focus:outline-hidden"
          >
            {/* Shopping Cart Icon with speed trails */}
            <div className="relative flex items-center justify-center">
              <svg
                viewBox="0 0 100 80"
                className="w-10 h-8 sm:w-12 sm:h-10 text-[#E6007E]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Speed lines */}
                <line x1="2" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="8" y1="32" x2="26" y2="32" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="4" y1="46" x2="20" y2="46" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                {/* Cart Body */}
                <path
                  d="M26 18H38L48 54H82L92 24H32"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Cart Wheels */}
                <circle cx="50" cy="68" r="6" fill="currentColor" />
                <circle cx="78" cy="68" r="6" fill="currentColor" />
                {/* Inner grid */}
                <line x1="44" y1="28" x2="48" y2="44" stroke="currentColor" strokeWidth="3" />
                <line x1="60" y1="26" x2="62" y2="46" stroke="currentColor" strokeWidth="3" />
                <line x1="74" y1="26" x2="74" y2="46" stroke="currentColor" strokeWidth="3" />
              </svg>

              {/* Kano Minarets Graphic */}
              <div className="hidden xs:flex items-end -ml-1 text-amber-700">
                <svg
                  viewBox="0 0 60 70"
                  className="w-8 h-10 sm:w-10 sm:h-12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Left Minaret */}
                  <rect x="10" y="24" width="10" height="42" fill="#D97706" rx="2" />
                  <path d="M7 24L15 6L23 24H7Z" fill="#B45309" />
                  <circle cx="15" cy="5" r="2.5" fill="#F59E0B" />
                  <rect x="13" y="32" width="4" height="7" rx="2" fill="#78350F" />
                  <rect x="13" y="46" width="4" height="7" rx="2" fill="#78350F" />

                  {/* Main Central Palace Dome / Tower */}
                  <rect x="24" y="16" width="16" height="50" fill="#F59E0B" rx="3" />
                  <path d="M21 16L32 2L43 16H21Z" fill="#D97706" />
                  <circle cx="32" cy="2" r="3" fill="#FDE047" />
                  <rect x="29" y="26" width="6" height="10" rx="3" fill="#78350F" />
                  <rect x="29" y="44" width="6" height="10" rx="3" fill="#78350F" />

                  {/* Right Minaret */}
                  <rect x="43" y="28" width="9" height="38" fill="#D97706" rx="2" />
                  <path d="M40 28L47.5 12L55 28H40Z" fill="#B45309" />
                  <circle cx="47.5" cy="11" r="2" fill="#F59E0B" />
                  <rect x="46" y="36" width="3" height="6" rx="1.5" fill="#78350F" />

                  {/* Base foliage */}
                  <path d="M5 66C15 62 45 62 55 66V70H5V66Z" fill="#15803D" />
                </svg>
              </div>
            </div>

            {/* Typography */}
            <div className="flex flex-col">
              <div className="flex items-center tracking-tight leading-none">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#0B172E]">
                  KASUWAR&nbsp;
                </span>
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#E6007E]">
                  KANAWA
                </span>
              </div>
              {/* Slogan Banner with Pink Accents */}
              <div className="flex items-center gap-1 mt-0.5">
                <svg className="w-3.5 h-2 text-[#E6007E]" viewBox="0 0 20 10" fill="currentColor">
                  <path d="M20 5C14 5 10 9 0 10C8 8 12 4 14 0C15 3 17 4.5 20 5Z" />
                </svg>
                <div className="bg-[#0B172E] text-white text-[9px] sm:text-[11px] font-extrabold tracking-wider px-2 sm:px-3 py-0.5 rounded-full uppercase shadow-xs">
                  AREWA SAI DAN AREWA
                </div>
                <svg className="w-3.5 h-2 text-[#E6007E] scale-x-[-1]" viewBox="0 0 20 10" fill="currentColor">
                  <path d="M20 5C14 5 10 9 0 10C8 8 12 4 14 0C15 3 17 4.5 20 5Z" />
                </svg>
              </div>
            </div>
          </a>

          {/* Search Bar (Desktop & Tablet) */}
          <form
            onSubmit={onSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center relative"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search for products here..."
                className="w-full pl-11 pr-28 py-2.5 bg-white border-2 border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#E6007E] focus:ring-2 focus:ring-[#E6007E]/20 transition-all shadow-xs"
              />
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-6 bg-[#E6007E] hover:bg-[#D00071] active:scale-95 text-white font-bold text-sm rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Action Icons: Account & Cart + Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Account Dropdown Container */}
            <div
              className="relative hidden sm:block"
              onMouseEnter={() => setAccountMenuOpen(true)}
              onMouseLeave={() => setAccountMenuOpen(false)}
            >
              <button
                onClick={() => {
                  if (currentUser) {
                    if (currentUser.accountType === 'seller' && onOpenSellerDashboard) {
                      onOpenSellerDashboard();
                    } else if (currentUser.accountType === 'admin' && onOpenAdminPanel) {
                      onOpenAdminPanel();
                    } else {
                      onOpenDashboard();
                    }
                  } else {
                    onOpenAuth('login');
                  }
                }}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors text-slate-700 hover:text-[#0B172E] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-[#E6007E] font-black text-xs">
                  {currentUser ? currentUser.fullName.slice(0, 1) : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="text-left text-xs">
                  <span className="block text-slate-400 text-[10px] leading-tight">
                    {currentUser ? `Hi, ${currentUser.fullName.split(' ')[0]}` : 'Welcome'}
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentUser ? `${currentUser.accountType.toUpperCase()} ▾` : 'Sign In / Register ▾'}
                  </span>
                </div>
              </button>

              {/* Account Dropdown Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100">
                        <span className="font-extrabold text-slate-900 block truncate">{currentUser.fullName}</span>
                        {currentUser.businessName && (
                          <span className="font-bold text-[#0B172E] text-[11px] block truncate">
                            {currentUser.businessName}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px] block truncate">{currentUser.email}</span>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          currentUser.accountType === 'seller'
                            ? 'bg-emerald-100 text-emerald-700'
                            : currentUser.accountType === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-[#E6007E]'
                        }`}>
                          {currentUser.accountType}
                        </span>
                      </div>

                      {/* SELLER SPECIFIC MENU ITEMS */}
                      {currentUser.accountType === 'seller' && (
                        <>
                          <button
                            onClick={() => {
                              setAccountMenuOpen(false);
                              if (onOpenSellerDashboard) onOpenSellerDashboard();
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-pink-50 text-[#E6007E] font-black flex items-center gap-2 cursor-pointer bg-pink-50/50"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Seller Dashboard (Kayayyaki & Orders)</span>
                          </button>
                        </>
                      )}

                      {/* ADMIN SPECIFIC MENU ITEMS */}
                      {currentUser.accountType === 'admin' && (
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            if (onOpenAdminPanel) onOpenAdminPanel();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-black flex items-center gap-2 cursor-pointer bg-blue-50/50"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Super Admin CPanel Control</span>
                        </button>
                      )}

                      {/* BUYER DASHBOARD & ORDERS */}
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenDashboard();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#E6007E] font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Buyer Dashboard & Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenDashboard();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#E6007E] font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>My Orders & Tracking</span>
                      </button>

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenAuth('login');
                        }}
                        className="w-full py-2 bg-[#E6007E] hover:bg-[#D00071] text-white font-bold text-center rounded-xl cursor-pointer"
                      >
                        Buyer & Seller Login
                      </button>

                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onOpenAuth('register');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center rounded-xl cursor-pointer"
                      >
                        Register (Buyer or Seller)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-200 text-[#E6007E] cursor-pointer group"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#E6007E] transition-transform group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#E6007E] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="block text-pink-600 text-[10px] leading-tight">My Cart</span>
                <span className="font-bold text-[#0B172E]">
                  ₦{cartTotal.toLocaleString()}
                </span>
              </div>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:text-[#E6007E] hover:bg-slate-100 cursor-pointer focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#E6007E]" />
              ) : (
                <Menu className="w-6 h-6 text-[#E6007E]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={onSearchSubmit} className="mt-2.5 md:hidden">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for products here..."
              className="w-full pl-10 pr-24 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#E6007E]"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 bg-[#E6007E] text-white font-bold text-xs rounded-full hover:bg-[#D00071]"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </header>
  );
};
