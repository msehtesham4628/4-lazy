import { Router, type Response } from 'express';
import { getDB, saveDB, setDB } from '../db.ts';
import { requireAdmin, type AuthenticatedRequest } from '../authMiddleware.ts';
import { sendShippingUpdateEmail } from '../emailService.ts';
import type { OrderStatus, InventoryTransaction } from '../../types/index.ts';
import {
  getMongoStats,
  connectMongoDB,
  syncLocalToMongo,
  syncMongoToLocal,
  isMongoConnected,
  ProductModel,
  UserModel,
  OrderModel,
  CategoryModel,
  CouponModel,
  ReturnRequestModel
} from '../mongodb.ts';

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
      lowStockCount: lowStockItems.length,
      stockNotificationsCount: (db.stockNotifications || []).filter(n => n.status === 'Pending').length
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

// Inventory: Stock manual adjustment (+ / - delta or exact stock value)
adminRouter.post('/inventory/adjust', (req: AuthenticatedRequest, res: Response) => {
  const { productId, variantId, sku, change, setExactStock, reason } = req.body;

  const db = getDB();
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const variant = product.variants.find(v => v.id === variantId || v.sku === sku);
  if (!variant) return res.status(404).json({ error: 'Variant not found.' });

  const prevStock = Number(variant.stock) || 0;
  let nextStock = prevStock;
  let numChange = 0;

  if (setExactStock !== undefined && setExactStock !== null && setExactStock !== '' && !isNaN(Number(setExactStock))) {
    nextStock = Math.max(0, Math.round(Number(setExactStock)));
    numChange = nextStock - prevStock;
  } else {
    const parsed = Number(change);
    if (change === undefined || change === null || change === '' || isNaN(parsed) || parsed === 0) {
      return res.status(400).json({ error: 'Enter a non-zero quantity change (e.g. -5 or +10).' });
    }
    numChange = Math.round(parsed);
    nextStock = Math.max(0, prevStock + numChange);
  }

  variant.stock = nextStock;

  const tx: InventoryTransaction = {
    id: `inv_tx_${Date.now()}`,
    productId: product.id,
    productTitle: product.title,
    variantSku: variant.sku,
    colorName: variant.colorName,
    size: variant.size,
    change: nextStock - prevStock,
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
    details: `${product.title} (${variant.sku}): ${prevStock} -> ${variant.stock} (${tx.change >= 0 ? '+' : ''}${tx.change})`,
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
  if (isMongoConnected()) {
    CouponModel.deleteOne({ id: req.params.id }).catch(err => {
      console.warn('Mongo coupon delete warning:', err?.message || err);
    });
  }
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

// Category Management (CMS category images & text)
adminRouter.get('/categories', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({ categories: db.categories });
});

adminRouter.post('/categories', (req: AuthenticatedRequest, res: Response) => {
  const { name, description, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const db = getDB();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newCat = {
    id: `cat_${Date.now()}`,
    slug,
    name: name.trim(),
    description: description || 'Architectural streetwear category.',
    image: image || '/assets/images/product_oversized_heavy_tee_1794056020516.jpg',
    itemCount: 0
  };

  db.categories.push(newCat);
  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'CATEGORY_CREATED',
    details: `Created category ${newCat.name}`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.status(201).json({ category: newCat });
});

adminRouter.put('/categories/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  Object.assign(cat, req.body);
  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'CATEGORY_UPDATED',
    details: `Updated category ${cat.name} (${cat.id})`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ category: cat });
});

adminRouter.delete('/categories/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  saveDB();
  return res.json({ success: true });
});

// Returns & Exchanges Management
adminRouter.get('/returns', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({ returns: db.returnRequests || [] });
});

adminRouter.put('/returns/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { status, notes, pickupAwb } = req.body;
  const db = getDB();
  const ret = db.returnRequests.find(r => r.id === req.params.id);
  if (!ret) return res.status(404).json({ error: 'Return request not found' });

  if (status) ret.status = status;
  if (notes !== undefined) ret.notes = notes;
  if (pickupAwb !== undefined) ret.pickupAwb = pickupAwb;
  ret.updatedAt = new Date().toISOString();

  // If status is Refund Completed, restock inventory if not already refunded
  if (status === 'Refund Completed') {
    const order = db.orders.find(o => o.id === ret.orderId || o.orderNumber === ret.orderNumber);
    if (order && order.payment.status !== 'refunded') {
      order.payment.status = 'refunded';
      order.status = 'Returned';
      for (const item of ret.items) {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          const variant = prod.variants.find(v => v.sku === item.variantSku || (v.size === item.size && v.colorName === item.colorName));
          if (variant) {
            variant.stock += item.quantity;
          }
        }
      }
    }
  }

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'RETURN_STATUS_UPDATED',
    details: `Updated return ${ret.id} to ${ret.status}`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ returnRequest: ret });
});

