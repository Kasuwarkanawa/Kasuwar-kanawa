import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TopContactBar } from './components/TopContactBar';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { MainPromotionalBanner } from './components/MainPromotionalBanner';
import { TrustBadges } from './components/TrustBadges';
import { CategoriesSection } from './components/CategoriesSection';
import { FlashSalesSection } from './components/FlashSalesSection';
import { SpecialOffersSection } from './components/SpecialOffersSection';
import { DiscountAdvertisements } from './components/DiscountAdvertisements';
import { PopularProductsSection } from './components/PopularProductsSection';
import { NewProductsSection } from './components/NewProductsSection';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Footer } from './components/Footer';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { ProductCard } from './components/ProductCard';
import { PRODUCTS } from './data/products';
import { CartItem, Product, User, Order, FlashSale, PromotionalAdvertisement, Announcement } from './types';
import { db } from './db/database';
import { CheckCircle2, Search, X, Shield, Store, UserCheck, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic products list (only approved products appear on public marketplace)
  const [liveProducts, setLiveProducts] = useState<Product[]>(() =>
    db.getProducts({ approvedOnly: true })
  );

  // Phase 7: Live Flash Sales, Promotional Advertisements & Announcements from Database
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSale | null>(() => db.getActiveFlashSale());
  const [activePromotions, setActivePromotions] = useState<PromotionalAdvertisement[]>(() => db.getActivePromotionalAds());
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<Announcement[]>(() => db.getPublishedAnnouncements());

  const refreshLiveProducts = useCallback(() => {
    setLiveProducts(db.getProducts({ approvedOnly: true }));
    setActiveFlashSale(db.getActiveFlashSale());
    setActivePromotions(db.getActivePromotionalAds());
    setPublishedAnnouncements(db.getPublishedAnnouncements());
  }, []);

  // User session state (Phase 3 & 4)
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());

  // Modal views
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [buyerDashboardOpen, setBuyerDashboardOpen] = useState(false);
  const [sellerDashboardOpen, setSellerDashboardOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Cart state with database persistence (Phase 5)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = db.getCart();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: `cart-${PRODUCTS[0].id}-Ceramic White-Standard Case-6 Months Standard`,
        product: PRODUCTS[0],
        quantity: 1,
        selectedColor: 'Ceramic White',
        selectedSize: 'Standard Case',
        selectedVariation: '6 Months Standard',
      },
    ];
  });

  // Items currently being checked out (supports both whole cart and single Buy Now product)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(cartItems);

  // 11. DATABASE INTEGRATION: Auto-save cart items to database
  useEffect(() => {
    db.saveCart(cartItems);
  }, [cartItems]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add to cart from basic card or detailed modal (Section 1)
  const handleAddToCart = (itemOrProduct: Product | CartItem) => {
    let newItem: CartItem;

    if ('product' in itemOrProduct) {
      newItem = itemOrProduct as CartItem;
    } else {
      const prod = itemOrProduct as Product;
      newItem = {
        id: `cart-${prod.id}-${prod.colors?.[0] || 'default'}-${prod.sizes?.[0] || 'std'}`,
        product: prod,
        quantity: 1,
        selectedColor: prod.colors?.[0],
        selectedSize: prod.sizes?.[0],
        selectedVariation: prod.variations?.[0]?.options[0],
      };
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item
        );
      }
      return [...prev, newItem];
    });

    showToast(`Added ${newItem.product.name.slice(0, 24)}... to Cart!`);
  };

  // 4. BUY NOW: Open checkout specifically for selected product with variation pickers
  const handleBuyNow = (itemOrProduct: Product | CartItem) => {
    let targetItem: CartItem;

    if ('product' in itemOrProduct) {
      targetItem = itemOrProduct as CartItem;
    } else {
      const prod = itemOrProduct as Product;
      targetItem = {
        id: `buynow-${prod.id}-${Date.now()}`,
        product: prod,
        quantity: 1,
        selectedColor: prod.colors?.[0],
        selectedSize: prod.sizes?.[0],
        selectedVariation: prod.variations?.[0]?.options[0],
      };
    }

    setCheckoutItems([targetItem]);
    setCheckoutModalOpen(true);
  };

  // 2. QUANTITY MANAGEMENT
  const handleUpdateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleProceedCheckoutFromCart = () => {
    setCheckoutItems(cartItems);
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    db.clearCart();
    setCartItems([]);
    showToast(`Order #${order.orderNumber} placed successfully!`);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.fullName}!`);
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    showToast('Signed out of account.');
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  // Collections from liveProducts (only approved products)
  const flashSaleProducts = useMemo(() => {
    if (activeFlashSale && activeFlashSale.productIds && activeFlashSale.productIds.length > 0) {
      return liveProducts.filter((p) => activeFlashSale.productIds.includes(p.id));
    }
    return liveProducts.filter((p) => p.isFlashSale);
  }, [liveProducts, activeFlashSale]);

  const popularProducts = useMemo(
    () => liveProducts.filter((p) => p.isPopular),
    [liveProducts]
  );
  const newProducts = useMemo(
    () => liveProducts.filter((p) => p.isNew),
    [liveProducts]
  );
  const specialOfferProducts = useMemo(
    () => liveProducts.filter((p) => p.isSpecialOffer || (p.discountPercentage && p.discountPercentage >= 15)),
    [liveProducts]
  );

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return liveProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [searchQuery, liveProducts]);

  // Category Filter Results
  const categoryFilteredProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    return liveProducts.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, liveProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const el = document.getElementById('search-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Safe fallback seller user for testing
  const activeSellerUser = useMemo(() => {
    if (currentUser?.accountType === 'seller') return currentUser;
    return db.getUserByEmailOrPhone('seller@kasuwarkanawa.com') || currentUser;
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-[#E6007E] selection:text-white">
      {/* System Phase 4 Portal Bar: Connect Buyer, Seller & Super Admin */}
      <div className="bg-[#081225] text-slate-300 py-1.5 px-3 sm:px-6 text-[11px] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-pink-400 font-extrabold uppercase tracking-wider">KASUWAR KANAWA:</span>
          {currentUser ? (
            <span className="text-white flex items-center gap-1.5 font-semibold">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser.fullName}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-black ${
                  currentUser.accountType === 'seller'
                    ? 'bg-emerald-600 text-white'
                    : currentUser.accountType === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#E6007E] text-white'
                }`}
              >
                {currentUser.accountType}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 italic">Guest Session</span>
          )}
        </div>

        {/* Portal Direct Access Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Buyer Dashboard Button (Role Guarded) */}
          <button
            type="button"
            onClick={() => {
              if (currentUser?.accountType === 'seller') {
                showToast('Access Restricted: Sellers cannot access Buyer Dashboard.');
                return;
              }
              if (!currentUser) {
                setAuthInitialMode('login');
                setAuthModalOpen(true);
                return;
              }
              setBuyerDashboardOpen(true);
            }}
            className="text-slate-300 hover:text-white font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
            <span>Buyer Dashboard</span>
          </button>

          {/* Seller Dashboard Button (Role Guarded) */}
          <button
            type="button"
            onClick={() => {
              if (currentUser?.accountType === 'buyer') {
                showToast('Access Restricted: Buyers cannot access Seller Dashboard.');
                return;
              }
              if (currentUser?.accountType !== 'seller') {
                const s = db.getUserByEmailOrPhone('seller@kasuwarkanawa.com');
                if (s) {
                  db.setCurrentUser(s);
                  setCurrentUser(s);
                }
              }
              setSellerDashboardOpen(true);
            }}
            className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seller Dashboard</span>
          </button>

          {/* Super Admin CPanel Button (Security Gated) */}
          <button
            type="button"
            onClick={() => setAdminPanelOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E6007E]" />
            <span>Super Admin CPanel</span>
          </button>

          {/* Role switcher for quick testing */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] border-l border-slate-700 pl-3">
            <span className="text-slate-500">Quick Test:</span>
            <button
              onClick={() => {
                const u = db.getUserByEmailOrPhone('09060938835');
                if (u) {
                  db.setCurrentUser(u);
                  setCurrentUser(u);
                  showToast('Switched to Usman Nafiu (Buyer)');
                }
              }}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Buyer
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => {
                const s = db.getUserByEmailOrPhone('seller@kasuwarkanawa.com');
                if (s) {
                  db.setCurrentUser(s);
                  setCurrentUser(s);
                  showToast('Switched to Danladi (Seller)');
                }
              }}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Seller
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => {
                const a = db.getUserByEmailOrPhone('admin@kasuwarkanawa.com');
                if (a) {
                  db.setCurrentUser(a);
                  setCurrentUser(a);
                  showToast('Switched to Super Admin CPanel');
                }
              }}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* 1. Top Contact Bar */}
      <TopContactBar />

      {/* 2. Header with Logo, Search, Account and Cart */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartDrawerOpen(true)}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onOpenDashboard={() => setBuyerDashboardOpen(true)}
        onOpenSellerDashboard={() => setSellerDashboardOpen(true)}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* 3. Navigation Menu Bar */}
      <NavigationBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          if (catId !== 'all') {
            const el = document.getElementById('category-products-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        selectedCategory={selectedCategory}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenAccount={() => {
          if (currentUser) {
            if (currentUser.accountType === 'seller') {
              setSellerDashboardOpen(true);
            } else if (currentUser.accountType === 'admin') {
              setAdminPanelOpen(true);
            } else {
              setBuyerDashboardOpen(true);
            }
          } else {
            setAuthInitialMode('login');
            setAuthModalOpen(true);
          }
        }}
        onOpenDashboard={() => setBuyerDashboardOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={cartCount}
      />

      {/* 4. Announcements Ticker Bar */}
      <AnnouncementBar />

      {/* Phase 7: Dynamic Broadcast Announcements Section */}
      <AnnouncementsSection announcements={publishedAnnouncements} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B172E] text-white px-4 py-3 rounded-xl shadow-2xl border border-pink-500/40 flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-200">
          <div className="p-1 bg-[#E6007E] rounded-full">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Active Search Results View (if search active) */}
        {searchResults && (
          <section
            id="search-results-section"
            className="max-w-7xl mx-auto px-4 sm:px-6 my-8"
          >
            <div className="flex items-center justify-between mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#E6007E]" />
                <h2 className="text-lg sm:text-xl font-black text-[#0B172E]">
                  Search Results for "{searchQuery}" ({searchResults.length})
                </h2>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Clear Search</span>
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                <p className="text-base font-bold text-slate-700">
                  No products matched your search.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching for "Redmi", "Shadda", "Fan", or "Earbuds".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onViewDetails={(p) => setSelectedProductForDetail(p)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Category Filter Section View (if a category is explicitly chosen) */}
        {categoryFilteredProducts && (
          <section
            id="category-products-section"
            className="max-w-7xl mx-auto px-4 sm:px-6 my-8"
          >
            <div className="flex items-center justify-between mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-[#E6007E] rounded-full inline-block" />
                <h2 className="text-lg sm:text-xl font-black text-[#0B172E] capitalize">
                  {selectedCategory} Category ({categoryFilteredProducts.length} items)
                </h2>
              </div>
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-bold text-[#E6007E] hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {categoryFilteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onViewDetails={(p) => setSelectedProductForDetail(p)}
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. Main Promotional Banner (Redmi Note 12) */}
        <MainPromotionalBanner
          onShopNow={(name) => {
            const redmi = PRODUCTS.find((p) => p.name.includes('Redmi Note 12'));
            if (redmi) {
              setSelectedProductForDetail(redmi);
            } else {
              setSearchQuery(name);
            }
          }}
          onAddToCart={handleAddToCart}
          featuredProduct={PRODUCTS.find((p) => p.name.includes('Redmi Note 12'))}
        />

        {/* 6. Flash Sales Section with Countdown Timer */}
        <FlashSalesSection
          products={flashSaleProducts}
          activeFlashSale={activeFlashSale}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onViewDetails={(p) => setSelectedProductForDetail(p)}
        />

        {/* 7. Trust Badges / 4 Value Propositions Strip */}
        <TrustBadges />

        {/* 8. Discount Advertisements / Promo Banners */}
        <DiscountAdvertisements
          promotions={activePromotions}
          onStartShopping={() => {
            const el = document.getElementById('popular-products-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            const el = document.getElementById('category-products-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 9. Product Categories */}
        <CategoriesSection
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            if (catId !== 'all') {
              const el = document.getElementById('category-products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* 10. Special Offers Section */}
        <SpecialOffersSection
          products={specialOfferProducts}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onViewDetails={(p) => setSelectedProductForDetail(p)}
        />

        {/* 11. Popular Products Section */}
        <PopularProductsSection
          products={popularProducts}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onViewDetails={(p) => setSelectedProductForDetail(p)}
        />

        {/* 12. New Products Section */}
        <NewProductsSection
          products={newProducts}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onViewDetails={(p) => setSelectedProductForDetail(p)}
        />
      </main>

      {/* Product Details Modal (Colors, Sizes, Variations, Reviews, WhatsApp, Report) */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          isOpen={!!selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          currentUser={currentUser}
          onRequireLogin={() => {
            setAuthInitialMode('login');
            setAuthModalOpen(true);
          }}
        />
      )}

      {/* Cart Drawer Component */}
      {cartDrawerOpen && (
        <CartDrawer
          isOpen={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedCheckout={handleProceedCheckoutFromCart}
        />
      )}

      {/* Checkout Modal Component (Shipping info, OPay confirmation, COD) */}
      {checkoutModalOpen && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          items={checkoutItems}
          currentUser={currentUser}
          onOrderSuccess={handleOrderSuccess}
          onOpenDashboard={() => setBuyerDashboardOpen(true)}
        />
      )}

      {/* Auth Modal (Buyer Registration, Login, Forgot Password) */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          initialMode={authInitialMode}
        />
      )}

      {/* Buyer Dashboard Component (Profile, 10-status Orders, OPay approval simulation) */}
      {buyerDashboardOpen && currentUser && (
        <BuyerDashboard
          user={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onClose={() => setBuyerDashboardOpen(false)}
          onContinueShopping={() => {
            const el = document.getElementById('popular-products-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* Seller Dashboard Component (Phase 4 Deliverable) */}
      {sellerDashboardOpen && activeSellerUser && (
        <SellerDashboard
          isOpen={sellerDashboardOpen}
          onClose={() => setSellerDashboardOpen(false)}
          seller={activeSellerUser}
          onProductUpdated={refreshLiveProducts}
          onOpenSuperAdmin={() => setAdminPanelOpen(true)}
        />
      )}

      {/* Super Admin CPanel Modal (Full Phase 8 Suite) */}
      {adminPanelOpen && (
        <AdminPanelModal
          isOpen={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
          onDataChanged={refreshLiveProducts}
          currentUser={currentUser}
          onAdminLogin={(adminUser) => {
            setCurrentUser(adminUser);
            refreshLiveProducts();
          }}
        />
      )}

      {/* 13. Footer with Kano Ribbon */}
      <Footer
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
