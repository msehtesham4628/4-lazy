import type { Order, StoreSettings } from '../types/index.ts';
import { getPaymentBadgeMeta } from './paymentTimer.ts';

export interface InvoiceLineItem {
  index: number;
  title: string;
  sku: string;
  variantLabel: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customNote?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderId: string;
  issueDateIso: string;
  issueDateFormatted: string;
  currency: string;
  seller: {
    brandName: string;
    legalName: string;
    tagline: string;
    gstin: string;
    addressLine1: string;
    addressLine2: string;
    state: string;
    stateCode: string;
    email: string;
    phone: string;
  };
  buyer: {
    name: string;
    email: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  placeOfSupply: string;
  isIntraState: boolean;
  taxRatePercent: number;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxableValue: number;
  shippingFee: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  amountInWords: string;
  payment: {
    statusLabel: string;
    statusTone: 'success' | 'pending' | 'cancelled' | 'failed' | 'refunded';
    methodLabel: string;
    transactionRef: string;
    paidAtFormatted?: string;
  };
  shipping: {
    courierCompany: string;
    trackingNumber: string;
    estimatedDeliveryDate?: string;
    orderStatus: string;
  };
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

function threeDigitWords(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (!h) return twoDigitWords(rem);
  return rem ? `${ONES[h]} Hundred ${twoDigitWords(rem)}` : `${ONES[h]} Hundred`;
}

/**
 * Converts a non-negative INR amount into Indian numbering words (Crore / Lakh / Thousand).
 */
export function numberToIndianRupeesWords(amount: number): string {
  const rounded = Math.max(0, Math.round(Number(amount) || 0));
  if (rounded === 0) return 'Rupees Zero Only';

  const parts: string[] = [];
  let n = rounded;

  const crore = Math.floor(n / 10000000);
  if (crore > 0) {
    parts.push(`${threeDigitWords(crore)} Crore`);
    n %= 10000000;
  }

  const lakh = Math.floor(n / 100000);
  if (lakh > 0) {
    parts.push(`${twoDigitWords(lakh)} Lakh`);
    n %= 100000;
  }

  const thousand = Math.floor(n / 1000);
  if (thousand > 0) {
    parts.push(`${twoDigitWords(thousand)} Thousand`);
    n %= 1000;
  }

  if (n > 0) {
    parts.push(threeDigitWords(n));
  }

  return `Rupees ${parts.join(' ').trim()} Only`;
}

export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatInrAmount(amount: number): string {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100;
  return rounded.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

export function formatInvoiceDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function buildInvoiceData(order: Order, settings?: Partial<StoreSettings>): InvoiceData {
  const buyerState = (order.shippingAddress?.state || 'Telangana').trim();
  const isIntraState = buyerState.toLowerCase() === 'telangana';
  const taxRatePercent = Number(settings?.taxRatePercent) || 5;
  const totalTax = Math.max(0, Number(order.tax) || 0);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isIntraState) {
    cgstAmount = Math.floor((totalTax / 2) * 100) / 100;
    sgstAmount = Number((totalTax - cgstAmount).toFixed(2));
  } else {
    igstAmount = totalTax;
  }

  const payMeta = getPaymentBadgeMeta(order.payment.status, order.payment.gatewayStatus);
  const methodLabel = (order.payment.paymentMethodDetail || order.payment.provider || 'CASHFREE').toUpperCase();
  const txRef = order.payment.cashfreePaymentId || order.payment.transactionId || order.payment.cashfreeOrderId || 'Pending';

  const items: InvoiceLineItem[] = (order.items || []).map((it, idx) => ({
    index: idx + 1,
    title: it.productTitle,
    sku: it.sku || '4L-TEE',
    variantLabel: `${it.colorName} / ${it.size}`,
    hsnCode: '6109',
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.price) || 0,
    lineTotal: (Number(it.price) || 0) * (Number(it.quantity) || 1),
    customNote: it.customPrint
      ? it.customPrint.customText
        ? `Custom Print: "${it.customPrint.customText}" (${it.customPrint.placement})`
        : `Custom Print (${it.customPrint.printTechnique})`
      : undefined
  }));

  const taxableValue = Math.max(0, (Number(order.subtotal) || 0) - (Number(order.discount) || 0));

  return {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    orderId: order.id,
    issueDateIso: order.createdAt,
    issueDateFormatted: formatInvoiceDate(order.createdAt),
    currency: order.payment.currency || settings?.currency || 'INR',
    seller: {
      brandName: settings?.brandName || '4LAAZY',
      legalName: '4LAAZY Luxury Streetwear Pvt. Ltd.',
      tagline: settings?.tagline || 'LESS EFFORT. MORE STYLE.',
      gstin: '36AABCL4921E1Z8',
      addressLine1: 'Road No. 36, Jubilee Hills',
      addressLine2: 'Hyderabad, Telangana - 500033, India',
      state: 'Telangana',
      stateCode: '36',
      email: settings?.contactEmail || 'concierge@4lazyfashion.com',
      phone: settings?.contactPhone || '+91 40 4892 4000'
    },
    buyer: {
      name: order.shippingAddress?.fullName || order.customer.name,
      email: order.customer.email,
      phone: order.shippingAddress?.phone || order.customer.phone,
      street: order.shippingAddress?.street || '',
      apartment: order.shippingAddress?.apartment || '',
      city: order.shippingAddress?.city || '',
      state: buyerState,
      pinCode: order.shippingAddress?.pinCode || '',
      country: order.shippingAddress?.country || 'India'
    },
    placeOfSupply: buyerState,
    isIntraState,
    taxRatePercent,
    items,
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    taxableValue,
    shippingFee: Number(order.shippingFee) || 0,
    cgstRate: isIntraState ? taxRatePercent / 2 : 0,
    sgstRate: isIntraState ? taxRatePercent / 2 : 0,
    igstRate: isIntraState ? 0 : taxRatePercent,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    grandTotal: Number(order.total) || 0,
    amountInWords: numberToIndianRupeesWords(order.total),
    payment: {
      statusLabel: payMeta.label,
      statusTone: payMeta.tone,
      methodLabel,
      transactionRef: txRef,
      paidAtFormatted: order.payment.paidAt ? formatInvoiceDate(order.payment.paidAt) : undefined
    },
    shipping: {
      courierCompany: order.tracking?.courierCompany || 'Blue Dart Express',
      trackingNumber: order.tracking?.trackingNumber || 'Pending Generation',
      estimatedDeliveryDate: order.tracking?.estimatedDeliveryDate,
      orderStatus: order.status
    }
  };
}

/**
 * Generates a self-contained, email-safe & print-ready GST Tax Invoice HTML document.
 */
export function renderInvoiceHtml(invoice: InvoiceData): string {
  const statusColor =
    invoice.payment.statusTone === 'success'
      ? { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' }
      : invoice.payment.statusTone === 'pending'
      ? { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
      : invoice.payment.statusTone === 'refunded'
      ? { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
      : { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };

  const rowsHtml = invoice.items
    .map(
      item => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#111827;">
            <strong>${escapeHtml(item.title)}</strong>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${escapeHtml(item.variantLabel)} · SKU: ${escapeHtml(item.sku)}</div>
            ${item.customNote ? `<div style="font-size:10px;color:#b45309;margin-top:2px;">${escapeHtml(item.customNote)}</div>` : ''}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;font-family:monospace;color:#4b5563;text-align:center;">${escapeHtml(item.hsnCode)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;font-family:monospace;color:#111827;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;font-family:monospace;color:#111827;text-align:right;">&#8377;${formatInrAmount(item.unitPrice)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;font-family:monospace;font-weight:700;color:#111827;text-align:right;">&#8377;${formatInrAmount(item.lineTotal)}</td>
        </tr>`
    )
    .join('');

  const taxLinesHtml = invoice.isIntraState
    ? `
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#4b5563;">CGST (${invoice.cgstRate}%):</td>
        <td style="padding:4px 0;font-size:12px;font-family:monospace;color:#111827;text-align:right;">&#8377;${formatInrAmount(invoice.cgstAmount)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#4b5563;">SGST (${invoice.sgstRate}%):</td>
        <td style="padding:4px 0;font-size:12px;font-family:monospace;color:#111827;text-align:right;">&#8377;${formatInrAmount(invoice.sgstAmount)}</td>
      </tr>`
    : `
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#4b5563;">IGST (${invoice.igstRate}%):</td>
        <td style="padding:4px 0;font-size:12px;font-family:monospace;color:#111827;text-align:right;">&#8377;${formatInrAmount(invoice.igstAmount)}</td>
      </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice ${escapeHtml(invoice.invoiceNumber)} | ${escapeHtml(invoice.seller.brandName)}</title>
  <style>
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .invoice-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div class="invoice-sheet" style="max-width:740px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
    <!-- Top Brand Strip -->
    <div style="background:#0c0c0e;color:#ffffff;padding:24px 28px;border-bottom:3px solid #E5A914;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:26px;font-weight:900;letter-spacing:4px;line-height:1;">${escapeHtml(invoice.seller.brandName)}</div>
            <div style="font-size:10px;letter-spacing:2.5px;color:#E5A914;margin-top:6px;text-transform:uppercase;">${escapeHtml(invoice.seller.tagline)}</div>
            <div style="font-size:11px;color:#a1a1aa;margin-top:10px;line-height:1.5;">
              ${escapeHtml(invoice.seller.legalName)}<br/>
              ${escapeHtml(invoice.seller.addressLine1)}, ${escapeHtml(invoice.seller.addressLine2)}<br/>
              GSTIN: <strong style="color:#f4f4f5;">${escapeHtml(invoice.seller.gstin)}</strong> · State Code: ${escapeHtml(invoice.seller.stateCode)}
            </div>
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#E5A914;text-transform:uppercase;">GST TAX INVOICE</div>
            <div style="font-size:18px;font-weight:800;font-family:monospace;margin-top:4px;color:#ffffff;">${escapeHtml(invoice.invoiceNumber)}</div>
            <div style="font-size:11px;color:#d4d4d8;margin-top:6px;">Order Ref: <strong>${escapeHtml(invoice.orderNumber)}</strong></div>
            <div style="font-size:11px;color:#a1a1aa;margin-top:2px;">Date: ${escapeHtml(invoice.issueDateFormatted)}</div>
            <div style="display:inline-block;margin-top:10px;padding:4px 10px;border-radius:4px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;background:${statusColor.bg};color:${statusColor.text};border:1px solid ${statusColor.border};">
              ${escapeHtml(invoice.payment.statusLabel)} · ${escapeHtml(invoice.payment.methodLabel)}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:24px 28px;">
      <!-- Buyer & Logistics Grid -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:22px;border-bottom:1px solid #e5e7eb;padding-bottom:16px;">
        <tr>
          <td style="width:55%;vertical-align:top;padding-bottom:16px;padding-right:16px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6b7280;margin-bottom:6px;">Billed &amp; Shipped To</div>
            <div style="font-size:14px;font-weight:700;color:#111827;">${escapeHtml(invoice.buyer.name)}</div>
            <div style="font-size:12px;color:#374151;line-height:1.55;margin-top:4px;">
              ${escapeHtml(invoice.buyer.street)}${invoice.buyer.apartment ? `, ${escapeHtml(invoice.buyer.apartment)}` : ''}<br/>
              ${escapeHtml(invoice.buyer.city)}, ${escapeHtml(invoice.buyer.state)} - ${escapeHtml(invoice.buyer.pinCode)}<br/>
              ${escapeHtml(invoice.buyer.country)}<br/>
              Email: ${escapeHtml(invoice.buyer.email)}<br/>
              Phone: ${escapeHtml(invoice.buyer.phone)}
            </div>
          </td>
          <td style="width:45%;vertical-align:top;padding-bottom:16px;text-align:right;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6b7280;margin-bottom:6px;">Supply &amp; Dispatch Details</div>
            <div style="font-size:12px;color:#374151;line-height:1.6;">
              Place of Supply: <strong>${escapeHtml(invoice.placeOfSupply)}</strong><br/>
              Tax Regime: <strong>${invoice.isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</strong><br/>
              Payment Ref: <span style="font-family:monospace;font-size:11px;">${escapeHtml(invoice.payment.transactionRef)}</span><br/>
              Courier: <strong>${escapeHtml(invoice.shipping.courierCompany)}</strong><br/>
              AWB: <span style="font-family:monospace;font-size:11px;">${escapeHtml(invoice.shipping.trackingNumber)}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Line Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;border-top:1px solid #d1d5db;border-bottom:2px solid #111827;">
            <th style="padding:10px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">Item Description</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">HSN</th>
            <th style="padding:10px 8px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">Unit Rate</th>
            <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4b5563;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Summary Totals -->
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:55%;vertical-align:top;padding-right:16px;">
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Amount in Words</div>
              <div style="font-size:12px;font-weight:600;color:#111827;margin-top:4px;">${escapeHtml(invoice.amountInWords)}</div>
            </div>
            <div style="font-size:11px;color:#6b7280;margin-top:12px;line-height:1.5;">
              For support or exchanges within 7 days, reach us at <strong>${escapeHtml(invoice.seller.email)}</strong> or ${escapeHtml(invoice.seller.phone)}.
            </div>
          </td>
          <td style="width:45%;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#4b5563;">Subtotal:</td>
                <td style="padding:4px 0;font-size:12px;font-family:monospace;font-weight:600;color:#111827;text-align:right;">&#8377;${formatInrAmount(invoice.subtotal)}</td>
              </tr>
              ${
                invoice.discount > 0
                  ? `<tr>
                      <td style="padding:4px 0;font-size:12px;color:#059669;">Privilege Discount:</td>
                      <td style="padding:4px 0;font-size:12px;font-family:monospace;font-weight:600;color:#059669;text-align:right;">-&#8377;${formatInrAmount(invoice.discount)}</td>
                    </tr>`
                  : ''
              }
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#4b5563;">Shipping &amp; Handling:</td>
                <td style="padding:4px 0;font-size:12px;font-family:monospace;color:#111827;text-align:right;">${invoice.shippingFee === 0 ? 'COMPLIMENTARY' : `&#8377;${formatInrAmount(invoice.shippingFee)}`}</td>
              </tr>
              ${taxLinesHtml}
              <tr>
                <td style="padding:10px 0 4px 0;font-size:15px;font-weight:900;color:#111827;border-top:2px solid #111827;">Grand Total:</td>
                <td style="padding:10px 0 4px 0;font-size:16px;font-family:monospace;font-weight:900;color:#111827;border-top:2px solid #111827;text-align:right;">&#8377;${formatInrAmount(invoice.grandTotal)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#6b7280;">
        <span>Computer-generated GST Tax Invoice. No physical signature required.</span>
        <span>${escapeHtml(invoice.seller.brandName)} · Hyderabad</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
