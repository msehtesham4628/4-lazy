import mongoose, { Schema } from 'mongoose';
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

// ----------------------------------------------------
// MONGOOSE SCHEMAS & MODELS
// ----------------------------------------------------

// 1. User Schema
const UserAddressSchema = new Schema(
  {
    id: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isEmailVerified: { type: Boolean, default: false },
    passwordHash: { type: String },
    addresses: [UserAddressSchema],
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'users' }
);

// 2. Product Schema
const ProductVariantSchema = new Schema(
  {
    id: { type: String, required: true },
    colorName: { type: String, required: true },
    colorHex: { type: String, required: true },
    size: { type: String, required: true },
    sku: { type: String, required: true },
    stock: { type: Number, default: 0 },
    images: [{ type: String }],
    priceAdjustment: { type: Number, default: 0 }
  },
  { _id: false }
);

const ProductColorGroupSchema = new Schema(
  {
    colorName: { type: String, required: true },
    colorHex: { type: String, required: true },
    images: [{ type: String }]
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    basePrice: { type: Number, required: true },
    discountPrice: { type: Number },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    variants: [ProductVariantSchema],
    colorGroups: [ProductColorGroupSchema],
    details: {
      fabric: { type: String, default: '100% Combed Cotton' },
      gsm: { type: Number },
      fit: { type: String, default: 'Boxy streetwear fit' },
      care: { type: String, default: 'Machine wash cold' },
      modelStats: { type: String }
    },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'products' }
);

// 3. Category Schema
const CategorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    itemCount: { type: Number, default: 0 }
  },
  { timestamps: true, collection: 'categories' }
);

// 4. Order Schema
const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    productTitle: { type: String, required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  },
  { _id: false }
);

const OrderStatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    note: { type: String }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payment: {
      provider: { type: String, default: 'cod' },
      transactionId: { type: String },
      status: { type: String, default: 'pending' },
      paidAt: { type: String },
      amount: { type: Number },
      currency: { type: String, default: 'INR' }
    },
    status: { type: String, default: 'Order Placed' },
    statusHistory: [OrderStatusHistorySchema],
    tracking: {
      courierCompany: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
      estimatedDeliveryDate: { type: String }
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'orders' }
);

// 5. Return Request Schema
const ReturnRequestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    orderNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    reason: { type: String, required: true },
    details: { type: String, required: true },
    items: [{ type: Schema.Types.Mixed }],
    refundAmount: { type: Number, default: 0 },
    status: { type: String, default: 'Requested' },
    pickupAwb: { type: String },
    notes: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'returns' }
);

// 6. Coupon Schema
const CouponSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    expiresAt: { type: String },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'coupons' }
);

// 7. Review Schema
const ReviewSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    title: { type: String },
    comment: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: true },
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'reviews' }
);

// 8. Inventory Transaction Schema
const InventoryTxSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    productTitle: { type: String, required: true },
    variantSku: { type: String, required: true },
    colorName: { type: String },
    size: { type: String },
    change: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'inventory_transactions' }
);

// 9. Store Settings Schema
const StoreSettingsSchema = new Schema(
  {
    brandName: { type: String, default: '4 LAZY' },
    tagline: { type: String, default: 'Less Effort. More Style.' },
    logoUrl: { type: String },
    contactEmail: { type: String, default: 'concierge@4lazyfashion.com' },
    contactPhone: { type: String, default: '+91 80004 52999' },
    currency: { type: String, default: 'INR' },
    taxRatePercent: { type: Number, default: 5 },
    freeShippingThreshold: { type: Number, default: 1999 },
    standardShippingFee: { type: Number, default: 99 },
    expressShippingFee: { type: Number, default: 199 },
    announcements: [{ type: String }],
    heroHeading: { type: String, default: 'LESS EFFORT. MORE STYLE.' },
    heroSubhead: { type: String },
    heroButtonText: { type: String, default: 'SHOP COLLECTION' },
    heroImageUrl: { type: String },
    campaignTitle: { type: String },
    campaignDescription: { type: String },
    campaignImageUrl: { type: String },
    razorpayKeyId: { type: String },
    stripePublicKey: { type: String },
    isTestMode: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'settings' }
);

// 10. Admin Activity Log Schema
const AdminActivityLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() }
  },
  { timestamps: true, collection: 'admin_logs' }
);

// 11. Email Log Schema
const EmailLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, required: true },
    sentAt: { type: String, default: () => new Date().toISOString() },
    status: { type: String, default: 'delivered' },
    previewHtml: { type: String }
  },
  { timestamps: true, collection: 'email_logs' }
);

// Export Mongoose Models (preventing OverwriteModelError on hot reloads)
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const ReturnRequestModel = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', ReturnRequestSchema);
export const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export const InventoryTxModel = mongoose.models.InventoryTx || mongoose.model('InventoryTx', InventoryTxSchema);
export const StoreSettingsModel = mongoose.models.StoreSettings || mongoose.model('StoreSettings', StoreSettingsSchema);
export const AdminActivityLogModel = mongoose.models.AdminActivityLog || mongoose.model('AdminActivityLog', AdminActivityLogSchema);
export const EmailLogModel = mongoose.models.EmailLog || mongoose.model('EmailLog', EmailLogSchema);

