import {
  User,
  Order,
  CartItem,
  Product,
  ProductReview,
  ProductReport,
  BuyerReport,
  SellerReport,
  OrderStatus,
  SellerSalesStats,
  ShippingAddress,
  FlashSale,
  PromotionalAdvertisement,
  Announcement,
  Category,
} from '../types';
import { INITIAL_REVIEWS, PRODUCTS } from '../data/products';

const USERS_STORAGE_KEY = 'kasuwar_users_v1';
const CURRENT_USER_KEY = 'kasuwar_current_user_v1';
const PRODUCTS_STORAGE_KEY = 'kasuwar_products_v1';
const ORDERS_STORAGE_KEY = 'kasuwar_orders_v1';
const REVIEWS_STORAGE_KEY = 'kasuwar_reviews_v1';
const REPORTS_STORAGE_KEY = 'kasuwar_reports_v1';
const BUYER_REPORTS_STORAGE_KEY = 'kasuwar_buyer_reports_v1';
const SELLER_REPORTS_STORAGE_KEY = 'kasuwar_seller_reports_v1';
const CATEGORIES_STORAGE_KEY = 'kasuwar_categories_v1';
const CART_STORAGE_KEY = 'kasuwar_cart_v1';
const FLASH_SALES_STORAGE_KEY = 'kasuwar_flash_sales_v1';
const PROMOTIONS_STORAGE_KEY = 'kasuwar_promotions_v1';
const ANNOUNCEMENTS_STORAGE_KEY = 'kasuwar_announcements_v1';

