import React, { useEffect, useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Package,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  LayoutList
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import {
  DEFAULT_PAYMENT_TIMEOUT_SECONDS,
  computeExpiresAtIso,
  computeRemainingSeconds,
  formatCountdown
} from '../utils/paymentTimer.ts';
import type { Order, PaymentTransaction } from '../types/index.ts';

interface PaymentStatusPageProps {
  orderId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({ orderId: propOrderId, onNavigate }) => {
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(DEFAULT_PAYMENT_TIMEOUT_SECONDS);
  const timeoutCancelRef = useRef(false);
  const confettiFiredRef = useRef(false);
  const [statusData, setStatusData] = useState<{
    orderId?: string;
    orderNumber?: string;
    cashfreeOrderId?: string;
    cashfreePaymentId?: string;
    paymentStatus: string;
    orderStatus?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    transactionDate?: string;
    expiresAt?: string;
    cancellationReason?: string;
    errorMessage?: string;
    order?: Order;
    transaction?: PaymentTransaction;
  } | null>(null);

  const resolveOrderId = useCallback(() => {
    if (propOrderId) return propOrderId;
    const params = new URLSearchParams(window.location.search);
    return params.get('order_id') || params.get('orderId') || sessionStorage.getItem('4lazy_pending_cf_order') || '';
  }, [propOrderId]);

  const verifyPaymentStatus = useCallback(
    async (isManualRefresh = false, silent = false) => {
      const targetOrderId = resolveOrderId();
      if (!targetOrderId) {
        setError('No order reference found in redirect URL.');
        setLoading(false);
        return;
      }

      if (isManualRefresh) setRefreshing(true);
      else if (!silent) setLoading(true);
      if (!silent) setError('');

      try {
        const res = await fetch(`/api/payment/order/${encodeURIComponent(targetOrderId)}`);
        const data = await res.json();

        if (!res.ok && !data.paymentStatus) {
          throw new Error(data.error || 'Unable to verify payment status with Cashfree.');
        }

        setStatusData(data);

        if (data.paymentStatus === 'SUCCESS') {
          clearCart();
          sessionStorage.removeItem('4lazy_pending_cf_order');
          if (!confettiFiredRef.current) {
            confettiFiredRef.current = true;
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#E5A914', '#ffffff', '#10b981']
            });
          }
        }
      } catch (err: any) {
        if (!silent) {
          setError(err?.message || 'Failed to confirm payment status.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveOrderId, clearCart]
  );

  const handleCancelUnconfirmed = useCallback(
    async (reason?: string) => {
      const targetOrderId = statusData?.cashfreeOrderId || resolveOrderId();
      if (!targetOrderId) return;
      setCancelling(true);
      try {
        const res = await fetch(`/api/payment/cancel/${encodeURIComponent(targetOrderId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: reason || 'Payment cancelled — confirmation not received within timer.'
          })
        });
        const data = await res.json();
        if (res.ok) {
          setStatusData(data);
          if (data.paymentStatus === 'SUCCESS') {
            clearCart();
            sessionStorage.removeItem('4lazy_pending_cf_order');
          }
        }
      } catch {
        // Fallback refresh
        await verifyPaymentStatus(false, true);
      } finally {
        setCancelling(false);
      }
    },
    [statusData?.cashfreeOrderId, resolveOrderId, clearCart, verifyPaymentStatus]
  );

  useEffect(() => {
    verifyPaymentStatus(false);
  }, [verifyPaymentStatus]);

  // While PENDING, tick live countdown timer and auto-poll every 3 seconds; auto-cancel on 00:00
  useEffect(() => {
    const currentStatus = (statusData?.paymentStatus || '').toUpperCase();
    if (currentStatus !== 'PENDING') return;

    const expiryIso =
      statusData?.expiresAt ||
      statusData?.transaction?.expiresAt ||
      statusData?.order?.payment?.expiresAt ||
      computeExpiresAtIso(statusData?.transactionDate, DEFAULT_PAYMENT_TIMEOUT_SECONDS);

    const updateTimer = () => {
      const rem = computeRemainingSeconds(expiryIso);
      setRemainingSeconds(rem);
      if (rem <= 0 && !timeoutCancelRef.current) {
        timeoutCancelRef.current = true;
        handleCancelUnconfirmed('Payment confirmation timer expired (no confirmation received within time limit).');
      }
    };

    updateTimer();
    const tickId = window.setInterval(updateTimer, 1000);
    const pollId = window.setInterval(() => {
      verifyPaymentStatus(false, true);
    }, 3000);

    return () => {
      window.clearInterval(tickId);
      window.clearInterval(pollId);
    };
  }, [
    statusData?.paymentStatus,
    statusData?.expiresAt,
    statusData?.transactionDate,
    statusData?.transaction?.expiresAt,
    statusData?.order?.payment?.expiresAt,
    handleCancelUnconfirmed,
    verifyPaymentStatus
  ]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#E5A914] animate-spin mx-auto" />
        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tight">
          Verifying Payment with Cashfree
        </h2>
        <p className="text-xs text-neutral-400">
          Confirming authoritative transaction settlement directly with Cashfree servers. Please do not close this tab.
        </p>
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-red-950/50 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white uppercase">Verification Error</h2>
        <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg p-3">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => verifyPaymentStatus(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-6 py-3 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Verification
          </button>
          <button
            onClick={() => onNavigate('checkout')}
            className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  const paymentStatus = (statusData?.paymentStatus || 'PENDING').toUpperCase();
  const isSuccess = paymentStatus === 'SUCCESS';
  const isPending = paymentStatus === 'PENDING';
  const isFailed = !isSuccess && !isPending;
  const order = statusData?.order;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Status Banner */}
      <div className="text-center space-y-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
            isSuccess
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
              : isPending
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              : 'bg-red-950/60 border-red-500/40 text-red-400'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : isPending ? (
            <Clock className="w-8 h-8" />
          ) : (
            <XCircle className="w-8 h-8" />
          )}
        </div>

        <span
          className={`text-[11px] font-mono tracking-widest uppercase block ${
            isSuccess ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-red-400'
          }`}
        >
          {isSuccess
            ? 'CASHFREE PAYMENT VERIFIED & CONFIRMED'
            : isPending
            ? 'PAYMENT PENDING CONFIRMATION'
            : `PAYMENT ${paymentStatus.replace('_', ' ')}`}
        </span>

        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          {isSuccess
            ? `Order Placed! Thank you, ${order?.customer.name || 'Customer'}`
            : isPending
            ? 'Awaiting Payment Confirmation'
            : paymentStatus === 'CANCELLED'
            ? 'Payment Cancelled'
            : 'Payment Could Not Be Completed'}
        </h1>

        {isPending && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 font-mono text-sm font-bold text-[#E5A914] tabular-nums">
            <Clock className="w-4 h-4" />
            <span>Auto-cancel in {formatCountdown(remainingSeconds)}</span>
          </div>
        )}

        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          {isSuccess
            ? `Your order is placed and confirmed via Cashfree (${statusData?.paymentMethod || 'Online'}). Your customer account and admin dashboard are updated.`
            : isPending
            ? 'Checking with Cashfree every 3 seconds. If confirmation is not received before the timer hits 00:00, this order will automatically move to Cancelled Payment.'
            : statusData?.cancellationReason ||
              statusData?.errorMessage ||
              'Your payment was declined or cancelled. No amount has been charged for a cancelled or failed attempt.'}
        </p>
      </div>

      {/* Transaction Summary Card */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-neutral-800">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Order ID</span>
            <p className="font-mono text-sm font-bold text-[#E5A914] mt-0.5 break-all">
              {statusData?.orderNumber || statusData?.orderId || '—'}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Amount</span>
            <p className="font-mono text-sm font-bold text-white mt-0.5 tabular-nums">
              {statusData?.currency || 'INR'} ₹{Number(statusData?.amount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Payment Status</span>
            <p
              className={`font-mono text-xs font-bold uppercase mt-1 ${
                isSuccess ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {paymentStatus}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Payment Method</span>
            <p className="text-xs text-white font-semibold mt-1">{statusData?.paymentMethod || 'Cashfree'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-950/70 border border-neutral-800 rounded-lg p-4">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Cashfree Order ID</span>
            <span className="font-mono text-neutral-200 break-all">{statusData?.cashfreeOrderId || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Cashfree Payment ID</span>
            <span className="font-mono text-neutral-200 break-all">{statusData?.cashfreePaymentId || 'Pending / N/A'}</span>
          </div>
        </div>

        {order && (
          <>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Order Items</h3>
              <div className="space-y-3 divide-y divide-neutral-800/80">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex gap-4 text-xs">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productTitle}
                        className="w-14 h-16 object-cover rounded bg-neutral-950 border border-neutral-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{item.productTitle}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {item.colorName} · Size {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-mono text-white font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified directly via Cashfree PG backend API.</span>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {isPending && (
            <>
              <button
                onClick={() => verifyPaymentStatus(true)}
                disabled={refreshing || cancelling}
                className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Checking Cashfree...' : 'Verify Status Now'}</span>
              </button>
              <button
                onClick={() => handleCancelUnconfirmed('Customer cancelled pending payment.')}
                disabled={cancelling}
                className="flex-1 border border-red-500/40 bg-red-950/30 hover:bg-red-950/60 text-red-300 font-bold py-3 px-4 rounded text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Payment'}
              </button>
            </>
          )}

          {isFailed && (
            <button
              onClick={() => onNavigate('checkout')}
              className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Payment</span>
            </button>
          )}

          {isSuccess && order && (
            <>
              <button
                onClick={() => onNavigate('account')}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <LayoutList className="w-4 h-4 text-[#E5A914]" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => onNavigate('track-order', { orderNumber: order.orderNumber, email: order.customer.email })}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4 text-[#E5A914]" />
                <span>Track Order</span>
              </button>
            </>
          )}

          <button
            onClick={() => onNavigate('shop', { category: 'all' })}
            className={`flex-1 ${
              isSuccess ? 'bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold' : 'bg-neutral-800 hover:bg-neutral-700 text-white font-bold'
            } py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2`}
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