// Tally & Financial Accounting Integration
adminRouter.get('/tally/summary', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();

  let grossProductSales = 0;
  let totalDiscounts = 0;
  let totalShippingRevenue = 0;
  let totalTaxCollected = 0;
  let totalRefunds = 0;
  let completedOrdersCount = 0;

  const paymentModesBreakup: Record<string, number> = {
    upi: 0,
    card: 0,
    razorpay: 0,
    stripe: 0,
    cod: 0
  };

  db.orders.forEach(o => {
    if (o.payment.status === 'completed') {
      completedOrdersCount++;
      grossProductSales += o.subtotal;
      totalDiscounts += o.discount;
      totalShippingRevenue += o.shippingFee;
      totalTaxCollected += o.tax;
      const provider = o.payment.provider || 'upi';
      paymentModesBreakup[provider] = (paymentModesBreakup[provider] || 0) + o.total;
    } else if (o.payment.status === 'refunded') {
      totalRefunds += o.total;
    }
  });

  const netTaxableValue = Math.max(0, grossProductSales - totalDiscounts);
  const cgstAmount = Math.round(totalTaxCollected / 2);
  const sgstAmount = totalTaxCollected - cgstAmount;
  const netRevenue = netTaxableValue + totalTaxCollected + totalShippingRevenue - totalRefunds;

  return res.json({
    summary: {
      completedOrdersCount,
      grossProductSales,
      totalDiscounts,
      netTaxableValue,
      totalShippingRevenue,
      cgstAmount,
      sgstAmount,
      totalTaxCollected,
      totalRefunds,
      netRevenue,
      paymentModesBreakup
    }
  });
});

// Export Sales Voucher XML for Tally ERP 9 / TallyPrime
adminRouter.get('/tally/export-xml', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const paidOrders = db.orders.filter(o => o.payment.status === 'completed');

  const vouchersXml = paidOrders.map(o => {
    const invDate = new Date(o.createdAt).toISOString().split('T')[0].replace(/-/g, '');
    const taxable = Math.max(0, o.subtotal - o.discount);
    const cgst = Math.round(o.tax / 2);
    const sgst = o.tax - cgst;
    const paymentLedger = o.payment.provider === 'upi' ? 'Razorpay UPI Ledger' : 'HDFC Bank Account';

    return `
      <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">
        <DATE>${invDate}</DATE>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${o.orderNumber}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${o.customer.name.replace(/&/g, '&amp;')}</PARTYLEDGERNAME>
        <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
        <BASICBUYERNAME>${o.customer.name.replace(/&/g, '&amp;')}</BASICBUYERNAME>
        <BASICPLACEOFSUPPLY>${o.shippingAddress.state}</BASICPLACEOFSUPPLY>
        <NARRATION>4LAAZY Order #${o.orderNumber} - ${o.items.map(i => `${i.productTitle} (${i.quantity})`).join(', ')}</NARRATION>
        
        <!-- Dr Party / Bank Ledger -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${paymentLedger}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${o.total}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>

        <!-- Cr Sales Account -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Streetwear Sales Account</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${taxable}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>

        <!-- Cr CGST @ 2.5% -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output CGST @ 2.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${cgst}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>

        <!-- Cr SGST @ 2.5% -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output SGST @ 2.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${sgst}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>

        ${o.shippingFee > 0 ? `
        <!-- Cr Shipping Charges -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Freight &amp; Delivery Recovery</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${o.shippingFee}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>` : ''}
      </VOUCHER>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>4LAAZY APPAREL INC</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${vouchersXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  res.header('Content-Type', 'application/xml');
  res.attachment('4LAZY_Tally_Sales_Vouchers.xml');
  return res.send(xml);
});

// Export GST Sales Register CSV
adminRouter.get('/tally/export-csv', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const headers = 'Invoice No,Invoice Date,Customer Name,State,PIN Code,Taxable Value,CGST (2.5%),SGST (2.5%),Delivery Charges,Invoice Total,Payment Provider,Status\n';
  const rows = db.orders.map(o => {
    const invDate = new Date(o.createdAt).toISOString().split('T')[0];
    const taxable = Math.max(0, o.subtotal - o.discount);
    const cgst = Math.round(o.tax / 2);
    const sgst = o.tax - cgst;
    return `"${o.orderNumber}","${invDate}","${o.customer.name.replace(/"/g, '""')}","${o.shippingAddress.state}","${o.shippingAddress.pinCode}",${taxable},${cgst},${sgst},${o.shippingFee},${o.total},"${o.payment.provider}","${o.payment.status}"`;
  }).join('\n');

  res.header('Content-Type', 'text/csv');
  res.attachment('4LAZY_GST_Sales_Register.csv');
  return res.send(headers + rows);
});