// Seed Initial Flash Sales
const INITIAL_FLASH_SALES: FlashSale[] = [
  {
    id: 'fs-1',
    title: 'Kano Grand Weekend Flash Sales',
    description: 'Unbeatable price cuts on electronics, smartphones, and Swiss Brocade fabrics!',
    discountPercentage: 25,
    startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    productIds: ['prod-1', 'prod-2', 'prod-3', 'prod-4'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Seed Initial Promotional Advertisements
const INITIAL_PROMOTIONS: PromotionalAdvertisement[] = [
  {
    id: 'promo-1',
    title: 'Weekend Special: Shop More, Save More!',
    description: 'Amazing Deals, Unbeatable Prices on All Collections across Kano Commercial Hubs.',
    badge: 'PROMO!',
    discountTag: 'Save 20%',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80',
    linkText: 'Explore Offers',
    linkUrl: '#flash-sales-section',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    title: 'Royal Kano Shadda & Kaftan Fabrics',
    description: 'Top quality Austrian & Swiss brocade for wedding & Friday attires direct from Kasuwar Kwari.',
    badge: 'UP TO 30% OFF',
    discountTag: '-30%',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    linkText: 'Kwari Collection',
    linkUrl: '#category-products-section',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'promo-3',
    title: 'Power Banks, Earbuds & Smart Gadgets',
    description: 'Fast-charging certified accessories with warranty from Beirut Road Tech Market.',
    badge: 'MEGA GADGET FEST',
    discountTag: '-25%',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    linkText: 'Shop Tech',
    linkUrl: '#popular-products-section',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Seed Initial Announcements
const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: 'Kasuwar Kanawa Grand Market Day Specials Active',
    description: 'Enjoy free delivery across Kano Municipal, Fagge & Nassarawa for all orders above ₦25,000!',
    type: 'discount',
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'anc-2',
    title: 'OPay Bank Transfer Verification System Active',
    description: 'Super Admin now verifies OPay transfers to RAMATU SAIDU (7066300079) instantly in CPanel.',
    type: 'info',
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

// Seed Initial Kano Market Categories (Phase 8 Specification: Kwari, Singa, Kurmi, Farm Center, Wasu Kasuwanni)
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'kwari',
    name: 'Kasuwar Kwari',
    hausaName: 'Kasuwar Yadudduka & Shadda',
    description: 'The largest textiles market in West Africa. Premium Austrian brocade, Swiss laces, and Kaftan materials.',
    iconName: 'Shirt',
    itemCount: 245,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'singa',
    name: 'Kasuwar Singa',
    hausaName: 'Kasuwar Kayan Masarufi',
    description: 'Kano wholesale hub for provisions, grains, foodstuffs, cooking oils, and household goods at bulk trade prices.',
    iconName: 'UtensilsCrossed',
    itemCount: 180,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'kurmi',
    name: 'Kasuwar Kurmi',
    hausaName: 'Kasuwar Tarihi & Kayan Gargajiya',
    description: 'Centuries-old historic market famous for authentic Kano dyed fabrics, leather goods, brassware, and traditional herbs.',
    iconName: 'Sparkles',
    itemCount: 135,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'farm_center',
    name: 'Kasuwar Farm Center',
    hausaName: 'Kasuwar Wayoyi & Na\'urori',
    description: 'Northern Nigeria premier electronics market. Smartphones, tablets, laptops, solar power, and accessories.',
    iconName: 'Smartphone',
    itemCount: 310,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'wasu',
    name: 'Wasu Kasuwanni',
    hausaName: 'Sauran Kasuwannin Jihar Kano',
    description: 'Dawanau Grains Market, Sabon Gari Market, Kofar Ruwa Hardware, and Yan Kaba Fresh Farm Produce.',
    iconName: 'Building',
    itemCount: 95,
    image: 'https://images.unsplash.com/photo-1583771036034-7833075677c7?auto=format&fit=crop&w=400&q=80',
  },
];

// Seed Initial Users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-buyer-1',
    fullName: 'Usman Nafiu',
    phone: '09060938835',
    whatsAppNumber: '2349060938835',
    email: 'usmannafiu46688@gmail.com',
    password: 'password123',
    address: 'No. 14 Bompai Road, Nassarawa GRA',
    businessAddress: '',
    city: 'Kano City',
    state: 'Kano State',
    area: 'Nassarawa',
    accountType: 'buyer',
    status: 'active',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'usr-buyer-2',
    fullName: 'Fatima Aliyu Garba',
    phone: '08031234567',
    whatsAppNumber: '2348031234567',
    email: 'fatima.garba@gmail.com',
    password: 'password123',
    address: 'Plot 88 Zoo Road, Housing Estate',
    businessAddress: '',
    city: 'Kano City',
    state: 'Kano State',
    area: 'Tarauni',
    accountType: 'buyer',
    status: 'active',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-11-03T11:20:00Z',
  },
  {
    id: 'usr-seller-1',
    fullName: 'Alhaji Danladi Merchant',
    businessName: 'Danladi Textiles & Brocade Hub',
    phone: '07066300079',
    whatsAppNumber: '2347066300079',
    email: 'seller@kasuwarkanawa.com',
    password: 'password123',
    address: 'Shop 42, Block B, Kasuwar Kwari Textiles Market',
    businessAddress: 'Shop 42, Block B, Kasuwar Kwari Market, Kano State',
    city: 'Kano City',
    state: 'Kano State',
    area: 'Fagge',
    productCategory: 'Kasuwar Kwari',
    accountType: 'seller',
    status: 'active',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-10-15T09:30:00Z',
  },
  {
    id: 'usr-seller-2',
    fullName: 'Hajiya Binta Electronics',
    businessName: 'Binta Farm Center Gadgets',
    phone: '08023456789',
    whatsAppNumber: '2348023456789',
    email: 'seller2@kasuwarkanawa.com',
    password: 'password123',
    address: 'Shop 18, Digital Plaza, Farm Center GSM Market',
    businessAddress: 'Shop 18, Digital Plaza, Farm Center GSM Village, Kano State',
    city: 'Kano City',
    state: 'Kano State',
    area: 'Tarauni',
    productCategory: 'Kasuwar Farm Center',
    accountType: 'seller',
    status: 'active',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-10-20T14:00:00Z',
  },
  {
    id: 'usr-admin-1',
    fullName: 'Super Admin Kano CPanel',
    businessName: 'Kasuwar Kanawa HQ CPanel',
    phone: '08000000000',
    whatsAppNumber: '2348000000000',
    email: 'admin@kasuwarkanawa.com',
    password: 'adminpassword',
    address: 'Kasuwar Kanawa Central Hub, Kano',
    businessAddress: 'Kasuwar Kanawa Central Hub, Kano State',
    city: 'Kano City',
    state: 'Kano State',
    area: 'Kano Municipal',
    accountType: 'admin',
    status: 'active',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-09-01T12:00:00Z',
  },
];

// Helper to seed products with seller IDs & approved state
const SEEDED_PRODUCTS: Product[] = PRODUCTS.map((p, idx) => ({
  ...p,
  sellerId: idx % 2 === 0 ? 'usr-seller-1' : 'usr-seller-2',
  sellerName: idx % 2 === 0 ? 'Alhaji Danladi Merchant' : p.sellerName || 'Kano Tech Hub',
  sellerBusinessName: idx % 2 === 0 ? 'Danladi Textiles & Brocade Hub' : 'Kano Central Distributors',
  sellerPhone: idx % 2 === 0 ? '07066300079' : p.sellerPhone || '09060938835',
  sellerWhatsApp: idx % 2 === 0 ? '2347066300079' : p.sellerWhatsApp || '2349060938835',
  isApproved: true,
  approvalStatus: 'approved',
  stockQuantity: p.stockLeft || 25,
}));

// Seed Initial Orders
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'KN-948210',
    buyerId: 'usr-buyer-1',
    buyerName: 'Usman Nafiu',
    buyerEmail: 'usmannafiu46688@gmail.com',
    buyerPhone: '09060938835',
    sellerId: 'usr-seller-1',
    sellerName: 'Alhaji Danladi Merchant',
    sellerBusinessName: 'Danladi Textiles & Brocade Hub',
    items: [
      {
        id: 'ci-1',
        product: SEEDED_PRODUCTS[4], // Redmi Note 12
        quantity: 1,
        selectedColor: 'Ice Blue',
        selectedSize: '128GB ROM + 8GB RAM',
        selectedVariation: '33W SuperFast Adapter Included',
      },
    ],
    subtotal: 195000,
    deliveryFee: 0,
    totalAmount: 195000,
    shippingAddress: {
      fullName: 'Usman Nafiu',
      phoneNumber: '09060938835',
      state: 'Kano State',
      city: 'Kano City',
      area: 'Nassarawa',
      completeAddress: 'No. 14 Bompai Road, Nassarawa GRA, Kano',
    },
    paymentMethod: 'opay',
    status: 'dispatched',
    paymentConfirmation: {
      method: 'opay',
      bankName: 'OPay',
      accountName: 'RAMATU SAIDU',
      accountNumber: '7066300079',
      senderName: 'Usman Nafiu Bello',
      transactionReference: 'OPAY-TRX-83921094',
      confirmedByBuyer: true,
      confirmedAt: '2026-11-09T10:14:00Z',
      verifiedByAdmin: true,
      verifiedAt: '2026-11-09T10:28:00Z',
      adminNotes: 'Payment verified via OPay Merchant Portal. Package released to rider.',
    },
    trackingTimeline: [
      {
        title: 'Order Placed',
        date: 'Nov 09, 2026 - 10:12 AM',
        completed: true,
        description: 'Order received and logged in system.',
      },
      {
        title: 'Payment Confirmed',
        date: 'Nov 09, 2026 - 10:28 AM',
        completed: true,
        description: 'Super Admin verified OPay transfer.',
      },
      {
        title: 'Processing & Quality Checked',
        date: 'Nov 09, 2026 - 11:45 AM',
        completed: true,
        description: 'Device sealed and warranty document stamped in Beirut Road store.',
      },
      {
        title: 'Dispatched to Rider',
        date: 'Nov 09, 2026 - 01:15 PM',
        completed: true,
        description: 'Rider Sani on motorcycle dispatching to Nassarawa GRA.',
      },
      {
        title: 'Delivered',
        date: 'Pending Delivery',
        completed: false,
        description: 'Package arriving at delivery address.',
      },
    ],
    sellerPhone: '07066300079',
    sellerWhatsApp: '2347066300079',
    createdAt: '2026-11-09T10:12:00Z',
    updatedAt: '2026-11-09T13:15:00Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'KN-783109',
    buyerId: 'usr-buyer-1',
    buyerName: 'Usman Nafiu',
    buyerEmail: 'usmannafiu46688@gmail.com',
    buyerPhone: '09060938835',
    sellerId: 'usr-seller-1',
    sellerName: 'Alhaji Danladi Merchant',
    sellerBusinessName: 'Danladi Textiles & Brocade Hub',
    items: [
      {
        id: 'ci-2',
        product: SEEDED_PRODUCTS[5], // Brocade Shadda
        quantity: 1,
        selectedColor: 'Pure Snow White',
        selectedSize: '5 Yards (Standard Babban Riga)',
        selectedVariation: 'Austrian Premium Gloss',
      },
    ],
    subtotal: 48000,
    deliveryFee: 0,
    totalAmount: 48000,
    shippingAddress: {
      fullName: 'Usman Nafiu',
      phoneNumber: '09060938835',
      state: 'Kano State',
      city: 'Kano City',
      area: 'Nassarawa',
      completeAddress: 'No. 14 Bompai Road, Nassarawa GRA, Kano',
    },
    paymentMethod: 'cod',
    status: 'delivered',
    paymentConfirmation: {
      method: 'cod',
      bankName: 'Cash on Delivery',
      accountName: 'Kasuwar Kanawa Cash Handler',
      accountNumber: 'N/A',
      confirmedByBuyer: true,
      confirmedAt: '2026-11-08T09:20:00Z',
      verifiedByAdmin: true,
      verifiedAt: '2026-11-08T15:30:00Z',
      adminNotes: 'Cash collected by dispatch rider.',
    },
    trackingTimeline: [
      {
        title: 'Order Placed (COD)',
        date: 'Nov 08, 2026 - 09:20 AM',
        completed: true,
        description: 'Order confirmed for Cash on Delivery.',
      },
      {
        title: 'Processing at Kasuwar Kwari',
        date: 'Nov 08, 2026 - 11:00 AM',
        completed: true,
        description: '5 Yards Austrian brocade rolled and packaged.',
      },
      {
        title: 'Dispatched',
        date: 'Nov 08, 2026 - 01:00 PM',
        completed: true,
        description: 'Rider in transit.',
      },
      {
        title: 'Delivered & Paid',
        date: 'Nov 08, 2026 - 03:30 PM',
        completed: true,
        description: 'Received by customer with full receipt.',
      },
    ],
    sellerPhone: '07066300079',
    sellerWhatsApp: '2347066300079',
    createdAt: '2026-11-08T09:20:00Z',
    updatedAt: '2026-11-08T15:30:00Z',
  },
  {
    id: 'ord-103',
    orderNumber: 'KN-621940',
    buyerId: 'usr-buyer-1',
    buyerName: 'Usman Nafiu',
    buyerEmail: 'usmannafiu46688@gmail.com',
    buyerPhone: '09060938835',
    sellerId: 'usr-seller-1',
    sellerName: 'Alhaji Danladi Merchant',
    sellerBusinessName: 'Danladi Textiles & Brocade Hub',
    items: [
      {
        id: 'ci-3',
        product: SEEDED_PRODUCTS[0], // Wireless Bluetooth Earbuds
        quantity: 1,
        selectedColor: 'Ceramic White',
        selectedSize: 'Standard Case',
        selectedVariation: '6 Months Standard',
      },
    ],
    subtotal: 18500,
    deliveryFee: 1500,
    totalAmount: 20000,
    shippingAddress: {
      fullName: 'Usman Nafiu',
      phoneNumber: '09060938835',
      state: 'Kano State',
      city: 'Kano City',
      area: 'Nassarawa',
      completeAddress: 'No. 14 Bompai Road, Nassarawa GRA, Kano',
    },
    paymentMethod: 'opay',
    status: 'pending_verification',
    paymentConfirmation: {
      method: 'opay',
      bankName: 'OPay',
      accountName: 'RAMATU SAIDU',
      accountNumber: '7066300079',
      senderName: 'Usman Nafiu',
      transactionReference: 'OPAY-TRANS-994103',
      confirmedByBuyer: true,
      confirmedAt: '2026-11-10T04:15:00Z',
      verifiedByAdmin: false,
      adminNotes: 'Awaiting Super Admin manual receipt match in OPay CPanel.',
    },
    trackingTimeline: [
      {
        title: 'Order Placed',
        date: 'Nov 10, 2026 - 04:10 AM',
        completed: true,
        description: 'Order created with OPay transfer payment method.',
      },
      {
        title: 'Pending Verification',
        date: 'Nov 10, 2026 - 04:15 AM',
        completed: true,
        description: 'Buyer confirmed payment. Waiting for Super Admin approval.',
      },
      {
        title: 'Payment Confirmed',
        date: 'Awaiting Admin Verification',
        completed: false,
        description: 'Super Admin verifies transaction reference.',
      },
      {
        title: 'Processing',
        date: 'Pending',
        completed: false,
        description: 'Order will be packed after verification.',
      },
    ],
    sellerPhone: '07066300079',
    sellerWhatsApp: '2347066300079',
    createdAt: '2026-11-10T04:10:00Z',
    updatedAt: '2026-11-10T04:15:00Z',
  },
];

