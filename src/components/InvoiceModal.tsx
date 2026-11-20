import React, { useState, useMemo } from 'react';
import { X, Printer, Download, Mail, CheckCircle2, Loader2, FileText } from 'lucide-react';
import type { Order, StoreSettings } from '../types/index.ts';
import { buildInvoiceData, formatInrAmount, renderInvoiceHtml } from '../utils/invoice.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface InvoiceModalProps {
  order: Order | null;
  settings?: Partial<StoreSettings>;
  onClose: () => void;
  onEmailSent?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  settings,
  onClose,
  onEmailSent
}) => {
  const { token } = useAuth();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const invoice = useMemo(
    () => (order ? buildInvoiceData(order, settings) : null),
    [order, settings]
  );

  if (!order || !invoice) return null;

  const badgeClass =
    invoice.payment.statusTone === 'success'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : invoice.payment.statusTone === 'pending'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : invoice.payment.statusTone === 'refunded'
      ? 'bg-sky-100 text-sky-800 border-sky-300'
      : 'bg-red-100 text-red-800 border-red-300';

  const handlePrintPdf = () => {
    const html = renderInvoiceHtml(invoice);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();
      window.setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          window.setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 1500);
        }
      }, 150);
    } else if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  const handleDownloadHtml = () => {
    const html = renderInvoiceHtml(invoice);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4LAAZY-Invoice-${order.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailInvoice = async () => {
    setSendingEmail(true);
    setEmailFeedback(null);
    try {
      const authToken = token || localStorage.getItem('4lazy_token') || '';
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/resend-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailFeedback({ type: 'error', text: data.error || 'Unable to email invoice right now.' });
      } else {
        setEmailFeedback({
          type: 'success',
          text: data.message || `Invoice sent to ${order.customer.email}.`
        });
        onEmailSent?.();
      }
    } catch {
      setEmailFeedback({ type: 'error', text: 'Network error sending invoice email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Tax Invoice ${invoice.invoiceNumber}`}
    >
      <div className="bg-neutral-950 border border-neutral-800 max-w-3xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col rounded-xl shadow-2xl overflow-hidden">
        {/* Sticky Action Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-4 h-4 text-[#E5A914]" />
            <span className="font-mono text-xs sm:text-sm font-bold">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEmailInvoice}
              disabled={sendingEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-100 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5A914]" /> : <Mail className="w-3.5 h-3.5 text-[#E5A914]" />}
              <span>{sendingEmail ? 'Sending...' : 'Email Invoice'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-100 text-[11px] font-bold uppercase tracking-wider transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#E5A914]" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E5A914] hover:bg-[#d49b10] text-black text-[11px] font-extrabold uppercase tracking-wider transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice"
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {emailFeedback && (
          <div
            className={`px-4 sm:px-6 py-2.5 text-xs flex items-center gap-2 border-b shrink-0 ${
              emailFeedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/70 border-red-500/30 text-red-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{emailFeedback.text}</span>
          </div>
        )}

        {/* Printable Paper Invoice Preview */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-neutral-900/50">
          <div className="bg-white text-neutral-950 rounded-lg shadow-xl overflow-hidden font-sans border border-neutral-200">
            {/* Dark Header Strip */}
            <div className="bg-[#0c0c0e] text-white px-6 py-6 border-b-[3px] border-[#E5A914] flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black tracking-[0.2em] uppercase">
                  {invoice.seller.brandName}
                </h2>
                <p className="text-[10px] tracking-[0.22em] text-[#E5A914] uppercase mt-1">
                  {invoice.seller.tagline}
                </p>
                <div className="text-[11px] text-neutral-400 mt-3 space-y-0.5 leading-relaxed">
                  <p>{invoice.seller.legalName}</p>
                  <p>
                    {invoice.seller.addressLine1}, {invoice.seller.addressLine2}
                  </p>
                  <p>
                    GSTIN: <strong className="text-neutral-200 font-mono">{invoice.seller.gstin}</strong> · State Code:{' '}
                    {invoice.seller.stateCode}
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#E5A914] uppercase block">
                  GST TAX INVOICE
                </span>
                <p className="font-mono text-lg font-extrabold text-white mt-0.5">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-[11px] text-neutral-300 mt-1">
                  Order Ref: <strong className="font-mono">{invoice.orderNumber}</strong>
                </p>
                <p className="text-[11px] text-neutral-400">Issued: {invoice.issueDateFormatted}</p>
                <span
                  className={`inline-block mt-2.5 px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                >
                  {invoice.payment.statusLabel} · {invoice.payment.methodLabel}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Buyer & Logistics Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-neutral-200 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Billed &amp; Shipped To
                  </span>
                  <p className="font-bold text-sm text-neutral-900">{invoice.buyer.name}</p>
                  <p className="text-neutral-700">
                    {invoice.buyer.street}
                    {invoice.buyer.apartment ? `, ${invoice.buyer.apartment}` : ''}
                  </p>
                  <p className="text-neutral-700">
                    {invoice.buyer.city}, {invoice.buyer.state} - {invoice.buyer.pinCode}
                  </p>
                  <p className="text-neutral-600">{invoice.buyer.email}</p>
                  <p className="text-neutral-600 font-mono">Phone: {invoice.buyer.phone}</p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Supply &amp; Dispatch Details
                  </span>
                  <p className="text-neutral-700">
                    Place of Supply: <strong>{invoice.placeOfSupply}</strong>
                  </p>
                  <p className="text-neutral-700">
                    Tax Regime:{' '}
                    <strong>
                      {invoice.isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                    </strong>
                  </p>
                  <p className="text-neutral-700">
                    Payment Ref:{' '}
                    <span className="font-mono text-[11px]">{invoice.payment.transactionRef}</span>
                  </p>
                  <p className="text-neutral-700">
                    Courier: <strong>{invoice.shipping.courierCompany}</strong>
                  </p>
                  <p className="text-neutral-700">
                    AWB: <span className="font-mono text-[11px]">{invoice.shipping.trackingNumber}</span>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-y-2 border-neutral-900 text-neutral-600 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-2">Item Description</th>
                      <th className="py-2.5 px-2 text-center">HSN</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Unit Rate</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {invoice.items.map(item => (
                      <tr key={item.index}>
                        <td className="py-3 px-2">
                          <p className="font-bold text-neutral-900">{item.title}</p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {item.variantLabel} · SKU: {item.sku}
                          </p>
                          {item.customNote && (
                            <p className="text-[10px] text-amber-700 mt-0.5">{item.customNote}</p>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-neutral-600">
                          {item.hsnCode}
                        </td>
                        <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums">
                          ₹{formatInrAmount(item.unitPrice)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold tabular-nums">
                          ₹{formatInrAmount(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Amount in Words */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-4 border-t border-neutral-200 items-start">
                <div className="sm:col-span-7 space-y-2.5">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                      Amount in Words
                    </span>
                    <p className="text-xs font-semibold text-neutral-900 mt-1">
                      {invoice.amountInWords}
                    </p>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Support &amp; 7-Day Exchanges: <strong>{invoice.seller.email}</strong> ·{' '}
                    {invoice.seller.phone}
                  </p>
                </div>

                <div className="sm:col-span-5 space-y-1.5 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-neutral-900 tabular-nums">
                      ₹{formatInrAmount(invoice.subtotal)}
                    </span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Privilege Discount:</span>
                      <span className="font-mono font-semibold tabular-nums">
                        -₹{formatInrAmount(invoice.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-mono text-neutral-900">
                      {invoice.shippingFee === 0
                        ? 'COMPLIMENTARY'
                        : `₹${formatInrAmount(invoice.shippingFee)}`}
                    </span>
                  </div>
                  {invoice.isIntraState ? (
                    <>
                      <div className="flex justify-between">
                        <span>CGST ({invoice.cgstRate}%):</span>
                        <span className="font-mono text-neutral-900 tabular-nums">
                          ₹{formatInrAmount(invoice.cgstAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({invoice.sgstRate}%):</span>
                        <span className="font-mono text-neutral-900 tabular-nums">
                          ₹{formatInrAmount(invoice.sgstAmount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>IGST ({invoice.igstRate}%):</span>
                      <span className="font-mono text-neutral-900 tabular-nums">
                        ₹{formatInrAmount(invoice.igstAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-neutral-950 pt-2.5 border-t-2 border-neutral-900">
                    <span>Grand Total:</span>
                    <span className="font-mono tabular-nums">
                      ₹{formatInrAmount(invoice.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex flex-wrap justify-between gap-2 text-[10px] text-neutral-500">
                <span>Computer-generated GST Tax Invoice. No physical signature required.</span>
                <span>{invoice.seller.brandName} · Hyderabad, Telangana</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
