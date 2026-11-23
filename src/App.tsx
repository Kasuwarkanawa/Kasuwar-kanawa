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
import { LogisticsDashboard } from './components/LogisticsDashboard';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Footer } from './components/Footer';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { NewsletterSection } from './components/NewsletterSection';
import { ProductCard } from './components/ProductCard';
import { CartItem, Product, User, Order, FlashSale, PromotionalAdvertisement, Announcement } from './types';
import { db } from './db/database';
import { authApi } from './utils/authApi';
import { marketplaceApi } from './utils/marketplaceApi';
import { AlertTriangle } from 'lucide-react';
import { CheckCircle2, Search, X, Shield, Store, UserCheck, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dismissedSpotlightId, setDismissedSpotlightId] = useState<string | null>(null);

  // Dynamic products list (only approved products appear on public marketplace)
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  // Phase 7: Live Flash Sales, Promotional Advertisements & Announcements from Database
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSale | null>(null);
  const [activePromotions, setActivePromotions] = useState<PromotionalAdvertisement[]>([]);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<Announcement[]>([]);

  const refreshLiveProducts = useCallback(async () => {
    const [productsResult, promotionsResult, flashSalesResult, announcementsResult] = await Promise.allSettled([
      marketplaceApi.catalog.list({ take: 100 }),
      marketplaceApi.content.publicPromotions(),
      marketplaceApi.content.publicFlashSales(),
      marketplaceApi.content.publicAnnouncements(),
    ]);
    if (productsResult.status === 'fulfilled') setLiveProducts(productsResult.value);
    else showToast('Unable to load the live product catalog. Please refresh and try again.');
    if (promotionsResult.status === 'fulfilled') setActivePromotions(promotionsResult.value);
    else setActivePromotions([]);
    if (flashSalesResult.status === 'fulfilled') setActiveFlashSale(flashSalesResult.value[0] || null);
    else setActiveFlashSale(null);
    if (announcementsResult.status === 'fulfilled') setPublishedAnnouncements(announcementsResult.value);
    else setPublishedAnnouncements([]);
  }, []);

  useEffect(() => {
    void refreshLiveProducts();
  }, [refreshLiveProducts]);

  // The first active admin promotion (or active flash sale) is also shown as a dismissible on-screen spotlight.
  const spotlightPromotion = activePromotions[0] || null;
  const spotlightId = spotlightPromotion?.id || (activeFlashSale ? activeFlashSale.id : null);
  const showSpotlight = Boolean(spotlightId && dismissedSpotlightId !== spotlightId);

  // User session state (Phase 3 & 4)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modal views
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [buyerDashboardOpen, setBuyerDashboardOpen] = useState(false);
  const [sellerDashboardOpen, setSellerDashboardOpen] = useState(false);
  const [logisticsDashboardOpen, setLogisticsDashboardOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Cart state with database persistence (Phase 5)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Never preload demo/sample products into a real buyer's cart.
    // Checkout accepts only products returned by the approved backend catalogue.
    const saved = db.getCart();
    return (saved || []).filter(
      (item) => !item.product.id.startsWith('sample-') && !item.product.id.startsWith('prod-')
    );
  });

  // Items currently being checked out (supports both whole cart and single Buy Now product)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(cartItems);

  // Guest cart remains local; authenticated buyer carts are stored in Supabase.
  useEffect(() => {
    if (currentUser?.accountType !== 'buyer') db.saveCart(cartItems);
  }, [cartItems, currentUser?.id, currentUser?.accountType]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Restore the authenticated user from the server-side HTTP-only session cookie.
  useEffect(() => {
    let active = true;
    authApi.currentUser()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch(() => {
        if (active) showToast('Authentication service is unavailable. Please try again shortly.');
      });
    return () => { active = false; };
  }, []);

  // Load the authenticated buyer's persistent cart from Supabase.
  useEffect(() => {
    if (!currentUser || currentUser.accountType !== 'buyer') return;
    let active = true;
    marketplaceApi.cart.list()
      .then(({ items }) => { if (active) setCartItems(items); })
      .catch((error) => { if (active) showToast(error instanceof Error ? error.message : 'Unable to load your saved cart.'); });
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.accountType]);

  // Add to cart from basic card or detailed modal (Section 1)
  const handleAddToCart = async (itemOrProduct: Product | CartItem) => {
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

    if (currentUser?.accountType === 'buyer') {
      try {
        await marketplaceApi.cart.add({
          productId: newItem.product.id,
          quantity: newItem.quantity,
          selectedColor: newItem.selectedColor,
          selectedSize: newItem.selectedSize,
          selectedVariation: newItem.selectedVariation,
        });
        const { items } = await marketplaceApi.cart.list();
        setCartItems(items);
        showToast(`Added ${newItem.product.name.slice(0, 24)}... to Cart!`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to add this product to your saved cart.');
      }
      return;
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
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      showToast('Please login or register as a buyer to continue.');
      return;
    }
    if (currentUser.accountType !== 'buyer') {
      showToast('Only buyer accounts can place orders.');
      return;
    }

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
    if (currentUser?.accountType === 'buyer') {
      void marketplaceApi.cart.update(cartItemId, quantity)
        .then(() => marketplaceApi.cart.list())
        .then(({ items }) => setCartItems(items))
        .catch((error) => showToast(error instanceof Error ? error.message : 'Unable to update cart quantity.'));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    if (currentUser?.accountType === 'buyer') {
      void marketplaceApi.cart.remove(cartItemId)
        .then(() => marketplaceApi.cart.list())
        .then(({ items }) => setCartItems(items))
        .catch((error) => showToast(error instanceof Error ? error.message : 'Unable to remove cart item.'));
      return;
    }
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleProceedCheckoutFromCart = () => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      showToast('Please login or register as a buyer to checkout.');
      return;
    }
    if (currentUser.accountType !== 'buyer') {
      showToast('Only buyer accounts can checkout.');
      return;
    }
    setCheckoutItems(cartItems);
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    db.clearCart();
    if (currentUser?.accountType === 'buyer') {
      void marketplaceApi.cart.clear().catch(() => undefined);
    }
    setCartItems([]);
    showToast(`Order #${order.orderNumber} placed successfully!`);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.fullName}!`);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setCurrentUser(null);
      setCartItems([]);
      db.clearCart();
      setBuyerDashboardOpen(false);
      setSellerDashboardOpen(false);
      setLogisticsDashboardOpen(false);
      setAdminPanelOpen(false);
      setAuthModalOpen(false);
      setCheckoutModalOpen(false);
      setCartDrawerOpen(false);
      showToast('Signed out successfully.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign out. Please try again.');
    }
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
    () => liveProducts.filter((p) => p.isNew).sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '')).slice(0, 12),
    [liveProducts]
  );
  const allProducts = useMemo(() => [...liveProducts].sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '')), [liveProducts]);
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
    return liveProducts.filter((p) => p.category === selectedCategory || p.categoryId === selectedCategory).sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
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

  // A seller dashboard must only ever receive the currently authenticated seller.
  const activeSellerUser = currentUser?.accountType === 'seller' ? currentUser : null;

  // Phase 10: seller subscription warning is available throughout the storefront.
  const [globalSellerSubscription, setGlobalSellerSubscription] = useState<any>(null);
  const [globalSubscriptionPaymentAccount, setGlobalSubscriptionPaymentAccount] = useState<any>(null);
  const [globalWarningDismissed, setGlobalWarningDismissed] = useState(false);

  useEffect(() => {
    if (currentUser?.accountType !== 'seller') {
      setGlobalSellerSubscription(null);
      setGlobalSubscriptionPaymentAccount(null);
      setGlobalWarningDismissed(false);
      return;
    }
    let active = true;
    const loadSubscriptionWarning = async () => {
      try {
        const result = await marketplaceApi.subscriptions.sellerOverview();
        if (!active) return;
        setGlobalSellerSubscription(result.subscription || null);
        setGlobalSubscriptionPaymentAccount(result.paymentAccount || null);
      } catch {
        if (active) {
          setGlobalSellerSubscription(null);
          setGlobalSubscriptionPaymentAccount(null);
        }
      }
    };
    void loadSubscriptionWarning();
    const refreshTimer = window.setInterval(loadSubscriptionWarning, 30000);
    return () => { active = false; window.clearInterval(refreshTimer); };
  }, [currentUser?.id, currentUser?.accountType]);

  useEffect(() => {
    if (!globalWarningDismissed) return;
    const showAgainTimer = window.setTimeout(() => setGlobalWarningDismissed(false), 10000);
    return () => window.clearTimeout(showAgainTimer);
  }, [globalWarningDismissed]);

  const globalSub = globalSellerSubscription;
  const globalExpiryTime = globalSub?.expiresAt ? new Date(globalSub.expiresAt).getTime() : 0;
  const globalDaysToExpiry = globalExpiryTime ? Math.ceil((globalExpiryTime - Date.now()) / 86400000) : 999;
  const showGlobalSellerWarning = Boolean(activeSellerUser && !sellerDashboardOpen && !globalWarningDismissed &&
    globalSub && ['active', 'grace'].includes(globalSub.status) &&
    (globalSub.status === 'grace' || (globalDaysToExpiry >= 0 && globalDaysToExpiry <= 7)));


  const openBuyerDashboard = () => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (currentUser.accountType !== 'buyer') {
      showToast('Access Restricted: Buyers only.');
      return;
    }
    setBuyerDashboardOpen(true);
  };

  const openSellerDashboard = () => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (currentUser.accountType !== 'seller') {
      showToast('Access Restricted: Sellers only.');
      return;
    }
    setSellerDashboardOpen(true);
  };

  const openLogisticsDashboard = () => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (currentUser.accountType !== 'logistics') {
      showToast('Access Restricted: Approved logistics companies only.');
      return;
    }
    setLogisticsDashboardOpen(true);
  };

  // Guests may open the admin sign-in screen; signed-in non-admin users are blocked.
  const openAdminPanel = () => {
    if (currentUser && currentUser.accountType !== 'admin') {
      showToast('Access Restricted: Super Admin only.');
      return;
    }
    setAdminPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-[#E6007E] selection:text-white">
      {showGlobalSellerWarning && (
        <section role="alert" aria-live="assertive" className={"fixed top-2 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[min(760px,calc(100vw-2rem))] z-[100] rounded-2xl border-2 p-4 shadow-2xl animate-pulse " + (globalSub.status === 'grace' ? 'border-red-500 bg-red-50 text-red-950' : 'border-amber-500 bg-amber-50 text-amber-950')}>
          <button type="button" onClick={() => setGlobalWarningDismissed(true)} aria-label="Close subscription warning" className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-slate-700 shadow"><X className="h-4 w-4" /></button>
          <div className="flex items-start gap-3 pr-8">
            <div className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-4 ring-red-200 animate-pulse"><AlertTriangle className="h-10 w-10 stroke-[3]" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black uppercase tracking-wide text-red-700">🚨 DANGER ZONE — SELLER SUBSCRIPTION WARNING</p>
              <p className="mt-1 text-xs font-semibold">
                {globalSub.status === 'grace'
                  ? 'Your 7-day grace period is active. Renew now. If it ends, selling access will be suspended and your products hidden from buyers. Your saved products and account will not be deleted.'
                  : 'Your subscription expires in ' + globalDaysToExpiry + ' day(s). Renew before expiry to avoid interruption. If you do not renew during the 7-day grace period, selling access will be suspended and your products hidden from buyers; saved products and account data will remain.'}
              </p>
              <div className="mt-2 rounded-lg bg-white/80 p-2 text-xs">
                <p>Renewal amount: <b>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number((Array.isArray(globalSub.plan) ? globalSub.plan[0] : globalSub.plan)?.price ?? globalSub.amountPaid ?? 1500))}</b></p>
                {globalSubscriptionPaymentAccount?.accountNumber && <p className="mt-1">Pay to {globalSubscriptionPaymentAccount.bankName}: <b>{globalSubscriptionPaymentAccount.accountNumber}</b> · {globalSubscriptionPaymentAccount.accountName}</p>}
              </div>
              <button type="button" onClick={() => setSellerDashboardOpen(true)} className="mt-3 rounded-lg bg-[#E6007E] px-4 py-2 text-xs font-black text-white">Open Seller Dashboard / Renew</button>
            </div>
          </div>
        </section>
      )}

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
                    : currentUser.accountType === 'logistics'
                    ? 'bg-amber-600 text-white'
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
              if (!currentUser) {
                setAuthInitialMode('login');
                setAuthModalOpen(true);
                return;
              }
              if (currentUser.accountType !== 'buyer') {
                showToast('Access Restricted: Buyers only.');
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
              if (!currentUser) {
                setAuthInitialMode('login');
                setAuthModalOpen(true);
                return;
              }
              if (currentUser.accountType !== 'seller') {
                showToast('Access Restricted: Sellers only.');
                return;
              }
              setSellerDashboardOpen(true);
            }}
            className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Seller Dashboard</span>
          </button>

          {/* Logistics Dashboard Button (Approved company only) */}
          {currentUser?.accountType === 'logistics' && (
            <button
              type="button"
              onClick={openLogisticsDashboard}
              className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-black flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Logistics Dashboard</span>
            </button>
          )}

          {/* Super Admin CPanel Button (Security Gated) */}
          <button
            type="button"
            onClick={() => {
              openAdminPanel();
            }}
            className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E6007E]" />
            <span>Super Admin CPanel</span>
          </button>


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
        onOpenDashboard={openBuyerDashboard}
        onOpenSellerDashboard={openSellerDashboard}
        onOpenAdminPanel={openAdminPanel}
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
            } else if (currentUser.accountType === 'logistics') {
              openLogisticsDashboard();
            } else if (currentUser.accountType === 'admin') {
              openAdminPanel();
            } else {
              setBuyerDashboardOpen(true);
            }
          } else {
            setAuthInitialMode('login');
            setAuthModalOpen(true);
          }
        }}
        onOpenDashboard={openBuyerDashboard}
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
        {/* Featured homepage banner advertisement */}
        {!searchResults && !categoryFilteredProducts && <MainPromotionalBanner />}

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

            {categoryFilteredProducts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Babu kayayyaki a wannan category tukuna.</div>
            ) : (
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
            )}
          </section>
        )}

        {/* Homepage: show the complete product catalogue as the only product collection */}
        {!searchResults && !categoryFilteredProducts && (
          <section id="all-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#E6007E] rounded-full inline-block" />
                  <h2 className="text-xl sm:text-2xl font-black text-[#0B172E]">All Products</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 ml-4">Browse all approved products in Kasuwar Kanawa ({allProducts.length})</p>
              </div>
            </div>
            {allProducts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No approved products are available yet.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} onViewDetails={(p) => setSelectedProductForDetail(p)} />
                ))}
              </div>
            )}
          </section>
        )}

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
          onOpenDashboard={openBuyerDashboard}
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
      {buyerDashboardOpen && currentUser?.accountType === 'buyer' && (
        <BuyerDashboard
          user={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
          }}
          onClose={() => setBuyerDashboardOpen(false)}
          onContinueShopping={() => {
            const el = document.getElementById('popular-products-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* Seller Dashboard Component (Phase 4 Deliverable) */}
      {sellerDashboardOpen && activeSellerUser?.accountType === 'seller' && (
        <SellerDashboard
          isOpen={sellerDashboardOpen}
          onClose={() => setSellerDashboardOpen(false)}
          seller={activeSellerUser}
          onProductUpdated={refreshLiveProducts}
          onOpenSuperAdmin={openAdminPanel}
        />
      )}

      {/* Logistics Company Dashboard (approved logistics accounts only) */}
      {logisticsDashboardOpen && currentUser?.accountType === 'logistics' && (
        <LogisticsDashboard
          user={currentUser}
          onClose={() => setLogisticsDashboardOpen(false)}
          onLogout={handleLogout}
          onDataChanged={refreshLiveProducts}
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
            if (adminUser.accountType !== 'admin') {
              showToast('Access Restricted: Super Admin only.');
              return;
            }
            setCurrentUser(adminUser);
            setAdminPanelOpen(false);
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
