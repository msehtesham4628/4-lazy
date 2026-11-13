import bcrypt from "bcryptjs";
import type { DatabaseSchema } from "./db.ts";
import { fallbackCategories, fallbackProducts } from "../data/fallbackCatalog.ts";





const salt = bcrypt.genSaltSync(10);

const adminHash = bcrypt.hashSync('admin123', salt);
const managerHash = bcrypt.hashSync('manager123', salt);
const customerHash = bcrypt.hashSync('lazy123', salt);

const poloImg = '/assets/images/tshirt_polo_neck_1794456301588.jpg';
const customPrintImg = '/assets/images/tshirt_custom_print_1794456303137.jpg';
const roundNeckImg = '/assets/images/tshirt_round_neck_1794456303307.jpg';
const acidWashImg = '/assets/images/tshirt_acid_wash_1794456303446.jpg';
const heroImg = '/assets/images/hero_streetwear_campaign_1794056018871.jpg';
const teeImg = '/assets/images/product_oversized_heavy_tee_1794056020516.jpg';
const hoodieImg = '/assets/images/product_streetwear_hoodie_1794056020931.jpg';
const cargoImg = '/assets/images/product_cargo_trousers_1794056021752.jpg';
const lookbookImg = '/assets/images/campaign_editorial_lookbook_1794056022183.jpg';
const joggersImg = '/assets/images/streetwear_sweatpants_joggers_1794058915788.jpg';
const overshirtImg = '/assets/images/minimalist_overshirt_jacket_1794058915149.jpg';
const logoImg = '/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png';

const categories = fallbackCategories;

const users = [
  {
    id: 'usr_admin_001',
    name: '4 LAZY Founder & Lead Admin',
    email: 'admin@4lazyfashion.com',
    phone: '+919876543210',
    role: 'admin',
    isEmailVerified: true,
    addresses: [],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr_admin_002',
    name: 'Vikram Singhania (Store Manager)',
    email: 'manager@4lazyfashion.com',
    phone: '+919876500000',
    role: 'admin',
    isEmailVerified: true,
    addresses: [],
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'usr_cust_001',
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
  },
  {
    id: 'usr_cust_002',
    name: 'Riya Sharma',
    email: 'riya.sharma@example.com',
    phone: '+919822334455',
    role: 'customer',
    isEmailVerified: true,
    addresses: [
      {
        id: 'addr_02',
        fullName: 'Riya Sharma',
        phone: '+919822334455',
        street: 'Villa 12, Gulmohar Enclave, Hauz Khas',
        apartment: 'Block C',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110016',
        country: 'India',
        isDefault: true
      }
    ],
    createdAt: '2026-02-14T09:30:00Z'
  },
  {
    id: 'usr_cust_003',
    name: 'Kabir Mehta',
    email: 'kabir.mehta@example.com',
    phone: '+919833445566',
    role: 'customer',
    isEmailVerified: true,
    addresses: [
      {
        id: 'addr_03',
        fullName: 'Kabir Mehta',
        phone: '+919833445566',
        street: 'Penthouse 8B, Brigade Heights, Indiranagar',
        apartment: '100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560038',
        country: 'India',
        isDefault: true
      }
    ],
    createdAt: '2026-02-18T16:15:00Z'
  },
  {
    id: 'usr_cust_004',
    name: 'Ananya Sen',
    email: 'ananya.sen@example.com',
    phone: '+919844556677',
    role: 'customer',
    isEmailVerified: true,
    addresses: [
      {
        id: 'addr_04',
        fullName: 'Ananya Sen',
        phone: '+919844556677',
        street: 'Plot 45, Sector 3, Salt Lake City',
        apartment: 'Near City Centre 1',
        city: 'Kolkata',
        state: 'West Bengal',
        pinCode: '700091',
        country: 'India',
        isDefault: true
      }
    ],
    createdAt: '2026-03-01T11:00:00Z'
  }
];

const passwords = {
  usr_admin_001: adminHash,
  usr_admin_002: managerHash,
  usr_cust_001: customerHash,
  usr_cust_002: customerHash,
  usr_cust_003: customerHash,
  usr_cust_004: customerHash
};