// ----------------------------------------------------
// MONGODB ATLAS ENDPOINTS
// ----------------------------------------------------

// GET /api/admin/mongodb/status
adminRouter.get('/mongodb/status', async (req: AuthenticatedRequest, res: Response) => {
  const stats = getMongoStats();
  let collections: Record<string, number> = {};

  if (stats.connected) {
    try {
      collections = {
        products: await ProductModel.countDocuments(),
        users: await UserModel.countDocuments(),
        orders: await OrderModel.countDocuments(),
        categories: await CategoryModel.countDocuments(),
        coupons: await CouponModel.countDocuments(),
        returns: await ReturnRequestModel.countDocuments()
      };
    } catch (err: any) {
      console.warn('Failed to query Mongo collection counts:', err?.message);
    }
  }

  return res.json({
    ...stats,
    collections
  });
});

// POST /api/admin/mongodb/connect
adminRouter.post('/mongodb/connect', async (req: AuthenticatedRequest, res: Response) => {
  const { uri } = req.body;
  if (!uri || typeof uri !== 'string') {
    return res.status(400).json({ error: 'MongoDB connection string (URI) is required.' });
  }

  const result = await connectMongoDB(uri.trim());
  if (result.connected) {
    const count = await ProductModel.countDocuments().catch(() => 0);
    if (count === 0) {
      // MongoDB is fresh, push all local demo data
      await syncLocalToMongo(getDB());
    } else {
      // MongoDB already has data, load it into local memory
      const pullResult = await syncMongoToLocal();
      if (pullResult.success && pullResult.data) {
        setDB(pullResult.data);
      }
    }
    return res.json({
      success: true,
      message: 'Successfully connected to MongoDB Atlas cluster!',
      host: result.host,
      existingProductCount: count
    });
  } else {
    return res.status(400).json({
      success: false,
      error: result.error || 'Failed to connect to MongoDB.',
      isWhitelistError: (result as any).isWhitelistError,
      isAuthError: (result as any).isAuthError
    });
  }
});

// POST /api/admin/mongodb/sync (Push local data to MongoDB)
adminRouter.post('/mongodb/sync', async (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const result = await syncLocalToMongo(db);
  if (result.success) {
    return res.json({
      success: true,
      message: 'All collections successfully synchronized to MongoDB Atlas.',
      syncedCounts: result.syncedCounts
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to synchronize with MongoDB.'
    });
  }
});

// POST /api/admin/mongodb/pull (Pull MongoDB data into local server)
adminRouter.post('/mongodb/pull', async (req: AuthenticatedRequest, res: Response) => {
  const result = await syncMongoToLocal();
  if (result.success && result.data) {
    setDB(result.data);
    return res.json({
      success: true,
      message: 'Successfully fetched latest catalog, products, and users from MongoDB Atlas.',
      loadedCounts: result.loadedCounts
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to pull data from MongoDB.'
    });
  }
});

// ----------------------------------------------------
// STOCK NOTIFICATION ("NOTIFY ME") REQUESTS
// ----------------------------------------------------

// GET /api/admin/stock-notifications
adminRouter.get('/stock-notifications', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  return res.json({
    notifications: db.stockNotifications || []
  });
});

// PUT /api/admin/stock-notifications/:id/notify
adminRouter.put('/stock-notifications/:id/notify', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  db.stockNotifications = db.stockNotifications || [];
  const item = db.stockNotifications.find(n => n.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Notification request not found.' });
  }

  item.status = 'Notified';
  item.notifiedAt = new Date().toISOString();

  if (item.customerEmail) {
    db.emailLogs.unshift({
      id: `eml_${Date.now()}`,
      to: item.customerEmail,
      subject: `Back In Stock: ${item.productTitle} (${item.size} / ${item.colorName})`,
      type: 'back_in_stock',
      sentAt: new Date().toISOString(),
      status: 'delivered',
      previewHtml: `<h1>4LAAZY</h1><p>Hey ${item.customerName}, your requested piece <strong>${item.productTitle}</strong> in <strong>${item.colorName} (Size ${item.size})</strong> is back in stock at 4laazy.com.</p>`
    });
  }

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'STOCK_NOTIFY_SENT',
    details: `Notified ${item.customerName} (${item.customerEmail || item.customerPhone}) for ${item.productTitle} [${item.colorName}/${item.size}].`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ notification: item, message: `Marked as notified for ${item.customerName}.` });
});

// DELETE /api/admin/stock-notifications/:id
adminRouter.delete('/stock-notifications/:id', (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  db.stockNotifications = db.stockNotifications || [];
  const idx = db.stockNotifications.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Notification request not found.' });
  }

  db.stockNotifications.splice(idx, 1);
  saveDB();
  return res.json({ success: true, message: 'Notification request removed.' });
});

