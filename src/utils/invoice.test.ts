import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInvoiceData,
  formatInrAmount,
  numberToIndianRupeesWords,
  renderInvoiceHtml
} from './invoice.ts';
import type { Order } from '../types/index.ts';

function createSampleOrder(state: string): Order {
  return {
    id: 'ord_inv_001',
    orderNumber: '4L-2026-8842',
    userId: 'usr_cust_001',
    customer: {
      name: 'Aryan Verma',
      email: 'aryan@example.com',
      phone: '+919811223344'
    },
    shippingAddress: {
      id: 'addr_001',
      fullName: 'Aryan Verma',
      phone: '+919811223344',
      street: 'Road No. 36, Jubilee Hills',
      city: state === 'Telangana' ? 'Hyderabad' : 'Mumbai',
      state,
      pinCode: state === 'Telangana' ? '500033' : '400001',
      country: 'India',
      isDefault: true
    },
    items: [
      {
        productId: 'prod_1',
        variantId: 'var_1',
        productTitle: 'Signature Heavy Combed Round Neck Tee',
        colorName: 'Obsidian Black',
        size: 'L',
        sku: '4L-RN-BLK-L',
        price: 1499,
        quantity: 2,
        image: '/assets/images/tshirt_round_neck_1794456303307.jpg'
      }
    ],
    subtotal: 2998,
    discount: 500,
    shippingFee: 0,
    tax: 125,
    total: 2623,
    payment: {
      provider: 'upi',
      transactionId: 'cf_pay_998877',
      cashfreePaymentId: 'cf_pay_998877',
      status: 'completed',
      paidAt: '2026-11-18T10:00:00.000Z',
      amount: 2623,
      currency: 'INR',
      paymentMethodDetail: 'UPI',
      gatewayStatus: 'PAID'
    },
    status: 'Confirmed',
    statusHistory: [{ status: 'Confirmed', timestamp: '2026-11-18T10:00:00.000Z' }],
    tracking: {
      courierCompany: 'Blue Dart Express',
      trackingNumber: '4L-TRACK-123456789',
      trackingUrl: '#'
    },
    createdAt: '2026-11-18T10:00:00.000Z'
  };
}

test('buildInvoiceData computes intra-state CGST + SGST for Telangana buyers', () => {
  const order = createSampleOrder('Telangana');
  const inv = buildInvoiceData(order);

  assert.equal(inv.invoiceNumber, 'INV-4L-2026-8842');
  assert.equal(inv.isIntraState, true);
  assert.equal(inv.cgstRate, 2.5);
  assert.equal(inv.sgstRate, 2.5);
  assert.equal(inv.igstRate, 0);
  assert.equal(inv.cgstAmount + inv.sgstAmount, 125);
  assert.equal(inv.igstAmount, 0);
  assert.equal(inv.items[0].hsnCode, '6109');
  assert.equal(inv.grandTotal, 2623);
  assert.equal(inv.amountInWords, 'Rupees Two Thousand Six Hundred Twenty Three Only');
});

test('buildInvoiceData computes inter-state IGST for non-Telangana buyers', () => {
  const order = createSampleOrder('Maharashtra');
  const inv = buildInvoiceData(order);

  assert.equal(inv.isIntraState, false);
  assert.equal(inv.cgstAmount, 0);
  assert.equal(inv.sgstAmount, 0);
  assert.equal(inv.igstRate, 5);
  assert.equal(inv.igstAmount, 125);
  assert.equal(inv.placeOfSupply, 'Maharashtra');
});

test('numberToIndianRupeesWords formats Indian numbering accurately', () => {
  assert.equal(numberToIndianRupeesWords(0), 'Rupees Zero Only');
  assert.equal(numberToIndianRupeesWords(1499), 'Rupees One Thousand Four Hundred Ninety Nine Only');
  assert.equal(numberToIndianRupeesWords(125000), 'Rupees One Lakh Twenty Five Thousand Only');
});

test('renderInvoiceHtml escapes untrusted input and renders complete GST Tax Invoice HTML', () => {
  const order = createSampleOrder('Telangana');
  order.customer.name = 'Aryan <script>alert(1)</script>';
  order.shippingAddress.fullName = 'Aryan <script>alert(1)</script>';

  const inv = buildInvoiceData(order);
  const html = renderInvoiceHtml(inv);

  assert.match(html, /GST TAX INVOICE/);
  assert.match(html, /INV-4L-2026-8842/);
  assert.match(html, /CGST \(2\.5%\)/);
  assert.match(html, /SGST \(2\.5%\)/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('formatInrAmount formats fractional amounts to 2 decimals and whole amounts cleanly', () => {
  assert.equal(formatInrAmount(5352.9), '5,352.90');
  assert.equal(formatInrAmount(127.45), '127.45');
  assert.equal(formatInrAmount(1499), '1,499');
  assert.equal(formatInrAmount(125000), '1,25,000');
});
