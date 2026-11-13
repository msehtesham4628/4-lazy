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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { compressUploadImage } from '../../utils/imageUtils.ts';
import {
  Order,
  Product,
  Category,
  Coupon,
  StoreSettings,
  EmailLog,
  InventoryTransaction,
  ReturnRequest,
  ProductVariant,
  ProductColorGroup
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
  | 'orders'
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
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  // Product Form State (for Add / Edit)
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
    imageUrl: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg',
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
  const [inventoryTx, setInventoryTx] = useState<InventoryTransaction[]>([]);
  const [adjustModalItem, setAdjustModalItem] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Stock replenishment from manufacturing mill');

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

  // Emails
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<EmailLog | null>(null);

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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setStoreSettings(d.settings);
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

  useEffect(() => {
    if (isAdmin && token) {
      setLoading(true);
      Promise.all([
        fetchOverview(),
        fetchProductsList(),
        fetchCategories(),
        fetchOrdersList(),
        fetchReturnsList(),
        fetchInventory(),
        fetchCustomers(),
        fetchTallySummary(),
        fetchCoupons(),
        fetchSettings(),
        fetchEmails(),
        fetchMongoStatus()
      ]).finally(() => setLoading(false));
    }
  }, [isAdmin, token]);

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
      imageUrl: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg',
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
    const stockMap: Record<string, number> = {};
    product.variants.forEach(v => {
      stockMap[v.size] = v.stock;
    });

    setProductForm({
      title: product.title,
      subtitle: product.subtitle || '',
      category: product.category,
      basePrice: product.basePrice,
      discountPrice: product.discountPrice || 0,
      description: product.description,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      fabric: product.details.fabric,
      gsm: product.details.gsm || 280,
      fit: product.details.fit,
      care: product.details.care,
      colorName: firstColor.colorName,
      colorHex: firstColor.colorHex,
      imageUrl: firstColor.images[0] || product.variants[0]?.images[0] || '',
      stockS: stockMap['S'] || 15,
      stockM: stockMap['M'] || 25,
      stockL: stockMap['L'] || 30,
      stockXL: stockMap['XL'] || 15,
      stockXXL: stockMap['XXL'] || 10
    });
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('error', 'Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      e.target.value = '';
      return;
    }

    setUploadingProductImage(true);
    try {
      const compressedDataUrl = await compressUploadImage(file, 960, 0.85);
      setProductForm(prev => ({ ...prev, imageUrl: compressedDataUrl }));
      showNotice('success', 'Product image uploaded and optimized.');
    } catch (err: any) {
      showNotice('error', 'Failed to process image: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadingProductImage(false);
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
      const variants: ProductVariant[] = [
        { id: `var_${ts}_s`, colorName: productForm.colorName, colorHex: productForm.colorHex, size: 'S', sku: `4L-${codePrefix}-S-${ts % 1000}`, stock: Number(productForm.stockS), images: [productForm.imageUrl] },
        { id: `var_${ts}_m`, colorName: productForm.colorName, colorHex: productForm.colorHex, size: 'M', sku: `4L-${codePrefix}-M-${ts % 1000}`, stock: Number(productForm.stockM), images: [productForm.imageUrl] },
        { id: `var_${ts}_l`, colorName: productForm.colorName, colorHex: productForm.colorHex, size: 'L', sku: `4L-${codePrefix}-L-${ts % 1000}`, stock: Number(productForm.stockL), images: [productForm.imageUrl] },
        { id: `var_${ts}_xl`, colorName: productForm.colorName, colorHex: productForm.colorHex, size: 'XL', sku: `4L-${codePrefix}-XL-${ts % 1000}`, stock: Number(productForm.stockXL), images: [productForm.imageUrl] },
        { id: `var_${ts}_xxl`, colorName: productForm.colorName, colorHex: productForm.colorHex, size: 'XXL', sku: `4L-${codePrefix}-XXL-${ts % 1000}`, stock: Number(productForm.stockXXL), images: [productForm.imageUrl] }
      ];

      const payload = {
        title: cleanTitle,
        subtitle: productForm.subtitle,
        category: productForm.category,
        basePrice: Number(productForm.basePrice),
        discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : undefined,
        description: productForm.description,
        isFeatured: productForm.isFeatured,
        isPublished: productForm.isPublished,
        colorGroups: [
          { colorName: productForm.colorName, colorHex: productForm.colorHex, images: [productForm.imageUrl] }
        ],
        variants,
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

      const d = await res.json();
      if (res.ok) {
        setShowProductModal(false);
        showNotice('success', editingProduct ? `Updated "${cleanTitle}" successfully.` : `Added "${cleanTitle}" to catalog.`);
        await Promise.all([fetchProductsList(), fetchInventory(), fetchOverview()]);
      } else {
        showNotice('error', d.error || 'Failed to save product.');
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

  // INVENTORY ADJUSTMENT
  const handleInventoryAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: adjustModalItem.productId,
          variantId: adjustModalItem.variantId,
          sku: adjustModalItem.sku,
          change: adjustQty,
          reason: adjustReason
        })
      });
      if (res.ok) {
        setAdjustModalItem(null);
        fetchInventory();
        fetchOverview();
      }
    } catch (e) {
      console.error(e);
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSettings) return;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(storeSettings)
      });
      if (res.ok) {
        setSettingsSuccess(true);
        showNotice('success', 'Store settings saved and published.');
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
    if (inventoryFilter === 'low') return item.stock > 0 && item.stock < 15;
    if (inventoryFilter === 'out') return item.stock === 0;
    return true;
  });

  const navTabs: { id: AdminTab; label: string; icon: any; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: products.length },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: lowStockItems.length > 0 ? `${lowStockItems.length} Low` : undefined, badgeColor: 'bg-amber-500/20 text-[#E5A914]' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
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
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-800/30">
                        <td className="py-2.5 font-bold text-[#E5A914]">{order.orderNumber}</td>
                        <td className="py-2.5 font-sans text-white">{order.customer.name} ({order.shippingAddress.city})</td>
                        <td className="py-2.5 text-white font-bold">₹{order.total.toLocaleString()}</td>
                        <td className="py-2.5 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-800 text-neutral-200">
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
                    ))}
                  </tbody>
                </table>
              </div>
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Variant Stock Matrix</h1>
                <p className="text-xs text-neutral-400">Direct SKU-level inventory adjustment, low-stock warnings, and valuation.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-lg text-xs font-semibold uppercase">
                <button
                  onClick={() => setInventoryFilter('all')}
                  className={`px-3 py-1 rounded transition-colors ${inventoryFilter === 'all' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                >
                  All SKUs ({inventoryMatrix.length})
                </button>
                <button
                  onClick={() => setInventoryFilter('low')}
                  className={`px-3 py-1 rounded transition-colors ${inventoryFilter === 'low' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Low Stock (&lt;15)
                </button>
                <button
                  onClick={() => setInventoryFilter('out')}
                  className={`px-3 py-1 rounded transition-colors ${inventoryFilter === 'out' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white'}`}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Inventory Valuation Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Stock Value</span>
                <p className="font-mono text-xl font-bold text-[#E5A914] mt-0.5">₹{totalValuation.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Total Physical Units</span>
                <p className="font-mono text-xl font-bold text-white mt-0.5">{totalStockCount} pieces</p>
              </div>
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Active SKU Codes</span>
                <p className="font-mono text-xl font-bold text-white mt-0.5">{inventoryMatrix.length} distinct sizes</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-sans">
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5">Product Title</th>
                    <th className="p-3.5">Colorway</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Available Stock</th>
                    <th className="p-3.5 text-right font-sans">Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 font-bold text-[#E5A914]">{item.sku}</td>
                      <td className="p-3.5 font-sans font-semibold text-white">{item.productTitle}</td>
                      <td className="p-3.5 font-sans flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: item.colorHex }} />
                        <span>{item.colorName}</span>
                      </td>
                      <td className="p-3.5 font-bold text-white">{item.size}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
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
                        <button
                          onClick={() => {
                            setAdjustModalItem(item);
                            setAdjustQty(10);
                          }}
                          className="bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-white px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
                        >
                          Adjust Stock (+/-)
                        </button>
                      </td>
                    </tr>
                  ))}
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
                    .map(order => (
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
                                        Custom: {it.customPrint.placement} · {it.customPrint.printTechnique}
                                      </span>
                                      {it.customPrint.customText && (
                                        <span className="block text-neutral-300">
                                          &ldquo;{it.customPrint.customText}&rdquo; ({it.customPrint.fontStyle || 'Bold Sans'}, {it.customPrint.textColor || 'Default Ink'})
                                        </span>
                                      )}
                                      {it.customPrint.uploadedGraphicUrl && (
                                        <span className="block text-emerald-400">Custom Artwork Attached</span>
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
                          <span className="text-[10px] text-emerald-400 font-sans uppercase">{order.payment.status}</span>
                        </td>
                        <td className="p-3.5 align-top font-sans">
                          <select
                            value={order.status}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-neutral-950 border border-neutral-700 text-xs text-white rounded px-2.5 py-1.5 cursor-pointer font-semibold"
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
                    ))}
                </tbody>
              </table>
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

            {/* SECTION 1: HERO SECTION & IMAGERY */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#E5A914]" /> Hero Banner &amp; Main Headline
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Image Asset Path or URL</label>
                  <input
                    type="text"
                    value={storeSettings.heroImageUrl}
                    onChange={e => setStoreSettings({ ...storeSettings, heroImageUrl: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                  {/* Preset photo quick select */}
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setStoreSettings({ ...storeSettings, heroImageUrl: '/assets/images/hero_streetwear_campaign_1794056018871.jpg' })}
                      className="text-[10px] text-[#E5A914] bg-neutral-950 border border-neutral-800 px-2 py-1 rounded"
                    >
                      Use Campaign Shot
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreSettings({ ...storeSettings, heroImageUrl: '/assets/images/campaign_editorial_lookbook_1794056022183.jpg' })}
                      className="text-[10px] text-neutral-300 bg-neutral-950 border border-neutral-800 px-2 py-1 rounded"
                    >
                      Use Lookbook Shot
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Display Headline</label>
                  <input
                    type="text"
                    value={storeSettings.heroHeading}
                    onChange={e => setStoreSettings({ ...storeSettings, heroHeading: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white font-bold rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Subhead Prose</label>
                  <textarea
                    rows={2}
                    value={storeSettings.heroSubhead}
                    onChange={e => setStoreSettings({ ...storeSettings, heroSubhead: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Primary Button Text</label>
                  <input
                    type="text"
                    value={storeSettings.heroButtonText}
                    onChange={e => setStoreSettings({ ...storeSettings, heroButtonText: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
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

                {/* Color & Photo Config */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white uppercase text-[11px]">Primary Colorway &amp; Imagery</span>
                    <input
                      ref={productImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => productImageInputRef.current?.click()}
                      disabled={uploadingProductImage}
                      className="inline-flex items-center gap-1.5 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-3 py-1.5 rounded text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingProductImage ? 'Processing...' : 'Upload Image'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <div className="w-20 h-24 rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center">
                      {productForm.imageUrl ? (
                        <img
                          src={productForm.imageUrl}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-neutral-600" />
                      )}
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <div className="sm:col-span-2">
                        <label className="block uppercase text-neutral-400 mb-1">
                          Image URL or Uploaded Data Image
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={productForm.imageUrl.startsWith('data:') ? '[Uploaded Device Image]' : productForm.imageUrl}
                            onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            readOnly={productForm.imageUrl.startsWith('data:')}
                            placeholder="/assets/images/... or https://..."
                            className="flex-1 bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                          />
                          {productForm.imageUrl.startsWith('data:') && (
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm(prev => ({
                                  ...prev,
                                  imageUrl: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg'
                                }))
                              }
                              className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-[11px] font-semibold shrink-0"
                              title="Reset to default image URL"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variant Stock Allocations */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                  <span className="font-bold text-white uppercase text-[11px] block">Size Stock Quantities</span>
                  <div className="grid grid-cols-5 gap-2 font-mono">
                    <div>
                      <label className="block text-center text-neutral-400 mb-1">Size S</label>
                      <input type="number" value={productForm.stockS} onChange={e => setProductForm({ ...productForm, stockS: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-800 p-2 text-center rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-center text-neutral-400 mb-1">Size M</label>
                      <input type="number" value={productForm.stockM} onChange={e => setProductForm({ ...productForm, stockM: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-800 p-2 text-center rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-center text-neutral-400 mb-1">Size L</label>
                      <input type="number" value={productForm.stockL} onChange={e => setProductForm({ ...productForm, stockL: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-800 p-2 text-center rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-center text-neutral-400 mb-1">Size XL</label>
                      <input type="number" value={productForm.stockXL} onChange={e => setProductForm({ ...productForm, stockXL: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-800 p-2 text-center rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-center text-neutral-400 mb-1">Size XXL</label>
                      <input type="number" value={productForm.stockXXL} onChange={e => setProductForm({ ...productForm, stockXXL: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-800 p-2 text-center rounded text-white" />
                    </div>
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
              <button onClick={() => setShowCategoryModal(false)}><X className="w-4 h-4" /></button>
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

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Category Image URL or Asset Path</label>
                <input
                  type="text"
                  value={categoryForm.image}
                  onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Description</label>
                <input
                  type="text"
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
                <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                  PAID ({viewInvoiceOrder.payment.provider.toUpperCase()})
                </span>
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
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-sm font-bold text-white uppercase">
                Adjust Stock: {adjustModalItem.sku}
              </h3>
              <button onClick={() => setAdjustModalItem(null)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleInventoryAdjustSubmit} className="space-y-3 text-xs">
              <p className="text-neutral-300">
                Current Stock: <strong className="font-mono text-white">{adjustModalItem.stock}</strong> units ({adjustModalItem.colorName} / {adjustModalItem.size})
              </p>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Quantity Change (+ to add, - to deduct)</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="New batch received from manufacturing mill"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAdjustModalItem(null)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button type="submit" className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </div>
  );
};
