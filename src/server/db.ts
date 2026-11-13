import fs from 'fs';
import os from 'os';
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
  StoreSettings,
  HeroSlide,
  StockNotificationRequest
} from '../types/index.ts';

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), '.data');
const BUNDLED_DB_FILE = path.resolve(BUNDLED_DATA_DIR, 'db.json');
const TMP_DATA_DIR = path.join(os.tmpdir(), '4laazy-data');
const IS_SERVERLESS_RO = Boolean(
  process.env.VERCEL ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

let activeDataDir = IS_SERVERLESS_RO ? TMP_DATA_DIR : BUNDLED_DATA_DIR;
function getDbFilePath() {
  return path.resolve(activeDataDir, 'db.json');
}

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
  stockNotifications: StockNotificationRequest[];
}

// In-memory cache synced with disk
let db: DatabaseSchema | null = null;
let pendingMongoSync: Promise<any> | null = null;

export function getPendingMongoSync(): Promise<any> | null {
  return pendingMongoSync;
}

export function trackMongoOp(op: Promise<any>) {
  const prev = pendingMongoSync;
  const chained = (prev ? prev.catch(() => {}).then(() => op) : op)
    .catch(err => {
      console.warn('MongoDB sync operation warning:', err?.message || err);
    })
    .finally(() => {
      if (pendingMongoSync === chained) {
        pendingMongoSync = null;
      }
    });
  pendingMongoSync = chained;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(activeDataDir)) {
      fs.mkdirSync(activeDataDir, { recursive: true });
    }
  } catch (err: any) {
    if (err?.code === 'EROFS' || err?.code === 'EACCES' || err?.code === 'EPERM') {
      activeDataDir = TMP_DATA_DIR;
      if (!fs.existsSync(activeDataDir)) {
        fs.mkdirSync(activeDataDir, { recursive: true });
      }
    } else {
      throw err;
    }
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
      name: '4LAAZY Founder & Lead Admin',
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
          street: 'Flat 402, Skyline Residency, Road No. 36, Jubilee Hills',
          apartment: 'Near Jubilee Checkpost',
          city: 'Hyderabad',
          state: 'Telangana',
          pinCode: '500033',
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
        street: 'Flat 402, Skyline Residency, Road No. 36, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pinCode: '500033',
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
        statusNotes: 'In transit to Hyderabad Hub'
      },
      internalNotes: 'VIP customer, included 4LAAZY brass monogram pin gift.',
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
      subject: 'Your 4LAAZY Order #4L-2026-1001 is on the way',
      type: 'shipping_update',
      sentAt: '2026-03-02T14:30:00Z',
      status: 'delivered',
      previewHtml: '<h1>4LAAZY</h1><p>Hey Aryan, your package has been handed over to Blue Dart Express. Tracking: BLUEDART-847291038</p>'
    }
  ];

  const settings: StoreSettings = {
    brandName: '4LAAZY',
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
    heroImages: [
      heroImg,
      lookbookImg,
      teeImg,
      '/assets/images/tshirt_acid_wash_1794456303446.jpg',
      '/assets/images/tshirt_polo_neck_1794456301588.jpg'
    ],
    heroSlides: [
      {
        id: 'hero_slide_1',
        imageUrl: heroImg,
        eyebrow: 'HYDERABAD · THE ARCHITECTURAL T-SHIRT HOUSE',
        heading: 'LESS EFFORT.\nMORE STYLE.',
        subhead: '280–320 GSM heavyweight combed cotton Round Neck T-shirts engineered for an everyday crisp collar.',
        linkType: 'category',
        linkTarget: 'Round Neck T-Shirt'
      },
      {
        id: 'hero_slide_2',
        imageUrl: lookbookImg,
        eyebrow: 'DROP SHOULDER ARCHITECTURE',
        heading: 'DOWN SHOULDER\nSILHOUETTES.',
        subhead: 'Boxy dropped-shoulder drapes with clean garment-washed pigments built for effortless layering.',
        linkType: 'category',
        linkTarget: 'Down Shoulder T-Shirt'
      },
      {
        id: 'hero_slide_3',
        imageUrl: '/assets/images/tshirt_polo_neck_1794456301588.jpg',
        eyebrow: 'INTERLOCK KNIT COLLARS',
        heading: 'PRECISION\nKNIT POLOS.',
        subhead: 'Structured 290 GSM interlock knit Polo Neck T-shirts that hold architectural form all day.',
        linkType: 'category',
        linkTarget: 'Polo Neck T-Shirt'
      },
      {
        id: 'hero_slide_4',
        imageUrl: '/assets/images/tshirt_acid_wash_1794456303446.jpg',
        eyebrow: 'SMALL-BATCH COLLECTOR DROP',
        heading: 'LIMITED\nARCHIVE PIECES.',
        subhead: 'Numbered acid-wash and limited graphic editions crafted in micro production runs.',
        linkType: 'category',
        linkTarget: 'Limited Design'
      },
      {
        id: 'hero_slide_5',
        imageUrl: '/assets/images/tshirt_custom_print_1794456303137.jpg',
        eyebrow: 'CUSTOM PRINT STUDIO',
        heading: 'YOUR ARTWORK.\nOUR HEAVY BLANK.',
        subhead: 'Preview how the print settles across 4 sample angles and upload your own graphic directly.',
        linkType: 'category',
        linkTarget: 'Customise T-Shirt'
      }
    ],
    campaignTitle: 'THE BRUTALIST MONOLITH',
    campaignDescription: 'Stripped of excess ornamentation. Raw unbrushed French Terry, drop-shoulder geometry, and muted industrial pigments crafted for timeless daily wear.',
    campaignImageUrl: lookbookImg,
    razorpayKeyId: 'rzp_test_4LAZYStoreDemo',
    stripePublicKey: 'pk_test_4LAZYStoreDemo',
    cashfreeAppId: 'TEST1029384756CF',
    cashfreeEnvironment: 'sandbox',
    codEnabled: true,
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
    wishlists: {},
    stockNotifications: []
  };
}