// ----------------------------------------------------
// MONGOOSE CONNECTION MANAGER & SYNC ENGINE
// ----------------------------------------------------

let mongoConnected = false;
let currentMongoUri = process.env.MONGODB_URI || '';
let lastError: string | null = null;

export function isMongoConnected(): boolean {
  return mongoConnected && mongoose.connection.readyState === 1;
}

export function getCurrentMongoUri(): string {
  return currentMongoUri;
}

export function getMongoStats() {
  const readyState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  return {
    connected: readyState === 1,
    status: states[readyState] || 'Disconnected',
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    uriConfigured: Boolean(currentMongoUri),
    maskedUri: currentMongoUri
      ? currentMongoUri.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$4')
      : null,
    lastError
  };
}

/**
 * Connect to MongoDB Atlas or local MongoDB
 */
export async function connectMongoDB(uri?: string): Promise<{
  connected: boolean;
  host?: string;
  error?: string;
  isWhitelistError?: boolean;
  isAuthError?: boolean;
}> {
  const targetUri = (uri || process.env.MONGODB_URI || '').trim();
  if (!targetUri) {
    return { connected: false, error: 'No MongoDB URI provided. Set MONGODB_URI or enter a connection string.' };
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        // ignore disconnect failure
      }
    }

    let cleanUri = targetUri;
    // If the URI ends without a database name, add 4lazy
    if (/^mongodb(\+srv)?:\/\/[^/]+\/?$/.test(cleanUri)) {
      cleanUri = cleanUri.replace(/\/?$/, '/4lazy?retryWrites=true&w=majority');
    } else if (/^mongodb(\+srv)?:\/\/[^/]+\/\?/.test(cleanUri)) {
      cleanUri = cleanUri.replace(/\/\?/, '/4lazy?');
    }

    currentMongoUri = cleanUri;
    lastError = null;

    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 6000
    });

    mongoConnected = true;
    console.log(`MongoDB connected successfully to host: ${mongoose.connection.host}, database: ${mongoose.connection.name}`);
    return {
      connected: true,
      host: mongoose.connection.host
    };
  } catch (err: any) {
    mongoConnected = false;
    const rawMsg = err?.message || String(err);
    const isWhitelistError =
      rawMsg.includes('whitelist') ||
      rawMsg.includes('Could not connect to any servers') ||
      rawMsg.includes('serverSelectionTimeoutMS') ||
      rawMsg.includes('ENOTFOUND') ||
      rawMsg.includes('querySrv');
    const isAuthError =
      rawMsg.includes('Authentication failed') ||
      rawMsg.includes('bad auth') ||
      rawMsg.includes('auth failed');

    let friendlyError = rawMsg;
    if (isWhitelistError) {
      friendlyError = 'MongoDB Atlas IP Whitelist Required: Your Atlas cluster is blocking access. Go to MongoDB Atlas > Network Access > Add IP Address > "Allow Access from Anywhere" (0.0.0.0/0), wait ~10 seconds, then reconnect.';
    } else if (isAuthError) {
      friendlyError = 'MongoDB Atlas Authentication Failed: Invalid database username or password. Please verify the user credentials in your Atlas Database Access panel.';
    }

    lastError = friendlyError;
    console.warn(`[MongoDB Connection Notice] ${friendlyError}`);
    return {
      connected: false,
      error: friendlyError,
      isWhitelistError,
      isAuthError
    };
  }
}

/**
 * Sync entire in-memory/JSON DB to MongoDB Atlas collections
 */
