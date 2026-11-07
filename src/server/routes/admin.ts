import { Router, Response } from 'express';
import { getDB, saveDB } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../authMiddleware.ts';
import { sendShippingUpdateEmail } from '../emailService.ts';
import { OrderStatus, InventoryTransaction } from '../../types/index.ts';

export const adminRouter = Router();

// Apply requireAdmin to all adminRouter endpoints
adminRouter.use(requireAdmin);

// Dashboard Overview Metrics
adminRouter.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();

  const totalRevenue = db.orders.reduce((sum, o) => {
    return o.payment.status === 'completed' ? sum + o.total : sum;
  }, 0);

  const totalOrders = db.orders.length;
  const totalCustomers = db.users.filter(u => u.role === 'customer').length;
  const totalProducts = db.products.length;

  const pendingOrders = db.orders.filter(o => o.status === 'Order Placed' || o.status === 'Confirmed' || o.status === 'Processing').length;
  const completedOrders = db.orders.filter(o => o.status === 'Delivered').length;

  // Variant low stock list
  const lowStockItems: any[] = [];
  db.products.forEach(p => {
    p.variants.forEach(v => {
      if (v.stock < 15) {
        lowStockItems.push({
          productId: p.id,
          productTitle: p.title,
          sku: v.sku,
          colorName: v.colorName,
          size: v.size,
          stock: v.stock
        });
      }
    });
  });

  // Recent 10 orders
  const recentOrders = db.orders.slice(0, 10);

  // Sales by month mock aggregation
  const salesHistory = [
    { month: 'Nov', revenue: Math.round(totalRevenue * 0.12) },
    { month: 'Dec', revenue: Math.round(totalRevenue * 0.18) },
    { month: 'Jan', revenue: Math.round(totalRevenue * 0.22) },
    { month: 'Feb', revenue: Math.round(totalRevenue * 0.26) },
    { month: 'Mar', revenue: Math.round(totalRevenue * 0.22) }
  ];

  return res.json({
    metrics: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      completedOrders,
      lowStockCount: lowStockItems.length
    },
    lowStockItems,
    recentOrders,
    salesHistory
  });
});

// Orders Management: List orders with filters
adminRouter.get('/orders', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const { status, search } = req.query;

  let list = [...db.orders];

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    );
  }

  return res.json({ orders: list });
});

// Orders Management: Update order status
adminRouter.put('/orders/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const db = getDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const prevStatus = order.status;
  order.status = status as OrderStatus;

  order.statusHistory.push({
    status: status as OrderStatus,
    timestamp: new Date().toISOString(),
    note: note || `Order status updated to ${status}`
  });

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'ORDER_STATUS_UPDATED',
    details: `Updated order #${order.orderNumber} from ${prevStatus} to ${status}`,
    timestamp: new Date().toISOString()
  });

  saveDB();

  // If order transitioned to Shipped or Out for Delivery or Delivered, auto-send email
  if (status === 'Shipped' || status === 'Out for Delivery' || status === 'Delivered') {
    try {
      sendShippingUpdateEmail(order);
    } catch (e) {
      console.error('Failed to send shipping email:', e);
    }
  }

  return res.json({ order, message: `Order status updated to ${status}.` });
});

// Orders Management: Assign tracking details
adminRouter.put('/orders/:id/tracking', (req: AuthenticatedRequest, res: Response) => {
  const { courierCompany, trackingNumber, trackingUrl, estimatedDeliveryDate, statusNotes } = req.body;
  if (!courierCompany || !trackingNumber) {
    return res.status(400).json({ error: 'Courier company and tracking number are required.' });
  }

  const db = getDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.tracking = {
    courierCompany,
    trackingNumber,
    trackingUrl: trackingUrl || '#',
    dispatchDate: new Date().toISOString().split('T')[0],
    estimatedDeliveryDate,
    statusNotes
  };

  if (order.status !== 'Shipped' && order.status !== 'Delivered') {
    order.status = 'Shipped';
    order.statusHistory.push({
      status: 'Shipped',
      timestamp: new Date().toISOString(),
      note: `Courier dispatched via ${courierCompany} with AWB #${trackingNumber}`
    });
  }

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'TRACKING_ASSIGNED',
    details: `Assigned tracking ${trackingNumber} (${courierCompany}) to #${order.orderNumber}`,
    timestamp: new Date().toISOString()
  });

  saveDB();

  try {
    sendShippingUpdateEmail(order);
  } catch (e) {
    console.error('Failed to send shipping email:', e);
  }

  return res.json({ order, message: 'Tracking details updated and customer notified.' });
});