export function getDB(): DatabaseSchema {
  if (db) return db;

  ensureDataDir();
  const dbFile = getDbFilePath();
  const sourceFile = fs.existsSync(dbFile)
    ? dbFile
    : fs.existsSync(BUNDLED_DB_FILE)
      ? BUNDLED_DB_FILE
      : null;

  if (sourceFile) {
    try {
      const raw = fs.readFileSync(sourceFile, 'utf-8');
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
        if (!hasExactSixCategories || !Array.isArray(db.products)) {
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
        } else {
          if (!db.settings.cashfreeAppId) {
            db.settings.cashfreeAppId = fullSeed.settings.cashfreeAppId;
            db.settings.cashfreeEnvironment = fullSeed.settings.cashfreeEnvironment || 'sandbox';
            needsSave = true;
          }
          if (db.settings.codEnabled === undefined) {
            db.settings.codEnabled = true;
            needsSave = true;
          }
          if (db.settings.brandName === '4 LAZY') {
            db.settings.brandName = '4LAAZY';
            needsSave = true;
          }
          if (!Array.isArray(db.settings.heroImages) || db.settings.heroImages.length < 4) {
            db.settings.heroImages = [
              db.settings.heroImageUrl || '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
              '/assets/images/campaign_editorial_lookbook_1794056022183.jpg',
              '/assets/images/product_oversized_heavy_tee_1794056020516.jpg',
              '/assets/images/tshirt_acid_wash_1794456303446.jpg',
              '/assets/images/tshirt_polo_neck_1794456301588.jpg'
            ];
            needsSave = true;
          }
          if (!Array.isArray(db.settings.heroSlides) || db.settings.heroSlides.length === 0) {
            const seedSlides: HeroSlide[] = [
              {
                id: 'hero_slide_1',
                imageUrl: db.settings.heroImages[0] || '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
                eyebrow: 'HYDERABAD · THE ARCHITECTURAL T-SHIRT HOUSE',
                heading: db.settings.heroHeading || 'LESS EFFORT.\nMORE STYLE.',
                subhead:
                  db.settings.heroSubhead ||
                  '280–320 GSM heavyweight combed cotton Round Neck T-shirts engineered for an everyday crisp collar.',
                linkType: 'category',
                linkTarget: 'Round Neck T-Shirt'
              },
              {
                id: 'hero_slide_2',
                imageUrl: db.settings.heroImages[1] || '/assets/images/campaign_editorial_lookbook_1794056022183.jpg',
                eyebrow: 'DROP SHOULDER ARCHITECTURE',
                heading: 'DOWN SHOULDER\nSILHOUETTES.',
                subhead: 'Boxy dropped-shoulder drapes with clean garment-washed pigments built for effortless layering.',
                linkType: 'category',
                linkTarget: 'Down Shoulder T-Shirt'
              },
              {
                id: 'hero_slide_3',
                imageUrl: db.settings.heroImages[4] || '/assets/images/tshirt_polo_neck_1794456301588.jpg',
                eyebrow: 'INTERLOCK KNIT COLLARS',
                heading: 'PRECISION\nKNIT POLOS.',
                subhead: 'Structured 290 GSM interlock knit Polo Neck T-shirts that hold architectural form all day.',
                linkType: 'category',
                linkTarget: 'Polo Neck T-Shirt'
              },
              {
                id: 'hero_slide_4',
                imageUrl: db.settings.heroImages[3] || '/assets/images/tshirt_acid_wash_1794456303446.jpg',
                eyebrow: 'SMALL-BATCH COLLECTOR DROP',
                heading: 'LIMITED\nARCHIVE PIECES.',
                subhead: 'Numbered acid-wash and limited graphic editions crafted in micro production runs.',
                linkType: 'category',
                linkTarget: 'Limited Design'
              },
              {
                id: 'hero_slide_5',
                imageUrl: '/assets/images/tshirt_custom_print_1794456303137.jpg',
                eyebrow: 'CUSTOM PRINT STUDIO',
                heading: 'YOUR ARTWORK.\nOUR HEAVY BLANK.',
                subhead: 'Preview how the print settles across 4 sample angles and upload your own graphic directly.',
                linkType: 'category',
                linkTarget: 'Customise T-Shirt'
              }
            ];
            db.settings.heroSlides = seedSlides;
            needsSave = true;
          }
        }
        db.returnRequests = db.returnRequests || [];
        db.carts = db.carts || {};
        db.wishlists = db.wishlists || {};
        db.stockNotifications = db.stockNotifications || [];

        // Upgrade seeded products that still have < 4 slides to 4 photo slides
        for (const p of db.products) {
          const seedMatch = (fullSeed.products as Product[]).find(sp => sp.id === p.id);
          if (seedMatch && p.colorGroups[0] && p.colorGroups[0].images.length < 4 && seedMatch.colorGroups[0]?.images.length >= 4) {
            p.colorGroups = seedMatch.colorGroups;
            p.variants = p.variants.map(v => {
              const sv = seedMatch.variants.find(mv => mv.id === v.id);
              return sv && v.images.length < 4 ? { ...v, images: sv.images } : v;
            });
            needsSave = true;
          }
        }

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

function writeLocalSnapshot() {
  if (!db) return;
  const serialized = JSON.stringify(db, null, 2);
  try {
    ensureDataDir();
    const dbFile = getDbFilePath();
    const tempFile = `${dbFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, dbFile);
  } catch (err: any) {
    if (err?.code === 'EROFS' || err?.code === 'EACCES' || err?.code === 'EPERM') {
      if (activeDataDir !== TMP_DATA_DIR) {
        activeDataDir = TMP_DATA_DIR;
        try {
          if (!fs.existsSync(activeDataDir)) {
            fs.mkdirSync(activeDataDir, { recursive: true });
          }
          const dbFile = getDbFilePath();
          const tempFile = `${dbFile}.tmp.${Date.now()}`;
          fs.writeFileSync(tempFile, serialized, 'utf-8');
          fs.renameSync(tempFile, dbFile);
          return;
        } catch (retryErr) {
          console.warn('Warning writing temp snapshot:', retryErr);
        }
      }
    } else {
      console.error('Error saving db.json:', err);
    }
  }
}

export function hydrateDbFromMongo(mongoData: Partial<DatabaseSchema>) {
  if (!db) {
    db = getDB();
  }
  if (Array.isArray(mongoData.products) && mongoData.products.length > 0) {
    db.products = mongoData.products;
  }
  if (Array.isArray(mongoData.categories) && mongoData.categories.length > 0) {
    db.categories = mongoData.categories;
  }
  if (Array.isArray(mongoData.users) && mongoData.users.length > 0) {
    db.users = mongoData.users;
  }
  if (mongoData.passwords && Object.keys(mongoData.passwords).length > 0) {
    db.passwords = { ...db.passwords, ...mongoData.passwords };
  }
  if (Array.isArray(mongoData.orders)) {
    db.orders = mongoData.orders;
  }
  if (Array.isArray(mongoData.coupons)) {
    db.coupons = mongoData.coupons;
  }
  if (Array.isArray(mongoData.returnRequests)) {
    db.returnRequests = mongoData.returnRequests;
  }
  if (Array.isArray(mongoData.reviews)) {
    db.reviews = mongoData.reviews;
  }
  if (Array.isArray(mongoData.stockNotifications)) {
    db.stockNotifications = mongoData.stockNotifications;
  }
  if (mongoData.settings) {
    db.settings = { ...db.settings, ...mongoData.settings };
  }
  writeLocalSnapshot();
}

export function saveDB() {
  if (!db) return;
  writeLocalSnapshot();

  // If MongoDB Atlas is connected, replicate changes and expose promise for serverless flushing
  if (isMongoConnected()) {
    trackMongoOp(syncLocalToMongo(db));
  }
}