const products = fallbackProducts;

const coupons = [
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

const orders = [
  {
    id: 'ord_1001',
    orderNumber: '4L-2026-1001',
    userId: 'usr_cust_001',
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
      { status: 'Confirmed', timestamp: '2026-03-01T15:25:00Z' },
      { status: 'Processing', timestamp: '2026-03-02T09:00:00Z' },
      { status: 'Packed', timestamp: '2026-03-02T11:30:00Z' },
      { status: 'Shipped', timestamp: '2026-03-02T14:30:00Z', note: 'Dispatched via Blue Dart Express' }
    ],
    tracking: {
      courierCompany: 'Blue Dart Express',
      trackingNumber: 'BLUEDART-847291038',
      trackingUrl: 'https://www.bluedart.com',
      estimatedDeliveryDate: '2026-03-05'
    },
    createdAt: '2026-03-01T15:20:00Z',
    updatedAt: '2026-03-02T14:30:00Z'
  },
  {
    id: 'ord_1002',
    orderNumber: '4L-2026-1002',
    userId: 'usr_cust_002',
    customer: {
      name: 'Riya Sharma',
      email: 'riya.sharma@example.com',
      phone: '+919822334455'
    },
    shippingAddress: {
      id: 'addr_02',
      fullName: 'Riya Sharma',
      phone: '+919822334455',
      street: 'Villa 12, Gulmohar Enclave, Hauz Khas',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110016',
      country: 'India',
      isDefault: true
    },
    items: [
      {
        productId: 'prod_joggers_01',
        variantId: 'var_jog_vc_m',
        productTitle: '500 GSM Heavy Loopback Sweatpants',
        colorName: 'Vintage Charcoal',
        size: 'M',
        sku: '4L-JOG-VC-M',
        price: 2799,
        quantity: 1,
        image: joggersImg
      },
      {
        productId: 'prod_cargo_01',
        variantId: 'var_crg_bo_m',
        productTitle: 'Relaxed Pleated Cargo Trousers',
        colorName: 'Bone Off-White',
        size: 'M',
        sku: '4L-CG-BO-M',
        price: 3299,
        quantity: 1,
        image: cargoImg
      }
    ],
    subtotal: 6098,
    discount: 500,
    shippingFee: 0,
    tax: 279.9,
    total: 5877.9,
    payment: {
      provider: 'card',
      transactionId: 'pay_rzp_live_883711',
      status: 'completed',
      paidAt: '2026-03-03T10:15:00Z',
      amount: 5877.9,
      currency: 'INR'
    },
    status: 'Delivered',
    statusHistory: [
      { status: 'Order Placed', timestamp: '2026-03-03T10:15:00Z' },
      { status: 'Confirmed', timestamp: '2026-03-03T10:20:00Z' },
      { status: 'Processing', timestamp: '2026-03-03T12:00:00Z' },
      { status: 'Packed', timestamp: '2026-03-03T16:00:00Z' },
      { status: 'Shipped', timestamp: '2026-03-04T09:30:00Z' },
      { status: 'Out for Delivery', timestamp: '2026-03-05T08:00:00Z' },
      { status: 'Delivered', timestamp: '2026-03-05T14:45:00Z' }
    ],
    tracking: {
      courierCompany: 'Delhivery',
      trackingNumber: 'DELHIVERY-99283716',
      trackingUrl: 'https://www.delhivery.com',
      estimatedDeliveryDate: '2026-03-05'
    },
    createdAt: '2026-03-03T10:15:00Z',
    updatedAt: '2026-03-05T14:45:00Z'
  },
  {
    id: 'ord_1003',
    orderNumber: '4L-2026-1003',
    userId: 'usr_cust_003',
    customer: {
      name: 'Kabir Mehta',
      email: 'kabir.mehta@example.com',
      phone: '+919833445566'
    },
    shippingAddress: {
      id: 'addr_03',
      fullName: 'Kabir Mehta',
      phone: '+919833445566',
      street: 'Penthouse 8B, Brigade Heights, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560038',
      country: 'India',
      isDefault: true
    },
    items: [
      {
        productId: 'prod_coord_01',
        variantId: 'var_cd_sm_l',
        productTitle: 'Monochrome Brutalist Co-ord Set',
        colorName: 'Slate Monochrome',
        size: 'L',
        sku: '4L-CD-SM-L',
        price: 5499,
        quantity: 1,
        image: lookbookImg
      }
    ],
    subtotal: 5499,
    discount: 500,
    shippingFee: 0,
    tax: 249.95,
    total: 5248.95,
    payment: {
      provider: 'upi',
      transactionId: 'pay_rzp_live_774912',
      status: 'completed',
      paidAt: '2026-03-06T18:30:00Z',
      amount: 5248.95,
      currency: 'INR'
    },
    status: 'Processing',
    statusHistory: [
      { status: 'Order Placed', timestamp: '2026-03-06T18:30:00Z' },
      { status: 'Confirmed', timestamp: '2026-03-06T18:35:00Z' },
      { status: 'Processing', timestamp: '2026-03-07T09:00:00Z' }
    ],
    createdAt: '2026-03-06T18:30:00Z',
    updatedAt: '2026-03-07T09:00:00Z'
  }
];