// Orders Management: Process Refund
adminRouter.post('/orders/:id/refund', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.payment.status = 'refunded';
  order.status = 'Returned';
  order.statusHistory.push({
    status: 'Returned',
    timestamp: new Date().toISOString(),
    note: `Refund of ₹${order.total.toLocaleString()} processed via ${order.payment.provider}.`
  });

  // Restore inventory
  for (const item of order.items) {
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      const variant = product.variants.find(v => v.id === item.variantId || v.sku === item.sku);
      if (variant) {
        variant.stock += item.quantity;
      }
    }
  }

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'ORDER_REFUNDED',
    details: `Processed refund of ₹${order.total} for #${order.orderNumber}`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ order, message: 'Refund completed and stock replenished.' });
});

// Inventory: Variant matrix with stock levels
adminRouter.get('/inventory', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const inventoryList: any[] = [];

  db.products.forEach(p => {
    p.variants.forEach(v => {
      inventoryList.push({
        productId: p.id,
        productTitle: p.title,
        category: p.category,
        variantId: v.id,
        sku: v.sku,
        colorName: v.colorName,
        colorHex: v.colorHex,
        size: v.size,
        stock: v.stock,
        price: p.discountPrice || p.basePrice
      });
    });
  });

  return res.json({
    inventory: inventoryList,
    transactions: db.inventoryTransactions.slice(0, 50)
  });
});

// Inventory: Stock manual adjustment
adminRouter.post('/inventory/adjust', (req: AuthenticatedRequest, res: Response) => {
  const { productId, variantId, sku, change, reason } = req.body;
  if (!change || isNaN(Number(change))) {
    return res.status(400).json({ error: 'Valid stock adjustment quantity is required.' });
  }

  const db = getDB();
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const variant = product.variants.find(v => v.id === variantId || v.sku === sku);
  if (!variant) return res.status(404).json({ error: 'Variant not found.' });

  const numChange = Number(change);
  const prevStock = variant.stock;
  variant.stock = Math.max(0, variant.stock + numChange);

  const tx: InventoryTransaction = {
    id: `inv_tx_${Date.now()}`,
    productId: product.id,
    productTitle: product.title,
    variantSku: variant.sku,
    colorName: variant.colorName,
    size: variant.size,
    change: numChange,
    previousStock: prevStock,
    newStock: variant.stock,
    reason: reason || 'Manual stock adjustment by admin',
    timestamp: new Date().toISOString()
  };

  db.inventoryTransactions.unshift(tx);
  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'INVENTORY_ADJUSTED',
    details: `${product.title} (${variant.sku}): ${prevStock} -> ${variant.stock} (${numChange > 0 ? '+' : ''}${numChange})`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ success: true, variant, transaction: tx });
});

// Customers list with spending statistics
adminRouter.get('/customers', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const customers = db.users
    .filter(u => u.role === 'customer')
    .map(u => {
      const userOrders = db.orders.filter(o => o.userId === u.id || o.customer.email.toLowerCase() === u.email.toLowerCase());
      const totalSpent = userOrders.reduce((sum, o) => o.payment.status === 'completed' ? sum + o.total : sum, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        isEmailVerified: u.isEmailVerified,
        ordersCount: userOrders.length,
        totalSpent,
        joinedAt: u.createdAt,
        addresses: u.addresses
      };
    });

  return res.json({ customers });
});

// Coupons Management: CRUD
adminRouter.get('/coupons', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({ coupons: db.coupons });
});

adminRouter.post('/coupons', (req: AuthenticatedRequest, res: Response) => {
  const { code, type, value, minOrderValue, maxDiscount, expiresAt, usageLimit } = req.body;
  if (!code || !type || !value) {
    return res.status(400).json({ error: 'Code, type (percent/fixed), and value are required.' });
  }

  const db = getDB();
  const cleanCode = code.trim().toUpperCase();
  if (db.coupons.some(c => c.code === cleanCode)) {
    return res.status(400).json({ error: 'A coupon with this code already exists.' });
  }

  const newCoupon = {
    id: `cpn_${Date.now()}`,
    code: cleanCode,
    type: type as 'percent' | 'fixed',
    value: Number(value),
    minOrderValue: Number(minOrderValue) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: Number(usageLimit) || 100,
    usedCount: 0,
    isActive: true
  };

  db.coupons.unshift(newCoupon);
  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'COUPON_CREATED',
    details: `Created coupon ${newCoupon.code}`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.status(201).json({ coupon: newCoupon });
});

adminRouter.put('/coupons/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const coupon = db.coupons.find(c => c.id === req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });

  Object.assign(coupon, req.body);
  saveDB();
  return res.json({ coupon });
});

adminRouter.delete('/coupons/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  db.coupons = db.coupons.filter(c => c.id !== req.params.id);
  saveDB();
  return res.json({ success: true });
});

// Content CMS & Settings
adminRouter.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({ settings: db.settings });
});

adminRouter.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  Object.assign(db.settings, req.body);

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'SETTINGS_UPDATED',
    details: 'Store settings and website content updated.',
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ settings: db.settings, message: 'Settings saved successfully.' });
});

// Logs & Emails
adminRouter.get('/logs', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({ logs: db.adminLogs });
});

adminRouter.get('/emails', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({ emails: db.emailLogs });
});
