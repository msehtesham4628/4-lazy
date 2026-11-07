import React, { useState, useEffect } from 'react';
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
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Order, Product, Coupon, StoreSettings, EmailLog, InventoryTransaction } from '../../types/index.ts';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'coupons'
  | 'content'
  | 'settings'
  | 'emails';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  // Overview Data
  const [metrics, setMetrics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    courierCompany: 'Blue Dart Express',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDeliveryDate: '',
    statusNotes: ''
  });

  // Inventory
  const [inventoryMatrix, setInventoryMatrix] = useState<any[]>([]);
  const [inventoryTx, setInventoryTx] = useState<InventoryTransaction[]>([]);
  const [adjustModalItem, setAdjustModalItem] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Stock replenishment');

  // Customers
  const [customers, setCustomers] = useState<any[]>([]);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percent',
    value: 10,
    minOrderValue: 1499,
    maxDiscount: 1000,
    usageLimit: 500
  });

  // Settings & Content
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Emails
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<EmailLog | null>(null);

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
      const res = await fetch('/api/products');
      const d = await res.json();
      setProducts(d.products || []);
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
        fetchOrdersList(),
        fetchInventory(),
        fetchCustomers(),
        fetchCoupons(),
        fetchSettings(),
        fetchEmails()
      ]).finally(() => setLoading(false));
    }
  }, [isAdmin, token]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-[#E5A914] mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold text-white uppercase">Administrator Access Required</h2>
        <p className="text-xs text-neutral-400 mt-2">
          Please authenticate with administrator credentials (e.g. <strong>admin@4lazyfashion.com</strong> / <strong>admin123</strong>) to access the store management console.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

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

  const handleProcessRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to process a full refund and return stock to inventory?')) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
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

  // COUPON CREATION
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        setShowCouponModal(false);
        fetchCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  // SETTINGS SAVE
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
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BULK CSV IMPORT
  const handleBulkImport = async () => {
    try {
      const lines = bulkCsvText.trim().split('\n');
      if (lines.length < 2) return alert('Please enter at least 1 header and 1 product row.');

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const productsToImport: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 3) continue;

        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx];
        });

        productsToImport.push({
          title: row['title'] || row['name'],
          category: row['category'] || 'Oversized T-Shirts',
          basePrice: Number(row['price']) || 1999,
          discountPrice: row['saleprice'] ? Number(row['saleprice']) : undefined,
          description: row['description'] || 'Imported via CSV batch.',
          variants: [
            {
              id: `var_${Date.now()}_${i}`,
              colorName: row['color'] || 'Washed Black',
              colorHex: '#141416',
              size: (row['size'] || 'L') as any,
              sku: row['sku'] || `4L-CSV-${1000 + i}`,
              stock: Number(row['stock']) || 20,
              images: ['/src/assets/images/product_oversized_heavy_tee_1794056020516.jpg']
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
        alert(data.message);
        setShowBulkModal(false);
        setBulkCsvText('');
        fetchProductsList();
        fetchInventory();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert('Error parsing CSV: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col md:flex-row">
      
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
            <img
              src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
              alt="4 LAZY Logo"
              className="w-8 h-8 object-contain rounded"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-display text-sm font-black text-white tracking-wider">4 LAZY CONSOLE</span>
              <span className="text-[10px] block text-[#E5A914] font-mono">SUPER ADMIN v4.2</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Metrics
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'orders' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2.5"><ShoppingBag className="w-4 h-4" /> Orders</span>
              <span className="text-[10px] font-mono font-bold bg-neutral-800 px-1.5 py-0.5 rounded text-white">{orders.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'products' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Package className="w-4 h-4" /> Products Catalog
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'inventory' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <span className="flex items-center gap-2.5"><Boxes className="w-4 h-4" /> Inventory Matrix</span>
              {lowStockItems.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-[#E5A914] px-1.5 py-0.5 rounded">{lowStockItems.length} Low</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'customers' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Users className="w-4 h-4" /> Customers Roster
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'coupons' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Tag className="w-4 h-4" /> Coupons & Privileges
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'content' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <FileText className="w-4 h-4" /> Website CMS
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'emails' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Mail className="w-4 h-4" /> Automated Email Logs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-[#E5A914] text-black font-extrabold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Settings className="w-4 h-4" /> Store Settings
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-neutral-800">
          <button
            onClick={() => onNavigate('home')}
            className="w-full text-left text-xs text-neutral-400 hover:text-white py-1 flex items-center justify-between"
          >
            <span>Return to Storefront</span>
            <span>&rarr;</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Executive Dashboard</h1>
                <p className="text-xs text-neutral-400">Live operational overview for 4 LAZY fashion brand.</p>
              </div>
              <div className="text-right font-mono text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded">
                Server & DB: HEALTHY
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Total Revenue (Verified)</span>
                <p className="font-mono text-2xl font-black text-[#E5A914] tabular-nums">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-400">+18% this month</p>
              </div>

              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Total Placed Orders</span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  {metrics.totalOrders}
                </p>
                <p className="text-[11px] text-neutral-400">{metrics.pendingOrders} in fulfillment queue</p>
              </div>

              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Active Customers</span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  {metrics.totalCustomers}
                </p>
                <p className="text-[11px] text-neutral-400">Verified buyers</p>
              </div>

              <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Catalog SKUs</span>
                <p className="font-mono text-2xl font-black text-white tabular-nums">
                  {inventoryMatrix.length}
                </p>
                <p className="text-[11px] text-amber-400 font-medium">{metrics.lowStockCount} stock warnings</p>
              </div>
            </div>

            {/* Low Stock Alerts Strip */}
            {lowStockItems.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#E5A914] text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Variant Inventory Warnings (Stock &lt; 15 units)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {lowStockItems.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="bg-black/60 p-2.5 rounded border border-neutral-800 flex justify-between items-center">
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{item.productTitle}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{item.sku} · {item.colorName} ({item.size})</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-400 ml-2">{item.stock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Recent Customer Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                      <th className="pb-2">Order #</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Payment</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 font-mono">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-800/30">
                        <td className="py-2.5 font-bold text-[#E5A914]">{order.orderNumber}</td>
                        <td className="py-2.5 font-sans text-white">{order.customer.name}</td>
                        <td className="py-2.5 text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 text-white">₹{order.total.toLocaleString()}</td>
                        <td className="py-2.5 text-emerald-400 font-sans uppercase text-[11px]">{order.payment.provider} ({order.payment.status})</td>
                        <td className="py-2.5 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-800 text-white">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Order Fulfillment</h1>
                <p className="text-xs text-neutral-400">Manage statuses, assign courier AWB tracking, and process returns.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-xs">
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search by Order # or Name..."
                    className="bg-transparent text-white focus:outline-none text-xs w-44"
                  />
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Customer & Destination</th>
                    <th className="p-3.5">Items Summary</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status Flow</th>
                    <th className="p-3.5 text-right">Logistics & Actions</th>
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
                          <p className="text-neutral-500 text-[11px]">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                        </td>
                        <td className="p-3.5 align-top font-sans">
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <p key={idx} className="text-[11px] text-neutral-300">
                                {it.quantity}x {it.productTitle} <span className="text-neutral-500">({it.colorName}/{it.size})</span>
                              </p>
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
                          {order.payment.status === 'completed' && (
                            <button
                              onClick={() => handleProcessRefund(order.id)}
                              className="block ml-auto text-[10px] text-red-400 hover:underline uppercase"
                            >
                              Process Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Product Catalog</h1>
                <p className="text-xs text-neutral-400">Create, edit variants, manage multi-color photo galleries, or bulk import.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#E5A914]" /> Bulk CSV Import
                </button>
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,title,category,price,saleprice,color,size,sku,stock\n" +
                      products.map(p => `${p.title},${p.category},${p.basePrice},${p.discountPrice || ''},Washed Black,L,4L-EXP,25`).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "4lazy_products_export.csv");
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Piece</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Base / Sale Price</th>
                    <th className="p-3.5">Colors & Variants</th>
                    <th className="p-3.5">Rating & Reviews</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {products.map(p => (
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
                          <p className="text-[11px] text-neutral-500 font-mono">{p.slug}</p>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-300 font-semibold">{p.category}</td>
                      <td className="p-3.5 font-mono">
                        <span className="font-bold text-white">₹{(p.discountPrice || p.basePrice).toLocaleString()}</span>
                        {p.discountPrice && <span className="text-neutral-500 line-through ml-2">₹{p.basePrice.toLocaleString()}</span>}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 mb-1">
                          {p.colorGroups.map(cg => (
                            <span key={cg.colorName} className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: cg.colorHex }} title={cg.colorName} />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400">{p.variants.length} total SKUs</span>
                      </td>
                      <td className="p-3.5 font-mono text-white">
                        ★ {p.rating} ({p.reviewsCount} reviews)
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onNavigate('product-detail', { slug: p.slug })}
                          className="text-[#E5A914] hover:underline font-bold mr-3"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVENTORY MATRIX TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Variant Inventory Matrix</h1>
                <p className="text-xs text-neutral-400">Variant-level stock control, automated transaction audit logs, and instant adjustments.</p>
              </div>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-sans">
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5">Product Title</th>
                    <th className="p-3.5">Color & Swatch</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Current Stock</th>
                    <th className="p-3.5 text-right">Stock Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {inventoryMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 font-bold text-[#E5A914]">{item.sku}</td>
                      <td className="p-3.5 font-sans font-semibold text-white">{item.productTitle}</td>
                      <td className="p-3.5 font-sans flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: item.colorHex }} />
                        <span>{item.colorName}</span>
                      </td>
                      <td className="p-3.5 font-bold text-white">{item.size}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.stock < 15 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {item.stock} Units
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => {
                            setAdjustModalItem(item);
                            setAdjustQty(10);
                          }}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1 rounded text-xs font-bold uppercase"
                        >
                          Adjust (+/-)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Log Table */}
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">Stock Audit Trail</h2>
              <div className="space-y-2 font-mono text-xs">
                {inventoryTx.slice(0, 10).map(tx => (
                  <div key={tx.id} className="p-2.5 bg-neutral-950 rounded border border-neutral-800 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold">{tx.productTitle}</span>
                      <span className="text-neutral-500 ml-2">({tx.variantSku})</span>
                      <p className="text-[11px] text-neutral-400 font-sans mt-0.5">{tx.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${tx.change > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {tx.change > 0 ? `+${tx.change}` : tx.change} units
                      </span>
                      <p className="text-[10px] text-neutral-500">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS ROSTER TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Customer Accounts & Lifetime Spend</h1>
              <p className="text-xs text-neutral-400">Profiles, addresses, verification status, and historical spending.</p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Email & Phone</th>
                    <th className="p-3.5">Email Verified</th>
                    <th className="p-3.5">Orders Count</th>
                    <th className="p-3.5">Total Spend</th>
                    <th className="p-3.5">Registered</th>
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
                          {c.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3.5 text-white font-bold">{c.ordersCount} Orders</td>
                      <td className="p-3.5 text-[#E5A914] font-bold">₹{c.totalSpent.toLocaleString()}</td>
                      <td className="p-3.5 text-neutral-500">{new Date(c.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Privilege Coupons</h1>
                <p className="text-xs text-neutral-400">Manage promotional codes, percentage discounts, and minimum order values.</p>
              </div>
              <button
                onClick={() => setShowCouponModal(true)}
                className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map(cpn => (
                <div key={cpn.id} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-lg font-black text-[#E5A914]">{cpn.code}</span>
                    <button onClick={() => handleDeleteCoupon(cpn.id)} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-neutral-300">
                    <p>Discount: <strong>{cpn.type === 'percent' ? `${cpn.value}% Off` : `₹${cpn.value} Off`}</strong></p>
                    <p>Min Order: <strong>₹{cpn.minOrderValue.toLocaleString()}</strong></p>
                    <p>Usage: <strong>{cpn.usedCount} / {cpn.usageLimit}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBSITE CMS & CONTENT TAB */}
        {activeTab === 'content' && storeSettings && (
          <div className="space-y-6 max-w-3xl">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Website Content CMS</h1>
              <p className="text-xs text-neutral-400">Update homepage announcements, hero banner text, and campaign stories without code edits.</p>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded">
                Changes published live to storefront.
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Main Heading</label>
                <input
                  type="text"
                  value={storeSettings.heroHeading}
                  onChange={e => setStoreSettings({ ...storeSettings, heroHeading: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Subhead Prose</label>
                <textarea
                  rows={3}
                  value={storeSettings.heroSubhead}
                  onChange={e => setStoreSettings({ ...storeSettings, heroSubhead: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Hero Button Callout</label>
                <input
                  type="text"
                  value={storeSettings.heroButtonText}
                  onChange={e => setStoreSettings({ ...storeSettings, heroButtonText: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Campaign Story Description</label>
                <textarea
                  rows={3}
                  value={storeSettings.campaignDescription}
                  onChange={e => setStoreSettings({ ...storeSettings, campaignDescription: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded"
                />
              </div>

              <button
                type="submit"
                className="bg-[#E5A914] text-black font-extrabold px-6 py-2.5 rounded text-xs uppercase tracking-widest hover:bg-[#d49b10]"
              >
                Publish Live Updates
              </button>
            </form>
          </div>
        )}

        {/* STORE SETTINGS TAB */}
        {activeTab === 'settings' && storeSettings && (
          <div className="space-y-6 max-w-3xl">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Global Store Configuration</h1>
              <p className="text-xs text-neutral-400">Payment gateway credentials, shipping thresholds, and tax policies.</p>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded">
                Settings saved successfully.
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={storeSettings.brandName}
                    onChange={e => setStoreSettings({ ...storeSettings, brandName: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={storeSettings.currency}
                    onChange={e => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Free Shipping Min (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.freeShippingThreshold}
                    onChange={e => setStoreSettings({ ...storeSettings, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Standard Shipping Fee (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.standardShippingFee}
                    onChange={e => setStoreSettings({ ...storeSettings, standardShippingFee: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Express Air Fee (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.expressShippingFee}
                    onChange={e => setStoreSettings({ ...storeSettings, expressShippingFee: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white">Payment Gateway Integration</h3>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={storeSettings.razorpayKeyId}
                    onChange={e => setStoreSettings({ ...storeSettings, razorpayKeyId: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Stripe Public Key</label>
                  <input
                    type="text"
                    value={storeSettings.stripePublicKey}
                    onChange={e => setStoreSettings({ ...storeSettings, stripePublicKey: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs text-white rounded font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#E5A914] text-black font-extrabold px-6 py-2.5 rounded text-xs uppercase tracking-widest hover:bg-[#d49b10]"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* AUTOMATED EMAIL LOGS TAB */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-neutral-800">
              <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Automated Notification Logs</h1>
              <p className="text-xs text-neutral-400">Inspect branded transactional emails dispatched to buyers and administrators.</p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Subject Line</th>
                    <th className="p-3.5">Template Type</th>
                    <th className="p-3.5">Dispatched At</th>
                    <th className="p-3.5 text-right">Inspect Email</th>
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

      {/* COURIER ASSIGN MODAL */}
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
                <label className="block text-[11px] uppercase text-neutral-400 mb-1">Courier Company</label>
                <input
                  type="text"
                  value={trackingForm.courierCompany}
                  onChange={e => setTrackingForm({ ...trackingForm, courierCompany: e.target.value })}
                  placeholder="Blue Dart Express"
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
                  placeholder="e.g. Mar 10, 2026"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setSelectedOrderForTracking(null)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button type="submit" className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider">
                  Notify Customer & Dispatch
                </button>
              </div>
            </form>
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

      {/* BULK CSV IMPORT MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-sm font-bold text-white uppercase">
                Bulk CSV Product Import
              </h3>
              <button onClick={() => setShowBulkModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-400">
                Paste CSV data with columns: <code className="text-[#E5A914]">title, category, price, saleprice, color, size, sku, stock</code>
              </p>

              <textarea
                rows={8}
                value={bulkCsvText}
                onChange={e => setBulkCsvText(e.target.value)}
                placeholder={"title,category,price,saleprice,color,size,sku,stock\nBrutalist Boxy Tee,Oversized T-Shirts,1899,1599,Washed Black,L,4L-BBT-WB-L,30\nHeavy Terry Jogger,Joggers & Sweatpants,2999,2499,Heather Grey,M,4L-JOG-HG-M,20"}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 font-mono text-xs text-white rounded focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBulkModal(false)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button onClick={handleBulkImport} className="bg-[#E5A914] text-black font-extrabold px-5 py-2 rounded text-xs uppercase tracking-wider">
                  Validate & Import Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUPON CREATE MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-100 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="font-display text-sm font-bold text-white uppercase">
                Create Privilege Coupon
              </h3>
              <button onClick={() => setShowCouponModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block uppercase text-neutral-400 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. VIP25"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white uppercase font-mono rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Discount Type</label>
                  <select
                    value={newCoupon.type}
                    onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Rupees (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={newCoupon.value}
                    onChange={e => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.minOrderValue}
                    onChange={e => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.maxDiscount}
                    onChange={e => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCouponModal(false)} className="text-xs text-neutral-400 px-3">Cancel</button>
                <button type="submit" className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-wider">
                  Save Coupon
                </button>
              </div>
            </form>
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