const returnRequests = [
  {
    id: 'ret_1001',
    orderId: 'ord_1001',
    orderNumber: '4L-2026-1001',
    customerName: 'Aryan Verma',
    customerEmail: 'aryan@example.com',
    customerPhone: '+919811223344',
    reason: 'Size Exchange',
    details: 'The Size L hoodie is a bit too wide on my shoulders, would love to exchange for Size M.',
    itemSku: '4L-HD-VC-L',
    productTitle: '500 GSM French Terry Boxy Hoodie',
    colorName: 'Vintage Charcoal',
    size: 'L',
    status: 'Approved',
    pickupAwb: 'REV-DELHIVERY-7749102',
    adminNotes: 'Reverse pickup booked with Delhivery for Monday.',
    createdAt: '2026-03-04T10:00:00Z',
    updatedAt: '2026-03-04T12:00:00Z'
  }
];

const reviews = [
  {
    id: 'rev_01',
    productId: 'prod_heavy_tee_01',
    userName: 'Aryan V.',
    rating: 5,
    title: 'The best boxy cut in India',
    comment: 'The collar stays tight after washing, the drop shoulder is immaculate, and the 280 GSM weight feels substantial without feeling stiff. 10/10.',
    verifiedPurchase: true,
    createdAt: '2026-02-28T14:30:00Z'
  },
  {
    id: 'rev_02',
    productId: 'prod_hoodie_01',
    userName: 'Riya S.',
    rating: 5,
    title: 'Worth every single rupee',
    comment: 'The 500 GSM fleece has so much structure. Doesn\'t collapse at the neck and looks so sculptural. Best streetwear purchase this season.',
    verifiedPurchase: true,
    createdAt: '2026-02-25T11:42:00Z'
  },
  {
    id: 'rev_03',
    productId: 'prod_joggers_01',
    userName: 'Kabir M.',
    rating: 5,
    title: 'Unbelievable drape and comfort',
    comment: 'Heavyweight loopback feel that doesn\'t lose its taper. The pockets are deep enough for large phones without sagging.',
    verifiedPurchase: true,
    createdAt: '2026-03-02T16:20:00Z'
  }
];

const inventoryTransactions = [
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

const adminLogs = [
  {
    id: 'log_01',
    adminEmail: 'admin@4lazyfashion.com',
    action: 'ORDER_DISPATCHED',
    details: 'Assigned courier tracking BLUEDART-847291038 to order 4L-2026-1001',
    timestamp: '2026-03-02T14:30:00Z'
  }
];

const emailLogs = [
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

const settings = {
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

const fullDb = {
  users,
  passwords,
  otps: {},
  products,
  categories,
  orders,
  returnRequests,
  coupons,
  reviews,
  inventoryTransactions,
  adminLogs,
  emailLogs,
  settings
};



export function getFullSeedData() {
  return fullDb;
}