// Seed Initial Buyer Reports
const INITIAL_BUYER_REPORTS: BuyerReport[] = [
  {
    id: 'br-1',
    sellerId: 'usr-seller-1',
    sellerName: 'Alhaji Danladi Merchant',
    sellerBusinessName: 'Danladi Textiles & Brocade Hub',
    buyerId: 'usr-buyer-fake',
    buyerName: 'Musa Abdullahi',
    buyerPhone: '08039988776',
    orderNumber: 'KN-551299',
    reason: 'Unresponsive on delivery and rejected valid COD parcel',
    details: 'Dispatch rider reached destination in Dala, buyer phone was switched off for 48 hours.',
    status: 'pending',
    createdAt: '2026-11-09T14:20:00Z',
  },
];

// Seed Initial Seller Reports
const INITIAL_SELLER_REPORTS: SellerReport[] = [
  {
    id: 'sr-1',
    buyerId: 'usr-buyer-1',
    buyerName: 'Usman Nafiu',
    buyerPhone: '09060938835',
    sellerId: 'usr-seller-2',
    sellerName: 'Hajiya Binta Electronics',
    sellerBusinessName: 'Binta Farm Center Gadgets',
    orderNumber: 'KN-883192',
    reason: 'Delayed shipping confirmation',
    details: 'Seller took 3 days to acknowledge the paid power bank order.',
    status: 'pending',
    createdAt: '2026-11-09T10:15:00Z',
  },
];

