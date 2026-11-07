import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  Product,
  Category,
  User,
  Order,
  Coupon,
  Review,
  InventoryTransaction,
  AdminActivityLog,
  EmailLog,
  StoreSettings
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  otps: Record<string, { code: string; expiresAt: number }>; // email -> OTP
  products: Product[];
  categories: Category[];
  orders: Order[];
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

  const heroImg = '/src/assets/images/hero_streetwear_campaign_1794056018871.jpg';
  const teeImg = '/src/assets/images/product_oversized_heavy_tee_1794056020516.jpg';
  const hoodieImg = '/src/assets/images/product_streetwear_hoodie_1794056020931.jpg';
  const cargoImg = '/src/assets/images/product_cargo_trousers_1794056021752.jpg';
  const lookbookImg = '/src/assets/images/campaign_editorial_lookbook_1794056022183.jpg';
  const logoImg = '/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png';

  const categories: Category[] = [
    { id: 'cat_oversized_tees', slug: 'oversized-t-shirts', name: 'Oversized T-Shirts', description: '280 GSM combed luxury cotton with exaggerated drop-shoulder drape.', itemCount: 14 },
    { id: 'cat_hoodies', slug: 'hoodies-sweatshirts', name: 'Hoodies & Sweatshirts', description: '500 GSM French Terry heavy boxy hoodies engineered for structure.', itemCount: 9 },
    { id: 'cat_trousers', slug: 'trousers-cargo', name: 'Trousers & Cargo', description: 'Tailored utilitarian cargos and relaxed wide-leg trousers.', itemCount: 8 },
    { id: 'cat_jackets', slug: 'jackets-outerwear', name: 'Jackets & Outerwear', description: 'Brutalist minimalist zip jackets, chore coats, and overshirts.', itemCount: 6 },
    { id: 'cat_joggers', slug: 'joggers-sweatpants', name: 'Joggers & Sweatpants', description: 'Heavyweight cuffed sweatpants with custom ribbed hems.', itemCount: 5 },
    { id: 'cat_accessories', slug: 'accessories', name: 'Accessories', description: 'Tactical crossbody pouches, beanies, and solid brass accessories.', itemCount: 4 }
  ];

  const products: Product[] = [
    {
      id: 'prod_heavy_tee_01',
      slug: 'heavyweight-oversized-box-tee',
      title: 'Heavyweight Oversized Box Tee',
      subtitle: '280 GSM Combed Cotton · Drop-Shoulder Silhouette',
      description: 'The definitive everyday streetwear silhouette. Crafted from custom-knit 280 GSM combed cotton jersey, pre-shrunk with a vintage garment wash. Features an exaggerated drop-shoulder cut, structured rib collar that retains its shape, and clean double-needle hems.',
      category: 'Oversized T-Shirts',
      tags: ['Bestseller', 'Heavyweight', 'Oversized', 'Streetwear'],
      basePrice: 1999,
      discountPrice: 1699,
      isFeatured: true,
      isPublished: true,
      colorGroups: [
        { colorName: 'Washed Black', colorHex: '#1c1b1f', images: [teeImg, heroImg] },
        { colorName: 'Vintage Bone', colorHex: '#ebe7df', images: [cargoImg, heroImg] },
        { colorName: 'Charcoal Grey', colorHex: '#3b3b40', images: [hoodieImg, teeImg] }
      ],
      variants: [
        { id: 'var_tee_wb_s', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'S', sku: '4L-TEE-WB-S', stock: 24, images: [teeImg, heroImg] },
        { id: 'var_tee_wb_m', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'M', sku: '4L-TEE-WB-M', stock: 38, images: [teeImg, heroImg] },
        { id: 'var_tee_wb_l', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'L', sku: '4L-TEE-WB-L', stock: 42, images: [teeImg, heroImg] },
        { id: 'var_tee_wb_xl', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'XL', sku: '4L-TEE-WB-XL', stock: 18, images: [teeImg, heroImg] },
        { id: 'var_tee_wb_xxl', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'XXL', sku: '4L-TEE-WB-XXL', stock: 9, images: [teeImg, heroImg] },
        { id: 'var_tee_vb_s', colorName: 'Vintage Bone', colorHex: '#ebe7df', size: 'S', sku: '4L-TEE-VB-S', stock: 15, images: [cargoImg, heroImg] },
        { id: 'var_tee_vb_m', colorName: 'Vintage Bone', colorHex: '#ebe7df', size: 'M', sku: '4L-TEE-VB-M', stock: 28, images: [cargoImg, heroImg] },
        { id: 'var_tee_vb_l', colorName: 'Vintage Bone', colorHex: '#ebe7df', size: 'L', sku: '4L-TEE-VB-L', stock: 30, images: [cargoImg, heroImg] },
        { id: 'var_tee_vb_xl', colorName: 'Vintage Bone', colorHex: '#ebe7df', size: 'XL', sku: '4L-TEE-VB-XL', stock: 12, images: [cargoImg, heroImg] },
        { id: 'var_tee_cg_m', colorName: 'Charcoal Grey', colorHex: '#3b3b40', size: 'M', sku: '4L-TEE-CG-M', stock: 20, images: [hoodieImg, teeImg] },
        { id: 'var_tee_cg_l', colorName: 'Charcoal Grey', colorHex: '#3b3b40', size: 'L', sku: '4L-TEE-CG-L', stock: 25, images: [hoodieImg, teeImg] }
      ],
      details: {
        fabric: '100% Combed Compact Cotton',
        gsm: 280,
        fit: 'Boxy, oversized drop-shoulder cut. True to streetwear fit.',
        care: 'Machine wash cold inside out with like colors. Hang dry or tumble dry low.',
        modelStats: 'Model is 6\'1" (185 cm) wearing size L.'
      },
      rating: 4.9,
      reviewsCount: 38,
      createdAt: '2026-02-15T10:00:00Z'
    },
    {
      id: 'prod_hoodie_01',
      slug: '500gsm-french-terry-boxy-hoodie',
      title: '500 GSM French Terry Boxy Hoodie',
      subtitle: 'Heavyweight Custom Terry · Double Layer Hood · Zero Drawstrings',
      description: 'Engineered for sculptural presence and tactile comfort. Made with our heaviest 500 GSM custom-looped French Terry cotton. Designed without drawstrings for a pure minimalist neckline, deep kangaroo pocket, and rib-knit side gussets for mobility.',
      category: 'Hoodies & Sweatshirts',
      tags: ['Flagship', 'Heavyweight', 'Winter Essential'],
      basePrice: 4299,
      discountPrice: 3899,
      isFeatured: true,
      isPublished: true,
      colorGroups: [
        { colorName: 'Vintage Charcoal', colorHex: '#323237', images: [hoodieImg, heroImg] },
        { colorName: 'Washed Black', colorHex: '#141416', images: [teeImg, hoodieImg] }
      ],
      variants: [
        { id: 'var_hood_vc_s', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'S', sku: '4L-HD-VC-S', stock: 16, images: [hoodieImg, heroImg] },
        { id: 'var_hood_vc_m', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'M', sku: '4L-HD-VC-M', stock: 25, images: [hoodieImg, heroImg] },
        { id: 'var_hood_vc_l', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'L', sku: '4L-HD-VC-L', stock: 29, images: [hoodieImg, heroImg] },
        { id: 'var_hood_vc_xl', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'XL', sku: '4L-HD-VC-XL', stock: 14, images: [hoodieImg, heroImg] },
        { id: 'var_hood_wb_m', colorName: 'Washed Black', colorHex: '#141416', size: 'M', sku: '4L-HD-WB-M', stock: 18, images: [teeImg, hoodieImg] },
        { id: 'var_hood_wb_l', colorName: 'Washed Black', colorHex: '#141416', size: 'L', sku: '4L-HD-WB-L', stock: 22, images: [teeImg, hoodieImg] }
      ],
      details: {
        fabric: '100% Cotton 500 GSM Loopback French Terry',
        gsm: 500,
        fit: 'Structured oversized fit with wide chest and relaxed sleeves.',
        care: 'Dry clean recommended or gentle cold machine wash.',
        modelStats: 'Model is 6\'2" wearing size L.'
      },
      rating: 5.0,
      reviewsCount: 52,
      createdAt: '2026-01-20T11:00:00Z'
    },
    {
      id: 'prod_cargo_01',
      slug: 'relaxed-pleated-cargo-trousers',
      title: 'Relaxed Pleated Cargo Trousers',
      subtitle: 'Tailored Heavy Twill · Magnetic Pocket Flaps · Straight Wide Leg',
      description: 'The intersection of sartorial tailoring and utilitarian functionalism. High-density cotton twill featuring tailored double-front pleats, flush-mount 3D cargo pockets with hidden magnetic closures, and adjustable cinch hems.',
      category: 'Trousers & Cargo',
      tags: ['Tailored', 'Utility', 'New Arrival'],
      basePrice: 3799,
      discountPrice: 3299,
      isFeatured: true,
      isPublished: true,
      colorGroups: [
        { colorName: 'Bone Off-White', colorHex: '#e5e1d7', images: [cargoImg, heroImg] },
        { colorName: 'Pitch Black', colorHex: '#111112', images: [lookbookImg, cargoImg] }
      ],
      variants: [
        { id: 'var_crg_bo_s', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'S', sku: '4L-CG-BO-S', stock: 12, images: [cargoImg, heroImg] },
        { id: 'var_crg_bo_m', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'M', sku: '4L-CG-BO-M', stock: 22, images: [cargoImg, heroImg] },
        { id: 'var_crg_bo_l', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'L', sku: '4L-CG-BO-L', stock: 19, images: [cargoImg, heroImg] },
        { id: 'var_crg_bo_xl', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'XL', sku: '4L-CG-BO-XL', stock: 8, images: [cargoImg, heroImg] },
        { id: 'var_crg_pb_m', colorName: 'Pitch Black', colorHex: '#111112', size: 'M', sku: '4L-CG-PB-M', stock: 17, images: [lookbookImg, cargoImg] },
        { id: 'var_crg_pb_l', colorName: 'Pitch Black', colorHex: '#111112', size: 'L', sku: '4L-CG-PB-L', stock: 20, images: [lookbookImg, cargoImg] }
      ],
      details: {
        fabric: '340 GSM High-Density Cotton Twill with Stretch',
        gsm: 340,
        fit: 'High-rise, relaxed through the thigh with gentle taper to hem.',
        care: 'Cool machine wash. Warm iron on reverse.',
        modelStats: 'Model is 6\'1" wearing waist size 32 (Size M).'
      },
      rating: 4.8,
      reviewsCount: 26,
      createdAt: '2026-02-01T09:30:00Z'
    },
    {
      id: 'prod_jacket_01',
      slug: 'brutalist-heavy-zip-jacket',
      title: 'Brutalist Minimalist Zip Jacket',
      subtitle: 'Structured Wool Blend · YKK Excella Two-Way Zip · Boxy Cut',
      description: 'An architectural outerwear piece designed for effortless layering. Constructed from heavy compacted wool-poly blend with clean concealed placket and matte dark gunmetal two-way hardware. Deep vertical welt pockets and internal passport pocket.',
      category: 'Jackets & Outerwear',
      tags: ['Outerwear', 'Limited Run'],
      basePrice: 5999,
      discountPrice: 5299,
      isFeatured: true,
      isPublished: true,
      colorGroups: [
        { colorName: 'Dark Charcoal', colorHex: '#252528', images: [lookbookImg, heroImg] }
      ],
      variants: [
        { id: 'var_jkt_dc_s', colorName: 'Dark Charcoal', colorHex: '#252528', size: 'S', sku: '4L-JKT-DC-S', stock: 8, images: [lookbookImg, heroImg] },
        { id: 'var_jkt_dc_m', colorName: 'Dark Charcoal', colorHex: '#252528', size: 'M', sku: '4L-JKT-DC-M', stock: 14, images: [lookbookImg, heroImg] },
        { id: 'var_jkt_dc_l', colorName: 'Dark Charcoal', colorHex: '#252528', size: 'L', sku: '4L-JKT-DC-L', stock: 12, images: [lookbookImg, heroImg] },
        { id: 'var_jkt_dc_xl', colorName: 'Dark Charcoal', colorHex: '#252528', size: 'XL', sku: '4L-JKT-DC-XL', stock: 6, images: [lookbookImg, heroImg] }
      ],
      details: {
        fabric: '60% Wool, 40% Technical Polyester, Cupro Satin Lining',
        fit: 'Slightly cropped boxy torso with generous sleeves.',
        care: 'Specialist dry clean only.',
        modelStats: 'Model is 6\'2" wearing size L.'
      },
      rating: 5.0,
      reviewsCount: 19,
      createdAt: '2026-01-10T14:00:00Z'
    }
  ];

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
      return db!;
    } catch (err) {
      console.warn('Failed to parse existing db.json, re-initializing with seed data', err);
    }
  }

  db = getInitialSeedData();
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
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}
