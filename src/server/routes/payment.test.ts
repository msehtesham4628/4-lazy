import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getDB } from '../db.ts';
import {
  cancelUnconfirmedPayment,
  reconcilePendingPayments,
  verifyCashfreeWebhookSignature
} from './payment.ts';
import type { Order, PaymentTransaction } from '../../types/index.ts';

test('verifyCashfreeWebhookSignature validates genuine HMAC-SHA256 signature and rejects tampered body', () => {
  const secret = 'test_webhook_secret_key_123';
  const timestamp = '1731570000000';
  const rawBody = JSON.stringify({
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: { order: { order_id: 'cf_4l_test_1', order_amount: 1673 }, payment: { payment_status: 'SUCCESS' } }
  });
  const validSig = crypto.createHmac('sha256', secret).update(`${timestamp}${rawBody}`).digest('base64');

  assert.equal(verifyCashfreeWebhookSignature(validSig, timestamp, rawBody, secret), true);
  assert.equal(verifyCashfreeWebhookSignature(validSig, timestamp, `${rawBody} `, secret), false);
  assert.equal(verifyCashfreeWebhookSignature('tampered_sig', timestamp, rawBody, secret), false);
});

test('cancelUnconfirmedPayment marks unpaid order & transaction as Cancelled Payment while preserving already-paid orders', async () => {
  const db = getDB();

  const cfOrderId = 'cf_4l_unit_cancel_1';
  const orderId = 'ord_unit_cancel_1';
  const nowIso = new Date().toISOString();

  const unpaidOrder: Order = {
    id: orderId,
    orderNumber: '4L-2026-9901',
    userId: 'usr_cust_001',
    customer: { name: 'Aryan Verma', email: 'aryan@example.com', phone: '9811223344' },
    shippingAddress: {
      id: 'addr_test',
      fullName: 'Aryan Verma',
      phone: '9811223344',
      street: 'Road 36',
      city: 'Hyderabad',
      state: 'Telangana',
      pinCode: '500033',
      country: 'India',
      isDefault: true
    },
    items: [],
    subtotal: 1499,
    discount: 0,
    shippingFee: 99,
    tax: 75,
    total: 1673,
    payment: {
      provider: 'cashfree',
      transactionId: cfOrderId,
      status: 'pending',
      amount: 1673,
      currency: 'INR',
      cashfreeOrderId: cfOrderId,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      gatewayStatus: 'ACTIVE'
    },
    status: 'Order Placed',
    statusHistory: [{ status: 'Order Placed', timestamp: nowIso, note: 'Awaiting payment' }],
    createdAt: nowIso
  };

  const unpaidTx: PaymentTransaction = {
    id: 'tx_unit_cancel_1',
    orderId,
    orderNumber: '4L-2026-9901',
    cashfreeOrderId: cfOrderId,
    customerId: 'usr_cust_001',
    customerDetails: unpaidOrder.customer,
    amount: 1673,
    currency: 'INR',
    paymentStatus: 'PENDING',
    paymentMethod: 'Cashfree',
    environment: 'sandbox',
    transactionDate: nowIso,
    expiresAt: unpaidOrder.payment.expiresAt,
    processedWebhooks: [],
    rawGatewayStatus: 'ACTIVE'
  };

  db.orders.push(unpaidOrder);
  db.transactions.push(unpaidTx);

  const cancelRes = await cancelUnconfirmedPayment(cfOrderId, 'Unit test timer expired');
  assert.equal(cancelRes.found, true);
  assert.equal(cancelRes.cancelled, true);
  assert.equal(unpaidTx.paymentStatus, 'CANCELLED');
  assert.equal(unpaidOrder.payment.status, 'cancelled');
  assert.equal(unpaidOrder.status, 'Cancelled');
  assert.match(unpaidOrder.payment.cancellationReason || '', /timer expired/i);

  // Confirm already-paid transaction cannot be overwritten by cancellation
  const paidOrderId = 'ord_unit_paid_1';
  const paidCfOrderId = 'cf_4l_unit_paid_1';
  const paidOrder: Order = {
    ...unpaidOrder,
    id: paidOrderId,
    orderNumber: '4L-2026-9902',
    payment: { ...unpaidOrder.payment, status: 'completed', cashfreeOrderId: paidCfOrderId, gatewayStatus: 'PAID' },
    status: 'Confirmed',
    statusHistory: [{ status: 'Confirmed', timestamp: nowIso, note: 'Paid' }]
  };
  const paidTx: PaymentTransaction = {
    ...unpaidTx,
    id: 'tx_unit_paid_1',
    orderId: paidOrderId,
    orderNumber: '4L-2026-9902',
    cashfreeOrderId: paidCfOrderId,
    paymentStatus: 'SUCCESS',
    rawGatewayStatus: 'PAID'
  };
  db.orders.push(paidOrder);
  db.transactions.push(paidTx);

  const paidGuardRes = await cancelUnconfirmedPayment(paidCfOrderId, 'Should not cancel');
  assert.equal(paidGuardRes.alreadyPaid, true);
  assert.equal(paidTx.paymentStatus, 'SUCCESS');
  assert.equal(paidOrder.status, 'Confirmed');

  // Cleanup injected test records
  db.orders = db.orders.filter(o => o.id !== orderId && o.id !== paidOrderId);
  db.transactions = db.transactions.filter(t => t.orderId !== orderId && t.orderId !== paidOrderId);
});

test('reconcilePendingPayments auto-cancels expired unpaid transactions and backfills missing ledger rows', async () => {
  const db = getDB();

  const expiredCfId = 'cf_4l_unit_expired_1';
  const expiredOrderId = 'ord_unit_expired_1';
  const pastIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const expiredAtIso = new Date(Date.now() - 60 * 1000).toISOString();

  const expiredOrder: Order = {
    id: expiredOrderId,
    orderNumber: '4L-2026-9903',
    userId: 'usr_cust_001',
    customer: { name: 'Aryan Verma', email: 'aryan@example.com', phone: '9811223344' },
    shippingAddress: {
      id: 'addr_test_2',
      fullName: 'Aryan Verma',
      phone: '9811223344',
      street: 'Road 36',
      city: 'Hyderabad',
      state: 'Telangana',
      pinCode: '500033',
      country: 'India',
      isDefault: true
    },
    items: [],
    subtotal: 1499,
    discount: 0,
    shippingFee: 99,
    tax: 75,
    total: 1673,
    payment: {
      provider: 'cashfree',
      transactionId: expiredCfId,
      status: 'pending',
      amount: 1673,
      currency: 'INR',
      cashfreeOrderId: expiredCfId,
      expiresAt: expiredAtIso,
      gatewayStatus: 'ACTIVE'
    },
    status: 'Order Placed',
    statusHistory: [{ status: 'Order Placed', timestamp: pastIso }],
    createdAt: pastIso
  };

  db.orders.push(expiredOrder);

  await reconcilePendingPayments([expiredOrderId]);

  const createdTx = db.transactions.find(t => t.orderId === expiredOrderId);
  assert.ok(createdTx, 'Expected reconcilePendingPayments to backfill missing PaymentTransaction row');
  assert.equal(createdTx.paymentStatus, 'CANCELLED');
  assert.equal(expiredOrder.payment.status, 'cancelled');
  assert.equal(expiredOrder.status, 'Cancelled');

  db.orders = db.orders.filter(o => o.id !== expiredOrderId);
  db.transactions = db.transactions.filter(t => t.orderId !== expiredOrderId);
});
