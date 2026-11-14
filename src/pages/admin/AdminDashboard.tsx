import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Users,
  Tag,
  FileText,
  Settings,
  Mail,
  Plus,
  Trash2,
  Edit,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  X,
  Search,
  ArrowUpDown,
  DollarSign,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Menu,
  LogOut,
  Store,
  Database,
  RefreshCw,
  Bell,
  ArrowUp,
  ArrowDown,
  Link2,
  CreditCard,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { compressUploadImage } from '../../utils/imageUtils.ts';
import { getPaymentBadgeMeta } from '../../utils/paymentTimer.ts';
import {
  Order,
  Product,
  Category,
  Coupon,
  StoreSettings,
  HeroSlide,
  EmailLog,
  InventoryTransaction,
  ReturnRequest,
  ProductVariant,
  ProductColorGroup,
  StockNotificationRequest,
  PaymentTransaction
} from '../../types/index.ts';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: any) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

type AdminTab =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'notify-requests'
  | 'orders'
  | 'payments'
  | 'returns'
  | 'customers'
  | 'tally'
  | 'content'
  | 'coupons'
  | 'settings'
  | 'emails';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, initialTab, onTabChange }) => {
  const { user, token, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>((initialTab as AdminTab) || 'overview');
  const [adminNavMenuOpen, setAdminNavMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab as AdminTab);
    }
  }, [initialTab]);

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Overview Data
  const [metrics, setMetrics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Excel / CSV Bulk Upload
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const activeUploadSlideRef = useRef<number>(0);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

  const DEFAULT_PRODUCT_SLIDES: [string, string, string, string] = [
    '/assets/images/product_oversized_heavy_tee_1794056020516.jpg',
    '/assets/images/tshirt_round_neck_1794456303307.jpg',
    '/assets/images/tshirt_custom_print_1794456303137.jpg',
    '/assets/images/campaign_editorial_lookbook_1794056022183.jpg'
  ];

  // Product Form State (for Add / Edit — supports 4 photo slides per product)
  const [productForm, setProductForm] = useState({
    title: '',
    subtitle: '',
    category: 'Round Neck T-Shirt',
    basePrice: 1999,
    discountPrice: 1699,
    description: '',
    isFeatured: false,
    isPublished: true,
    fabric: '100% Combed Compact Cotton',
    gsm: 280,
    fit: 'Boxy drop-shoulder streetwear cut',
    care: 'Machine wash cold inside-out. Hang dry in shade.',
    colorName: 'Washed Black',
    colorHex: '#141416',
    imageUrls: [...DEFAULT_PRODUCT_SLIDES] as [string, string, string, string],
    stockS: 20,
    stockM: 35,
    stockL: 40,
    stockXL: 25,
    stockXXL: 10
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    courierCompany: 'Blue Dart Express',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDeliveryDate: '',
    statusNotes: ''
  });
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);

  // Payments Management (Cashfree Transactions)
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<{
    totalCount: number;
    successCount: number;
    pendingCount: number;
    cancelledCount?: number;
    failedCount: number;
    totalSuccessVolume: number;
    pendingVolume: number;
  } | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    'all' | 'SUCCESS' | 'PENDING' | 'CANCELLED' | 'FAILED'
  >('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [syncingPaymentId, setSyncingPaymentId] = useState<string | null>(null);
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null);

  // Returns
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [returnStatusForm, setReturnStatusForm] = useState({
    status: 'Approved',
    pickupAwb: '',
    notes: ''
  });

  // Inventory
  const [inventoryMatrix, setInventoryMatrix] = useState<any[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryTx, setInventoryTx] = useState<InventoryTransaction[]>([]);
  const [adjustModalItem, setAdjustModalItem] = useState<any | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>('10');
  const [adjustMode, setAdjustMode] = useState<'delta' | 'exact'>('delta');
  const [adjustReason, setAdjustReason] = useState('Stock replenishment / warehouse count update');
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [quickAdjustingSku, setQuickAdjustingSku] = useState<string | null>(null);

  // Customers
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[] | null>(null);

  // Tally & GST Accounting
  const [tallySummary, setTallySummary] = useState<any>(null);

  // Categories & CMS
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg'
  });

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percent' as 'percent' | 'flat',
    value: 10,
    minOrderValue: 1499,
    maxDiscount: 1000,
    usageLimit: 500,
    expiresAt: ''
  });

  // Inline feedback & two-step delete confirmation states (iframe-safe, zero window.alert/confirm)
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null);
  const [confirmDeleteCouponId, setConfirmDeleteCouponId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [togglingCod, setTogglingCod] = useState(false);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setAdminNotice({ type, text });
    setTimeout(() => {
      setAdminNotice(prev => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Settings & CMS Content
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const heroSlideFileInputRef = useRef<HTMLInputElement>(null);
  const activeHeroUploadIdxRef = useRef<number>(0);
  const [uploadingHeroSlideIdx, setUploadingHeroSlideIdx] = useState<number | null>(null);
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

  // Emails
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<EmailLog | null>(null);

  // Back-in-stock Notify Requests
  const [stockNotifications, setStockNotifications] = useState<StockNotificationRequest[]>([]);
  const [notifyFilter, setNotifyFilter] = useState<'all' | 'Pending' | 'Notified'>('all');
  const [notifySearch, setNotifySearch] = useState('');
  const [confirmDeleteNotifyId, setConfirmDeleteNotifyId] = useState<string | null>(null);

  // MongoDB Atlas State
  const [mongoStats, setMongoStats] = useState<any>(null);
  const [mongoUriInput, setMongoUriInput] = useState('');
  const [mongoLoading, setMongoLoading] = useState(false);
  const [mongoMsg, setMongoMsg] = useState<{ type: 'success' | 'error'; text: string; isWhitelist?: boolean } | null>(null);

  const fetchMongoStatus = async () => {
    try {
      const res = await fetch('/api/admin/mongodb/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMongoStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch MongoDB status:', e);
    }
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUriInput.trim()) return;
    setMongoLoading(true);
    setMongoMsg(null);
    try {
      const res = await fetch('/api/admin/mongodb/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uri: mongoUriInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMongoMsg({ type: 'success', text: data.message || 'Connected to MongoDB Atlas!' });
        fetchMongoStatus();
        fetchProductsList();
        fetchCategories();
        fetchOverview();
      } else {
        const isWl = Boolean(
          data.isWhitelistError ||
          data.error?.toLowerCase().includes('whitelist') ||
          data.error?.toLowerCase().includes('could not connect to any servers') ||
          data.error?.toLowerCase().includes('serverselectiontimeoutms')
        );
        setMongoMsg({
          type: 'error',
          text: data.error || 'Connection failed',
          isWhitelist: isWl
        });
      }
    } catch (err: any) {
      setMongoMsg({ type: 'error', text: err.message || 'Connection error' });
    } finally {
      setMongoLoading(false);
    }
  };

  const handleSyncMongo = async () => {
    setMongoLoading(true);
    setMongoMsg(null);
    try {
      const res = await fetch('/api/admin/mongodb/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMongoMsg({ type: 'success', text: `Sync Complete: ${data.message}` });
        fetchMongoStatus();
        fetchProductsList();
        fetchOverview();
      } else {
        setMongoMsg({ type: 'error', text: data.error || 'Failed to sync with MongoDB' });
      }
    } catch (err: any) {
      setMongoMsg({ type: 'error', text: err.message || 'Sync error' });
    } finally {
      setMongoLoading(false);
    }
  };

  const handlePullMongo = async () => {
    setMongoLoading(true);
    setMongoMsg(null);
    try {
      const res = await fetch('/api/admin/mongodb/pull', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMongoMsg({ type: 'success', text: `Loaded from Atlas: ${data.message}` });
        fetchMongoStatus();
        fetchProductsList();
        fetchCategories();
        fetchOrdersList();
        fetchOverview();
      } else {
        setMongoMsg({ type: 'error', text: data.error || 'Failed to pull from MongoDB' });
      }
    } catch (err: any) {
      setMongoMsg({ type: 'error', text: err.message || 'Pull error' });
    } finally {
      setMongoLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setMetrics(d.metrics);
        setRecentOrders(d.recentOrders || []);
        setLowStockItems(d.lowStockItems || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const fallbackRes = await fetch('/api/products');
        const fallbackData = await fallbackRes.json();
        setProducts(fallbackData.products || []);
        return;
      }
      const d = await res.json();
      setProducts(d.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setCategories(d.categories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrdersList = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setOrders(d.orders || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReturnsList = async () => {
    try {
      const res = await fetch('/api/admin/returns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setReturns(d.returns || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/admin/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setInventoryMatrix(d.inventory || []);
      setInventoryTx(d.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setCustomers(d.customers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTallySummary = async () => {
    try {
      const res = await fetch('/api/admin/tally/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setTallySummary(d.summary);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setCoupons(d.coupons || []);
    } catch (e) {
      console.error(e);
    }
  };

  const normalizeHeroSlides = (s: StoreSettings | null): HeroSlide[] => {
    if (!s) return [];
    if (Array.isArray(s.heroSlides) && s.heroSlides.length > 0) {
      return s.heroSlides;
    }
    const imgs =
      Array.isArray(s.heroImages) && s.heroImages.length > 0
        ? s.heroImages
        : [
            s.heroImageUrl || '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
            '/assets/images/campaign_editorial_lookbook_1794056022183.jpg',
            '/assets/images/tshirt_polo_neck_1794456301588.jpg',
            '/assets/images/tshirt_acid_wash_1794456303446.jpg',
            '/assets/images/tshirt_custom_print_1794456303137.jpg'
          ];
    return imgs.map((imgUrl, idx) => ({
      id: `hero_slide_${idx + 1}`,
      imageUrl: imgUrl,
      eyebrow: 'HYDERABAD · THE ARCHITECTURAL T-SHIRT HOUSE',
      heading: s.heroHeading || 'LESS EFFORT.\nMORE STYLE.',
      subhead: s.heroSubhead || 'Heavyweight 280–320 GSM combed cotton T-shirts.',
      linkType: 'category',
      linkTarget: 'Round Neck T-Shirt'
    }));
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.settings) {
        setStoreSettings({
          ...d.settings,
          heroSlides: normalizeHeroSlides(d.settings)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/admin/emails', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setEmails(d.emails || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStockNotifications = async () => {
    try {
      const res = await fetch('/api/admin/stock-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setStockNotifications(d.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setTransactions(d.transactions || []);
        setPaymentSummary(d.summary || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncPaymentStatus = async (cashfreeOrderId: string) => {
    setSyncingPaymentId(cashfreeOrderId);
    try {
      const res = await fetch(`/api/admin/payments/${encodeURIComponent(cashfreeOrderId)}/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        showNotice('success', d.message || 'Payment status synchronized with Cashfree.');
        await Promise.all([fetchPayments(), fetchOrdersList(), fetchOverview()]);
        if (d.transaction && selectedTransaction?.cashfreeOrderId === cashfreeOrderId) {
          setSelectedTransaction(d.transaction);
        }
      } else {
        showNotice('error', d.error || 'Failed to sync payment status.');
      }
    } catch (e: any) {
      showNotice('error', e?.message || 'Network error syncing payment.');
    } finally {
      setSyncingPaymentId(null);
    }
  };

  const handleCancelPendingPayment = async (cashfreeOrderId: string) => {
    setCancellingPaymentId(cashfreeOrderId);
    try {
      const res = await fetch(`/api/admin/payments/${encodeURIComponent(cashfreeOrderId)}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: 'Cancelled from Admin Dashboard — confirmation not received.'
        })
      });
      const d = await res.json();
      if (res.ok) {
        showNotice('success', d.message || 'Unconfirmed payment moved to Cancelled Payment.');
        await Promise.all([fetchPayments(), fetchOrdersList(), fetchOverview()]);
        if (d.transaction && selectedTransaction?.cashfreeOrderId === cashfreeOrderId) {
          setSelectedTransaction(d.transaction);
        }
      } else {
        showNotice('error', d.error || 'Failed to cancel pending payment.');
      }
    } catch (e: any) {
      showNotice('error', e?.message || 'Network error cancelling payment.');
    } finally {
      setCancellingPaymentId(null);
    }
  };

  useEffect(() => {
    if (isAdmin && token) {
      setLoading(true);
      Promise.all([
        fetchOverview(),
        fetchProductsList(),
        fetchCategories(),
        fetchOrdersList(),
        fetchPayments(),
        fetchReturnsList(),
        fetchInventory(),
        fetchCustomers(),
        fetchTallySummary(),
        fetchCoupons(),
        fetchSettings(),
        fetchEmails(),
        fetchStockNotifications(),
        fetchMongoStatus()
      ]).finally(() => setLoading(false));
    }
  }, [isAdmin, token]);

  // Refresh dynamic order & payment views immediately on tab switches
  useEffect(() => {
    if (!isAdmin || !token) return;
    if (activeTab === 'overview') {
      fetchOverview();
    } else if (activeTab === 'orders') {
      fetchOrdersList();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab, isAdmin, token]);

  // Live background sync (10s) so newly placed, confirmed, and auto-cancelled payments update in real time
  useEffect(() => {
    if (!isAdmin || !token) return;
    if (activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'payments') return;
    const timer = window.setInterval(() => {
      if (activeTab === 'overview') {
        fetchOverview();
      } else if (activeTab === 'orders') {
        fetchOrdersList();
      } else if (activeTab === 'payments') {
        fetchPayments();
      }
    }, 10000);
    return () => window.clearInterval(timer);
  }, [activeTab, isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-[#E5A914] mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold text-white uppercase">Administrator Access Required</h2>
        <p className="text-xs text-neutral-400 mt-2">
          Please sign in with administrator credentials (e.g. <strong>admin@4lazyfashion.com</strong> / <strong>admin123</strong>) to access the store management console.
        </p>
        <button
          onClick={() => onNavigate('admin-login')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  // PRODUCT CRUD
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      subtitle: '',
      category: categories[0]?.name || 'Round Neck T-Shirt',
      basePrice: 1999,
      discountPrice: 1699,
      description: 'Custom heavyweight luxury streetwear piece.',
      isFeatured: false,
      isPublished: true,
      fabric: '100% Combed Compact Cotton',
      gsm: 280,
      fit: 'Boxy drop-shoulder streetwear fit',
      care: 'Machine wash cold. Hang dry in shade.',
      colorName: 'Washed Black',
      colorHex: '#141416',
      imageUrls: [...DEFAULT_PRODUCT_SLIDES],
      stockS: 20,
      stockM: 35,
      stockL: 40,
      stockXL: 25,
      stockXXL: 10
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    const firstColor = product.colorGroups[0] || { colorName: 'Washed Black', colorHex: '#141416', images: [] };
    const existingImgs =
      firstColor.images && firstColor.images.length > 0
        ? firstColor.images
        : product.variants[0]?.images || [];
    const stockMap: Record<string, number> = {};
    const firstColorVariants = product.variants.filter(
      v => v.colorName.toLowerCase() === firstColor.colorName.toLowerCase()
    );
    (firstColorVariants.length > 0 ? firstColorVariants : product.variants).forEach(v => {
      stockMap[v.size] = v.stock;
    });

    const normalizedHex = /^#[0-9A-Fa-f]{6}$/.test(firstColor.colorHex || '') ? firstColor.colorHex : '#141416';

    setProductForm({
      title: product.title,
      subtitle: product.subtitle || '',
      category: product.category,
      basePrice: product.basePrice,
      discountPrice: product.discountPrice || 0,
      description: product.description,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      fabric: product.details?.fabric || '100% Combed Cotton',
      gsm: product.details?.gsm || 280,
      fit: product.details?.fit || 'Boxy Drop Shoulder Oversized Fit',
      care: product.details?.care || 'Cold machine wash inside-out',
      colorName: firstColor.colorName,
      colorHex: normalizedHex,
      imageUrls: [
        existingImgs[0] || DEFAULT_PRODUCT_SLIDES[0],
        existingImgs[1] || '',
        existingImgs[2] || '',
        existingImgs[3] || ''
      ],
      stockS: stockMap['S'] ?? 0,
      stockM: stockMap['M'] ?? 0,
      stockL: stockMap['L'] ?? 0,
      stockXL: stockMap['XL'] ?? 0,
      stockXXL: stockMap['XXL'] ?? 0
    });
    setShowProductModal(true);
  };

  const triggerSlideUpload = (slideIdx: number) => {
    activeUploadSlideRef.current = slideIdx;
    productImageInputRef.current?.click();
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      e.target.value = '';
      return;
    }

    const slideIdx = activeUploadSlideRef.current;
    setUploadingSlideIndex(slideIdx);
    try {
      const compressedDataUrl = await compressUploadImage(file, 900, 0.78, 120 * 1024);
      const approxKb = Math.max(1, Math.round((compressedDataUrl.length * 3) / 4 / 1024));
      setProductForm(prev => {
        const next: [string, string, string, string] = [...prev.imageUrls] as [string, string, string, string];
        next[slideIdx] = compressedDataUrl;
        return { ...prev, imageUrls: next };
      });
      showNotice('success', `Photo Slide ${slideIdx + 1} optimized (${approxKb} KB) and ready.`);
    } catch (err: any) {
      showNotice('error', 'Failed to process image: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadingSlideIndex(null);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const cleanTitle = productForm.title.trim();
      const codePrefix = (cleanTitle.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || '4L').padEnd(2, 'L');
      const ts = Date.now();
      const slideImages = productForm.imageUrls.map(u => u.trim()).filter(Boolean);
      const finalImages = slideImages.length > 0 ? slideImages : [DEFAULT_PRODUCT_SLIDES[0]];

      const sizeStocks: { size: ProductVariant['size']; stock: number }[] = [
        { size: 'S', stock: Math.max(0, Math.round(Number(productForm.stockS) || 0)) },
        { size: 'M', stock: Math.max(0, Math.round(Number(productForm.stockM) || 0)) },
        { size: 'L', stock: Math.max(0, Math.round(Number(productForm.stockL) || 0)) },
        { size: 'XL', stock: Math.max(0, Math.round(Number(productForm.stockXL) || 0)) },
        { size: 'XXL', stock: Math.max(0, Math.round(Number(productForm.stockXXL) || 0)) }
      ];

      const prevFirstColorName = editingProduct?.colorGroups?.[0]?.colorName || productForm.colorName;
      const primaryVariants: ProductVariant[] = sizeStocks.map(({ size, stock }) => {
        const existingVar = editingProduct?.variants.find(
          v => v.colorName.toLowerCase() === prevFirstColorName.toLowerCase() && v.size === size
        );
        return {
          id: existingVar?.id || `var_${ts}_${size.toLowerCase()}`,
          colorName: productForm.colorName,
          colorHex: productForm.colorHex,
          size,
          sku: existingVar?.sku || `4L-${codePrefix}-${size}-${ts % 1000}`,
          stock,
          // Images are stored on colorGroups[0].images so large base64 strings are not duplicated 5x across every size variant
          images: []
        };
      });

      const remainingVariants = editingProduct
        ? editingProduct.variants.filter(v => v.colorName.toLowerCase() !== prevFirstColorName.toLowerCase())
        : [];
      const extraColorGroups = editingProduct ? editingProduct.colorGroups.slice(1) : [];

      const payload = {
        title: cleanTitle,
        subtitle: productForm.subtitle,
        category: productForm.category,
        basePrice: Number(productForm.basePrice),
        discountPrice: productForm.discountPrice > 0 ? Number(productForm.discountPrice) : null,
        description: productForm.description,
        isFeatured: productForm.isFeatured,
        isPublished: productForm.isPublished,
        colorGroups: [
          { colorName: productForm.colorName, colorHex: productForm.colorHex, images: finalImages },
          ...extraColorGroups
        ],
        variants: [...primaryVariants, ...remainingVariants],
        details: {
          fabric: productForm.fabric,
          gsm: Number(productForm.gsm),
          fit: productForm.fit,
          care: productForm.care
        }
      };

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      let d: any = {};
      try {
        d = rawText ? JSON.parse(rawText) : {};
      } catch {
        d = { error: rawText || `HTTP ${res.status}` };
      }

      if (res.ok) {
        if (d.product) {
          setProducts(prev =>
            editingProduct
              ? prev.map(p => (p.id === d.product.id ? d.product : p))
              : [d.product, ...prev]
          );
        }
        setShowProductModal(false);
        showNotice('success', editingProduct ? `Updated "${cleanTitle}" successfully.` : `Added "${cleanTitle}" to catalog.`);
        await Promise.all([fetchProductsList(), fetchInventory(), fetchOverview()]);
      } else {
        showNotice('error', d.error || `Failed to save product (HTTP ${res.status}).`);
      }
    } catch (e: any) {
      showNotice('error', 'Error saving product: ' + (e.message || 'Unknown error'));
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setConfirmDeleteProductId(null);
        setProducts(prev => prev.filter(p => p.id !== id));
        showNotice('success', 'Product permanently deleted from catalog.');
        await Promise.all([fetchProductsList(), fetchInventory(), fetchOverview()]);
      } else {
        showNotice('error', data.error || 'Failed to delete product.');
      }
    } catch (e: any) {
      showNotice('error', 'Failed to delete product: ' + (e.message || 'Network error'));
    }
  };

  // EXCEL / CSV BULK IMPORT
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    try {
      const lines = bulkCsvText.trim().split('\n');
      if (lines.length < 2) {
        showNotice('error', 'Please provide at least a header row and one product row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const productsToImport: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 3) continue;

        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx];
        });

        productsToImport.push({
          title: row['title'] || row['name'] || `4LAAZY Drop Piece ${i}`,
          category: row['category'] || 'Round Neck T-Shirt',
          basePrice: Number(row['price']) || 1999,
          discountPrice: row['saleprice'] ? Number(row['saleprice']) : undefined,
          description: row['description'] || 'Imported via bulk CSV upload.',
          variants: [
            {
              id: `var_${Date.now()}_${i}`,
              colorName: row['color'] || 'Washed Black',
              colorHex: '#141416',
              size: (row['size'] || 'L') as any,
              sku: row['sku'] || `4L-CSV-${1000 + i}`,
              stock: Number(row['stock']) || 25,
              images: ['/assets/images/product_oversized_heavy_tee_1794056020516.jpg']
            }
          ]
        });
      }

      const res = await fetch('/api/admin/products/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ products: productsToImport })
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('success', data.message || `Imported ${productsToImport.length} products.`);
        setShowBulkModal(false);
        setBulkCsvText('');
        await Promise.all([fetchProductsList(), fetchInventory(), fetchOverview()]);
      } else {
        showNotice('error', data.error || 'Bulk import failed.');
      }
    } catch (err: any) {
      showNotice('error', 'Error parsing CSV: ' + err.message);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,title,category,price,saleprice,color,size,sku,stock,description\n" +
      "Architectural Down Shoulder Box Tee,Down Shoulder T-Shirt,1999,1699,Washed Black,L,4L-DS-WB-L,30,280 GSM combed cotton down shoulder tee\n" +
      "Brutalist Boxy Knit Polo,Polo Neck T-Shirt,2499,2199,Washed Black,XL,4L-PL-WB-XL,20,290 GSM interlock knit polo t-shirt\n" +
      "Signature Heavy Combed Round Neck T-Shirt,Round Neck T-Shirt,1799,1499,Pure White,M,4L-RN-PW-M,25,280 GSM pure cotton crewneck t-shirt";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "4lazy_product_import_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  // ORDER ACTIONS
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrdersList();
        fetchOverview();
        fetchEmails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForTracking) return;

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderForTracking.id}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(trackingForm)
      });
      if (res.ok) {
        setSelectedOrderForTracking(null);
        fetchOrdersList();
        fetchEmails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // RETURNS MANAGEMENT ACTIONS
  const handleUpdateReturnStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    try {
      const res = await fetch(`/api/admin/returns/${selectedReturn.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(returnStatusForm)
      });
      if (res.ok) {
        setSelectedReturn(null);
        fetchReturnsList();
        fetchOrdersList();
        fetchInventory();
        fetchOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // INVENTORY ADJUSTMENT (Supports + / - delta & exact stock setting)
  const handleQuickStockDelta = async (item: any, delta: number) => {
    if (delta === 0) return;
    if (delta < 0 && item.stock === 0) {
      showNotice('error', `${item.sku} is already at 0 units.`);
      return;
    }
    setQuickAdjustingSku(item.sku);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          change: delta,
          reason: `Quick ${delta > 0 ? `+${delta}` : delta} adjustment from inventory table`
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showNotice(
          'success',
          `${item.sku} (${item.colorName} / ${item.size}) stock updated to ${data.variant?.stock ?? Math.max(0, item.stock + delta)} units.`
        );
        await Promise.all([fetchInventory(), fetchProductsList(), fetchOverview()]);
      } else {
        showNotice('error', data.error || 'Failed to update stock.');
      }
    } catch (e: any) {
      showNotice('error', 'Failed to update stock: ' + (e?.message || 'Network error'));
    } finally {
      setQuickAdjustingSku(null);
    }
  };

  const handleInventoryAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    const trimmed = adjustQtyInput.trim();
    const parsedNum = Number(trimmed);

    if (!trimmed || isNaN(parsedNum)) {
      showNotice('error', 'Please enter a valid number (for example -5, +10, or 0 in Exact mode).');
      return;
    }

    if (adjustMode === 'delta' && Math.round(parsedNum) === 0) {
      showNotice('error', 'Enter a non-zero adjustment like -5 or +10, or switch to "Set Exact Stock".');
      return;
    }

    if (adjustMode === 'exact' && parsedNum < 0) {
      showNotice('error', 'Exact stock quantity cannot be less than 0.');
      return;
    }

    setAdjustSaving(true);
    try {
      const payload =
        adjustMode === 'exact'
          ? {
              productId: adjustModalItem.productId,
              variantId: adjustModalItem.variantId,
              sku: adjustModalItem.sku,
              setExactStock: Math.max(0, Math.round(parsedNum)),
              reason: adjustReason
            }
          : {
              productId: adjustModalItem.productId,
              variantId: adjustModalItem.variantId,
              sku: adjustModalItem.sku,
              change: Math.round(parsedNum),
              reason: adjustReason
            };

      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setAdjustModalItem(null);
        showNotice(
          'success',
          `Updated ${adjustModalItem.sku} stock to ${data.variant?.stock ?? 0} units.`
        );
        await Promise.all([fetchInventory(), fetchProductsList(), fetchOverview()]);
      } else {
        showNotice('error', data.error || 'Failed to update stock.');
      }
    } catch (e: any) {
      showNotice('error', 'Error updating stock: ' + (e?.message || 'Network error'));
    } finally {
      setAdjustSaving(false);
    }
  };

  // CATEGORY MANAGEMENT
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        showNotice('success', editingCategory ? 'Category updated.' : 'Category created.');
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotice('error', err.error || 'Failed to save category.');
      }
    } catch (e) {
      console.error(e);
      showNotice('error', 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConfirmDeleteCategoryId(null);
        showNotice('success', 'Category deleted.');
        fetchCategories();
      } else {
        showNotice('error', 'Failed to delete category.');
      }
    } catch (e) {
      console.error(e);
      showNotice('error', 'Failed to delete category.');
    }
  };

  // COUPONS CRUD
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCoupon.code.trim().toUpperCase();
    if (!cleanCode) {
      showNotice('error', 'Please enter a valid promo code.');
      return;
    }
    setSavingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: cleanCode,
          type: newCoupon.type,
          value: Number(newCoupon.value),
          minOrderValue: Number(newCoupon.minOrderValue) || 0,
          maxDiscount: newCoupon.type === 'percent' && newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : undefined,
          usageLimit: Number(newCoupon.usageLimit) || 500,
          expiresAt: newCoupon.expiresAt || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCouponModal(false);
        setNewCoupon({
          code: '',
          type: 'percent',
          value: 10,
          minOrderValue: 1499,
          maxDiscount: 1000,
          usageLimit: 500,
          expiresAt: ''
        });
        showNotice('success', `Coupon ${cleanCode} created and activated.`);
        fetchCoupons();
      } else {
        showNotice('error', data.error || 'Failed to create coupon.');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !coupon.isActive })
      });
      if (res.ok) {
        showNotice('success', `Coupon ${coupon.code} is now ${!coupon.isActive ? 'Active' : 'Paused'}.`);
        fetchCoupons();
      } else {
        showNotice('error', 'Failed to update coupon status.');
      }
    } catch (err) {
      showNotice('error', 'Failed to update coupon status.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConfirmDeleteCouponId(null);
        setCoupons(prev => prev.filter(c => c.id !== id));
        showNotice('success', 'Coupon deleted.');
        fetchCoupons();
      } else {
        showNotice('error', 'Failed to delete coupon.');
      }
    } catch (err) {
      showNotice('error', 'Failed to delete coupon.');
    }
  };

  // SETTINGS SAVE & COD TOGGLE
  const handleToggleCod = async () => {
    if (!storeSettings) return;
    const nextCod = storeSettings.codEnabled === false;
    setTogglingCod(true);
    try {
      const updated = { ...storeSettings, codEnabled: nextCod };
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setStoreSettings(data.settings || updated);
        showNotice('success', `Cash on Delivery (COD) is now ${nextCod ? 'ENABLED' : 'DISABLED'} on checkout.`);
      } else {
        showNotice('error', 'Failed to toggle COD setting.');
      }
    } catch (err) {
      showNotice('error', 'Failed to update COD setting.');
    } finally {
      setTogglingCod(false);
    }
  };

  const getHeroSlidesList = (): HeroSlide[] => {
    return normalizeHeroSlides(storeSettings);
  };

  const updateHeroSlidesList = (nextSlides: HeroSlide[]) => {
    if (!storeSettings) return;
    const cleanedUrls = nextSlides.map(s => s.imageUrl).filter(Boolean);
    setStoreSettings({
      ...storeSettings,
      heroSlides: nextSlides,
      heroImages: cleanedUrls,
      heroImageUrl: nextSlides[0]?.imageUrl || storeSettings.heroImageUrl,
      heroHeading: nextSlides[0]?.heading || storeSettings.heroHeading,
      heroSubhead: nextSlides[0]?.subhead || storeSettings.heroSubhead
    });
  };

  const handleUpdateHeroSlide = (index: number, patch: Partial<HeroSlide>) => {
    const slides = [...getHeroSlidesList()];
    if (!slides[index]) return;
    slides[index] = { ...slides[index], ...patch };
    updateHeroSlidesList(slides);
  };

  const handleAddHeroSlide = () => {
    const slides = [...getHeroSlidesList()];
    const defaultCat = categories[0]?.name || 'Round Neck T-Shirt';
    slides.push({
      id: `hero_slide_${Date.now()}`,
      imageUrl: '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
      eyebrow: 'NEW DROP FEATURE',
      heading: 'ARCHITECTURAL\nHEAVYWEIGHT.',
      subhead: 'Add custom copy for this slide and link it directly to any category or product.',
      linkType: 'category',
      linkTarget: defaultCat
    });
    updateHeroSlidesList(slides);
    showNotice('success', `Added Slide ${slides.length}. Edit its image, matter, and link below, then publish changes.`);
  };

  const handleRemoveHeroSlide = (index: number) => {
    const slides = [...getHeroSlidesList()];
    if (slides.length <= 1) {
      showNotice('error', 'At least 1 hero slide is required.');
      return;
    }
    slides.splice(index, 1);
    updateHeroSlidesList(slides);
  };

  const handleMoveHeroSlide = (index: number, dir: -1 | 1) => {
    const slides = [...getHeroSlidesList()];
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const temp = slides[index];
    slides[index] = slides[target];
    slides[target] = temp;
    updateHeroSlidesList(slides);
  };

  const triggerHeroSlideUpload = (index: number) => {
    activeHeroUploadIdxRef.current = index;
    heroSlideFileInputRef.current?.click();
  };

  const handleHeroSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      e.target.value = '';
      return;
    }

    const slideIdx = activeHeroUploadIdxRef.current;
    setUploadingHeroSlideIdx(slideIdx);
    try {
      const compressed = await compressUploadImage(file, 1400, 0.85);
      handleUpdateHeroSlide(slideIdx, { imageUrl: compressed });
      showNotice('success', `Hero Slide ${slideIdx + 1} image uploaded.`);
    } catch (err: any) {
      showNotice('error', 'Failed to upload hero slide image: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadingHeroSlideIdx(null);
      e.target.value = '';
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'Please select a valid image file.');
      e.target.value = '';
      return;
    }

    setUploadingCategoryImage(true);
    try {
      const compressed = await compressUploadImage(file, 1200, 0.85);
      setCategoryForm(prev => ({ ...prev, image: compressed }));
      showNotice('success', 'Category banner image uploaded.');
    } catch (err: any) {
      showNotice('error', 'Failed to upload category image: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadingCategoryImage(false);
      e.target.value = '';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSettings) return;

    const slides = getHeroSlidesList();
    const payload: StoreSettings = {
      ...storeSettings,
      heroSlides: slides,
      heroImages: slides.map(s => s.imageUrl).filter(Boolean),
      heroImageUrl: slides[0]?.imageUrl || storeSettings.heroImageUrl,
      heroHeading: slides[0]?.heading || storeSettings.heroHeading,
      heroSubhead: slides[0]?.subhead || storeSettings.heroSubhead
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.settings) setStoreSettings(data.settings);
        setSettingsSuccess(true);
        showNotice('success', 'Hero slides, category imagery, and store settings published live.');
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        showNotice('error', 'Failed to save store settings.');
      }
    } catch (e) {
      console.error(e);
      showNotice('error', 'Error saving store settings.');
    }
  };

  // Filtered inventory calculations
  const totalStockCount = inventoryMatrix.reduce((sum, item) => sum + item.stock, 0);
  const totalValuation = inventoryMatrix.reduce((sum, item) => sum + (item.stock * item.price), 0);

  const filteredInventory = inventoryMatrix.filter(item => {
    const matchesSearch =
      !inventorySearch.trim() ||
      item.sku.toLowerCase().includes(inventorySearch.trim().toLowerCase()) ||
      item.productTitle.toLowerCase().includes(inventorySearch.trim().toLowerCase()) ||
      item.colorName.toLowerCase().includes(inventorySearch.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (inventoryFilter === 'low') return item.stock > 0 && item.stock < 15;
    if (inventoryFilter === 'out') return item.stock === 0;
    return true;
  });

  const handleMarkStockNotified = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/stock-notifications/${id}/notify`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showNotice('success', data.message || 'Customer marked as notified.');
        await Promise.all([fetchStockNotifications(), fetchOverview(), fetchEmails()]);
      } else {
        showNotice('error', data.error || 'Failed to mark as notified.');
      }
    } catch {
      showNotice('error', 'Failed to update stock notification.');
    }
  };

  const handleDeleteStockNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/stock-notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConfirmDeleteNotifyId(null);
        setStockNotifications(prev => prev.filter(n => n.id !== id));
        showNotice('success', 'Notify request deleted.');
        fetchOverview();
      } else {
        showNotice('error', 'Failed to delete request.');
      }
    } catch {
      showNotice('error', 'Failed to delete request.');
    }
  };

  const pendingNotifyCount = stockNotifications.filter(n => n.status === 'Pending').length;

  const navTabs: { id: AdminTab; label: string; icon: any; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: products.length },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: lowStockItems.length > 0 ? `${lowStockItems.length} Low` : undefined, badgeColor: 'bg-amber-500/20 text-[#E5A914]' },
    { id: 'notify-requests', label: 'Notify Me', icon: Bell, badge: pendingNotifyCount > 0 ? pendingNotifyCount : undefined, badgeColor: 'bg-amber-500/20 text-[#E5A914]' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: paymentSummary?.pendingCount ? `${paymentSummary.pendingCount} Pending` : transactions.length, badgeColor: paymentSummary?.pendingCount ? 'bg-amber-500/20 text-[#E5A914]' : undefined },
    { id: 'returns', label: 'Returns', icon: RotateCcw, badge: returns.length > 0 ? returns.length : undefined, badgeColor: 'bg-amber-500/20 text-[#E5A914]' },
    { id: 'customers', label: 'Customers', icon: Users, badge: customers.length > 0 ? customers.length : undefined },
    { id: 'tally', label: 'Tally & GST', icon: FileSpreadsheet },
    { id: 'content', label: 'CMS & Images', icon: FileText },
    { id: 'coupons', label: 'Coupons', icon: Tag, badge: coupons.length > 0 ? coupons.length : undefined },
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col">
      
      {/* Top Admin Sticky Navigation Bar with Complete Menu Bar in Nav */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-2xl">
        {/* Nav Header Main Row */}
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Monogram & Module Drawer Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setAdminNavMenuOpen(!adminNavMenuOpen)}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors flex items-center gap-1.5"
              aria-label="Toggle dashboard navigation menu"
            >
              {adminNavMenuOpen ? <X className="w-5 h-5 text-[#E5A914]" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center p-1 shadow-inner">
                <img
                  src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
                  alt="4LAAZY Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-black text-white tracking-wider">4LAAZY</span>
                  <span className="text-[9px] font-bold tracking-widest text-[#E5A914] bg-[#E5A914]/10 border border-[#E5A914]/30 px-1.5 py-0.5 rounded uppercase font-mono">
                    ADMIN
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                  EXECUTIVE CONSOLE
                </span>
              </div>
            </div>
          </div>

          {/* Nav Quick Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={openAddProductModal}
              className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
              title="Add a new garment to the catalog"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              title="Upload products in bulk via CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Excel Upload</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/80 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Preview Public Storefront"
            >
              <Store className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden lg:inline">Storefront</span>
            </button>

            <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

            {/* Admin User / Logout */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user?.name || 'Super Admin'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ACTIVE SESSION
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out of Admin Console"
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Drawer Overlay (accessed via Menu icon without second bar below header) */}
        {adminNavMenuOpen && (
          <div className="border-t border-neutral-800 bg-neutral-950/98 backdrop-blur-xl px-4 py-4 space-y-4">
            <div className="max-w-[1700px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      selectTab(tab.id);
                      setAdminNavMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-left transition-all ${
                      isActive
                        ? 'bg-[#E5A914] text-black font-extrabold shadow'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </span>
                    {tab.badge !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1 rounded ${isActive ? 'bg-black/20 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1.5 hover:text-white"
              >
                <Store className="w-4 h-4" />
                <span>Return to Storefront</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-10 overflow-y-auto">
        {adminNotice && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              adminNotice.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/70 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {adminNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{adminNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminNotice(null)}
              className="text-neutral-400 hover:text-white p-1"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        {/* OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Executive Dashboard</h1>
                <p className="text-xs text-neutral-400">Live operational oversight, order queues, and revenue metrics.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectTab('orders')}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider"
                >
                  Manage Orders ({orders.length})
                </button>
                <button
                  onClick={openAddProductModal}
                  className="bg-[#E5A914] text-black font-extrabold px-3.5 py-1.5 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Gross Sales Turnover</span>
                <p className="font-mono text-2xl font-black text-[#E5A914] tabular-nums">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-400">{metrics.completedOrders} orders fulfilled</p>
              </div>

              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Active Order Queue</span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  {metrics.totalOrders}
                </p>
                <p className="text-[11px] text-amber-400">{metrics.pendingOrders} pending dispatch</p>
              </div>

              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Customer Roster</span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  {metrics.totalCustomers}
                </p>
                <p className="text-[11px] text-neutral-400">Verified buyer accounts</p>
              </div>

              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Total Stock Valuation</span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  ₹{totalValuation.toLocaleString()}
                </p>
                <p className="text-[11px] text-neutral-400">{totalStockCount} units in warehouse</p>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => selectTab('products')}
                className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left"
              >
                <Package className="w-4 h-4 text-[#E5A914] mb-1.5" />
                <p className="text-xs font-bold text-white uppercase">Products &amp; Excel</p>
                <p className="text-[10px] text-neutral-400">Add, edit, bulk upload</p>
              </button>
              <button
                onClick={() => selectTab('inventory')}
                className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left"
              >
                <Boxes className="w-4 h-4 text-[#E5A914] mb-1.5" />
                <p className="text-xs font-bold text-white uppercase">Stock Inventory</p>
                <p className="text-[10px] text-neutral-400">Variant stock &amp; audit</p>
              </button>
              <button
                onClick={() => selectTab('returns')}
                className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left"
              >
                <RotateCcw className="w-4 h-4 text-[#E5A914] mb-1.5" />
                <p className="text-xs font-bold text-white uppercase">Returns &amp; Exchanges</p>
                <p className="text-[10px] text-neutral-400">{returns.length} active return cases</p>
              </button>
              <button
                onClick={() => selectTab('tally')}
                className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#E5A914] mb-1.5" />
                <p className="text-xs font-bold text-white uppercase">Tally XML &amp; GST</p>
                <p className="text-[10px] text-neutral-400">Export vouchers &amp; CSV</p>
              </button>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Recent Orders Overview</h2>
                <button onClick={() => selectTab('orders')} className="text-xs text-[#E5A914] hover:underline font-bold">
                  View All Orders &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-sans">
                      <th className="pb-2.5">Order Number</th>
                      <th className="pb-2.5">Customer</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5">Payment</th>
                      <th className="pb-2.5">Order Status</th>
                      <th className="pb-2.5 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {recentOrders.map(order => {
                      const payMeta = getPaymentBadgeMeta(order.payment.status, order.payment.gatewayStatus);
                      const payBadgeClass =
                        payMeta.tone === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : payMeta.tone === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : payMeta.tone === 'refunded'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400';
                      const orderStatusClass =
                        order.status === 'Cancelled'
                          ? 'bg-red-500/20 text-red-400'
                          : order.status === 'Order Placed' || order.status === 'Confirmed' || order.status === 'Delivered'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-neutral-800 text-neutral-200';
                      return (
                        <tr key={order.id} className="hover:bg-neutral-800/30">
                          <td className="py-2.5 font-bold text-[#E5A914]">{order.orderNumber}</td>
                          <td className="py-2.5 font-sans text-white">{order.customer.name} ({order.shippingAddress.city})</td>
                          <td className="py-2.5 text-white font-bold">₹{order.total.toLocaleString()}</td>
                          <td className="py-2.5 font-sans">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${payBadgeClass}`}>
                              {payMeta.label}
                            </span>
                            <span className="block text-[10px] text-neutral-500 mt-0.5 uppercase">
                              {order.payment.paymentMethodDetail || order.payment.provider}
                            </span>
                          </td>
                          <td className="py-2.5 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${orderStatusClass}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-sans">
                            <button
                              onClick={() => setViewInvoiceOrder(order)}
                              className="text-neutral-400 hover:text-white text-xs underline mr-3"
                            >
                              Invoice
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderForTracking(order);
                                setTrackingForm({
                                  courierCompany: order.tracking?.courierCompany || 'Blue Dart Express',
                                  trackingNumber: order.tracking?.trackingNumber || '',
                                  trackingUrl: order.tracking?.trackingUrl || '',
                                  estimatedDeliveryDate: order.tracking?.estimatedDeliveryDate || '',
                                  statusNotes: order.tracking?.statusNotes || ''
                                });
                              }}
                              className="text-[#E5A914] hover:underline font-bold text-xs"
                            >
                              Logistics
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Out-of-Stock Notify Me Customer Waitlist Snapshot */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#E5A914]" />
                    Restock Waitlist (&ldquo;Notify Me&rdquo;)
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {pendingNotifyCount} pending customer request{pendingNotifyCount === 1 ? '' : 's'} for out-of-stock pieces
                  </p>
                </div>
                <button
                  onClick={() => selectTab('notify-requests')}
                  className="text-xs text-[#E5A914] hover:underline font-bold"
                >
                  Open Waitlist &rarr;
                </button>
              </div>

              {stockNotifications.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3">
                  No out-of-stock notification requests yet. When customers click &ldquo;Notify Me&rdquo; on zero-stock items, their details appear here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                        <th className="pb-2.5">Customer</th>
                        <th className="pb-2.5">Contact</th>
                        <th className="pb-2.5">Requested Piece</th>
                        <th className="pb-2.5">Status</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      {stockNotifications.slice(0, 5).map(reqItem => (
                        <tr key={reqItem.id} className="hover:bg-neutral-800/30">
                          <td className="py-2.5 font-semibold text-white">{reqItem.customerName}</td>
                          <td className="py-2.5 font-mono text-[11px] text-neutral-300">
                            {reqItem.customerEmail && <span className="block">{reqItem.customerEmail}</span>}
                            {reqItem.customerPhone && <span className="text-neutral-400">{reqItem.customerPhone}</span>}
                          </td>
                          <td className="py-2.5 text-neutral-300">
                            <span className="font-semibold text-white block">{reqItem.productTitle}</span>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {reqItem.colorName} · Size {reqItem.size}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                reqItem.status === 'Notified'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-[#E5A914]'
                              }`}
                            >
                              {reqItem.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            {reqItem.status === 'Pending' ? (
                              <button
                                type="button"
                                onClick={() => handleMarkStockNotified(reqItem.id)}
                                className="text-[#E5A914] hover:underline font-bold text-xs"
                              >
                                Send Alert
                              </button>
                            ) : (
                              <span className="text-[11px] text-neutral-500">Sent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB (Add, Edit, Delete, Excel/CSV Upload) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Product Catalog Management</h1>
                <p className="text-xs text-neutral-400">Add new designs, edit existing variants, delete pieces, or upload in bulk via Excel/CSV.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadSampleTemplate}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Sample Template
                </button>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#E5A914]" /> Excel / CSV Upload
                </button>
                <button
                  onClick={openAddProductModal}
                  className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#d49b10]"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
            </div>

            {/* Product Search & Count Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg text-xs max-w-md w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search by product title, category, or SKU..."
                  className="bg-transparent text-white focus:outline-none text-xs w-full"
                />
                {productSearch && (
                  <button type="button" onClick={() => setProductSearch('')} className="text-neutral-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {products.filter(p =>
                  !productSearch.trim() ||
                  p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.variants.some(v => v.sku.toLowerCase().includes(productSearch.toLowerCase()))
                ).length}{' '}
                of {products.length} pieces
              </span>
            </div>

            {/* Product List Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Piece</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Pricing</th>
                    <th className="p-3.5">Colors &amp; Stock</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {products
                    .filter(p =>
                      !productSearch.trim() ||
                      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.variants.some(v => v.sku.toLowerCase().includes(productSearch.toLowerCase()))
                    )
                    .map(p => (
                    <tr key={p.id} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={p.colorGroups[0]?.images[0] || p.variants[0]?.images[0]}
                          alt={p.title}
                          className="w-12 h-14 object-cover rounded bg-neutral-950 border border-neutral-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-bold text-white">{p.title}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">{p.slug}</p>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-300 font-semibold">{p.category}</td>
                      <td className="p-3.5 font-mono tabular-nums">
                        <span className="font-bold text-white">₹{(p.discountPrice || p.basePrice).toLocaleString()}</span>
                        {p.discountPrice && <span className="text-neutral-500 line-through ml-2">₹{p.basePrice.toLocaleString()}</span>}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 mb-1">
                          {p.colorGroups.map(cg => (
                            <span key={cg.colorName} className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: cg.colorHex }} title={cg.colorName} />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                          {p.variants.reduce((sum, v) => sum + v.stock, 0)} units total
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${p.isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                          {p.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {confirmDeleteProductId === p.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded text-[11px] uppercase"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProductId(null)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-2 py-1 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(p)}
                              className="text-[#E5A914] hover:underline font-bold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProductId(p.id)}
                              className="text-red-400 hover:underline font-semibold text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 text-xs">
                        No products in catalog yet. Click &quot;Add Product&quot; to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVENTORY MANAGEMENT TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Variant Stock Matrix</h1>
                <p className="text-xs text-neutral-400">Direct SKU-level inventory adjustment (- / +), low-stock warnings, and valuation.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs">
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    placeholder="Search SKU or product..."
                    className="bg-transparent text-white focus:outline-none text-xs w-40"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-lg text-xs font-semibold uppercase">
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('all')}
                    className={`px-3 py-1 rounded transition-colors ${inventoryFilter === 'all' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    All SKUs ({inventoryMatrix.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('low')}
                    className={`px-3 py-1 rounded transition-colors ${inventoryFilter === 'low' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Low Stock (&lt;15)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryFilter('out')}
                    className={`px-3 py-1 rounded transition-colors ${inventoryFilter === 'out' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Inventory Valuation Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Stock Value</span>
                <p className="font-mono text-xl font-bold text-[#E5A914] mt-0.5 tabular-nums">₹{totalValuation.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Physical Units</span>
                <p className="font-mono text-xl font-bold text-white mt-0.5 tabular-nums">{totalStockCount} pieces</p>
              </div>
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Active SKU Codes</span>
                <p className="font-mono text-xl font-bold text-white mt-0.5 tabular-nums">{inventoryMatrix.length} distinct sizes</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-sans">
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5">Product Title</th>
                    <th className="p-3.5">Colorway</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Available Stock</th>
                    <th className="p-3.5 text-right font-sans">Stock Adjustment (- / +)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredInventory.map((item, idx) => {
                    const isBusy = quickAdjustingSku === item.sku;
                    return (
                      <tr key={item.variantId || `${item.sku}_${idx}`} className="hover:bg-neutral-800/20">
                        <td className="p-3.5 font-bold text-[#E5A914]">{item.sku}</td>
                        <td className="p-3.5 font-sans font-semibold text-white">{item.productTitle}</td>
                        <td className="p-3.5 font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-neutral-700 shrink-0" style={{ backgroundColor: item.colorHex }} />
                            <span>{item.colorName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-white">{item.size}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${
                            item.stock === 0
                              ? 'bg-red-500/20 text-red-400'
                              : item.stock < 15
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {item.stock} Units
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-sans">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy || item.stock === 0}
                              onClick={() => handleQuickStockDelta(item, -5)}
                              className="px-2 py-1 bg-neutral-950 hover:bg-red-500/20 border border-neutral-800 hover:border-red-500/40 text-red-400 rounded text-[11px] font-mono font-bold disabled:opacity-40 transition-colors"
                              title="Deduct 5 units"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              disabled={isBusy || item.stock === 0}
                              onClick={() => handleQuickStockDelta(item, -1)}
                              className="px-2 py-1 bg-neutral-950 hover:bg-red-500/20 border border-neutral-800 hover:border-red-500/40 text-red-400 rounded text-[11px] font-mono font-bold disabled:opacity-40 transition-colors"
                              title="Deduct 1 unit"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQuickStockDelta(item, 1)}
                              className="px-2 py-1 bg-neutral-950 hover:bg-emerald-500/20 border border-neutral-800 hover:border-emerald-500/40 text-emerald-400 rounded text-[11px] font-mono font-bold disabled:opacity-40 transition-colors"
                              title="Add 1 unit"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleQuickStockDelta(item, 5)}
                              className="px-2 py-1 bg-neutral-950 hover:bg-emerald-500/20 border border-neutral-800 hover:border-emerald-500/40 text-emerald-400 rounded text-[11px] font-mono font-bold disabled:opacity-40 transition-colors"
                              title="Add 5 units"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustModalItem(item);
                                setAdjustMode('delta');
                                setAdjustQtyInput('10');
                              }}
                              className="bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-white px-3 py-1 rounded text-xs font-bold uppercase transition-colors ml-1"
                            >
                              Custom
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STOCK NOTIFICATIONS ("NOTIFY ME") TAB */}
        {activeTab === 'notify-requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                  Restock Alerts (&ldquo;Notify Me&rdquo;)
                </h1>
                <p className="text-xs text-neutral-400">
                  Customers waiting on zero-stock products and sizes. Notify buyers directly once inventory is replenished.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setNotifyFilter('all')}
                  className={`px-3 py-1.5 rounded ${
                    notifyFilter === 'all' ? 'bg-white text-black font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({stockNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyFilter('Pending')}
                  className={`px-3 py-1.5 rounded ${
                    notifyFilter === 'Pending' ? 'bg-[#E5A914] text-black font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  Pending ({stockNotifications.filter(n => n.status === 'Pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyFilter('Notified')}
                  className={`px-3 py-1.5 rounded ${
                    notifyFilter === 'Notified' ? 'bg-emerald-500 text-black font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  Notified ({stockNotifications.filter(n => n.status === 'Notified').length})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg text-xs max-w-md w-full">
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={notifySearch}
                onChange={e => setNotifySearch(e.target.value)}
                placeholder="Search by customer name, email, phone, or product..."
                className="bg-transparent text-white focus:outline-none text-xs w-full"
              />
              {notifySearch && (
                <button type="button" onClick={() => setNotifySearch('')} className="text-neutral-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Customer Details</th>
                    <th className="p-3.5">Product &amp; Variant</th>
                    <th className="p-3.5">Current Stock</th>
                    <th className="p-3.5">Requested Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {stockNotifications
                    .filter(item => {
                      if (notifyFilter !== 'all' && item.status !== notifyFilter) return false;
                      if (!notifySearch.trim()) return true;
                      const q = notifySearch.toLowerCase();
                      return (
                        item.customerName.toLowerCase().includes(q) ||
                        item.customerEmail.toLowerCase().includes(q) ||
                        item.customerPhone.toLowerCase().includes(q) ||
                        item.productTitle.toLowerCase().includes(q) ||
                        item.size.toLowerCase().includes(q) ||
                        item.colorName.toLowerCase().includes(q)
                      );
                    })
                    .map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const variant = prod?.variants.find(
                        v =>
                          (item.variantId && v.id === item.variantId) ||
                          (v.colorName.toLowerCase() === item.colorName.toLowerCase() && v.size === item.size)
                      );
                      const liveStock = variant?.stock ?? 0;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-800/20">
                          <td className="p-3.5">
                            <p className="font-bold text-white">{item.customerName}</p>
                            {item.customerEmail && (
                              <p className="text-[11px] font-mono text-neutral-300">{item.customerEmail}</p>
                            )}
                            {item.customerPhone && (
                              <p className="text-[11px] font-mono text-neutral-400">{item.customerPhone}</p>
                            )}
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-white">{item.productTitle}</p>
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {item.colorName} · Size {item.size}
                              {item.sku ? ` · ${item.sku}` : ''}
                            </p>
                          </td>
                          <td className="p-3.5 font-mono tabular-nums">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                liveStock === 0
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {liveStock} Units
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-neutral-400 tabular-nums">
                            {new Date(item.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                item.status === 'Notified'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-[#E5A914]'
                              }`}
                            >
                              {item.status}
                            </span>
                            {item.notifiedAt && (
                              <span className="block text-[10px] text-neutral-500 font-mono mt-0.5">
                                {new Date(item.notifiedAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                            {item.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => handleMarkStockNotified(item.id)}
                                className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-2.5 py-1 rounded text-[11px] uppercase tracking-wider"
                              >
                                Mark Notified
                              </button>
                            )}
                            {confirmDeleteNotifyId === item.id ? (
                              <span className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStockNotification(item.id)}
                                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded text-[11px] uppercase"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNotifyId(null)}
                                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded text-[11px]"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteNotifyId(item.id)}
                                className="text-red-400 hover:underline font-semibold text-xs"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {stockNotifications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        No restock alerts requested yet. Customers who click &ldquo;Notify Me&rdquo; on zero-stock products will be listed here with their contact info.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Customer Orders</h1>
                <p className="text-xs text-neutral-400">Order verification, packing status flow, and courier tracking updates.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-xs">
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search by Order # or Customer..."
                    className="bg-transparent text-white focus:outline-none text-xs w-48"
                  />
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Order Ref</th>
                    <th className="p-3.5">Buyer &amp; Address</th>
                    <th className="p-3.5">Pieces</th>
                    <th className="p-3.5">Total (₹)</th>
                    <th className="p-3.5">Fulfillment Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono">
                  {orders
                    .filter(o => !orderSearch || o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) || o.customer.name.toLowerCase().includes(orderSearch.toLowerCase()))
                    .map(order => {
                      const payMeta = getPaymentBadgeMeta(order.payment.status, order.payment.gatewayStatus);
                      const payBadgeClass =
                        payMeta.tone === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : payMeta.tone === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : payMeta.tone === 'refunded'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-red-500/20 text-red-400';
                      const isPendingOnline =
                        order.payment.status === 'pending' &&
                        Boolean(order.payment.cashfreeOrderId) &&
                        order.payment.provider !== 'cod';

                      return (
                        <tr key={order.id} className="hover:bg-neutral-800/20">
                          <td className="p-3.5 align-top">
                            <span className="font-bold text-[#E5A914] block">{order.orderNumber}</span>
                            <span className="text-[10px] text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="p-3.5 align-top font-sans">
                            <p className="font-bold text-white">{order.customer.name}</p>
                            <p className="text-neutral-400 text-[11px]">{order.customer.email}</p>
                            <p className="text-neutral-500 text-[11px]">{order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.pinCode})</p>
                          </td>
                          <td className="p-3.5 align-top font-sans">
                            <div className="space-y-1">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="text-[11px] text-neutral-300">
                                  <p>{it.quantity}x {it.productTitle} <span className="text-neutral-500">({it.colorName}/{it.size})</span></p>
                                  {it.customPrint && (
                                    <div className="mt-1 p-1.5 bg-neutral-950/70 border border-[#E5A914]/30 rounded flex items-center gap-2">
                                      {it.customPrint.uploadedGraphicUrl &&
                                        (it.customPrint.uploadedGraphicUrl.startsWith('data:') ||
                                          it.customPrint.uploadedGraphicUrl.startsWith('/') ||
                                          it.customPrint.uploadedGraphicUrl.startsWith('http')) && (
                                          <img
                                            src={it.customPrint.uploadedGraphicUrl}
                                            alt="Custom print graphic"
                                            className="w-8 h-8 object-contain rounded bg-neutral-900 border border-neutral-800 shrink-0"
                                          />
                                        )}
                                      <div className="text-[10px] text-[#E5A914] font-mono leading-snug">
                                        <span>
                                          {it.customPrint.printTechnique === 'Custom Image Print'
                                            ? 'Custom Print Image Attached'
                                            : `Custom: ${it.customPrint.placement} · ${it.customPrint.printTechnique}`}
                                        </span>
                                        {it.customPrint.customText && (
                                          <span className="block text-neutral-300">
                                            &ldquo;{it.customPrint.customText}&rdquo; ({it.customPrint.fontStyle || 'Bold Sans'}, {it.customPrint.textColor || 'Default Ink'})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 align-top">
                            <span className="font-bold text-white block">₹{order.total.toLocaleString()}</span>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-sans uppercase font-bold ${payBadgeClass}`}>
                              {payMeta.label}
                            </span>
                            <span className="block text-[10px] text-neutral-500 font-sans mt-0.5 uppercase">
                              {order.payment.paymentMethodDetail || order.payment.provider}
                            </span>
                            {order.payment.cancellationReason && (
                              <span className="block text-[10px] text-red-400/90 font-sans mt-0.5 max-w-[180px] leading-tight">
                                {order.payment.cancellationReason}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 align-top font-sans">
                            <select
                              value={order.status}
                              onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`bg-neutral-950 border text-xs rounded px-2.5 py-1.5 cursor-pointer font-semibold ${
                                order.status === 'Cancelled'
                                  ? 'border-red-500/40 text-red-300'
                                  : 'border-neutral-700 text-white'
                              }`}
                            >
                              <option value="Order Placed">Order Placed</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Returned">Returned</option>
                            </select>
                            {isPendingOnline && order.payment.cashfreeOrderId && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleSyncPaymentStatus(order.payment.cashfreeOrderId!)}
                                  disabled={syncingPaymentId === order.payment.cashfreeOrderId}
                                  className="px-2 py-0.5 rounded bg-[#E5A914]/15 hover:bg-[#E5A914]/25 border border-[#E5A914]/40 text-[#E5A914] text-[10px] font-bold uppercase disabled:opacity-50"
                                >
                                  {syncingPaymentId === order.payment.cashfreeOrderId ? 'Syncing...' : 'Sync'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelPendingPayment(order.payment.cashfreeOrderId!)}
                                  disabled={cancellingPaymentId === order.payment.cashfreeOrderId}
                                  className="px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-[10px] font-bold uppercase disabled:opacity-50"
                                >
                                  {cancellingPaymentId === order.payment.cashfreeOrderId ? '...' : 'Cancel'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 align-top text-right font-sans space-y-1.5">
                            <button
                              onClick={() => {
                                setSelectedOrderForTracking(order);
                                setTrackingForm({
                                  courierCompany: order.tracking?.courierCompany || 'Blue Dart Express',
                                  trackingNumber: order.tracking?.trackingNumber || '',
                                  trackingUrl: order.tracking?.trackingUrl || '',
                                  estimatedDeliveryDate: order.tracking?.estimatedDeliveryDate || '',
                                  statusNotes: order.tracking?.statusNotes || ''
                                });
                              }}
                              className="inline-flex items-center gap-1 bg-[#E5A914] text-black font-extrabold px-2.5 py-1 rounded text-[11px] uppercase tracking-wider"
                            >
                              <Truck className="w-3 h-3" />
                              {order.tracking?.trackingNumber ? 'Edit AWB' : 'Assign Courier'}
                            </button>
                            <button
                              onClick={() => setViewInvoiceOrder(order)}
                              className="block ml-auto text-xs text-neutral-400 hover:text-white underline"
                            >
                              Print Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENTS MANAGEMENT TAB (CASHFREE TRANSACTIONS) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
                  Payment Management
                </h1>
                <p className="text-xs text-neutral-400">
                  Track Cashfree transactions, verify pending payments, inspect payment methods, and audit failed attempts.
                </p>
              </div>
              <button
                onClick={fetchPayments}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#E5A914]" />
                <span>Refresh Ledger</span>
              </button>
            </div>

            {/* Payment KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Total Transactions
                </span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  {paymentSummary?.totalCount ?? transactions.length}
                </p>
                <p className="text-[11px] text-neutral-400">All recorded attempts</p>
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Successful Payments
                </span>
                <p className="font-mono text-2xl font-black text-emerald-400 tabular-nums">
                  ₹{(paymentSummary?.totalSuccessVolume ?? 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-400/80">
                  {paymentSummary?.successCount ?? 0} verified settlements
                </p>
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Pending Payments
                </span>
                <p className="font-mono text-2xl font-black text-[#E5A914] tabular-nums">
                  {paymentSummary?.pendingCount ?? 0}
                </p>
                <p className="text-[11px] text-amber-400/80">
                  ₹{(paymentSummary?.pendingVolume ?? 0).toLocaleString()} awaiting confirmation
                </p>
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Cancelled / Failed
                </span>
                <p className="font-mono text-2xl font-black text-red-400 tabular-nums">
                  {paymentSummary?.failedCount ?? 0}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {paymentSummary?.cancelledCount ?? 0} cancelled · timeout or declined
                </p>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Transactions' },
                  { id: 'SUCCESS', label: 'Successful' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'CANCELLED', label: 'Cancelled Payment' },
                  { id: 'FAILED', label: 'Failed / Dropped' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPaymentStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                      paymentStatusFilter === f.id
                        ? 'bg-[#E5A914] text-black'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  placeholder="Search Order ID, Cashfree ID, or customer..."
                  className="w-full bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Order ID / Date</th>
                    <th className="p-3.5">Cashfree IDs</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {transactions
                    .filter(tx => {
                      if (paymentStatusFilter === 'CANCELLED') {
                        return (
                          tx.paymentStatus === 'CANCELLED' ||
                          tx.paymentStatus === 'USER_DROPPED'
                        );
                      }
                      if (paymentStatusFilter === 'FAILED') {
                        return (
                          tx.paymentStatus === 'FAILED' ||
                          tx.paymentStatus === 'CANCELLED' ||
                          tx.paymentStatus === 'USER_DROPPED'
                        );
                      }
                      if (paymentStatusFilter !== 'all') {
                        return tx.paymentStatus === paymentStatusFilter;
                      }
                      return true;
                    })
                    .filter(tx => {
                      if (!paymentSearch.trim()) return true;
                      const q = paymentSearch.trim().toLowerCase();
                      return (
                        tx.orderNumber.toLowerCase().includes(q) ||
                        tx.orderId.toLowerCase().includes(q) ||
                        tx.cashfreeOrderId.toLowerCase().includes(q) ||
                        (tx.cashfreePaymentId || '').toLowerCase().includes(q) ||
                        tx.customerDetails.name.toLowerCase().includes(q) ||
                        tx.customerDetails.email.toLowerCase().includes(q)
                      );
                    })
                    .map(tx => {
                      const isSuccess = tx.paymentStatus === 'SUCCESS';
                      const isPending = tx.paymentStatus === 'PENDING';
                      const isCancelled = tx.paymentStatus === 'CANCELLED' || tx.paymentStatus === 'USER_DROPPED';
                      const noteReason = tx.cancellationReason || tx.errorMessage;
                      return (
                        <tr key={tx.id} className="hover:bg-neutral-800/20">
                          <td className="p-3.5 align-top">
                            <span className="font-mono font-bold text-[#E5A914] block">{tx.orderNumber}</span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(tx.transactionDate).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3.5 align-top font-mono text-[11px]">
                            <span className="text-neutral-200 block">{tx.cashfreeOrderId}</span>
                            <span className="text-neutral-500 block">
                              Pay ID: {tx.cashfreePaymentId || '—'}
                            </span>
                          </td>
                          <td className="p-3.5 align-top">
                            <p className="font-bold text-white">{tx.customerDetails.name}</p>
                            <p className="text-[11px] text-neutral-400">{tx.customerDetails.email}</p>
                            <p className="text-[10px] text-neutral-500">{tx.customerDetails.phone}</p>
                          </td>
                          <td className="p-3.5 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-semibold text-neutral-200">
                              {tx.paymentMethod}
                            </span>
                            <span className="block text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                              {tx.environment}
                            </span>
                          </td>
                          <td className="p-3.5 align-top font-mono font-bold text-white tabular-nums">
                            {tx.currency} ₹{Number(tx.amount).toLocaleString()}
                          </td>
                          <td className="p-3.5 align-top">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                isSuccess
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : isPending
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {isCancelled ? 'CANCELLED PAYMENT' : tx.paymentStatus}
                            </span>
                            {noteReason && !isSuccess && (
                              <span className="block text-[10px] text-red-300/80 mt-1 max-w-[200px] leading-tight">
                                {noteReason}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 align-top text-right space-x-2 whitespace-nowrap">
                            {isPending && tx.paymentMethod !== 'COD' && (
                              <>
                                <button
                                  onClick={() => handleSyncPaymentStatus(tx.cashfreeOrderId)}
                                  disabled={syncingPaymentId === tx.cashfreeOrderId}
                                  className="inline-flex items-center gap-1 bg-[#E5A914]/15 hover:bg-[#E5A914]/25 border border-[#E5A914]/40 text-[#E5A914] px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${
                                      syncingPaymentId === tx.cashfreeOrderId ? 'animate-spin' : ''
                                    }`}
                                  />
                                  <span>Sync</span>
                                </button>
                                <button
                                  onClick={() => handleCancelPendingPayment(tx.cashfreeOrderId)}
                                  disabled={cancellingPaymentId === tx.cashfreeOrderId}
                                  className="inline-flex items-center gap-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                  <X className="w-3 h-3" />
                                  <span>{cancellingPaymentId === tx.cashfreeOrderId ? '...' : 'Cancel'}</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedTransaction(tx)}
                              className="inline-flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="p-10 text-center text-xs text-neutral-500">
                  No payment transactions recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* RETURNS & EXCHANGES MANAGEMENT TAB */}
        {activeTab === 'returns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Returns &amp; Sizing Exchanges</h1>
                <p className="text-xs text-neutral-400">Process customer exchange requests, schedule reverse pickups, and issue refunds.</p>
              </div>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Case ID</th>
                    <th className="p-3.5">Order Ref &amp; Buyer</th>
                    <th className="p-3.5">Exchange Reason</th>
                    <th className="p-3.5">Returned Piece</th>
                    <th className="p-3.5">Return Status</th>
                    <th className="p-3.5 text-right">Process Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {returns.map(ret => (
                    <tr key={ret.id} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 font-mono font-bold text-[#E5A914]">{ret.id}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-white font-mono">{ret.orderNumber}</p>
                        <p className="text-neutral-400 text-[11px]">{ret.customerName} ({ret.customerEmail})</p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-white block">{ret.reason}</span>
                        <p className="text-[11px] text-neutral-400 max-w-xs">{ret.details}</p>
                      </td>
                      <td className="p-3.5">
                        {ret.items.map((it, idx) => (
                          <p key={idx} className="text-[11px] text-neutral-300">
                            {it.productTitle} - <strong>{it.colorName} ({it.size})</strong>
                          </p>
                        ))}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          ret.status === 'Refund Completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ret.status === 'Approved'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setReturnStatusForm({
                              status: ret.status,
                              pickupAwb: ret.pickupAwb || '',
                              notes: ret.notes || ''
                            });
                          }}
                          className="bg-[#E5A914] text-black font-extrabold px-3 py-1.5 rounded text-xs uppercase tracking-wider hover:bg-[#d49b10]"
                        >
                          Manage Case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER DATA TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Customer Data &amp; Spend Profiles</h1>
                <p className="text-xs text-neutral-400">Registered buyers, order history, lifetime spending, and verified status.</p>
              </div>

              <button
                onClick={() => {
                  const csv = "data:text/csv;charset=utf-8,Name,Email,Phone,Orders,TotalSpend,JoinedDate\n" +
                    customers.map(c => `"${c.name}","${c.email}","${c.phone}",${c.ordersCount},${c.totalSpent},"${c.joinedAt}"`).join('\n');
                  const encodedUri = encodeURI(csv);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "4lazy_customers_export.csv");
                  document.body.appendChild(link);
                  link.click();
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Customers (.csv)
              </button>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Order Count</th>
                    <th className="p-3.5">Lifetime Spend</th>
                    <th className="p-3.5 text-right">Order History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 font-sans font-bold text-white">{c.name}</td>
                      <td className="p-3.5 text-neutral-300">
                        {c.email} <br />
                        <span className="text-neutral-500 font-sans">{c.phone}</span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${c.isEmailVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                          {c.isEmailVerified ? 'Verified' : 'Pending OTP'}
                        </span>
                      </td>
                      <td className="p-3.5 text-white font-bold">{c.ordersCount} Orders</td>
                      <td className="p-3.5 text-[#E5A914] font-bold">₹{c.totalSpent.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => {
                            const userOrders = orders.filter(o => o.customer.email.toLowerCase() === c.email.toLowerCase());
                            setSelectedCustomerOrders(userOrders);
                          }}
                          className="text-[#E5A914] hover:underline font-bold text-xs"
                        >
                          View Orders ({c.ordersCount})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TALLY & GST FINANCIAL REPORTS TAB */}
        {activeTab === 'tally' && tallySummary && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Tally ERP / TallyPrime &amp; GST Accounting</h1>
                <p className="text-xs text-neutral-400">Generate standard Tally XML Sales Vouchers and GST tax audit registers.</p>
              </div>

              <div className="flex gap-2">
                <a
                  href="/api/admin/tally/export-xml"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-3.5 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Export Tally XML Vouchers
                </a>
                <a
                  href="/api/admin/tally/export-csv"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> GST Sales Register (.csv)
                </a>
              </div>
            </div>

            {/* Accounting Breakdown Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Gross Product Turnover</span>
                <p className="font-mono text-xl font-bold text-white">₹{tallySummary.grossProductSales.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-500">Before discounts</p>
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Net Taxable Value</span>
                <p className="font-mono text-xl font-bold text-[#E5A914]">₹{tallySummary.netTaxableValue.toLocaleString()}</p>
                <p className="text-[11px] text-emerald-400">After -₹{tallySummary.totalDiscounts} coupons</p>
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Output GST (CGST + SGST)</span>
                <p className="font-mono text-xl font-bold text-white">₹{tallySummary.totalTaxCollected.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-400">CGST: ₹{tallySummary.cgstAmount} · SGST: ₹{tallySummary.sgstAmount}</p>
              </div>

              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Net Invoiced Inflow</span>
                <p className="font-mono text-xl font-bold text-emerald-400">₹{tallySummary.netRevenue.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-400">Net of ₹{tallySummary.totalRefunds} refunds</p>
              </div>
            </div>

            {/* Tally XML Import Instructions Box */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 text-xs">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#E5A914]" />
                How to Import into Tally ERP 9 / TallyPrime:
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                <li>Click <strong>&quot;Export Tally XML Vouchers&quot;</strong> above to download <code className="text-[#E5A914]">4LAAZY_Tally_Sales_Vouchers.xml</code>.</li>
                <li>Open TallyPrime &gt; Select your Company (e.g. <strong>4LAAZY APPAREL INC</strong>).</li>
                <li>Navigate to <strong>Import &gt; Transactions &gt; XML Format</strong>.</li>
                <li>Select the exported file. Tally will automatically post Dr to Bank/Cashfree Ledger and Cr to Streetwear Sales + Output CGST/SGST Ledgers!</li>
              </ol>
            </div>
          </div>
        )}

        {/* WEBSITE CMS & IMAGES / HERO / CATEGORY EDIT TAB */}
        {activeTab === 'content' && storeSettings && (
          <div className="space-y-8 max-w-4xl">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Website CMS &amp; Imagery Editor</h1>
              <p className="text-xs text-neutral-400">Edit hero images, headlines, announcement strips, and category photos live on the storefront.</p>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded">
                Changes saved and published live to storefront!
              </div>
            )}

            {/* SECTION 1: HERO AUTO-SLIDER — PER-SLIDE IMAGE, MATTER & CATEGORY/PRODUCT LINKS */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#E5A914]" /> Hero Auto-Slider Slides ({getHeroSlidesList().length})
                  </h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Add slides with custom images, editable copy (matter), and link each slide to a category or specific product.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    ref={heroSlideFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleHeroSlideImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddHeroSlide}
                    className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Hero Slide
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider"
                  >
                    Publish Changes
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {getHeroSlidesList().map((slide, slideIdx, arr) => (
                  <div
                    key={slide.id || slideIdx}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4"
                  >
                    {/* Slide Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#E5A914]/15 text-[#E5A914] border border-[#E5A914]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                          Slide 0{slideIdx + 1}
                        </span>
                        <span className="text-[11px] text-neutral-400 truncate max-w-[260px]">
                          {slide.linkType === 'category' && slide.linkTarget
                            ? `Links to Category: ${slide.linkTarget}`
                            : slide.linkType === 'product' && slide.linkTarget
                            ? `Links to Product: ${
                                products.find(p => p.slug === slide.linkTarget)?.title || slide.linkTarget
                              }`
                            : 'No destination link'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={slideIdx === 0}
                          onClick={() => handleMoveHeroSlide(slideIdx, -1)}
                          className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 disabled:opacity-35"
                          title="Move slide up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={slideIdx === arr.length - 1}
                          onClick={() => handleMoveHeroSlide(slideIdx, 1)}
                          className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-300 disabled:opacity-35"
                          title="Move slide down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {arr.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHeroSlide(slideIdx)}
                            className="p-1.5 bg-neutral-900 hover:bg-red-500/20 border border-neutral-800 hover:border-red-500/40 rounded text-neutral-400 hover:text-red-400 ml-1"
                            title="Remove slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      {/* Image Preview & Upload */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="aspect-[16/10] w-full rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={`Hero slide ${slideIdx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-neutral-600" />
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerHeroSlideUpload(slideIdx)}
                            disabled={uploadingHeroSlideIdx !== null}
                            className="inline-flex items-center justify-center gap-1.5 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-3 py-1.5 rounded text-[11px] uppercase tracking-wider shrink-0 disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" />
                            {uploadingHeroSlideIdx === slideIdx ? 'Uploading...' : 'Upload'}
                          </button>
                          <input
                            type="text"
                            value={slide.imageUrl.startsWith('data:') ? '[Uploaded Device Image]' : slide.imageUrl}
                            onChange={e => handleUpdateHeroSlide(slideIdx, { imageUrl: e.target.value })}
                            readOnly={slide.imageUrl.startsWith('data:')}
                            placeholder="/assets/images/..."
                            className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-[11px] text-white font-mono rounded"
                          />
                        </div>
                      </div>

                      {/* Slide Matter & Link Controls */}
                      <div className="md:col-span-8 space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                            Eyebrow / Tagline Matter
                          </label>
                          <input
                            type="text"
                            value={slide.eyebrow || ''}
                            onChange={e => handleUpdateHeroSlide(slideIdx, { eyebrow: e.target.value })}
                            placeholder="e.g. HYDERABAD · THE ARCHITECTURAL T-SHIRT HOUSE"
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                              Slide Heading
                            </label>
                            <textarea
                              rows={2}
                              value={slide.heading}
                              onChange={e => handleUpdateHeroSlide(slideIdx, { heading: e.target.value })}
                              placeholder="LESS EFFORT.\nMORE STYLE."
                              className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-bold rounded"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                              Slide Description (Matter)
                            </label>
                            <textarea
                              rows={2}
                              value={slide.subhead}
                              onChange={e => handleUpdateHeroSlide(slideIdx, { subhead: e.target.value })}
                              placeholder="Describe the featured category or product..."
                              className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                            />
                          </div>
                        </div>

                        {/* Category / Product Link Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-800/70">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-[#E5A914] font-semibold mb-1 flex items-center gap-1">
                              <Link2 className="w-3 h-3" /> Slide Link Type
                            </label>
                            <select
                              value={slide.linkType}
                              onChange={e => {
                                const nextType = e.target.value as HeroSlide['linkType'];
                                const nextTarget =
                                  nextType === 'category'
                                    ? categories[0]?.name || 'Round Neck T-Shirt'
                                    : nextType === 'product'
                                    ? products[0]?.slug || ''
                                    : '';
                                handleUpdateHeroSlide(slideIdx, { linkType: nextType, linkTarget: nextTarget });
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded cursor-pointer"
                            >
                              <option value="category">Link to Category Page</option>
                              <option value="product">Link to Specific Product</option>
                              <option value="none">No Link</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                              {slide.linkType === 'product'
                                ? 'Select Target Product'
                                : slide.linkType === 'category'
                                ? 'Select Target Category'
                                : 'Destination'}
                            </label>
                            {slide.linkType === 'category' ? (
                              <select
                                value={slide.linkTarget}
                                onChange={e => handleUpdateHeroSlide(slideIdx, { linkTarget: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded cursor-pointer"
                              >
                                <option value="trending">Trending Drops</option>
                                <option value="all">All T-Shirts</option>
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            ) : slide.linkType === 'product' ? (
                              <select
                                value={slide.linkTarget}
                                onChange={e => handleUpdateHeroSlide(slideIdx, { linkTarget: e.target.value })}
                                className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded cursor-pointer"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.slug}>
                                    {p.title} ({p.category})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="bg-neutral-900/50 border border-neutral-800 px-3 py-2 text-xs text-neutral-500 rounded">
                                Slide is informational only
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: CATEGORY IMAGES & NAMES EDITOR */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E5A914]" /> Category Images &amp; Silhouettes
                </h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', image: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg' });
                    setShowCategoryModal(true);
                  }}
                  className="bg-[#E5A914] text-black font-extrabold px-3 py-1.5 rounded text-xs uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden group">
                    <div className="h-32 bg-neutral-900 relative">
                      <img src={cat.image || '/assets/images/product_oversized_heavy_tee_1794056020516.jpg'} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-xs">{cat.name}</h4>
                        <p className="text-[10px] text-neutral-400 line-clamp-1">{cat.description}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({ name: cat.name, description: cat.description, image: cat.image || '' });
                            setShowCategoryModal(true);
                          }}
                          className="text-[#E5A914] hover:underline text-xs font-bold"
                        >
                          Edit
                        </button>
                        {confirmDeleteCategoryId === cat.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCategoryId(null)}
                              className="text-neutral-400 hover:text-white text-[10px] px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCategoryId(cat.id)}
                            className="text-neutral-500 hover:text-red-400 text-xs ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save CMS Changes Button */}
            <button
              onClick={handleSaveSettings}
              className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-black px-8 py-3.5 rounded text-xs uppercase tracking-widest transition-colors shadow-xl"
            >
              Publish Live CMS &amp; Imagery Changes
            </button>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && storeSettings && (
          <div className="space-y-6 max-w-3xl">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Global Store Configuration</h1>
              <p className="text-xs text-neutral-400">Payment credentials, free shipping limits, tax rates, and support details.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={storeSettings.brandName}
                    onChange={e => setStoreSettings({ ...storeSettings, brandName: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Store Currency</label>
                  <input
                    type="text"
                    value={storeSettings.currency}
                    onChange={e => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Free Delivery Min (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.freeShippingThreshold}
                    onChange={e => setStoreSettings({ ...storeSettings, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Standard Delivery (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.standardShippingFee}
                    onChange={e => setStoreSettings({ ...storeSettings, standardShippingFee: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Express Air Fee (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.expressShippingFee}
                    onChange={e => setStoreSettings({ ...storeSettings, expressShippingFee: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 space-y-4">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">Payment Gateway &amp; Checkout Options</h3>

                {/* Cash on Delivery (COD) On/Off Toggle Card */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Cash on Delivery (COD)
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          storeSettings.codEnabled !== false
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {storeSettings.codEnabled !== false ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      When switched OFF, Cash on Delivery is hidden on the Checkout payment page and blocked at order submission.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={storeSettings.codEnabled !== false}
                    disabled={togglingCod}
                    onClick={handleToggleCod}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      storeSettings.codEnabled !== false ? 'bg-emerald-500' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        storeSettings.codEnabled !== false ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Cashfree App ID</label>
                    <input
                      type="text"
                      value={storeSettings.cashfreeAppId || 'TEST1029384756CF'}
                      onChange={e => setStoreSettings({ ...storeSettings, cashfreeAppId: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Cashfree Environment</label>
                    <select
                      value={storeSettings.cashfreeEnvironment || 'sandbox'}
                      onChange={e => setStoreSettings({ ...storeSettings, cashfreeEnvironment: e.target.value as 'sandbox' | 'production' })}
                      className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    >
                      <option value="sandbox">Sandbox (Test Mode)</option>
                      <option value="production">Production (Live Settlement)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={storeSettings.razorpayKeyId}
                    onChange={e => setStoreSettings({ ...storeSettings, razorpayKeyId: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Stripe Public Key</label>
                  <input
                    type="text"
                    value={storeSettings.stripePublicKey}
                    onChange={e => setStoreSettings({ ...storeSettings, stripePublicKey: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
              </div>

              {/* MONGODB ATLAS INTEGRATION CARD */}
              <div className="pt-6 border-t border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#E5A914]" />
                    <div>
                      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">MongoDB Atlas &amp; Mongoose ODM</h3>
                      <p className="text-[11px] text-neutral-400">Enterprise cloud document database integration for products, users, orders, and inventory.</p>
                    </div>
                  </div>
                  {mongoStats?.connected ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      MongoDB Atlas Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Persistent Store Active (Atlas Ready)
                    </span>
                  )}
                </div>

                {mongoMsg && (
                  <div className={`p-4 text-xs rounded-xl space-y-2.5 ${mongoMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border border-red-500/40 text-red-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold leading-relaxed">{mongoMsg.text}</span>
                      <button type="button" onClick={() => setMongoMsg(null)} className="text-neutral-400 hover:text-white shrink-0 p-1">&times;</button>
                    </div>

                    {mongoMsg.isWhitelist && (
                      <div className="mt-3 p-3.5 bg-black/75 rounded-lg border border-amber-500/40 text-amber-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                          <span>Fix MongoDB Atlas IP Whitelist (Takes ~10 seconds):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                          <li>Open your <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-400 hover:text-amber-300">MongoDB Atlas Dashboard</a> (Cluster <strong>Zentrixa</strong>).</li>
                          <li>In the left sidebar under <strong>Security</strong>, click <strong>Network Access</strong>.</li>
                          <li>Click the green <strong>"+ Add IP Address"</strong> button.</li>
                          <li>Click <strong>"Allow Access From Anywhere"</strong> (this automatically sets <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded font-mono">0.0.0.0/0</code>).</li>
                          <li>Click <strong>Confirm</strong>, wait ~10 seconds for the status to say <em>Active</em>, and click <strong>"Connect Atlas"</strong> below.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Status & Stats Details */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 block">Database Engine</span>
                      <span className="font-bold text-white">MongoDB &amp; Mongoose</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 block">Active Host</span>
                      <span className="font-mono text-neutral-300 truncate block text-[11px]">{mongoStats?.host || 'Cloud Atlas / Local'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 block">Database Name</span>
                      <span className="font-mono text-[#E5A914] text-[11px]">{mongoStats?.dbName || '4lazy'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 block">Status</span>
                      <span className="text-emerald-400 font-semibold text-[11px]">{mongoStats?.status || 'Active'}</span>
                    </div>
                  </div>

                  {/* Collection Metrics */}
                  {mongoStats?.connected && mongoStats?.collections && (
                    <div className="pt-3 border-t border-neutral-900 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="p-2 bg-neutral-900 rounded">
                        <span className="text-[10px] text-neutral-400 block uppercase">Products</span>
                        <span className="font-mono font-bold text-white text-xs">{mongoStats.collections.products || 0}</span>
                      </div>
                      <div className="p-2 bg-neutral-900 rounded">
                        <span className="text-[10px] text-neutral-400 block uppercase">Users</span>
                        <span className="font-mono font-bold text-white text-xs">{mongoStats.collections.users || 0}</span>
                      </div>
                      <div className="p-2 bg-neutral-900 rounded">
                        <span className="text-[10px] text-neutral-400 block uppercase">Orders</span>
                        <span className="font-mono font-bold text-white text-xs">{mongoStats.collections.orders || 0}</span>
                      </div>
                      <div className="p-2 bg-neutral-900 rounded">
                        <span className="text-[10px] text-neutral-400 block uppercase">Categories</span>
                        <span className="font-mono font-bold text-white text-xs">{mongoStats.collections.categories || 0}</span>
                      </div>
                      <div className="p-2 bg-neutral-900 rounded">
                        <span className="text-[10px] text-neutral-400 block uppercase">Coupons</span>
                        <span className="font-mono font-bold text-white text-xs">{mongoStats.collections.coupons || 0}</span>
                      </div>
                      <div className="p-2 bg-neutral-900 rounded">
                        <span className="text-[10px] text-neutral-400 block uppercase">Returns</span>
                        <span className="font-mono font-bold text-white text-xs">{mongoStats.collections.returns || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connect Custom MongoDB Atlas URI Form */}
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400">
                    MongoDB Atlas Connection URI (MONGODB_URI)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={mongoUriInput}
                      onChange={e => setMongoUriInput(e.target.value)}
                      placeholder="mongodb+srv://username:password@cluster0.mongodb.net/4lazy?retryWrites=true&w=majority"
                      className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono focus:outline-none focus:border-neutral-600"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleConnectMongo}
                        disabled={mongoLoading || !mongoUriInput.trim()}
                        className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        {mongoLoading ? 'Connecting...' : 'Connect Atlas'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSyncMongo}
                        disabled={mongoLoading}
                        className="bg-[#E5A914] hover:bg-[#d49b10] disabled:opacity-50 text-black font-extrabold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap"
                        title="Push all products, categories, orders, and users into MongoDB Atlas"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${mongoLoading ? 'animate-spin' : ''}`} />
                        Push to Atlas
                      </button>
                      <button
                        type="button"
                        onClick={handlePullMongo}
                        disabled={mongoLoading || !mongoStats?.connected}
                        className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap"
                        title="Pull latest live collections from MongoDB Atlas into local store"
                      >
                        Pull from Atlas
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    Configuring <code className="text-neutral-400">MONGODB_URI</code> connects your MongoDB Atlas cluster directly with Mongoose ODM models.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800">
                <button
                  type="submit"
                  className="bg-[#E5A914] text-black font-extrabold px-6 py-2.5 rounded text-xs uppercase tracking-widest hover:bg-[#d49b10]"
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* COUPONS & PROMO CODES TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Coupons &amp; Promo Codes</h1>
                <p className="text-xs text-neutral-400">Create percentage or flat discount codes, toggle active status, and monitor redemptions.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCouponModal(true)}
                className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Coupons</span>
                <p className="font-mono text-xl font-bold text-white mt-0.5 tabular-nums">{coupons.length}</p>
              </div>
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Active Promo Codes</span>
                <p className="font-mono text-xl font-bold text-emerald-400 mt-0.5 tabular-nums">
                  {coupons.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Redemptions</span>
                <p className="font-mono text-xl font-bold text-[#E5A914] mt-0.5 tabular-nums">
                  {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
                </p>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Coupon Code</th>
                    <th className="p-3.5">Discount Offer</th>
                    <th className="p-3.5">Min Order</th>
                    <th className="p-3.5">Redemptions</th>
                    <th className="p-3.5">Expiry</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 font-bold text-[#E5A914] text-sm tracking-wider">{c.code}</td>
                      <td className="p-3.5 font-sans text-white font-semibold">
                        {c.type === 'percent' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                        {c.type === 'percent' && c.maxDiscount ? (
                          <span className="text-[11px] text-neutral-400 font-mono block">Max ₹{c.maxDiscount}</span>
                        ) : null}
                      </td>
                      <td className="p-3.5 text-neutral-300 tabular-nums">₹{(c.minOrderValue || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-neutral-300 tabular-nums">
                        {c.usedCount} / {c.usageLimit}
                      </td>
                      <td className="p-3.5 text-neutral-400 text-[11px]">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'No Expiry'}
                      </td>
                      <td className="p-3.5 font-sans">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c)}
                          className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-colors ${
                            c.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                          }`}
                        >
                          {c.isActive ? 'Active (Click to Pause)' : 'Paused (Click to Enable)'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right font-sans whitespace-nowrap">
                        {confirmDeleteCouponId === c.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded text-[11px] uppercase"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCouponId(null)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-2 py-1 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCouponId(c.id)}
                            className="text-red-400 hover:underline font-semibold text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center font-sans text-neutral-400">
                        No promo coupons created yet. Click &quot;Create Coupon&quot; to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMAIL NOTIFICATIONS LOG TAB */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Transactional Notification Logs</h1>
              <p className="text-xs text-neutral-400">Inspect branded emails sent to buyers (OTP verification, invoices, courier tracking).</p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-sans">
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Template</th>
                    <th className="p-3.5">Dispatched</th>
                    <th className="p-3.5 text-right font-sans">Inspect Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono">
                  {emails.map(eml => (
                    <tr key={eml.id} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 font-sans font-bold text-white">{eml.to}</td>
                      <td className="p-3.5 font-sans text-neutral-200">{eml.subject}</td>
                      <td className="p-3.5">
                        <span className="bg-neutral-800 text-[#E5A914] px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {eml.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-500">{new Date(eml.sentAt).toLocaleString()}</td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => setSelectedEmailPreview(eml)}
                          className="text-[#E5A914] hover:underline flex items-center gap-1 ml-auto text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View HTML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* PRODUCT ADD / EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-3xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden text-neutral-100 shadow-2xl">
            <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-neutral-800 shrink-0 bg-neutral-900">
              <h3 className="font-display text-base font-bold text-white uppercase truncate pr-3">
                {editingProduct ? `Edit Piece: ${editingProduct.title}` : 'Add New Streetwear Piece'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Product Title</label>
                    <input
                      type="text"
                      value={productForm.title}
                      onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                      placeholder="e.g. Heavyweight Boxy Tee"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-bold rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Subtitle / Key Highlight</label>
                    <input
                      type="text"
                      value={productForm.subtitle}
                      onChange={e => setProductForm({ ...productForm, subtitle: e.target.value })}
                      placeholder="e.g. 280 GSM Combed Cotton · Boxy Fit"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Category</label>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      value={productForm.basePrice}
                      onChange={e => setProductForm({ ...productForm, basePrice: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Sale Discounted Price (₹)</label>
                    <input
                      type="number"
                      value={productForm.discountPrice}
                      onChange={e => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                  </div>
                </div>

                {/* Color & 4 Photo Slides Config */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-white uppercase text-[11px] block">
                        Primary Colorway &amp; 4 Photo Slides
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Upload or paste 4 product photos (e.g. front, detail, back &amp; sample print result).
                      </span>
                    </div>
                    <input
                      ref={productImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Color Name</label>
                      <input
                        type="text"
                        value={productForm.colorName}
                        onChange={e => setProductForm({ ...productForm, colorName: e.target.value })}
                        placeholder="Washed Black"
                        className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Hex Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={productForm.colorHex}
                          onChange={e => setProductForm({ ...productForm, colorHex: e.target.value })}
                          className="h-8 w-10 bg-transparent cursor-pointer rounded"
                        />
                        <input
                          type="text"
                          value={productForm.colorHex}
                          onChange={e => setProductForm({ ...productForm, colorHex: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 px-2 py-1 text-xs text-white font-mono rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[0, 1, 2, 3].map(slideIdx => {
                      const slideVal = productForm.imageUrls[slideIdx] || '';
                      return (
                        <div key={slideIdx} className="p-2.5 bg-neutral-900/70 border border-neutral-800 rounded-lg space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                              Slide {slideIdx + 1} {slideIdx === 0 ? '(Main)' : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerSlideUpload(slideIdx)}
                              disabled={uploadingSlideIndex !== null}
                              className="inline-flex items-center gap-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-3 h-3" />
                              {uploadingSlideIndex === slideIdx ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="w-12 h-14 rounded border border-neutral-800 bg-neutral-950 overflow-hidden shrink-0 flex items-center justify-center">
                              {slideVal ? (
                                <img
                                  src={slideVal}
                                  alt={`Slide ${slideIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-neutral-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex gap-1.5">
                              <input
                                type="text"
                                value={slideVal.startsWith('data:') ? '[Uploaded Device Image]' : slideVal}
                                onChange={e => {
                                  const next: [string, string, string, string] = [...productForm.imageUrls] as [string, string, string, string];
                                  next[slideIdx] = e.target.value;
                                  setProductForm(prev => ({ ...prev, imageUrls: next }));
                                }}
                                readOnly={slideVal.startsWith('data:')}
                                placeholder="/assets/images/... or URL"
                                className="w-full bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 text-[11px] text-white font-mono rounded"
                              />
                              {slideVal && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next: [string, string, string, string] = [...productForm.imageUrls] as [string, string, string, string];
                                    next[slideIdx] = slideIdx === 0 ? DEFAULT_PRODUCT_SLIDES[0] : '';
                                    setProductForm(prev => ({ ...prev, imageUrls: next }));
                                  }}
                                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-[10px] shrink-0"
                                  title="Clear slide image"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Variant Stock Allocations */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                  <span className="font-bold text-white uppercase text-[11px] block">Size Stock Quantities (- / +)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
                    {(
                      [
                        { label: 'S', key: 'stockS' },
                        { label: 'M', key: 'stockM' },
                        { label: 'L', key: 'stockL' },
                        { label: 'XL', key: 'stockXL' },
                        { label: 'XXL', key: 'stockXXL' }
                      ] as const
                    ).map(({ label, key }) => {
                      const val = Number(productForm[key]) || 0;
                      return (
                        <div key={label} className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-2 space-y-1.5">
                          <label className="block text-center text-[11px] font-bold text-neutral-300">
                            Size {label}
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm(prev => ({
                                  ...prev,
                                  [key]: Math.max(0, (Number(prev[key]) || 0) - 1)
                                }))
                              }
                              className="w-7 h-8 bg-neutral-950 hover:bg-red-500/20 border border-neutral-800 text-neutral-300 hover:text-red-300 rounded font-bold text-sm flex items-center justify-center shrink-0"
                              title={`Decrease ${label} stock`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={val}
                              onChange={e => {
                                const parsed = parseInt(e.target.value, 10);
                                setProductForm(prev => ({
                                  ...prev,
                                  [key]: isNaN(parsed) ? 0 : Math.max(0, parsed)
                                }));
                              }}
                              className="w-full min-w-0 bg-neutral-950 border border-neutral-800 py-1.5 text-center rounded text-white text-xs tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm(prev => ({
                                  ...prev,
                                  [key]: (Number(prev[key]) || 0) + 1
                                }))
                              }
                              className="w-7 h-8 bg-neutral-950 hover:bg-emerald-500/20 border border-neutral-800 text-neutral-300 hover:text-emerald-300 rounded font-bold text-sm flex items-center justify-center shrink-0"
                              title={`Increase ${label} stock`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white font-semibold">
                    <input
                      type="checkbox"
                      checked={productForm.isPublished}
                      onChange={e => setProductForm({ ...productForm, isPublished: e.target.checked })}
                      className="accent-[#E5A914] w-4 h-4"
                    />
                    <span>Publish Live on Storefront</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white font-semibold">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                      className="accent-[#E5A914] w-4 h-4"
                    />
                    <span>Feature in Trending Products</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-900 shrink-0">
                <button type="button" onClick={() => setShowProductModal(false)} className="text-xs text-neutral-400 hover:text-white px-4 py-2">Cancel</button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="bg-[#E5A914] text-black font-extrabold px-6 py-2.5 rounded text-xs uppercase tracking-wider hover:bg-[#d49b10] disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create & Publish Piece'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL / CSV BULK IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-sm font-bold text-white uppercase flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#E5A914]" /> Bulk Excel / CSV Product Upload
              </h3>
              <button onClick={() => setShowBulkModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-neutral-950 p-3 rounded border border-neutral-800">
                <div>
                  <span className="font-bold text-white block">Upload CSV / Excel Spreadsheet</span>
                  <span className="text-[11px] text-neutral-400">Select any valid .csv or text data file from your computer</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv, .txt, .xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose File
                </button>
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Or Paste CSV Text Directly:</label>
                <textarea
                  rows={8}
                  value={bulkCsvText}
                  onChange={e => setBulkCsvText(e.target.value)}
                  placeholder={"title,category,price,saleprice,color,size,sku,stock,description\nDown Shoulder Box Tee,Down Shoulder,1999,1699,Washed Black,L,4L-IMP-01,30,Heavy combed cotton tee"}
                  className="w-full bg-neutral-950 border border-neutral-800 p-3 font-mono text-xs text-white rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="text-[#E5A914] hover:underline text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download Sample CSV
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowBulkModal(false)} className="text-xs text-neutral-400 px-3">Cancel</button>
                  <button
                    onClick={handleBulkImport}
                    className="bg-[#E5A914] text-black font-extrabold px-5 py-2 rounded text-xs uppercase tracking-wider hover:bg-[#d49b10]"
                  >
                    Validate &amp; Import Products
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COURIER LOGISTICS AWB MODAL */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-base font-bold text-white uppercase">
                Assign Logistics Tracking: #{selectedOrderForTracking.orderNumber}
              </h3>
              <button onClick={() => setSelectedOrderForTracking(null)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleAssignTracking} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase text-neutral-400 mb-1">Courier Logistics Company</label>
                <input
                  type="text"
                  value={trackingForm.courierCompany}
                  onChange={e => setTrackingForm({ ...trackingForm, courierCompany: e.target.value })}
                  placeholder="Blue Dart Express / Delhivery"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase text-neutral-400 mb-1">AWB Tracking Number</label>
                <input
                  type="text"
                  value={trackingForm.trackingNumber}
                  onChange={e => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  placeholder="BLUEDART-847291038"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase text-neutral-400 mb-1">Estimated Delivery Date</label>
                <input
                  type="text"
                  value={trackingForm.estimatedDeliveryDate}
                  onChange={e => setTrackingForm({ ...trackingForm, estimatedDeliveryDate: e.target.value })}
                  placeholder="e.g. Mar 12, 2026"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setSelectedOrderForTracking(null)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button type="submit" className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider">
                  Notify Buyer &amp; Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN CASE MANAGEMENT MODAL */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-base font-bold text-white uppercase">
                Return Case: {selectedReturn.id} (#{selectedReturn.orderNumber})
              </h3>
              <button onClick={() => setSelectedReturn(null)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleUpdateReturnStatus} className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
                <p className="font-bold text-white">{selectedReturn.customerName} ({selectedReturn.customerEmail})</p>
                <p className="text-neutral-400 mt-1">Reason: <strong className="text-white">{selectedReturn.reason}</strong></p>
                <p className="text-neutral-400">{selectedReturn.details}</p>
                <p className="text-[#E5A914] font-mono font-bold mt-1">Refund Value: ₹{selectedReturn.refundAmount.toLocaleString()}</p>
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Update Case Status</label>
                <select
                  value={returnStatusForm.status}
                  onChange={e => setReturnStatusForm({ ...returnStatusForm, status: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded cursor-pointer"
                >
                  <option value="Requested">Requested</option>
                  <option value="Approved">Approved</option>
                  <option value="Pickup Scheduled">Pickup Scheduled</option>
                  <option value="Received &amp; Inspected">Received &amp; Inspected</option>
                  <option value="Refund Completed">Refund Completed (Restocks Stock)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Reverse Logistics Courier AWB (Optional)</label>
                <input
                  type="text"
                  value={returnStatusForm.pickupAwb}
                  onChange={e => setReturnStatusForm({ ...returnStatusForm, pickupAwb: e.target.value })}
                  placeholder="BLUE-RET-9921448"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                />
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={returnStatusForm.notes}
                  onChange={e => setReturnStatusForm({ ...returnStatusForm, notes: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedReturn(null)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button type="submit" className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider">
                  Save Return Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD / EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-base font-bold text-white uppercase">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
              </h3>
              <button type="button" onClick={() => setShowCategoryModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block uppercase text-neutral-400 mb-1">Category Title</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Co-ord Sets"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block uppercase text-neutral-400">Category Banner Image</label>
                  <input
                    ref={categoryImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleCategoryImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => categoryImageInputRef.current?.click()}
                    disabled={uploadingCategoryImage}
                    className="inline-flex items-center gap-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    {uploadingCategoryImage ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>

                {categoryForm.image && (
                  <div className="h-24 w-full rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img
                      src={categoryForm.image}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <input
                  type="text"
                  value={categoryForm.image.startsWith('data:') ? '[Uploaded Device Image]' : categoryForm.image}
                  onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  readOnly={categoryForm.image.startsWith('data:')}
                  placeholder="/assets/images/... or URL"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Description / Matter</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Architectural drop description"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button type="submit" className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-base font-bold text-white uppercase flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#E5A914]" /> Create Promo Coupon
              </h3>
              <button type="button" onClick={() => setShowCouponModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block uppercase text-neutral-400 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="e.g. HYD4L20"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Discount Type</label>
                  <select
                    value={newCoupon.type}
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as 'percent' | 'flat' })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    {newCoupon.type === 'percent' ? 'Percent Off (%)' : 'Flat Discount (₹)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={newCoupon.type === 'percent' ? 90 : 50000}
                    value={newCoupon.value}
                    onChange={e => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCoupon.minOrderValue}
                    onChange={e => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    {newCoupon.type === 'percent' ? 'Max Discount Cap (₹)' : 'Usage Limit'}
                  </label>
                  {newCoupon.type === 'percent' ? (
                    <input
                      type="number"
                      min={0}
                      value={newCoupon.maxDiscount}
                      onChange={e => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={newCoupon.usageLimit}
                      onChange={e => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {newCoupon.type === 'percent' && (
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Usage Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={newCoupon.usageLimit}
                      onChange={e => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                  </div>
                )}
                <div className={newCoupon.type === 'percent' ? '' : 'col-span-2'}>
                  <label className="block uppercase text-neutral-400 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCouponModal(false)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="bg-[#E5A914] text-black font-extrabold px-5 py-2 rounded text-xs uppercase tracking-wider hover:bg-[#d49b10] disabled:opacity-50"
                >
                  {savingCoupon ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE GST INVOICE MODAL */}
      {viewInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white text-neutral-950 max-w-2xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:p-8 rounded-xl shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-start border-b border-neutral-300 pb-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight">4LAAZY</h2>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-0.5">LESS EFFORT. MORE STYLE.</p>
                <p className="text-xs text-neutral-600 mt-2">GSTIN: 36AABCL4921E1Z8</p>
                <p className="text-xs text-neutral-600">Road No. 36, Jubilee Hills, Hyderabad 500033</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-500 uppercase block">TAX INVOICE</span>
                <p className="text-base font-bold font-mono">{viewInvoiceOrder.orderNumber}</p>
                <p className="text-xs text-neutral-600 mt-1">Date: {new Date(viewInvoiceOrder.createdAt).toLocaleDateString()}</p>
                {(() => {
                  const invMeta = getPaymentBadgeMeta(
                    viewInvoiceOrder.payment.status,
                    viewInvoiceOrder.payment.gatewayStatus
                  );
                  const invBadgeStyle =
                    invMeta.tone === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invMeta.tone === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : invMeta.tone === 'refunded'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800';
                  return (
                    <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${invBadgeStyle}`}>
                      {invMeta.label} ({(viewInvoiceOrder.payment.paymentMethodDetail || viewInvoiceOrder.payment.provider).toUpperCase()})
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b border-neutral-300 pb-4">
              <div>
                <span className="font-bold uppercase text-neutral-500 block mb-1">Billed &amp; Shipped To:</span>
                <p className="font-bold">{viewInvoiceOrder.shippingAddress.fullName}</p>
                <p>{viewInvoiceOrder.shippingAddress.street}</p>
                <p>{viewInvoiceOrder.shippingAddress.city}, {viewInvoiceOrder.shippingAddress.state} - {viewInvoiceOrder.shippingAddress.pinCode}</p>
                <p>Phone: {viewInvoiceOrder.shippingAddress.phone}</p>
              </div>
              <div className="text-right">
                <span className="font-bold uppercase text-neutral-500 block mb-1">Logistics Reference:</span>
                <p>Courier: <strong>{viewInvoiceOrder.tracking?.courierCompany || 'Blue Dart Express'}</strong></p>
                <p className="font-mono">AWB: {viewInvoiceOrder.tracking?.trackingNumber || 'Pending Generation'}</p>
              </div>
            </div>

            {/* Invoice Line Items */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-300 text-neutral-500 uppercase tracking-wider">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">Variant / SKU</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {viewInvoiceOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-bold">{it.productTitle}</td>
                    <td className="py-2.5 text-neutral-600 font-mono text-[11px]">{it.sku} ({it.colorName}/{it.size})</td>
                    <td className="py-2.5 text-center font-mono">{it.quantity}</td>
                    <td className="py-2.5 text-right font-mono">₹{it.price.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-mono font-bold">₹{(it.price * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-neutral-300 space-y-1.5 text-xs text-neutral-600 ml-auto max-w-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-neutral-900">₹{viewInvoiceOrder.subtotal.toLocaleString()}</span>
              </div>
              {viewInvoiceOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Privilege Coupon Discount:</span>
                  <span className="font-mono font-bold">-₹{viewInvoiceOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span className="font-mono text-neutral-900">{viewInvoiceOrder.shippingFee === 0 ? 'FREE' : `₹${viewInvoiceOrder.shippingFee}`}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span className="font-mono text-neutral-900">₹{Math.round(viewInvoiceOrder.tax / 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span className="font-mono text-neutral-900">₹{Math.round(viewInvoiceOrder.tax / 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-neutral-950 pt-2 border-t-2 border-neutral-900">
                <span>Invoice Total:</span>
                <span className="font-mono">₹{viewInvoiceOrder.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-300 flex justify-between items-center text-xs">
              <span className="text-neutral-500 text-[11px]">Computer generated tax invoice. No signature required.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setViewInvoiceOrder(null)}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STOCK ADJUST MODAL */}
      {adjustModalItem && (() => {
        const parsedQty = Number(adjustQtyInput);
        const hasValidNumber = adjustQtyInput.trim() !== '' && !isNaN(parsedQty);
        const previewNextStock = hasValidNumber
          ? adjustMode === 'exact'
            ? Math.max(0, Math.round(parsedQty))
            : Math.max(0, (Number(adjustModalItem.stock) || 0) + Math.round(parsedQty))
          : adjustModalItem.stock;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  Adjust Stock: {adjustModalItem.sku}
                </h3>
                <button type="button" onClick={() => setAdjustModalItem(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInventoryAdjustSubmit} className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block">Variant</span>
                    <span className="font-semibold text-white">
                      {adjustModalItem.colorName} / Size {adjustModalItem.size}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] uppercase text-neutral-400 block">Current &rarr; New</span>
                    <span className="font-bold text-white tabular-nums">
                      {adjustModalItem.stock} &rarr;{' '}
                      <strong className="text-[#E5A914]">{previewNextStock} Units</strong>
                    </span>
                  </div>
                </div>

                {/* Adjustment Mode Selector */}
                <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustMode('delta');
                      setAdjustQtyInput('10');
                    }}
                    className={`py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                      adjustMode === 'delta' ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Add / Deduct (- / +)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustMode('exact');
                      setAdjustQtyInput(String(adjustModalItem.stock));
                    }}
                    className={`py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                      adjustMode === 'exact' ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Set Exact Stock
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block uppercase text-neutral-400">
                    {adjustMode === 'delta'
                      ? 'Quantity Change (e.g. -5 to deduct, +10 to add)'
                      : 'New Exact Stock Quantity (0 or more)'}
                  </label>

                  {/* Signed Input + Quick - / + Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = isNaN(Number(adjustQtyInput)) ? 0 : Math.round(Number(adjustQtyInput));
                        const next = adjustMode === 'exact' ? Math.max(0, cur - 1) : cur - 1;
                        setAdjustQtyInput(String(next));
                      }}
                      className="px-3 py-2 bg-neutral-950 hover:bg-red-500/20 border border-neutral-800 text-red-400 rounded font-mono font-bold text-sm"
                    >
                      -1
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustQtyInput}
                      onChange={e => {
                        const raw = e.target.value;
                        if (adjustMode === 'exact') {
                          if (/^\d*$/.test(raw)) setAdjustQtyInput(raw);
                        } else {
                          if (/^[+-]?\d*$/.test(raw)) setAdjustQtyInput(raw);
                        }
                      }}
                      placeholder={adjustMode === 'delta' ? '-5 or +10' : '0'}
                      className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-center text-sm text-white font-mono font-bold rounded focus:outline-none focus:border-[#E5A914]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cur = isNaN(Number(adjustQtyInput)) ? 0 : Math.round(Number(adjustQtyInput));
                        const next = cur + 1;
                        setAdjustQtyInput(String(next));
                      }}
                      className="px-3 py-2 bg-neutral-950 hover:bg-emerald-500/20 border border-neutral-800 text-emerald-400 rounded font-mono font-bold text-sm"
                    >
                      +1
                    </button>
                  </div>

                  {adjustMode === 'delta' ? (
                    <div className="grid grid-cols-6 gap-1.5 font-mono pt-1">
                      {[-10, -5, -1, 1, 5, 10].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAdjustQtyInput(String(val))}
                          className={`py-1.5 rounded border text-[11px] font-bold transition-colors ${
                            val < 0
                              ? 'bg-neutral-950 border-neutral-800 text-red-400 hover:border-red-500/50'
                              : 'bg-neutral-950 border-neutral-800 text-emerald-400 hover:border-emerald-500/50'
                          }`}
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5 font-mono pt-1">
                      {[0, 5, 10, 25, 50].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAdjustQtyInput(String(val))}
                          className="py-1.5 rounded border bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-[#E5A914] hover:text-[#E5A914] text-[11px] font-bold transition-colors"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Audit Reason</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    placeholder="New batch received / manual stock count"
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModalItem(null)}
                    className="text-xs text-neutral-400 hover:text-white px-3 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustSaving}
                    className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {adjustSaving ? 'Updating...' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* CUSTOMER ORDERS DRAWER */}
      {selectedCustomerOrders && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-xl w-full p-6 text-neutral-100 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-sm font-bold text-white uppercase">
                Customer Order History ({selectedCustomerOrders.length} Orders)
              </h3>
              <button onClick={() => setSelectedCustomerOrders(null)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedCustomerOrders.length === 0 ? (
                <p className="text-xs text-neutral-400">No orders placed by this customer yet.</p>
              ) : (
                selectedCustomerOrders.map(ord => (
                  <div key={ord.id} className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-[#E5A914]">{ord.orderNumber}</span>
                      <span className="font-mono font-bold text-white">₹{ord.total.toLocaleString()}</span>
                    </div>
                    <p className="text-neutral-400">Date: {new Date(ord.createdAt).toLocaleDateString()} · Status: <strong className="text-white">{ord.status}</strong></p>
                    <div className="space-y-1 pt-1 border-t border-neutral-800">
                      {ord.items.map((it, idx) => (
                        <p key={idx} className="text-neutral-300 text-[11px]">{it.quantity}x {it.productTitle} ({it.colorName}/{it.size})</p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMAIL HTML PREVIEW MODAL */}
      {selectedEmailPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full p-6 text-neutral-100 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-display text-sm font-bold text-white uppercase">
                  {selectedEmailPreview.subject}
                </h3>
                <p className="text-[11px] text-neutral-400">To: {selectedEmailPreview.to}</p>
              </div>
              <button onClick={() => setSelectedEmailPreview(null)}><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 rounded border border-neutral-800">
              <div dangerouslySetInnerHTML={{ __html: selectedEmailPreview.previewHtml }} />
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT TRANSACTION DETAILS MODAL */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5A914]">
                  CASHFREE TRANSACTION RECORD
                </span>
                <h3 className="font-display text-base font-bold text-white uppercase">
                  {selectedTransaction.orderNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedTransaction(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-950 p-4 rounded-lg border border-neutral-800">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Order ID</span>
                <span className="font-mono text-white break-all">{selectedTransaction.orderId}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Cashfree Order ID</span>
                <span className="font-mono text-[#E5A914] break-all">{selectedTransaction.cashfreeOrderId}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Cashfree Payment ID</span>
                <span className="font-mono text-white break-all">
                  {selectedTransaction.cashfreePaymentId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Amount</span>
                <span className="font-mono font-bold text-white">
                  {selectedTransaction.currency} ₹{Number(selectedTransaction.amount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Payment Status</span>
                <span className="font-mono font-bold text-white">{selectedTransaction.paymentStatus}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Payment Method</span>
                <span className="text-white font-semibold">{selectedTransaction.paymentMethod}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Environment</span>
                <span className="uppercase font-mono text-neutral-300">{selectedTransaction.environment}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Transaction Date</span>
                <span className="text-neutral-300">
                  {new Date(selectedTransaction.transactionDate).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-1 text-xs">
              <span className="text-[10px] text-neutral-500 uppercase block">Customer Details</span>
              <p className="font-bold text-white">{selectedTransaction.customerDetails.name}</p>
              <p className="text-neutral-400">
                {selectedTransaction.customerDetails.email} · {selectedTransaction.customerDetails.phone}
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">
                Customer ID: {selectedTransaction.customerId}
              </p>
            </div>

            {(selectedTransaction.cancellationReason || selectedTransaction.errorMessage) && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded text-xs text-red-300">
                {selectedTransaction.cancellationReason || selectedTransaction.errorMessage}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {selectedTransaction.paymentStatus === 'PENDING' && selectedTransaction.paymentMethod !== 'COD' && (
                <button
                  onClick={() => handleCancelPendingPayment(selectedTransaction.cashfreeOrderId)}
                  disabled={cancellingPaymentId === selectedTransaction.cashfreeOrderId}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>
                    {cancellingPaymentId === selectedTransaction.cashfreeOrderId ? 'Cancelling...' : 'Cancel Payment'}
                  </span>
                </button>
              )}
              {selectedTransaction.paymentMethod !== 'COD' && (
                <button
                  onClick={() => handleSyncPaymentStatus(selectedTransaction.cashfreeOrderId)}
                  disabled={syncingPaymentId === selectedTransaction.cashfreeOrderId}
                  className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      syncingPaymentId === selectedTransaction.cashfreeOrderId ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Verify with Cashfree</span>
                </button>
              )}
              <button
                onClick={() => setSelectedTransaction(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