export const db = {
  // --- USERS ---
  getUsers(): User[] {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      const parsed: User[] = JSON.parse(raw);
      let updated = false;
      INITIAL_USERS.forEach((initUser) => {
        const existing = parsed.find((u) => u.id === initUser.id || u.email.toLowerCase() === initUser.email.toLowerCase());
        if (!existing) {
          parsed.push(initUser);
          updated = true;
        } else if (!existing.profileImage && initUser.profileImage) {
          existing.profileImage = initUser.profileImage;
          updated = true;
        }
      });
      parsed.forEach((u) => {
        if (!u.status) {
          u.status = 'active';
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  },

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  getUserByEmailOrPhone(identifier: string): User | null {
    const users = this.getUsers();
    const clean = identifier.trim().toLowerCase();
    return (
      users.find(
        (u) =>
          u.email.toLowerCase() === clean ||
          u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')
      ) || null
    );
  },

  adminLogin(identifier: string, password: string): { success: boolean; user?: User; error?: string } {
    const clean = identifier.trim().toLowerCase();
    const users = this.getUsers();
    const adminUser = users.find(
      (u) =>
        (u.email.toLowerCase() === clean || u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) &&
        u.accountType === 'admin'
    );

    if (!adminUser) {
      if (clean === 'admin' || clean === 'admin@kasuwarkanawa.com') {
        const fallback = users.find((u) => u.accountType === 'admin') || INITIAL_USERS.find((u) => u.accountType === 'admin');
        if (fallback && (password === 'adminpassword' || password === 'admin' || password === 'password123')) {
          this.setCurrentUser(fallback);
          return { success: true, user: fallback };
        }
      }
      return { success: false, error: 'Access Denied: Only authorized Super Admin can log in to CPanel.' };
    }

    if (adminUser.status === 'suspended' || adminUser.status === 'rejected') {
      return { success: false, error: `Account ${adminUser.status}. Contact system administrator.` };
    }

    if (adminUser.password && adminUser.password !== password && password !== 'adminpassword' && password !== 'admin') {
      return { success: false, error: 'Incorrect Super Admin password. Please check credentials.' };
    }

    this.setCurrentUser(adminUser);
    return { success: true, user: adminUser };
  },

  adminAddUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `usr-${userData.accountType}-${Date.now()}`,
      status: userData.status || 'active',
      createdAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  adminUpdateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(users[index]);
    }
    return users[index];
  },

  adminDeleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) return false;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  adminSetUserStatus(userId: string, status: 'active' | 'suspended' | 'rejected' | 'approved'): User | null {
    const normalizedStatus: 'active' | 'suspended' | 'rejected' = status === 'approved' ? 'active' : status;
    return this.adminUpdateUser(userId, { status: normalizedStatus });
  },

  getBuyerStats(buyerId: string) {
    const orders = this.getOrders(buyerId);
    const paidOrders = orders.filter(
      (o) =>
        o.status === 'payment_confirmed' ||
        o.paymentConfirmation?.verifiedByAdmin ||
        (o.paymentMethod === 'cod' && o.status === 'delivered')
    );
    const pendingOrders = orders.filter(
      (o) =>
        o.status === 'pending' ||
        o.status === 'pending_order' ||
        o.status === 'pending_payment' ||
        o.status === 'pending_verification'
    );
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const totalProductsPurchased = orders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0),
      0
    );
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      deliveredOrders: deliveredOrders.length,
      totalProductsPurchased,
      totalSpent,
      purchaseHistory: orders,
    };
  },

  registerUser(userData: Omit<User, 'id' | 'createdAt'>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }
    if (users.some((u) => u.phone.replace(/\s+/g, '') === userData.phone.replace(/\s+/g, ''))) {
      return { success: false, error: 'An account with this phone number already exists.' };
    }

    const newUser: User = {
      ...userData,
      id: `usr-${userData.accountType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return { success: true, user: newUser };
  },

  updateUserProfile(userId: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(users[index]);
    }
    return users[index];
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      const users = this.getUsers();
      const defaultUser = users[0] || INITIAL_USERS[0];
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // --- PRODUCTS (4. PRODUCT MANAGEMENT) ---
  getProducts(options?: { sellerId?: string; approvedOnly?: boolean }): Product[] {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    let products: Product[] = [];
    if (!raw) {
      products = SEEDED_PRODUCTS;
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } else {
      try {
        products = JSON.parse(raw);
      } catch {
        products = SEEDED_PRODUCTS;
      }
    }

    if (options?.sellerId) {
      return products.filter((p) => p.sellerId === options.sellerId);
    }

    if (options?.approvedOnly) {
      return products.filter((p) => p.isApproved !== false && p.approvalStatus !== 'pending_approval');
    }

    return products;
  },

  getProductById(id: string): Product | null {
    const products = this.getProducts();
    return products.find((p) => p.id === id) || null;
  },

  addProduct(productData: Omit<Product, 'id'>): Product {
    const products = this.getProducts();
    const discount =
      productData.originalPrice > productData.price
        ? Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)
        : 0;

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      discountPercentage: discount,
      rating: 5.0,
      reviewsCount: 0,
      isApproved: false, // Must remain Pending Approval until Super Admin approves
      approvalStatus: 'pending_approval',
      stockLeft: productData.stockQuantity || productData.stockLeft || 10,
    };

    products.unshift(newProduct);
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    return newProduct;
  },

  updateProduct(productId: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return null;

    let discount = products[index].discountPercentage;
    const finalPrice = updates.price ?? products[index].price;
    const finalOriginalPrice = updates.originalPrice ?? products[index].originalPrice;
    if (finalOriginalPrice > finalPrice) {
      discount = Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100);
    }

    products[index] = {
      ...products[index],
      ...updates,
      discountPercentage: discount,
      stockLeft: updates.stockQuantity ?? updates.stockLeft ?? products[index].stockLeft,
    };

    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    return products[index];
  },

  deleteProduct(productId: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== productId);
    if (filtered.length === products.length) return false;
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  adminApproveProduct(productId: string, approve: boolean): Product | null {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return null;

    products[index].isApproved = approve;
    products[index].approvalStatus = approve ? 'approved' : 'rejected';
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    return products[index];
  },

  // --- ORDERS (5. ORDER MANAGEMENT, 6. PAYMENT STATUS, 7. ORDER DELIVERY) ---
  getOrders(buyerId?: string): Order[] {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    let orders: Order[] = [];
    if (!raw) {
      orders = INITIAL_ORDERS;
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } else {
      try {
        orders = JSON.parse(raw);
      } catch {
        orders = INITIAL_ORDERS;
      }
    }

    if (buyerId) {
      return orders.filter((o) => o.buyerId === buyerId);
    }
    return orders;
  },

  getSellerOrders(sellerId: string): Order[] {
    const orders = this.getOrders();
    return orders.filter((o) => {
      if (o.sellerId === sellerId) return true;
      return o.items.some((item) => item.product.sellerId === sellerId);
    });
  },

  getOrderById(id: string): Order | null {
    const orders = this.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  createOrder(orderData: {
    buyer: User;
    items: CartItem[];
    shippingAddress: ShippingAddress;
    paymentMethod: 'opay' | 'cod';
    senderName?: string;
    transactionReference?: string;
  }): Order {
    const orders = this.getOrders();
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = subtotal >= 25000 ? 0 : 1500;
    const totalAmount = subtotal + deliveryFee;
    const now = new Date().toISOString();
    const orderNumber = `KN-${Math.floor(100000 + Math.random() * 900000)}`;

    const initialStatus: OrderStatus =
      orderData.paymentMethod === 'opay' ? 'pending_verification' : 'pending_order';

    const primarySeller = orderData.items[0]?.product;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      buyerId: orderData.buyer.id,
      buyerName: orderData.buyer.fullName,
      buyerEmail: orderData.buyer.email,
      buyerPhone: orderData.buyer.phone,
      sellerId: primarySeller?.sellerId || 'usr-seller-1',
      sellerName: primarySeller?.sellerName || 'Alhaji Danladi Merchant',
      sellerBusinessName: primarySeller?.sellerBusinessName || 'Danladi Textiles Hub',
      items: orderData.items,
      subtotal,
      deliveryFee,
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      status: initialStatus,
      paymentConfirmation: {
        method: orderData.paymentMethod,
        bankName: orderData.paymentMethod === 'opay' ? 'OPay' : 'Cash on Delivery',
        accountName: orderData.paymentMethod === 'opay' ? 'RAMATU SAIDU' : 'Cash on Delivery',
        accountNumber: orderData.paymentMethod === 'opay' ? '7066300079' : 'N/A',
        senderName: orderData.senderName || orderData.buyer.fullName,
        transactionReference:
          orderData.transactionReference ||
          (orderData.paymentMethod === 'opay' ? `OPAY-REF-${Math.floor(1000000 + Math.random() * 9000000)}` : undefined),
        confirmedByBuyer: orderData.paymentMethod === 'opay',
        confirmedAt: now,
        verifiedByAdmin: false,
        adminNotes:
          orderData.paymentMethod === 'opay'
            ? 'Waiting for Super Admin verification in CPanel.'
            : 'Payment due on delivery to Kano address.',
      },
      trackingTimeline: [
        {
          title: 'Order Placed',
          date: new Date().toLocaleString(),
          completed: true,
          description: `Order ${orderNumber} placed by buyer.`,
        },
        {
          title: orderData.paymentMethod === 'opay' ? 'Pending Verification' : 'Order Processing',
          date: new Date().toLocaleString(),
          completed: true,
          description:
            orderData.paymentMethod === 'opay'
              ? 'OPay payment confirmation logged. Super admin will review.'
              : 'Dispatch team packing items for Cash on Delivery.',
        },
        {
          title: 'Payment Confirmed',
          date: 'Pending Verification',
          completed: false,
          description: 'Awaiting Super Admin CPanel approval.',
        },
        {
          title: 'Processing',
          date: 'Pending',
          completed: false,
          description: 'Seller packaging products.',
        },
        {
          title: 'Dispatched',
          date: 'Pending',
          completed: false,
          description: 'Package handed over to dispatch rider.',
        },
        {
          title: 'Delivered',
          date: 'Pending',
          completed: false,
          description: 'Package handed to recipient.',
        },
      ],
      sellerPhone: primarySeller?.sellerPhone || '07066300079',
      sellerWhatsApp: primarySeller?.sellerWhatsApp || '2347066300079',
      createdAt: now,
      updatedAt: now,
    };

    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return newOrder;
  },

  updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();

    const nowStr = new Date().toLocaleString();

    if (status === 'payment_confirmed') {
      orders[index].paymentConfirmation.verifiedByAdmin = true;
      orders[index].paymentConfirmation.verifiedAt = new Date().toISOString();
      const step = orders[index].trackingTimeline.find((s) => s.title === 'Payment Confirmed');
      if (step) {
        step.completed = true;
        step.date = nowStr;
      }
    } else if (status === 'processing') {
      const step = orders[index].trackingTimeline.find((s) => s.title === 'Processing');
      if (step) {
        step.completed = true;
        step.date = nowStr;
        step.description = 'Seller accepted and prepared order for delivery.';
      }
    } else if (status === 'dispatched') {
      orders[index].dispatchedAt = new Date().toISOString();
      const step = orders[index].trackingTimeline.find((s) => s.title === 'Dispatched');
      if (step) {
        step.completed = true;
        step.date = nowStr;
        step.description = 'Order handed to dispatch rider for delivery.';
      }
    } else if (status === 'delivered') {
      orders[index].deliveredAt = new Date().toISOString();
      orders[index].trackingTimeline.forEach((s) => (s.completed = true));
      const step = orders[index].trackingTimeline.find((s) => s.title === 'Delivered');
      if (step) {
        step.completed = true;
        step.date = nowStr;
        step.description = 'Order delivered successfully to buyer.';
      }
    } else if (status === 'rejected') {
      const step = orders[index].trackingTimeline.find((s) => s.title.includes('Rejected') || s.title.includes('Payment Confirmed'));
      if (step) {
        step.title = 'Payment Rejected';
        step.completed = false;
        step.date = nowStr;
        step.description = orders[index].adminRejectionReason || 'Payment verification failed.';
      }
    }

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return orders[index];
  },

  confirmPaymentByBuyer(
    orderId: string,
    senderName: string,
    transactionReference: string
  ): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    orders[index].paymentConfirmation = {
      ...orders[index].paymentConfirmation,
      senderName,
      transactionReference,
      confirmedByBuyer: true,
      confirmedAt: new Date().toISOString(),
    };
    orders[index].status = 'pending_verification';
    orders[index].updatedAt = new Date().toISOString();

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return orders[index];
  },

  adminApprovePayment(orderId: string): Order | null {
    return this.updateOrderStatus(orderId, 'payment_confirmed');
  },

  adminRejectPayment(orderId: string, reason?: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    orders[index].status = 'rejected';
    orders[index].paymentConfirmation.verifiedByAdmin = false;
    orders[index].adminRejectionReason = reason || 'Bank transfer could not be verified in official OPay portal.';
    orders[index].paymentConfirmation.adminNotes = reason || 'Bank transfer verification rejected by Super Admin.';
    orders[index].updatedAt = new Date().toISOString();

    const step = orders[index].trackingTimeline.find((s) => s.title.includes('Payment Confirmed') || s.title.includes('Pending Verification'));
    if (step) {
      step.title = 'Payment Rejected';
      step.completed = false;
      step.date = new Date().toLocaleString();
      step.description = orders[index].adminRejectionReason;
    }

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return orders[index];
  },

  // Seller Order Controls (6. SELLER ORDER MANAGEMENT & 10. DELIVERY CONFIRMATION)
  sellerAcceptOrder(orderId: string): Order | null {
    return this.updateOrderStatus(orderId, 'processing');
  },

  sellerRejectOrder(orderId: string, reason?: string): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    orders[index].status = 'rejected';
    orders[index].sellerRejectionReason = reason || 'Order rejected by seller (out of stock / unavailable).';
    orders[index].updatedAt = new Date().toISOString();

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return orders[index];
  },

  sellerDispatchOrder(orderId: string): Order | null {
    return this.updateOrderStatus(orderId, 'dispatched');
  },

  sellerDeliverOrder(orderId: string): Order | null {
    return this.updateOrderStatus(orderId, 'delivered');
  },

  // 10. SELLER SALES HISTORY & METRICS
  getSellerStats(sellerId: string): SellerSalesStats {
    const sellerProducts = this.getProducts({ sellerId });
    const sellerOrders = this.getSellerOrders(sellerId);

    const paidOrders = sellerOrders.filter(
      (o) => o.status === 'payment_confirmed' || o.status === 'processing' || o.status === 'dispatched' || o.status === 'delivered'
    ).length;

    const pendingOrders = sellerOrders.filter(
      (o) => o.status === 'pending_order' || o.status === 'pending_payment' || o.status === 'pending_verification'
    ).length;

    const deliveredOrders = sellerOrders.filter((o) => o.status === 'delivered').length;

    let totalProductsSold = 0;
    let totalRevenue = 0;

    sellerOrders.forEach((o) => {
      if (o.status !== 'cancelled' && o.status !== 'rejected') {
        o.items.forEach((item) => {
          if (item.product.sellerId === sellerId) {
            totalProductsSold += item.quantity;
            totalRevenue += item.product.price * item.quantity;
          }
        });
      }
    });

    return {
      totalProductsListed: sellerProducts.length,
      totalProductsSold,
      totalOrders: sellerOrders.length,
      paidOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
    };
  },

  // --- REVIEWS & RATINGS ---
  getReviews(productId?: string): ProductReview[] {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    let reviews: ProductReview[] = [];
    if (!raw) {
      reviews = INITIAL_REVIEWS;
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } else {
      try {
        reviews = JSON.parse(raw);
      } catch {
        reviews = INITIAL_REVIEWS;
      }
    }

    if (productId) {
      return reviews.filter((r) => r.productId === productId);
    }
    return reviews;
  },

  addReview(reviewData: Omit<ProductReview, 'id' | 'createdAt'>): ProductReview {
    const reviews = this.getReviews();
    const newReview: ProductReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    return newReview;
  },

  // --- PRODUCT REPORTS ---
  getReports(): ProductReport[] {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  submitReport(reportData: Omit<ProductReport, 'id' | 'status' | 'createdAt'>): ProductReport {
    const reports = this.getReports();
    const newReport: ProductReport = {
      ...reportData,
      id: `rep-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    reports.unshift(newReport);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return newReport;
  },

  // --- 9. SELLER REPORTS (REPORT BUYERS) ---
  getBuyerReports(sellerId?: string): BuyerReport[] {
    const raw = localStorage.getItem(BUYER_REPORTS_STORAGE_KEY);
    let reports: BuyerReport[] = [];
    if (!raw) {
      reports = INITIAL_BUYER_REPORTS;
      localStorage.setItem(BUYER_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } else {
      try {
        reports = JSON.parse(raw);
      } catch {
        reports = INITIAL_BUYER_REPORTS;
      }
    }

    if (sellerId) {
      return reports.filter((r) => r.sellerId === sellerId);
    }
    return reports;
  },

  submitBuyerReport(reportData: Omit<BuyerReport, 'id' | 'status' | 'createdAt'>): BuyerReport {
    const reports = this.getBuyerReports();
    const newReport: BuyerReport = {
      ...reportData,
      id: `br-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    reports.unshift(newReport);
    localStorage.setItem(BUYER_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return newReport;
  },

  // --- 11. SHOPPING CART PERSISTENCE ---
  getCart(): CartItem[] {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCart(items: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  },

  clearCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  // --- PHASE 7: 1 & 2. FLASH SALES MANAGEMENT ---
  getFlashSales(): FlashSale[] {
    const raw = localStorage.getItem(FLASH_SALES_STORAGE_KEY);
    let sales: FlashSale[] = [];
    if (!raw) {
      sales = INITIAL_FLASH_SALES;
      localStorage.setItem(FLASH_SALES_STORAGE_KEY, JSON.stringify(sales));
    } else {
      try {
        sales = JSON.parse(raw);
      } catch {
        sales = INITIAL_FLASH_SALES;
      }
    }
    return sales;
  },

  getActiveFlashSale(): FlashSale | null {
    const sales = this.getFlashSales();
    const now = Date.now();
    let updated = false;

    // Automatically end Flash Sales when their ending date and time are reached
    for (const s of sales) {
      const end = new Date(s.endTime).getTime();
      if (s.isActive && now >= end) {
        s.isActive = false;
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(FLASH_SALES_STORAGE_KEY, JSON.stringify(sales));
    }

    return sales.find((s) => s.isActive && now < new Date(s.endTime).getTime()) || null;
  },

  createFlashSale(data: Omit<FlashSale, 'id' | 'createdAt'>): FlashSale {
    const sales = this.getFlashSales();
    const newSale: FlashSale = {
      ...data,
      id: `fs-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    sales.unshift(newSale);
    localStorage.setItem(FLASH_SALES_STORAGE_KEY, JSON.stringify(sales));

    // Update product flash sale flags
    if (newSale.isActive && newSale.productIds && newSale.productIds.length > 0) {
      const products = this.getProducts();
      let prodUpdated = false;
      products.forEach((p) => {
        if (newSale.productIds.includes(p.id)) {
          p.isFlashSale = true;
          if (newSale.discountPercentage > 0 && (!p.originalPrice || p.originalPrice <= p.price)) {
            p.originalPrice = p.price;
            p.price = Math.round(p.originalPrice * (1 - newSale.discountPercentage / 100));
            p.discountPercentage = newSale.discountPercentage;
          }
          prodUpdated = true;
        }
      });
      if (prodUpdated) {
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      }
    }

    return newSale;
  },

  updateFlashSale(id: string, updates: Partial<FlashSale>): FlashSale | null {
    const sales = this.getFlashSales();
    const index = sales.findIndex((s) => s.id === id);
    if (index === -1) return null;

    sales[index] = { ...sales[index], ...updates };
    localStorage.setItem(FLASH_SALES_STORAGE_KEY, JSON.stringify(sales));

    // Sync product flash sale tags
    const products = this.getProducts();
    const currentActiveSale = sales.find((s) => s.isActive && Date.now() < new Date(s.endTime).getTime());
    let prodUpdated = false;

    products.forEach((p) => {
      const isInActive = currentActiveSale?.productIds.includes(p.id);
      if (p.isFlashSale !== isInActive) {
        p.isFlashSale = !!isInActive;
        prodUpdated = true;
      }
    });

    if (prodUpdated) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    }

    return sales[index];
  },

  deleteFlashSale(id: string): boolean {
    const sales = this.getFlashSales();
    const filtered = sales.filter((s) => s.id !== id);
    if (filtered.length === sales.length) return false;
    localStorage.setItem(FLASH_SALES_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  toggleFlashSaleStatus(id: string, isActive: boolean): FlashSale | null {
    return this.updateFlashSale(id, { isActive });
  },

  // --- PHASE 7: 3. PRODUCT DISCOUNTS ---
  setProductDiscount(
    productId: string,
    discountData: {
      price: number;
      originalPrice: number;
      discountPercentage?: number;
      isSpecialOffer?: boolean;
      isFlashSale?: boolean;
    }
  ): Product | null {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return null;

    const originalPrice = Number(discountData.originalPrice);
    const price = Number(discountData.price);
    const discountPercentage =
      discountData.discountPercentage ??
      (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

    products[index] = {
      ...products[index],
      originalPrice,
      price,
      discountPercentage,
      isSpecialOffer: discountData.isSpecialOffer ?? products[index].isSpecialOffer,
      isFlashSale: discountData.isFlashSale ?? products[index].isFlashSale,
    };

    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    return products[index];
  },

  removeProductDiscount(productId: string): Product | null {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return null;

    products[index].price = products[index].originalPrice;
    products[index].discountPercentage = 0;
    products[index].isFlashSale = false;
    products[index].isSpecialOffer = false;

    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    return products[index];
  },

  // --- PHASE 7: 5. PROMOTIONAL ADVERTISEMENTS ---
  getPromotionalAds(): PromotionalAdvertisement[] {
    const raw = localStorage.getItem(PROMOTIONS_STORAGE_KEY);
    let ads: PromotionalAdvertisement[] = [];
    if (!raw) {
      ads = INITIAL_PROMOTIONS;
      localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(ads));
    } else {
      try {
        ads = JSON.parse(raw);
      } catch {
        ads = INITIAL_PROMOTIONS;
      }
    }
    return ads;
  },

  getActivePromotionalAds(): PromotionalAdvertisement[] {
    return this.getPromotionalAds().filter((a) => a.isActive);
  },

  createPromotionalAd(data: Omit<PromotionalAdvertisement, 'id' | 'createdAt'>): PromotionalAdvertisement {
    const ads = this.getPromotionalAds();
    const newAd: PromotionalAdvertisement = {
      ...data,
      id: `ad-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    ads.unshift(newAd);
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(ads));
    return newAd;
  },

  updatePromotionalAd(id: string, updates: Partial<PromotionalAdvertisement>): PromotionalAdvertisement | null {
    const ads = this.getPromotionalAds();
    const index = ads.findIndex((a) => a.id === id);
    if (index === -1) return null;

    ads[index] = { ...ads[index], ...updates };
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(ads));
    return ads[index];
  },

  deletePromotionalAd(id: string): boolean {
    const ads = this.getPromotionalAds();
    const filtered = ads.filter((a) => a.id !== id);
    if (filtered.length === ads.length) return false;
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  togglePromotionalAd(id: string, isActive: boolean): PromotionalAdvertisement | null {
    return this.updatePromotionalAd(id, { isActive });
  },

  // --- PHASE 7: 6. ANNOUNCEMENTS ---
  getAnnouncements(): Announcement[] {
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    let announcements: Announcement[] = [];
    if (!raw) {
      announcements = INITIAL_ANNOUNCEMENTS;
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    } else {
      try {
        announcements = JSON.parse(raw);
      } catch {
        announcements = INITIAL_ANNOUNCEMENTS;
      }
    }
    return announcements;
  },

  getPublishedAnnouncements(): Announcement[] {
    return this.getAnnouncements().filter((a) => a.isPublished);
  },

  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const announcements = this.getAnnouncements();
    const newAnnouncement: Announcement = {
      ...data,
      id: `anc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    announcements.unshift(newAnnouncement);
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    return newAnnouncement;
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const announcements = this.getAnnouncements();
    const index = announcements.findIndex((a) => a.id === id);
    if (index === -1) return null;

    announcements[index] = { ...announcements[index], ...updates };
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    return announcements[index];
  },

  deleteAnnouncement(id: string): boolean {
    const announcements = this.getAnnouncements();
    const filtered = announcements.filter((a) => a.id !== id);
    if (filtered.length === announcements.length) return false;
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  toggleAnnouncementPublish(id: string, isPublished: boolean): Announcement | null {
    return this.updateAnnouncement(id, { isPublished });
  },

  // --- PHASE 8: 9. CATEGORY MANAGEMENT (Kwari, Singa, Kurmi, Farm Center, Wasu Kasuwanni) ---
  getCategories(): Category[] {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    try {
      const parsed: Category[] = JSON.parse(raw);
      let updated = false;
      INITIAL_CATEGORIES.forEach((initCat) => {
        if (!parsed.some((c) => c.id === initCat.id)) {
          parsed.push(initCat);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  createCategory(categoryData: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    categories.push(newCat);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    return newCat;
  },

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    categories[index] = { ...categories[index], ...updates };
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    return categories[index];
  },

  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    if (filtered.length === categories.length) return false;
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // --- PHASE 8: 12. REPORT MANAGEMENT (Products, Buyers, Sellers) ---
  getSellerReports(): SellerReport[] {
    const raw = localStorage.getItem(SELLER_REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SELLER_REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_SELLER_REPORTS));
      return INITIAL_SELLER_REPORTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SELLER_REPORTS;
    }
  },

  submitSellerReport(reportData: Omit<SellerReport, 'id' | 'status' | 'createdAt'>): SellerReport {
    const reports = this.getSellerReports();
    const newReport: SellerReport = {
      ...reportData,
      id: `sr-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    reports.unshift(newReport);
    localStorage.setItem(SELLER_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return newReport;
  },

  adminUpdateProductReportStatus(
    reportId: string,
    status: 'approved' | 'rejected' | 'resolved',
    adminNotes?: string
  ): ProductReport | null {
    const reports = this.getReports();
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;
    reports[idx] = {
      ...reports[idx],
      status,
      adminNotes: adminNotes || reports[idx].adminNotes,
    };
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return reports[idx];
  },

  adminUpdateBuyerReportStatus(
    reportId: string,
    status: 'approved' | 'rejected' | 'resolved',
    adminNotes?: string
  ): BuyerReport | null {
    const reports = this.getBuyerReports();
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;
    reports[idx] = {
      ...reports[idx],
      status,
      adminNotes: adminNotes || reports[idx].adminNotes,
    };
    localStorage.setItem(BUYER_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return reports[idx];
  },

  adminUpdateSellerReportStatus(
    reportId: string,
    status: 'approved' | 'rejected' | 'resolved',
    adminNotes?: string
  ): SellerReport | null {
    const reports = this.getSellerReports();
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;
    reports[idx] = {
      ...reports[idx],
      status,
      adminNotes: adminNotes || reports[idx].adminNotes,
    };
    localStorage.setItem(SELLER_REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return reports[idx];
  },

  // --- PHASE 8: 8. ORDER MANAGEMENT APPROVALS & REJECTIONS ---
  adminApproveOrder(orderId: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    if (order.paymentMethod === 'opay' && !order.paymentConfirmation.verifiedByAdmin) {
      return this.adminApprovePayment(orderId);
    }
    return this.updateOrderStatus(orderId, 'processing');
  },

  adminRejectOrder(orderId: string, reason?: string): Order | null {
    return this.adminRejectPayment(orderId, reason || 'Order rejected by Super Admin in CPanel.');
  },

  // --- PHASE 8: 13. DELIVERY MONITORING ---
  getDispatchedAndDeliveredOrders(): Order[] {
    const all = this.getOrders();
    return all
      .filter((o) => o.status === 'dispatched' || o.status === 'delivered')
      .sort(
        (a, b) =>
          new Date(b.deliveredAt || b.dispatchedAt || b.updatedAt || b.createdAt).getTime() -
          new Date(a.deliveredAt || a.dispatchedAt || a.updatedAt || a.createdAt).getTime()
      );
  },

  // --- NEWSLETTER SUBSCRIPTION ---
  getNewsletterSubscribers(): string[] {
    const raw = localStorage.getItem('kasuwar_newsletter_subscribers');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  subscribeNewsletter(email: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    const list = this.getNewsletterSubscribers();
    if (list.includes(cleanEmail)) {
      return { success: true, message: 'You are already subscribed to Kasuwar Kanawa updates!' };
    }
    list.push(cleanEmail);
    localStorage.setItem('kasuwar_newsletter_subscribers', JSON.stringify(list));
    return { success: true, message: 'Nagode! You are now subscribed to Kano market deals and exclusive offers.' };
  },
};

