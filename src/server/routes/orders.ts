import { Router, Response } from 'express';
import { getDB, saveDB } from '../db.ts';
import { optionalAuthenticate, authenticate, AuthenticatedRequest } from '../authMiddleware.ts';
import { sendOrderConfirmationEmail } from '../emailService.ts';
import { Order, OrderItem, UserAddress, InventoryTransaction } from '../../types/index.ts';

export const ordersRouter = Router();

// Validate Coupon helper
function evaluateCoupon(code: string, subtotal: number, category?: string) {
  const db = getDB();
  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  if (!coupon) return { valid: false, message: 'Invalid or inactive coupon code.' };

  if (Date.now() > new Date(coupon.expiresAt).getTime()) {
    return { valid: false, message: 'Coupon code has expired.' };
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached.' };
  }

  if (subtotal < coupon.minOrderValue) {
    return { valid: false, message: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString()} required for this coupon.` };
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }

  return { valid: true, coupon, discount: Math.round(discount) };
}

// Public: Validate coupon endpoint
ordersRouter.post('/coupons/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });

  const result = evaluateCoupon(code, Number(subtotal) || 0);
  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }

  return res.json({
    valid: true,
    code: result.coupon!.code,
    discount: result.discount,
    type: result.coupon!.type,
    value: result.coupon!.value
  });
});

// Create Order (Multi-Step Checkout)
ordersRouter.post('/orders', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    customer,
    shippingAddress,
    items,
    paymentMethod,
    couponCode,
    deliveryMethod = 'standard'
  } = req.body;

  if (!customer?.name || !customer?.email || !customer?.phone) {
    return res.status(400).json({ error: 'Customer name, email, and phone are required.' });
  }

  if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.pinCode || !shippingAddress?.state) {
    return res.status(400).json({ error: 'Incomplete shipping address.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }

  const db = getDB();

  // 1. Verify item inventory and lock server-side prices
  const verifiedOrderItems: OrderItem[] = [];
  let calculatedSubtotal = 0;
  const inventoryUpdates: { product: any; variant: any; quantity: number }[] = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product || !product.isPublished) {
      return res.status(400).json({ error: `Product "${item.productTitle || item.productId}" is not available.` });
    }

    const variant = product.variants.find(v => v.id === item.variantId || (v.size === item.size && v.colorName === item.colorName));
    if (!variant) {
      return res.status(400).json({ error: `Variant for "${product.title}" (${item.colorName} / ${item.size}) is not available.` });
    }

    if (variant.stock < item.quantity) {
      return res.status(400).json({
        error: `Insufficient inventory for ${product.title} (${item.colorName} / ${item.size}). Only ${variant.stock} left in stock.`
      });
    }

    const price = product.discountPrice || product.basePrice;
    calculatedSubtotal += price * item.quantity;

    verifiedOrderItems.push({
      productId: product.id,
      variantId: variant.id,
      productTitle: product.title,
      colorName: variant.colorName,
      size: variant.size,
      sku: variant.sku,
      price,
      quantity: item.quantity,
      image: variant.images[0] || product.colorGroups[0]?.images[0] || ''
    });

    inventoryUpdates.push({ product, variant, quantity: item.quantity });
  }

  // 2. Validate Coupon server-side
  let discountAmount = 0;
  if (couponCode) {
    const couponEval = evaluateCoupon(couponCode, calculatedSubtotal);
    if (couponEval.valid) {
      discountAmount = couponEval.discount || 0;
      if (couponEval.coupon) {
        couponEval.coupon.usedCount += 1;
      }
    }
  }

  // 3. Calculate Shipping Fee & Tax
  const settings = db.settings;
  let shippingFee = 0;
  if (deliveryMethod === 'express') {
    shippingFee = settings.expressShippingFee || 199;
  } else {
    shippingFee = calculatedSubtotal >= settings.freeShippingThreshold ? 0 : (settings.standardShippingFee || 99);
  }

  const taxableAmount = Math.max(0, calculatedSubtotal - discountAmount);
  const tax = Math.round((taxableAmount * (settings.taxRatePercent || 5)) / 100);
  const total = taxableAmount + shippingFee + tax;

  // 4. Atomically decrement inventory and record transactions
  const orderNumber = `4L-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  for (const update of inventoryUpdates) {
    const prevStock = update.variant.stock;
    update.variant.stock = Math.max(0, update.variant.stock - update.quantity);

    const tx: InventoryTransaction = {
      id: `inv_tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      productId: update.product.id,
      productTitle: update.product.title,
      variantSku: update.variant.sku,
      colorName: update.variant.colorName,
      size: update.variant.size,
      change: -update.quantity,
      previousStock: prevStock,
      newStock: update.variant.stock,
      reason: `Order #${orderNumber} fulfillment`,
      timestamp: new Date().toISOString()
    };
    db.inventoryTransactions.unshift(tx);
  }

  // 5. Construct Order Record
  const newOrder: Order = {
    id: `ord_${Date.now()}`,
    orderNumber,
    userId: req.user?.id,
    customer: {
      name: customer.name.trim(),
      email: customer.email.toLowerCase().trim(),
      phone: customer.phone.trim()
    },
    shippingAddress: {
      id: `addr_${Date.now()}`,
      fullName: shippingAddress.fullName || customer.name,
      phone: shippingAddress.phone || customer.phone,
      street: shippingAddress.street,
      apartment: shippingAddress.apartment || '',
      city: shippingAddress.city,
      state: shippingAddress.state,
      pinCode: shippingAddress.pinCode,
      country: shippingAddress.country || 'India',
      isDefault: false
    },
    items: verifiedOrderItems,
    subtotal: calculatedSubtotal,
    discount: discountAmount,
    shippingFee,
    tax,
    total,
    payment: {
      provider: paymentMethod || 'upi',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'completed',
      paidAt: new Date().toISOString(),
      amount: total,
      currency: settings.currency || 'INR'
    },
    status: 'Confirmed',
    statusHistory: [
      {
        status: 'Order Placed',
        timestamp: new Date().toISOString()
      },
      {
        status: 'Confirmed',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        note: `Payment verified via ${paymentMethod ? paymentMethod.toUpperCase() : 'GATEWAY'}. Order placed in production queue.`
      }
    ],
    tracking: {
      courierCompany: 'Blue Dart Express',
      trackingNumber: `4L-TRACK-${Math.floor(100000000 + Math.random() * 900000000)}`,
      trackingUrl: '#',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      statusNotes: 'Preparing for courier handover'
    },
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // If user is authenticated and doesn't have this address, auto-save to their book
  if (req.user) {
    const userInDb = db.users.find(u => u.id === req.user!.id);
    if (userInDb && userInDb.addresses.length === 0) {
      userInDb.addresses.push({ ...newOrder.shippingAddress, isDefault: true });
    }
  }

  saveDB();

  // Send automated email notification
  try {
    sendOrderConfirmationEmail(newOrder);
  } catch (e) {
    console.error('Failed to send order email:', e);
  }

  return res.status(201).json({
    success: true,
    order: newOrder,
    message: 'Order placed and payment confirmed.'
  });
});

// Customer: Get personal orders
ordersRouter.get('/orders/my-orders', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const userOrders = db.orders.filter(o => o.userId === req.user!.id || o.customer.email.toLowerCase() === req.user!.email.toLowerCase());
  return res.json({ orders: userOrders });
});

// Public: Get single order by ID or Order Number
ordersRouter.get('/orders/:id', (req, res) => {
  const db = getDB();
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  return res.json({ order });
});

// Public: Dedicated Order Tracking lookup
ordersRouter.post('/orders/track', (req, res) => {
  const { orderNumber, emailOrPhone } = req.body;
  if (!orderNumber || !emailOrPhone) {
    return res.status(400).json({ error: 'Order number and Email or Phone number are required.' });
  }

  const db = getDB();
  const cleanOrder = orderNumber.trim().toUpperCase();
  const cleanQuery = emailOrPhone.trim().toLowerCase();

  const order = db.orders.find(o =>
    o.orderNumber.toUpperCase() === cleanOrder &&
    (o.customer.email.toLowerCase() === cleanQuery || o.customer.phone.includes(cleanQuery))
  );

  if (!order) {
    return res.status(404).json({
      error: 'No order matched these details. Please double-check your order number and contact information.'
    });
  }

  return res.json({ order });
});