export async function syncLocalToMongo(dbData: any): Promise<{ success: boolean; syncedCounts: Record<string, number>; error?: string }> {
  if (!isMongoConnected()) {
    return { success: false, syncedCounts: {}, error: 'MongoDB is not connected. Connect first.' };
  }

  try {
    const counts: Record<string, number> = {};

    // 1. Users
    if (dbData.users && dbData.users.length > 0) {
      for (const u of dbData.users) {
        const passwordHash = dbData.passwords?.[u.id];
        await UserModel.findOneAndUpdate(
          { id: u.id },
          { ...u, passwordHash },
          { upsert: true, new: true }
        );
      }
      counts.users = dbData.users.length;
    }

    // 2. Categories
    if (dbData.categories && dbData.categories.length > 0) {
      for (const cat of dbData.categories) {
        await CategoryModel.findOneAndUpdate({ id: cat.id }, cat, { upsert: true, new: true });
      }
      counts.categories = dbData.categories.length;
    }

    // 3. Products
    if (dbData.products && dbData.products.length > 0) {
      for (const prod of dbData.products) {
        await ProductModel.findOneAndUpdate({ id: prod.id }, prod, { upsert: true, new: true });
      }
      counts.products = dbData.products.length;
    }

    // 4. Orders
    if (dbData.orders && dbData.orders.length > 0) {
      for (const ord of dbData.orders) {
        await OrderModel.findOneAndUpdate({ id: ord.id }, ord, { upsert: true, new: true });
      }
      counts.orders = dbData.orders.length;
    }

    // 5. Coupons
    if (dbData.coupons && dbData.coupons.length > 0) {
      for (const cpn of dbData.coupons) {
        await CouponModel.findOneAndUpdate({ id: cpn.id }, cpn, { upsert: true, new: true });
      }
      counts.coupons = dbData.coupons.length;
    }

    // 6. Returns
    if (dbData.returnRequests && dbData.returnRequests.length > 0) {
      for (const ret of dbData.returnRequests) {
        await ReturnRequestModel.findOneAndUpdate({ id: ret.id }, ret, { upsert: true, new: true });
      }
      counts.returns = dbData.returnRequests.length;
    }

    // 7. Settings
    if (dbData.settings) {
      await StoreSettingsModel.findOneAndUpdate({}, dbData.settings, { upsert: true, new: true });
      counts.settings = 1;
    }

    console.log('Synced local store to MongoDB Atlas:', counts);
    return { success: true, syncedCounts: counts };
  } catch (err: any) {
    console.error('Error syncing local store to MongoDB:', err);
    return { success: false, syncedCounts: {}, error: err.message || String(err) };
  }
}

/**
 * Pull data from MongoDB Atlas into local memory/cache
 */
export async function syncMongoToLocal(): Promise<{
  success: boolean;
  loadedCounts: Record<string, number>;
  data?: any;
  error?: string;
}> {
  if (!isMongoConnected()) {
    return { success: false, loadedCounts: {}, error: 'MongoDB is not connected.' };
  }

  try {
    const [products, categories, users, orders, coupons, returnRequests, settings] = await Promise.all([
      ProductModel.find().lean(),
      CategoryModel.find().lean(),
      UserModel.find().lean(),
      OrderModel.find().lean(),
      CouponModel.find().lean(),
      ReturnRequestModel.find().lean(),
      StoreSettingsModel.findOne().lean()
    ]);

    const passwords: Record<string, string> = {};
    const sanitizedUsers = users.map((u: any) => {
      if (u.passwordHash) {
        passwords[u.id] = u.passwordHash;
      }
      const { _id, __v, passwordHash, ...cleanUser } = u;
      return cleanUser;
    });

    const cleanProducts = products.map((p: any) => {
      const { _id, __v, ...cleanProd } = p;
      return cleanProd;
    });

    const cleanCategories = categories.map((c: any) => {
      const { _id, __v, ...cleanCat } = c;
      return cleanCat;
    });

    const cleanOrders = orders.map((o: any) => {
      const { _id, __v, ...cleanOrd } = o;
      return cleanOrd;
    });

    const cleanCoupons = coupons.map((cp: any) => {
      const { _id, __v, ...cleanCpn } = cp;
      return cleanCpn;
    });

    const cleanReturns = returnRequests.map((r: any) => {
      const { _id, __v, ...cleanRet } = r;
      return cleanRet;
    });

    let cleanSettings = settings;
    if (cleanSettings) {
      const { _id, __v, ...cs } = cleanSettings as any;
      cleanSettings = cs;
    }

    const loadedCounts: Record<string, number> = {
      products: cleanProducts.length,
      categories: cleanCategories.length,
      users: sanitizedUsers.length,
      orders: cleanOrders.length,
      coupons: cleanCoupons.length,
      returns: cleanReturns.length
    };

    return {
      success: true,
      loadedCounts,
      data: {
        products: cleanProducts,
        categories: cleanCategories,
        users: sanitizedUsers,
        passwords,
        orders: cleanOrders,
        coupons: cleanCoupons,
        returnRequests: cleanReturns,
        settings: cleanSettings || undefined
      }
    };
  } catch (err: any) {
    console.error('Error syncing Mongo to local:', err);
    return { success: false, loadedCounts: {}, error: err?.message || String(err) };
  }
}

/**
 * Initialize MongoDB on boot if MONGODB_URI is provided
 */
export async function initMongoDB(initialDbData?: any) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('MongoDB: No MONGODB_URI provided in environment. Running with local persistent database.');
    return;
  }

  const res = await connectMongoDB(uri);
  if (res.connected) {
    try {
      const count = await ProductModel.countDocuments();
      if (count === 0 && initialDbData) {
        console.log('MongoDB is empty. Seeding initial products, categories, and users into MongoDB...');
        await syncLocalToMongo(initialDbData);
      } else {
        console.log(`Connected to MongoDB Atlas with ${count} existing products.`);
      }
    } catch (e) {
      console.error('Failed to check or seed MongoDB:', e);
    }
  }
}
