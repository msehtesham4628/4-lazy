import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { getDB, saveDB } from '../db.ts';
import { optionalAuthenticate, type AuthenticatedRequest } from '../authMiddleware.ts';
import { sendOrderConfirmationEmail } from '../emailService.ts';
import type {
  Order,
  OrderItem,
  InventoryTransaction,
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentMethod
} from '../../types/index.ts';

export const paymentRouter = Router();

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2025-01-01';

export function getCashfreeServerConfig() {
  const db = getDB();
  const appId = (process.env.CASHFREE_APP_ID || '').trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
  const rawEnv = (process.env.CASHFREE_ENV || db.settings.cashfreeEnvironment || 'sandbox').toLowerCase();
  const environment: 'sandbox' | 'production' = rawEnv === 'production' ? 'production' : 'sandbox';
  const apiBase =
    environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

  return {
    appId,
    secretKey,
    environment,
    apiBase,
    apiVersion: CASHFREE_API_VERSION,
    configured: Boolean(appId && secretKey)
  };
}

function resolvePublicBaseUrl(req: Request): string {
  const configured = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;

  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const proto = process.env.NODE_ENV === 'production' ? 'https' : (forwardedProto || req.protocol || 'http');
  const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function evaluateCoupon(code: string, subtotal: number) {
  const db = getDB();
  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  if (!coupon) return { valid: false, message: 'Invalid or inactive coupon code.' };

  if (coupon.expiresAt && Date.now() > new Date(coupon.expiresAt).getTime()) {
    return { valid: false, message: 'Coupon code has expired.' };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached.' };
  }
  if (subtotal < coupon.minOrderValue) {
    return { valid: false, message: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString()} required.` };
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

  discount = Math.min(subtotal, Math.round(discount));
  return { valid: true, coupon, discount };
}

export function extractCashfreeMethodInfo(paymentMethodObj: any): {
  label: string;
  provider: PaymentMethod;
  details: Record<string, any>;
} {
  if (!paymentMethodObj || typeof paymentMethodObj !== 'object') {
    return { label: 'Cashfree', provider: 'cashfree', details: {} };
  }

  if (paymentMethodObj.upi) {
    return {
      label: 'UPI',
      provider: 'upi',
      details: paymentMethodObj.upi
    };
  }
  if (paymentMethodObj.card) {
    const cardType = String(paymentMethodObj.card.card_type || '').toLowerCase();
    const label = cardType.includes('debit') ? 'Debit Card' : cardType.includes('credit') ? 'Credit Card' : 'Card';
    return {
      label,
      provider: 'card',
      details: paymentMethodObj.card
    };
  }
  if (paymentMethodObj.netbanking) {
    return {
      label: 'Net Banking',
      provider: 'netbanking',
      details: paymentMethodObj.netbanking
    };
  }
  if (paymentMethodObj.app) {
    return {
      label: 'Wallet',
      provider: 'wallet',
      details: paymentMethodObj.app
    };
  }
  if (paymentMethodObj.emi || paymentMethodObj.cardless_emi) {
    return {
      label: 'EMI',
      provider: 'emi',
      details: paymentMethodObj.emi || paymentMethodObj.cardless_emi
    };
  }
  if (paymentMethodObj.paylater) {
    return {
      label: 'Pay Later',
      provider: 'paylater',
      details: paymentMethodObj.paylater
    };
  }

  const firstKey = Object.keys(paymentMethodObj)[0] || 'cashfree';
  return {
    label: firstKey.toUpperCase(),
    provider: 'cashfree',
    details: paymentMethodObj
  };
}

function finalizePaidOrderIdempotently(order: Order, tx: PaymentTransaction, note: string) {
  const db = getDB();
  const alreadyCompleted = order.payment.status === 'completed';

  order.payment.status = 'completed';
  order.payment.paidAt = order.payment.paidAt || new Date().toISOString();
  order.payment.transactionDate = tx.transactionDate;
  order.payment.cashfreePaymentId = tx.cashfreePaymentId;
  order.payment.transactionId = tx.cashfreePaymentId || order.payment.transactionId;
  order.payment.paymentMethodDetail = tx.paymentMethod;
  order.payment.gatewayStatus = 'PAID';

  if (order.status === 'Order Placed' || order.status === 'Cancelled') {
    order.status = 'Confirmed';
  }

  const alreadyRecordedHistory = order.statusHistory.some(
    h => h.status === 'Confirmed' && h.note && tx.cashfreePaymentId && h.note.includes(tx.cashfreePaymentId)
  );
  if (!alreadyRecordedHistory) {
    order.statusHistory.push({
      status: 'Confirmed',
      timestamp: new Date().toISOString(),
      note
    });
  }

  if (!alreadyCompleted) {
    // Decrement inventory once on verified payment
    const reasonTag = `Order #${order.orderNumber} fulfillment`;
    const stockAlreadyDeducted = db.inventoryTransactions.some(it => it.reason === reasonTag);
    if (!stockAlreadyDeducted) {
      for (const item of order.items) {
        if (item.productId === 'custom-print-tee' || item.customPrint) continue;
        const product = db.products.find(p => p.id === item.productId);
        if (product) {
          const variant = product.variants.find(
            v => v.id === item.variantId || v.sku === item.sku
          );
          if (variant) {
            const prevStock = variant.stock;
            variant.stock = Math.max(0, prevStock - item.quantity);
            const invTx: InventoryTransaction = {
              id: `inv_tx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              productId: product.id,
              productTitle: product.title,
              variantSku: variant.sku,
              colorName: variant.colorName,
              size: variant.size,
              change: -item.quantity,
              previousStock: prevStock,
              newStock: variant.stock,
              reason: reasonTag,
              timestamp: new Date().toISOString()
            };
            db.inventoryTransactions.unshift(invTx);
          }
        }
      }
    }

    try {
      sendOrderConfirmationEmail(order);
    } catch (e) {
      console.error('Failed to send Cashfree order confirmation email:', e);
    }
  }
}

export async function verifyAndSyncCashfreeOrder(orderIdOrCfId: string): Promise<{
  found: boolean;
  statusCode?: number;
  error?: string;
  order?: Order;
  transaction?: PaymentTransaction;
}> {
  const db = getDB();
  const tx = db.transactions.find(
    t =>
      t.cashfreeOrderId === orderIdOrCfId ||
      t.orderId === orderIdOrCfId ||
      t.orderNumber === orderIdOrCfId
  );
  const order = db.orders.find(
    o =>
      o.payment.cashfreeOrderId === orderIdOrCfId ||
      o.id === orderIdOrCfId ||
      o.orderNumber === orderIdOrCfId ||
      (tx && o.id === tx.orderId)
  );

  if (!order && !tx) {
    return { found: false, statusCode: 404, error: 'Order or payment transaction not found.' };
  }

  const cfOrderId = tx?.cashfreeOrderId || order?.payment.cashfreeOrderId;
  if (!cfOrderId) {
    return { found: false, statusCode: 400, error: 'No Cashfree order ID associated with this order.' };
  }

  const cfg = getCashfreeServerConfig();
  if (!cfg.configured) {
    return {
      found: true,
      statusCode: 503,
      error: 'Cashfree API credentials (CASHFREE_APP_ID, CASHFREE_SECRET_KEY) are not configured on the server.',
      order,
      transaction: tx
    };
  }

  const headers = {
    'x-client-id': cfg.appId,
    'x-client-secret': cfg.secretKey,
    'x-api-version': cfg.apiVersion
  };

  const [orderRes, paymentsRes] = await Promise.all([
    fetch(`${cfg.apiBase}/orders/${encodeURIComponent(cfOrderId)}`, { headers }),
    fetch(`${cfg.apiBase}/orders/${encodeURIComponent(cfOrderId)}/payments`, { headers })
  ]);

  const cfOrderData: any = await orderRes.json().catch(() => ({}));
  const cfPaymentsData: any = await paymentsRes.json().catch(() => []);

  if (!orderRes.ok) {
    return {
      found: true,
      statusCode: orderRes.status,
      error: cfOrderData?.message || 'Unable to fetch order status from Cashfree.',
      order,
      transaction: tx
    };
  }

  const paymentsList: any[] = Array.isArray(cfPaymentsData) ? cfPaymentsData : [];
  const successPayment = paymentsList.find(p => p.payment_status === 'SUCCESS');
  const latestPayment = successPayment || paymentsList[0] || null;

  const targetTx: PaymentTransaction = tx || {
    id: `tx_${Date.now()}`,
    orderId: order!.id,
    orderNumber: order!.orderNumber,
    cashfreeOrderId: cfOrderId,
    customerId: order!.userId || `cust_${order!.customer.phone.replace(/\D/g, '').slice(-10) || 'guest'}`,
    customerDetails: order!.customer,
    amount: order!.total,
    currency: order!.payment.currency || 'INR',
    paymentStatus: 'PENDING',
    paymentMethod: 'Cashfree',
    environment: cfg.environment,
    transactionDate: order!.createdAt,
    processedWebhooks: []
  };

  if (!tx) {
    db.transactions.unshift(targetTx);
  }

  const gatewayOrderStatus = String(cfOrderData.order_status || '').toUpperCase();
  const gatewayPaymentStatus = String(latestPayment?.payment_status || '').toUpperCase();

  if (latestPayment) {
    const methodInfo = extractCashfreeMethodInfo(latestPayment.payment_method);
    targetTx.cashfreePaymentId = String(latestPayment.cf_payment_id || targetTx.cashfreePaymentId || '');
    targetTx.paymentMethod = methodInfo.label;
    targetTx.paymentMethodDetails = methodInfo.details;
    targetTx.transactionDate = latestPayment.payment_completion_time || latestPayment.payment_time || targetTx.transactionDate;
    if (order) {
      order.payment.provider = methodInfo.provider;
      order.payment.paymentMethodDetail = methodInfo.label;
      order.payment.cashfreePaymentId = targetTx.cashfreePaymentId;
      order.payment.transactionDate = targetTx.transactionDate;
    }
  }

  targetTx.rawGatewayStatus = gatewayPaymentStatus || gatewayOrderStatus;
  targetTx.updatedAt = new Date().toISOString();

  // Validate payment amount against stored order total
  const expectedAmount = order ? Number(order.total) : Number(targetTx.amount);
  const paidAmount = latestPayment?.payment_amount !== undefined
    ? Number(latestPayment.payment_amount)
    : Number(cfOrderData.order_amount || expectedAmount);

  if (gatewayOrderStatus === 'PAID' || gatewayPaymentStatus === 'SUCCESS') {
    if (Math.abs(paidAmount - expectedAmount) > 1.0) {
      targetTx.paymentStatus = 'FAILED';
      targetTx.errorMessage = `Payment amount mismatch: expected ₹${expectedAmount}, received ₹${paidAmount}`;
      if (order) {
        order.payment.status = 'failed';
        order.payment.gatewayStatus = 'AMOUNT_MISMATCH';
      }
      saveDB();
      return {
        found: true,
        statusCode: 400,
        error: targetTx.errorMessage,
        order,
        transaction: targetTx
      };
    }

    targetTx.paymentStatus = 'SUCCESS';
    targetTx.errorMessage = undefined;
    if (order) {
      finalizePaidOrderIdempotently(
        order,
        targetTx,
        `Cashfree payment verified (${targetTx.paymentMethod}). Cashfree Payment ID: ${targetTx.cashfreePaymentId || cfOrderId}`
      );
    }
  } else if (
    gatewayPaymentStatus === 'FAILED' ||
    gatewayPaymentStatus === 'CANCELLED' ||
    gatewayPaymentStatus === 'USER_DROPPED' ||
    gatewayOrderStatus === 'EXPIRED' ||
    gatewayOrderStatus === 'TERMINATED'
  ) {
    const mappedStatus: PaymentTransactionStatus =
      gatewayPaymentStatus === 'USER_DROPPED'
        ? 'USER_DROPPED'
        : gatewayPaymentStatus === 'CANCELLED'
        ? 'CANCELLED'
        : 'FAILED';

    targetTx.paymentStatus = mappedStatus;
    targetTx.errorMessage = latestPayment?.payment_message || `Payment ${mappedStatus.toLowerCase().replace('_', ' ')} at gateway.`;
    if (order && order.payment.status !== 'completed') {
      order.payment.status = mappedStatus === 'CANCELLED' ? 'cancelled' : 'failed';
      order.payment.gatewayStatus = targetTx.rawGatewayStatus;
      order.status = 'Cancelled';
      const hasFailHistory = order.statusHistory.some(h => h.status === 'Cancelled');
      if (!hasFailHistory) {
        order.statusHistory.push({
          status: 'Cancelled',
          timestamp: new Date().toISOString(),
          note: targetTx.errorMessage
        });
      }
    }
  } else {
    targetTx.paymentStatus = 'PENDING';
    if (order && order.payment.status !== 'completed') {
      order.payment.gatewayStatus = gatewayOrderStatus || 'ACTIVE';
    }
  }

  saveDB();
  return { found: true, order, transaction: targetTx };
}

// Public: Cashfree public config (NEVER returns secret key)
paymentRouter.get('/config', (_req: Request, res: Response) => {
  const cfg = getCashfreeServerConfig();
  const db = getDB();
  return res.json({
    environment: cfg.environment,
    configured: cfg.configured,
    currency: db.settings.currency || 'INR',
    codEnabled: db.settings.codEnabled !== false,
    supportedMethods: [
      'UPI',
      'Credit Cards',
      'Debit Cards',
      'Net Banking',
      'Wallets',
      'EMI',
      'Pay Later'
    ]
  });
});

// POST /api/payment/create-order
paymentRouter.post('/create-order', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      couponCode,
      deliveryMethod = 'standard',
      amount: clientAmount
    } = req.body || {};

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: 'Customer name, email, and phone are required.' });
    }
    if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.pinCode || !shippingAddress?.state) {
      return res.status(400).json({ error: 'Complete shipping address is required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    const cfg = getCashfreeServerConfig();
    if (!cfg.configured) {
      return res.status(503).json({
        error: 'Cashfree gateway is not configured on the server. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.'
      });
    }

    const db = getDB();
    const verifiedOrderItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      if (item.productId === 'custom-print-tee' || item.customPrint) {
        const unitPrice = Math.max(999, Number(item.price) || 1999);
        calculatedSubtotal += unitPrice * qty;
        verifiedOrderItems.push({
          productId: item.productId || 'custom-print-tee',
          variantId: item.variantId || `var_custom_${Date.now()}`,
          productTitle: item.productTitle || 'Custom 3D Studio T-Shirt',
          colorName: item.colorName || 'Pure White',
          size: item.size || 'L',
          sku: item.sku || '4L-CUSTOM-TEE',
          price: unitPrice,
          quantity: qty,
          image: item.image || '/assets/images/tshirt_custom_print_1794456303137.jpg',
          customPrint: item.customPrint
        });
        continue;
      }

      const product = db.products.find(p => p.id === item.productId);
      if (!product || !product.isPublished) {
        return res.status(400).json({ error: `Product "${item.productTitle || item.productId}" is not available.` });
      }
      const variant = product.variants.find(
        v => v.id === item.variantId || (v.size === item.size && v.colorName === item.colorName)
      );
      if (!variant) {
        return res.status(400).json({ error: `Variant for "${product.title}" is unavailable.` });
      }
      if (variant.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.title} (${variant.colorName} / ${variant.size}). Only ${variant.stock} remaining.`
        });
      }

      const price = product.discountPrice || product.basePrice;
      calculatedSubtotal += price * qty;

      verifiedOrderItems.push({
        productId: product.id,
        variantId: variant.id,
        productTitle: product.title,
        colorName: variant.colorName,
        size: variant.size,
        sku: variant.sku,
        price,
        quantity: qty,
        image: variant.images[0] || product.colorGroups[0]?.images[0] || ''
      });
    }

    let discountAmount = 0;
    if (couponCode) {
      const couponEval = evaluateCoupon(couponCode, calculatedSubtotal);
      if (couponEval.valid) {
        discountAmount = couponEval.discount || 0;
      }
    }

    const settings = db.settings;
    const shippingFee =
      deliveryMethod === 'express'
        ? settings.expressShippingFee || 199
        : calculatedSubtotal >= settings.freeShippingThreshold
        ? 0
        : settings.standardShippingFee || 99;

    const taxableAmount = Math.max(0, calculatedSubtotal - discountAmount);
    const tax = Math.round((taxableAmount * (settings.taxRatePercent || 5)) / 100);
    const serverTotal = Number((taxableAmount + shippingFee + tax).toFixed(2));

    if (clientAmount !== undefined && Math.abs(Number(clientAmount) - serverTotal) > 1.5) {
      return res.status(400).json({
        error: `Order amount validation failed. Server calculated ₹${serverTotal}, received ₹${clientAmount}.`
      });
    }

    const cleanPhone = String(customer.phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required for Cashfree.' });
    }

    const orderNumber = `4L-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const internalOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cashfreeOrderId = `cf_4l_${Date.now()}_${Math.floor(1000 + Math.random() * 8999)}`;
    const customerId = req.user?.id || `cust_${cleanPhone}`;
    const currency = settings.currency || 'INR';
    const baseUrl = resolvePublicBaseUrl(req);

    const cfPayload = {
      order_id: cashfreeOrderId,
      order_amount: serverTotal,
      order_currency: currency,
      customer_details: {
        customer_id: customerId,
        customer_name: customer.name.trim(),
        customer_email: customer.email.toLowerCase().trim(),
        customer_phone: cleanPhone
      },
      order_meta: {
        return_url: `${baseUrl}/payment-status?order_id={order_id}`,
        notify_url: `${baseUrl}/api/payment/webhook`
      },
      order_note: `4LAAZY Order #${orderNumber}`
    };

    const cfRes = await fetch(`${cfg.apiBase}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cfg.appId,
        'x-client-secret': cfg.secretKey,
        'x-api-version': cfg.apiVersion
      },
      body: JSON.stringify(cfPayload)
    });

    const cfData: any = await cfRes.json().catch(() => ({}));
    if (!cfRes.ok || !cfData.payment_session_id) {
      return res.status(cfRes.status >= 400 ? cfRes.status : 502).json({
        error: cfData?.message || 'Cashfree rejected order creation. Please verify your Cashfree API keys and environment.'
      });
    }

    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: internalOrderId,
      orderNumber,
      userId: req.user?.id,
      customer: {
        name: customer.name.trim(),
        email: customer.email.toLowerCase().trim(),
        phone: cleanPhone
      },
      shippingAddress: {
        id: `addr_${Date.now()}`,
        fullName: shippingAddress.fullName || customer.name.trim(),
        phone: shippingAddress.phone || cleanPhone,
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
      total: serverTotal,
      payment: {
        provider: 'cashfree',
        transactionId: cfData.cf_order_id ? String(cfData.cf_order_id) : cashfreeOrderId,
        status: 'pending',
        amount: serverTotal,
        currency,
        cashfreeOrderId: cfData.order_id || cashfreeOrderId,
        paymentSessionId: cfData.payment_session_id,
        transactionDate: nowIso,
        gatewayStatus: cfData.order_status || 'ACTIVE'
      },
      status: 'Order Placed',
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: nowIso,
          note: `Awaiting Cashfree payment settlement (Order ID: ${cfData.order_id || cashfreeOrderId}).`
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
        statusNotes: 'Pending payment verification'
      },
      createdAt: nowIso
    };

    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      cashfreeOrderId: cfData.order_id || cashfreeOrderId,
      paymentSessionId: cfData.payment_session_id,
      customerId,
      customerDetails: newOrder.customer,
      amount: serverTotal,
      currency,
      paymentStatus: 'PENDING',
      paymentMethod: 'Cashfree',
      environment: cfg.environment,
      transactionDate: nowIso,
      updatedAt: nowIso,
      processedWebhooks: [],
      rawGatewayStatus: cfData.order_status || 'ACTIVE'
    };

    db.orders.unshift(newOrder);
    db.transactions.unshift(newTx);
    saveDB();

    const checkoutBase =
      cfg.environment === 'production'
        ? 'https://payments.cashfree.com/order/#'
        : 'https://payments-test.cashfree.com/order/#';

    return res.status(201).json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      cashfreeOrderId: newTx.cashfreeOrderId,
      paymentSessionId: cfData.payment_session_id,
      checkoutUrl: cfData.payment_link || `${checkoutBase}${cfData.payment_session_id}`,
      environment: cfg.environment,
      amount: serverTotal,
      currency
    });
  } catch (err: any) {
    console.error('Cashfree create-order error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error creating Cashfree payment order.' });
  }
});

// GET /api/payment/order/:orderId
paymentRouter.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const orderIdParam = String(req.params.orderId || '');
    const result = await verifyAndSyncCashfreeOrder(orderIdParam);

    if (!result.found) {
      return res.status(result.statusCode || 404).json({ error: result.error });
    }
    if (result.statusCode && result.statusCode >= 400 && !result.transaction) {
      return res.status(result.statusCode).json({ error: result.error });
    }

    return res.json({
      success: result.transaction?.paymentStatus === 'SUCCESS',
      orderId: result.order?.id || result.transaction?.orderId,
      orderNumber: result.order?.orderNumber || result.transaction?.orderNumber,
      cashfreeOrderId: result.transaction?.cashfreeOrderId,
      cashfreePaymentId: result.transaction?.cashfreePaymentId,
      paymentStatus: result.transaction?.paymentStatus || 'PENDING',
      orderStatus: result.order?.status || 'Order Placed',
      amount: result.transaction?.amount ?? result.order?.total,
      currency: result.transaction?.currency || 'INR',
      paymentMethod: result.transaction?.paymentMethod || 'Cashfree',
      transactionDate: result.transaction?.transactionDate,
      errorMessage: result.error || result.transaction?.errorMessage,
      order: result.order,
      transaction: result.transaction
    });
  } catch (err: any) {
    console.error('Cashfree order status check error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to verify payment status with Cashfree.' });
  }
});

// POST /api/payment/webhook
paymentRouter.post('/webhook', (req: Request & { rawBody?: string }, res: Response) => {
  try {
    const cfg = getCashfreeServerConfig();
    if (!cfg.secretKey) {
      return res.status(503).json({ error: 'Cashfree secret key not configured.' });
    }

    const signature = String(req.headers['x-webhook-signature'] || '');
    const timestamp = String(req.headers['x-webhook-timestamp'] || '');
    const rawBody = req.rawBody;

    if (!signature || !timestamp || !rawBody) {
      return res.status(400).json({ error: 'Missing Cashfree webhook signature headers or raw body.' });
    }

    const signedPayload = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', cfg.secretKey)
      .update(signedPayload)
      .digest('base64');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn('Cashfree webhook signature verification failed.');
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body || {};
    const eventType = String(event.type || 'PAYMENT_WEBHOOK');
    const cfOrder = event.data?.order || {};
    const cfPayment = event.data?.payment || {};
    const cfOrderId = String(cfOrder.order_id || '');
    const cfPaymentId = String(cfPayment.cf_payment_id || '');
    const paymentStatus = String(cfPayment.payment_status || '').toUpperCase();

    if (!cfOrderId) {
      return res.status(400).json({ error: 'Missing order_id in webhook payload.' });
    }

    const db = getDB();
    db.processedWebhookKeys = db.processedWebhookKeys || [];

    const idempotencyKey = `${eventType}:${cfOrderId}:${cfPaymentId}:${paymentStatus}`;
    if (db.processedWebhookKeys.includes(idempotencyKey)) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const tx = db.transactions.find(t => t.cashfreeOrderId === cfOrderId);
    const order = db.orders.find(
      o => o.payment.cashfreeOrderId === cfOrderId || (tx && o.id === tx.orderId)
    );

    if (!order && !tx) {
      return res.status(404).json({ error: 'Order not found for webhook.' });
    }

    if (tx?.processedWebhooks?.includes(idempotencyKey)) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const expectedAmount = order ? Number(order.total) : Number(tx!.amount);
    const webhookAmount = Number(cfPayment.payment_amount ?? cfOrder.order_amount ?? expectedAmount);

    if (paymentStatus === 'SUCCESS' && Math.abs(webhookAmount - expectedAmount) > 1.0) {
      if (tx) {
        tx.paymentStatus = 'FAILED';
        tx.errorMessage = `Webhook amount mismatch: expected ₹${expectedAmount}, received ₹${webhookAmount}`;
      }
      saveDB();
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    const methodInfo = extractCashfreeMethodInfo(cfPayment.payment_method);
    const nowIso = new Date().toISOString();

    const targetTx = tx!;
    if (targetTx) {
      targetTx.cashfreePaymentId = cfPaymentId || targetTx.cashfreePaymentId;
      targetTx.paymentMethod = methodInfo.label;
      targetTx.paymentMethodDetails = methodInfo.details;
      targetTx.transactionDate = cfPayment.payment_time || targetTx.transactionDate || nowIso;
      targetTx.updatedAt = nowIso;
      targetTx.rawGatewayStatus = paymentStatus || eventType;
      targetTx.processedWebhooks = [...(targetTx.processedWebhooks || []), idempotencyKey];
    }

    if (paymentStatus === 'SUCCESS' || eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      if (targetTx) {
        targetTx.paymentStatus = 'SUCCESS';
        targetTx.errorMessage = undefined;
      }
      if (order) {
        order.payment.provider = methodInfo.provider;
        if (targetTx) {
          finalizePaidOrderIdempotently(
            order,
            targetTx,
            `Cashfree webhook verified (${methodInfo.label}). Payment ID: ${cfPaymentId || cfOrderId}`
          );
        }
      }
    } else if (
      paymentStatus === 'FAILED' ||
      paymentStatus === 'USER_DROPPED' ||
      paymentStatus === 'CANCELLED' ||
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK'
    ) {
      const mapped: PaymentTransactionStatus =
        paymentStatus === 'USER_DROPPED' || eventType === 'PAYMENT_USER_DROPPED_WEBHOOK'
          ? 'USER_DROPPED'
          : paymentStatus === 'CANCELLED'
          ? 'CANCELLED'
          : 'FAILED';

      if (targetTx && targetTx.paymentStatus !== 'SUCCESS') {
        targetTx.paymentStatus = mapped;
        targetTx.errorMessage = cfPayment.payment_message || `Gateway reported ${mapped}`;
      }
      if (order && order.payment.status !== 'completed') {
        order.payment.status = mapped === 'CANCELLED' ? 'cancelled' : 'failed';
        order.payment.gatewayStatus = mapped;
        order.status = 'Cancelled';
        order.statusHistory.push({
          status: 'Cancelled',
          timestamp: nowIso,
          note: `Cashfree webhook: Payment ${mapped} (${cfPaymentId || cfOrderId}).`
        });
      }
    }

    db.processedWebhookKeys.push(idempotencyKey);
    if (db.processedWebhookKeys.length > 500) {
      db.processedWebhookKeys = db.processedWebhookKeys.slice(-500);
    }

    saveDB();
    return res.status(200).json({ received: true, status: targetTx?.paymentStatus || paymentStatus });
  } catch (err: any) {
    console.error('Cashfree webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
});
