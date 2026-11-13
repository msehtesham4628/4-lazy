import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { syncLocalToMongo, isMongoConnected } from './mongodb.ts';
import { getFullSeedData } from './seedData.ts';
import type {
  Product,
  Category,
  User,
  Order,
  ReturnRequest,
  Coupon,
  Review,
  InventoryTransaction,
  AdminActivityLog,
  EmailLog,
  StoreSettings
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  otps: Record<string, { code: string; expiresAt: number }>; // email -> OTP
  products: Product[];
  categories: Category[];
  orders: Order[];
  returnRequests: ReturnRequest[];
  coupons: Coupon[];
  reviews: Review[];
  inventoryTransactions: InventoryTransaction[];
  adminLogs: AdminActivityLog[];
  emailLogs: EmailLog[];
  settings: StoreSettings;
  carts: Record<string, any>; // userId or guestId -> cart
  wishlists: Record<string, string[]>; // userId -> productIds[]
}

// In-memory cache synced with disk
let db: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getInitialSeedData(): DatabaseSchema {
  const adminId = 'usr_admin_001';
  const customerId = 'usr_cust_001';
  const passwordSalt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', passwordSalt);
  const customerHash = bcrypt.hashSync('lazy123', passwordSalt);

  const heroImg = '/assets/images/hero_streetwear_campaign_1794056018871.jpg';
  const teeImg = '/assets/images/product_oversized_heavy_tee_1794056020516.jpg';
  const hoodieImg = '/assets/images/product_streetwear_hoodie_1794056020931.jpg';
  const cargoImg = '/assets/images/product_cargo_trousers_1794056021752.jpg';
  const lookbookImg = '/assets/images/campaign_editorial_lookbook_1794056022183.jpg';
  const logoImg = '/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png';

  const fullSeed = getFullSeedData() as any;
  const categories: Category[] = fullSeed.categories;
  const products: Product[] = fullSeed.products;

  const coupons: Coupon[] = [
    {
      id: 'cpn_lazy10',
      code: 'LAZY10',
      type: 'percent',
      value: 10,
      minOrderValue: 1499,
      maxDiscount: 1000,
      expiresAt: '2027-12-31T23:59:59Z',
      usageLimit: 1000,
      usedCount: 84,
      isActive: true
    },
    {
      id: 'cpn_first4l',
      code: 'FIRST4L',
      type: 'fixed',
      value: 500,
      minOrderValue: 2499,
      expiresAt: '2027-12-31T23:59:59Z',
      usageLimit: 500,
      usedCount: 132,
      isActive: true
    },
    {
      id: 'cpn_oversized20',
      code: 'OVERSIZED20',
      type: 'percent',
      value: 20,
      minOrderValue: 3999,
      maxDiscount: 1500,
      expiresAt: '2027-06-30T23:59:59Z',
      usageLimit: 200,
      usedCount: 47,
      isActive: true
    }
  ];

  const users: User[] = [
    {
      id: adminId,
      name: '4 LAZY Founder & Lead Admin',
      email: 'admin@4lazyfashion.com',
      phone: '+919876543210',
      role: 'admin',
      isEmailVerified: true,
      addresses: [],
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: customerId,
      name: 'Aryan Verma',
      email: 'aryan@example.com',
      phone: '+919811223344',
      role: 'customer',
      isEmailVerified: true,
      addresses: [
        {
          id: 'addr_01',
          fullName: 'Aryan Verma',
          phone: '+919811223344',
          street: 'Flat 402, Skyline Residency, Bandra West',
          apartment: 'Near Linking Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400050',
          country: 'India',
          isDefault: true
        }
      ],
      createdAt: '2026-02-10T12:00:00Z'
    }
  ];

  const orders: Order[] = [
    {
      id: 'ord_1001',
      orderNumber: '4L-2026-1001',
      userId: customerId,
      customer: {
        name: 'Aryan Verma',
        email: 'aryan@example.com',
        phone: '+919811223344'
      },
      shippingAddress: {
        id: 'addr_01',
        fullName: 'Aryan Verma',
        phone: '+919811223344',
        street: 'Flat 402, Skyline Residency, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400050',
        country: 'India',
        isDefault: true
      },
      items: [
        {
          productId: 'prod_heavy_tee_01',
          variantId: 'var_tee_wb_l',
          productTitle: 'Heavyweight Oversized Box Tee',
          colorName: 'Washed Black',
          size: 'L',
          sku: '4L-TEE-WB-L',
          price: 1699,
          quantity: 1,
          image: teeImg
        },
        {
          productId: 'prod_hoodie_01',
          variantId: 'var_hood_vc_l',
          productTitle: '500 GSM French Terry Boxy Hoodie',
          colorName: 'Vintage Charcoal',
          size: 'L',
          sku: '4L-HD-VC-L',
          price: 3899,
          quantity: 1,
          image: hoodieImg
        }
      ],
      subtotal: 5598,
      discount: 500,
      shippingFee: 0,
      tax: 254.9,
      total: 5352.9,
      payment: {
        provider: 'upi',
        transactionId: 'pay_rzp_live_998124',
        status: 'completed',
        paidAt: '2026-03-01T15:20:00Z',
        amount: 5352.9,
        currency: 'INR'
      },
      status: 'Shipped',
      statusHistory: [
        { status: 'Order Placed', timestamp: '2026-03-01T15:20:00Z' },
        { status: 'Confirmed', timestamp: '2026-03-01T15:35:00Z', note: 'Payment verified via Razorpay UPI.' },
        { status: 'Packed', timestamp: '2026-03-02T10:00:00Z', note: 'Inspected and packaged in biodegradable luxury matte box.' },
        { status: 'Shipped', timestamp: '2026-03-02T14:30:00Z', note: 'Dispatched via Blue Dart Express courier.' }
      ],
      tracking: {
        courierCompany: 'Blue Dart Express',
        trackingNumber: 'BLUEDART-847291038',
        trackingUrl: 'https://www.bluedart.com/tracking?trackNumber=BLUEDART-847291038',
        dispatchDate: '2026-03-02',
        estimatedDeliveryDate: '2026-03-05',
        statusNotes: 'In transit to Mumbai Hub'
      },
      internalNotes: 'VIP customer, included 4 LAZY brass monogram pin gift.',
      createdAt: '2026-03-01T15:20:00Z'
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev_01',
      productId: 'prod_heavy_tee_01',
      userName: 'Rohan M.',
      rating: 5,
      title: 'Unbelievable fabric weight & collar structure',
      comment: 'Honestly better quality than my €120 European tees. The collar stays crisp even after 5 washes and the drop shoulder cut is perfection.',
      verifiedPurchase: true,
      createdAt: '2026-02-28T14:10:00Z'
    },
    {
      id: 'rev_02',
      productId: 'prod_hoodie_01',
      userName: 'Tanya K.',
      rating: 5,
      title: 'Worth every single rupee',
      comment: 'The 500 GSM fleece has so much structure. Doesn\'t collapse at the neck and looks so sculptural. Best streetwear purchase this season.',
      verifiedPurchase: true,
      createdAt: '2026-02-25T11:42:00Z'
    }
  ];

  const inventoryTransactions: InventoryTransaction[] = [
    {
      id: 'inv_tx_01',
      productId: 'prod_heavy_tee_01',
      productTitle: 'Heavyweight Oversized Box Tee',
      variantSku: '4L-TEE-WB-L',
      colorName: 'Washed Black',
      size: 'L',
      change: -1,
      previousStock: 43,
      newStock: 42,
      reason: 'Order #4L-2026-1001 fulfillment',
      timestamp: '2026-03-01T15:20:00Z'
    }
  ];

  const adminLogs: AdminActivityLog[] = [
    {
      id: 'log_01',
      adminEmail: 'admin@4lazyfashion.com',
      action: 'ORDER_DISPATCHED',
      details: 'Assigned courier tracking BLUEDART-847291038 to order 4L-2026-1001',
      timestamp: '2026-03-02T14:30:00Z'
    }
  ];

  const emailLogs: EmailLog[] = [
    {
      id: 'eml_01',
      to: 'aryan@example.com',
      subject: 'Your 4 LAZY Order #4L-2026-1001 is on the way',
      type: 'shipping_update',
      sentAt: '2026-03-02T14:30:00Z',
      status: 'delivered',
      previewHtml: '<h1>4 LAZY</h1><p>Hey Aryan, your package has been handed over to Blue Dart Express. Tracking: BLUEDART-847291038</p>'
    }
  ];

  const settings: StoreSettings = {
    brandName: '4 LAZY',
    tagline: 'Less Effort. More Style.',
    logoUrl: logoImg,
    contactEmail: 'concierge@4lazyfashion.com',
    contactPhone: '+91 80004 52999',
    currency: 'INR',
    taxRatePercent: 5,
    freeShippingThreshold: 1999,
    standardShippingFee: 99,
    expressShippingFee: 199,
    announcements: [
      'COMPLIMENTARY SHIPPING ACROSS INDIA ON ORDERS OVER ₹1,999',
      'DROP 04 / BRUTALIST HEAVYWEIGHTS NOW LIVE',
      'USE CODE "FIRST4L" FOR ₹500 OFF YOUR FIRST ORDER'
    ],
    heroHeading: 'LESS EFFORT. MORE STYLE.',
    heroSubhead: 'Engineered for the contemporary vanguard. Architectural heavyweight silhouettes, custom 280-500 GSM loopback knits, and uncompromising minimal tailoring.',
    heroButtonText: 'SHOP DROP 04',
    heroImageUrl: heroImg,
    campaignTitle: 'THE BRUTALIST MONOLITH',
    campaignDescription: 'Stripped of excess ornamentation. Raw unbrushed French Terry, drop-shoulder geometry, and muted industrial pigments crafted for timeless daily wear.',
    campaignImageUrl: lookbookImg,
    razorpayKeyId: 'rzp_test_4LAZYStoreDemo',
    stripePublicKey: 'pk_test_4LAZYStoreDemo',
    cashfreeAppId: 'TEST1029384756CF',
    cashfreeEnvironment: 'sandbox',
    isTestMode: true
  };

  return {
    users,
    passwords: {
      [adminId]: adminHash,
      [customerId]: customerHash
    },
    otps: {},
    products,
    categories,
    orders,
    returnRequests: [
      {
        id: 'ret_1001',
        orderId: 'ord_1001',
        orderNumber: '4L-2026-1001',
        customerName: 'Aryan Verma',
        customerEmail: 'aryan@example.com',
        customerPhone: '+919811223344',
        reason: 'Size Exchange',
        details: 'Wanted to exchange Heavyweight Box Tee from Size L to Size XL for a more exaggerated drop-shoulder drape.',
        items: [
          {
            productId: 'prod_heavy_tee_01',
            productTitle: 'Heavyweight Oversized Box Tee',
            variantSku: '4L-TEE-WB-L',
            size: 'L',
            colorName: 'Washed Black',
            quantity: 1,
            price: 1699
          }
        ],
        refundAmount: 1699,
        status: 'Pickup Scheduled',
        pickupAwb: 'BLUE-RET-9921448',
        notes: 'Reverse pickup scheduled via Blue Dart reverse logistics.',
        createdAt: '2026-03-03T11:00:00Z',
        updatedAt: '2026-03-03T14:00:00Z'
      }
    ],
    coupons,
    reviews,
    inventoryTransactions,
    adminLogs,
    emailLogs,
    settings,
    carts: {},
    wishlists: {}
  };
}

