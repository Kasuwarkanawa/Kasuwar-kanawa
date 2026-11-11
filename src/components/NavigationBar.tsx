import React, { useState } from 'react';
import {
  Home,
  LayoutGrid,
  Zap,
  Gift,
  Tag,
  ShoppingBag,
  User,
  ChevronDown,
} from 'lucide-react';
import { CATEGORIES } from '../data/products';

interface NavigationBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectCategory: (categoryId: string) => void;
  selectedCategory: string | null;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenDashboard?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  cartCount: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  setActiveTab,
  onSelectCategory,
  selectedCategory,
  onOpenCart,
  onOpenAccount,
  onOpenDashboard,
  mobileMenuOpen,
  setMobileMenuOpen,
  cartCount,
}) => {
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const handleNavClick = (tabId: string, sectionId?: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setCategoriesDropdownOpen(false);

    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-[#0B172E] text-white shadow-md relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Home Tab */}
            <button
              onClick={() => {
                onSelectCategory('all');
                handleNavClick('home');
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'home' && (!selectedCategory || selectedCategory === 'all')
                  ? 'bg-[#E6007E] text-white font-bold shadow-sm'
                  : 'hover:bg-white/10 text-slate-200'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* Categories Dropdown Tab */}
            <div
              className="relative"
              onMouseEnter={() => setCategoriesDropdownOpen(true)}
              onMouseLeave={() => setCategoriesDropdownOpen(false)}
            >
              <button
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-t-md transition-colors cursor-pointer ${
                  selectedCategory && selectedCategory !== 'all'
                    ? 'bg-[#E6007E]/30 text-pink-300'
                    : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-pink-400" />
                <span>Categories</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </button>

              {/* Mega / Dropdown Menu */}
              {categoriesDropdownOpen && (
                <div className="absolute top-full left-0 w-72 bg-white text-slate-900 rounded-b-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Browse Department</span>
                    <button
                      onClick={() => {
                        onSelectCategory('all');
                        setCategoriesDropdownOpen(false);
                      }}
                      className="text-[#E6007E] hover:underline normal-case cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        handleNavClick('category', 'categories-section');
                        setCategoriesDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-pink-50 flex items-center justify-between transition-colors cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-pink-50 text-[#E6007E] font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{cat.name}</span>
                        {cat.hausaName && (
                          <span className="text-[10px] text-slate-400">
                            {cat.hausaName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-normal">
                        {cat.itemCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Flash Sales Tab */}
            <button
              onClick={() => handleNavClick('flash-sales', 'flash-sales-section')}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'flash-sales'
                  ? 'bg-[#E6007E] text-white font-bold'
                  : 'hover:bg-white/10 text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>Flash Sales</span>
            </button>

            {/* Special Offers Tab */}
            <button
              onClick={() => handleNavClick('special-offers', 'special-offers-section')}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'special-offers'
                  ? 'bg-[#E6007E] text-white font-bold'
                  : 'hover:bg-white/10 text-slate-200'
              }`}
            >
              <Gift className="w-4 h-4 text-pink-400" />
              <span>Special Offers</span>
            </button>

            {/* Deals Tab */}
            <button
              onClick={() => handleNavClick('deals', 'discount-ads-section')}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-t-md transition-colors cursor-pointer ${
                activeTab === 'deals'
                  ? 'bg-[#E6007E] text-white font-bold'
                  : 'hover:bg-white/10 text-slate-200'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Deals</span>
            </button>
          </div>

          {/* Right Nav: Cart & Account */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs lg:text-sm font-semibold"
            >
              <ShoppingBag className="w-4 h-4 text-pink-400" />
              <span>My Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#E6007E] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs lg:text-sm font-semibold"
            >
              <User className="w-4 h-4 text-slate-300" />
              <span>Account</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-700/60 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold mb-3">
              <button
                onClick={() => {
                  onSelectCategory('all');
                  handleNavClick('home');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  activeTab === 'home' ? 'bg-[#E6007E] text-white' : 'bg-slate-800/80 text-slate-200'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNavClick('flash-sales', 'flash-sales-section')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 text-yellow-300 hover:bg-slate-700 cursor-pointer"
              >
                <Zap className="w-4 h-4 shrink-0 text-yellow-400 fill-yellow-400" />
                <span>Flash Sales</span>
              </button>

              <button
                onClick={() => handleNavClick('special-offers', 'special-offers-section')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 text-pink-300 hover:bg-slate-700 cursor-pointer"
              >
                <Gift className="w-4 h-4 shrink-0 text-pink-400" />
                <span>Special Offers</span>
              </button>

              <button
                onClick={() => handleNavClick('deals', 'discount-ads-section')}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 text-emerald-300 hover:bg-slate-700 cursor-pointer"
              >
                <Tag className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Deals</span>
              </button>
            </div>

            {/* Mobile Categories list */}
            <div className="border-t border-slate-800 pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Browse Categories
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      handleNavClick('category', 'categories-section');
                    }}
                    className={`text-left p-2 rounded text-xs transition-colors cursor-pointer truncate ${
                      selectedCategory === cat.id
                        ? 'bg-[#E6007E] text-white font-bold'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Account & Cart Quick Actions */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="flex items-center gap-2 text-xs text-slate-200 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <User className="w-4 h-4 text-pink-400" />
                <span>My Account</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="flex items-center gap-2 text-xs text-white py-1.5 px-3 rounded bg-[#E6007E] hover:bg-[#D00071] font-bold cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cart ({cartCount})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
