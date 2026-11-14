export type Role = 'customer' | 'admin';

export interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isEmailVerified: boolean;
  addresses: UserAddress[];
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  sku: string;
  stock: number;
  images: string[];
  priceAdjustment?: number;
}

export interface ProductColorGroup {
  colorName: string;
  colorHex: string;
  images: string[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  tags: string[];
  basePrice: number;
  discountPrice?: number;
  isFeatured: boolean;
  isPublished: boolean;
  variants: ProductVariant[];
  colorGroups: ProductColorGroup[];
  details: {
    fabric: string;
    gsm?: number;
    fit: string;
    care: string;
    modelStats?: string;
  };
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  heroImage?: string;
  itemCount?: number;
}

export type ReturnStatus =
  | 'Requested'
  | 'Approved'
  | 'Pickup Scheduled'
  | 'Received & Inspected'
  | 'Refund Completed'
  | 'Rejected';

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  reason: string;
  details: string;
  items: {
    productId: string;
    productTitle: string;
    variantSku: string;
    size: string;
    colorName: string;
    quantity: number;
    price: number;
  }[];
  refundAmount: number;
  status: ReturnStatus;
  pickupAwb?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomPrintDetails {
  customText?: string;
  textColor?: string;
  fontStyle?: string;
  placement: 'center-chest' | 'left-chest' | 'full-back' | 'sleeve';
  printTechnique: string;
  uploadedGraphicUrl?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productTitle: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  maxStock: number;
  customPrint?: CustomPrintDetails;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  couponDiscount: number;
  couponCode?: string;
  shippingFee: number;
  tax: number;
  total: number;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cashfree' | 'razorpay' | 'stripe' | 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi' | 'paylater' | 'cod';

export interface PaymentInfo {
  provider: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  paidAt?: string;
  amount: number;
  currency: string;
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  paymentSessionId?: string;
  paymentMethodDetail?: string;
  transactionDate?: string;
  gatewayStatus?: string;
  expiresAt?: string;
  cancellationReason?: string;
}

export type PaymentTransactionStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'USER_DROPPED'
  | 'REFUNDED';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  cashfreeOrderId: string;
  cashfreePaymentId?: string;
  paymentSessionId?: string;
  customerId: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  currency: string;
  paymentStatus: PaymentTransactionStatus;
  paymentMethod: string;
  paymentMethodDetails?: Record<string, any>;
  environment: 'sandbox' | 'production';
  transactionDate: string;
  updatedAt?: string;
  expiresAt?: string;
  cancellationReason?: string;
  processedWebhooks?: string[];
  rawGatewayStatus?: string;
  errorMessage?: string;
}

export interface TrackingInfo {
  courierCompany: string;
  trackingNumber: string;
  trackingUrl: string;
  dispatchDate?: string;
  estimatedDeliveryDate?: string;
  statusNotes?: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productTitle: string;
  colorName: string;
  size: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  customPrint?: CustomPrintDetails;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: UserAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  payment: PaymentInfo;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  tracking?: TrackingInfo;
  internalNotes?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  categoryRestriction?: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productTitle: string;
  variantSku: string;
  colorName: string;
  size: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
}

export interface AdminActivityLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface StockNotificationRequest {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantId?: string;
  sku?: string;
  colorName: string;
  size: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userId?: string;
  status: 'Pending' | 'Notified';
  notifiedAt?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'welcome' | 'email_otp' | 'order_confirmation' | 'shipping_update' | 'password_reset' | 'back_in_stock';
  sentAt: string;
  status: 'sent' | 'delivered';
  previewHtml: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  eyebrow?: string;
  heading: string;
  subhead: string;
  linkType: 'category' | 'product' | 'none';
  linkTarget: string;
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  taxRatePercent: number;
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  announcements: string[];
  heroHeading: string;
  heroSubhead: string;
  heroButtonText: string;
  heroImageUrl: string;
  heroImages?: string[];
  heroSlides?: HeroSlide[];
  campaignTitle: string;
  campaignDescription: string;
  campaignImageUrl: string;
  razorpayKeyId: string;
  stripePublicKey: string;
  cashfreeAppId?: string;
  cashfreeEnvironment?: 'sandbox' | 'production';
  codEnabled?: boolean;
  isTestMode: boolean;
}