export function getDB(): DatabaseSchema {
  if (db) return db;

  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      if (db) {
        const fullSeed = getFullSeedData() as any;
        const hasExactSixCategories =
          Array.isArray(db.categories) &&
          db.categories.length === 6 &&
          db.categories.some(c => c.slug === 'round-neck-t-shirt') &&
          db.categories.some(c => c.slug === 'polo-neck-t-shirt') &&
          db.categories.some(c => c.slug === 'down-shoulder-t-shirt') &&
          db.categories.some(c => c.slug === 'customise-t-shirt') &&
          db.categories.some(c => c.slug === 'laazy-designs') &&
          db.categories.some(c => c.slug === 'limited-design');

        let needsSave = false;
        if (!hasExactSixCategories || !db.products || db.products.length < 24) {
          db.products = fullSeed.products;
          db.categories = fullSeed.categories;
          needsSave = true;
        }
        if (!db.users || db.users.length < 6) {
          db.users = fullSeed.users;
          db.passwords = { ...fullSeed.passwords, ...(db.passwords || {}) };
          needsSave = true;
        }
        if (!db.settings) {
          db.settings = fullSeed.settings;
          needsSave = true;
        } else if (!db.settings.cashfreeAppId) {
          db.settings.cashfreeAppId = fullSeed.settings.cashfreeAppId;
          db.settings.cashfreeEnvironment = fullSeed.settings.cashfreeEnvironment || 'sandbox';
          needsSave = true;
        }
        db.returnRequests = db.returnRequests || [];
        db.carts = db.carts || {};
        db.wishlists = db.wishlists || {};
        if (needsSave) {
          saveDB();
        }
        return db;
      }
    } catch (err) {
      console.warn('Failed to parse existing db.json, re-initializing with seed data', err);
    }
  }

  db = getInitialSeedData();
  saveDB();
  return db;
}

export function setDB(updatedDB: Partial<DatabaseSchema>): DatabaseSchema {
  if (!db) {
    db = getDB();
  }
  db = { ...db, ...updatedDB } as DatabaseSchema;
  saveDB();
  return db;
}

export function saveDB() {
  if (!db) return;
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // If MongoDB Atlas is connected, asynchronously replicate changes
    if (isMongoConnected()) {
      syncLocalToMongo(db).catch(err => {
        console.warn('MongoDB background synchronization warning:', err?.message || err);
      });
    }
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}
