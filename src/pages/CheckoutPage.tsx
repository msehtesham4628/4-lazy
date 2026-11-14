import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronLeft,
  Tag,
  Smartphone,
  Building2,
  Wallet,
  Loader2,
  Percent,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  DEFAULT_PAYMENT_TIMEOUT_SECONDS,
  computeRemainingSeconds,
  formatCountdown
} from '../utils/paymentTimer.ts';
import type { Order } from '../types/index.ts';

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_modal';
      }) => Promise<{ error?: any; redirect?: boolean; paymentDetails?: any }>;
    };
  }
}

interface CheckoutPageProps {
  onNavigate: (page: string, params?: any) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi NCR', 'Chandigarh'
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, discount, tax, coupon, applyCoupon, removeCoupon, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);

  // Coupon state on checkout page
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Step 1: Contact
  const [contact, setContact] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // Step 2: Shipping Address
  const defaultAddr = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
  const [address, setAddress] = useState({
    street: defaultAddr?.street || '',
    apartment: defaultAddr?.apartment || '',
    city: defaultAddr?.city || '',
    state: defaultAddr?.state || 'Telangana',
    pinCode: defaultAddr?.pinCode || '',
    country: 'India'
  });

  // Step 3: Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');

  // Step 4: Cashfree Gateway + COD
  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'cod'>('cashfree');
  const [cashfreeEnv, setCashfreeEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [cashfreeConfigured, setCashfreeConfigured] = useState<boolean>(true);
  const [paymentTimeoutSeconds, setPaymentTimeoutSeconds] = useState<number>(DEFAULT_PAYMENT_TIMEOUT_SECONDS);

  // Active Checkout Payment Timer & Confirmation State
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    orderNumber: string;
    cashfreeOrderId: string;
    paymentSessionId: string;
    checkoutUrl: string;
    amount: number;
    currency: string;
    expiresAt: string;
    timeoutSeconds: number;
    environment: 'sandbox' | 'production';
  } | null>(null);
  const [paymentPhase, setPaymentPhase] = useState<'idle' | 'awaiting' | 'cancelling' | 'cancelled' | 'confirmed'>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(DEFAULT_PAYMENT_TIMEOUT_SECONDS);
  const [cancelledInfo, setCancelledInfo] = useState<{
    orderNumber?: string;
    cashfreeOrderId?: string;
    amount?: number;
    reason?: string;
  } | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [verifyingNow, setVerifyingNow] = useState(false);
  const [cashfreeModalOpen, setCashfreeModalOpen] = useState(false);
  const timeoutCancelFiredRef = React.useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/payment/config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.environment === 'production' || data.environment === 'sandbox') {
            setCashfreeEnv(data.environment);
          }
          if (typeof data.configured === 'boolean') {
            setCashfreeConfigured(data.configured);
          }
          if (typeof data.timeoutSeconds === 'number' && data.timeoutSeconds > 0) {
            setPaymentTimeoutSeconds(data.timeoutSeconds);
          }
          if (data.codEnabled === false) {
            setCodEnabled(false);
            setPaymentMethod('cashfree');
          } else {
            setCodEnabled(true);
          }
        }
      })
      .catch(() => setCodEnabled(true));
  }, []);

  const cleanupCashfreeModal = React.useCallback(() => {
    setCashfreeModalOpen(false);
    if (typeof document === 'undefined') return;
    const exact = document.getElementById('cashfree-modal-container');
    if (exact) exact.remove();
    document
      .querySelectorAll('[id^="cashfree-modal"], [class*="cashfree-modal"]')
      .forEach(el => {
        if (el.id !== 'cashfree-timer-floating-bar') {
          el.remove();
        }
      });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  useEffect(() => {
    return () => {
      cleanupCashfreeModal();
    };
  }, [cleanupCashfreeModal]);

  // Keep Cashfree's injected modal container seated cleanly below our 52px persistent timer bar
  useEffect(() => {
    if (paymentPhase !== 'awaiting' && paymentPhase !== 'cancelling') return;
    const adjustModal = () => {
      const cfContainer = document.getElementById('cashfree-modal-container');
      if (cfContainer) {
        cfContainer.style.zIndex = '2147483640';
        cfContainer.style.top = '52px';
        cfContainer.style.height = 'calc(100vh - 52px)';
      }
    };
    adjustModal();
    const observer = new MutationObserver(adjustModal);
    observer.observe(document.body, { childList: true, subtree: false });
    return () => observer.disconnect();
  }, [paymentPhase]);

  const handlePaymentConfirmed = React.useCallback(
    (order: Order) => {
      cleanupCashfreeModal();
      setConfirmedOrder(order);
      setPaymentPhase('confirmed');
      setPendingPayment(null);
      setLoading(false);
      sessionStorage.removeItem('4lazy_pending_cf_order');
      clearCart();
      onNavigate('order-success', { order });
    },
    [cleanupCashfreeModal, clearCart, onNavigate]
  );

  const handleCancelPendingPayment = React.useCallback(
    async (reason?: string) => {
      if (!pendingPayment) return;
      cleanupCashfreeModal();
      const targetCfId = pendingPayment.cashfreeOrderId;
      setPaymentPhase('cancelling');
      try {
        const res = await fetch(`/api/payment/cancel/${encodeURIComponent(targetCfId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: reason || 'Payment cancelled — confirmation not received within timer.'
          })
        });
        const data = await res.json().catch(() => ({}));
        if (data?.alreadyPaid && data?.order) {
          handlePaymentConfirmed(data.order);
          return;
        }
        setCancelledInfo({
          orderNumber: data.orderNumber || pendingPayment.orderNumber,
          cashfreeOrderId: targetCfId,
          amount: pendingPayment.amount,
          reason:
            data.cancellationReason ||
            reason ||
            'Payment was cancelled because confirmation was not received before the timer expired.'
        });
        setPaymentPhase('cancelled');
        sessionStorage.removeItem('4lazy_pending_cf_order');
      } catch {
        setCancelledInfo({
          orderNumber: pendingPayment.orderNumber,
          cashfreeOrderId: targetCfId,
          amount: pendingPayment.amount,
          reason: reason || 'Payment cancelled due to timeout.'
        });
        setPaymentPhase('cancelled');
      } finally {
        setLoading(false);
      }
    },
    [cleanupCashfreeModal, pendingPayment, handlePaymentConfirmed]
  );

  const checkPendingPaymentStatus = React.useCallback(
    async (manual = false) => {
      if (!pendingPayment) return;
      if (manual) setVerifyingNow(true);
      try {
        const res = await fetch(`/api/payment/order/${encodeURIComponent(pendingPayment.cashfreeOrderId)}`);
        const data = await res.json().catch(() => ({}));
        const st = String(data?.paymentStatus || '').toUpperCase();
        if (st === 'SUCCESS' && data.order) {
          handlePaymentConfirmed(data.order);
          return;
        }
        if (st === 'CANCELLED' || st === 'FAILED' || st === 'USER_DROPPED') {
          cleanupCashfreeModal();
          setCancelledInfo({
            orderNumber: data.orderNumber || pendingPayment.orderNumber,
            cashfreeOrderId: pendingPayment.cashfreeOrderId,
            amount: pendingPayment.amount,
            reason:
              data.cancellationReason ||
              data.errorMessage ||
              `Payment ${st.toLowerCase().replace('_', ' ')} at Cashfree gateway.`
          });
          setPaymentPhase('cancelled');
          setLoading(false);
          sessionStorage.removeItem('4lazy_pending_cf_order');
        }
      } catch {
        // Keep polling until confirmed or timer expires
      } finally {
        if (manual) setVerifyingNow(false);
      }
    },
    [cleanupCashfreeModal, pendingPayment, handlePaymentConfirmed]
  );

  // Live 1-second countdown + 3-second Cashfree confirmation polling
  useEffect(() => {
    if (paymentPhase !== 'awaiting' || !pendingPayment) return;

    const tickTimer = () => {
      const rem = computeRemainingSeconds(pendingPayment.expiresAt);
      setRemainingSeconds(rem);
      if (rem <= 0 && timeoutCancelFiredRef.current !== pendingPayment.cashfreeOrderId) {
        timeoutCancelFiredRef.current = pendingPayment.cashfreeOrderId;
        handleCancelPendingPayment('Payment confirmation timer expired (no confirmation received before 00:00).');
      }
    };

    tickTimer();
    const countdownId = window.setInterval(tickTimer, 1000);
    const pollId = window.setInterval(() => {
      checkPendingPaymentStatus(false);
    }, 3000);

    return () => {
      window.clearInterval(countdownId);
      window.clearInterval(pollId);
    };
  }, [paymentPhase, pendingPayment, handleCancelPendingPayment, checkPendingPaymentStatus]);

  const launchCashfreeModal = async (sessionId: string, mode: 'sandbox' | 'production') => {
    if (typeof window.Cashfree !== 'function') {
      setErrorMsg('Cashfree popup SDK is unavailable. Use the hosted Cashfree payment link below.');
      return;
    }
    setCashfreeModalOpen(true);
    try {
      const cashfree = window.Cashfree({ mode });
      const result = await cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: '_modal'
      });
      setCashfreeModalOpen(false);
      // After modal completes or closes, check backend status immediately
      await checkPendingPaymentStatus(true);
      if (result?.error) {
        setErrorMsg(result.error?.message || 'Checkout window closed before confirmation. Complete payment or cancel below.');
      }
    } catch (err: any) {
      setCashfreeModalOpen(false);
      setErrorMsg(err?.message || 'Unable to display Cashfree popup inside this frame. Use the hosted link below.');
    }
  };

  const handleApplyCouponCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    const res = await applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponSuccess(`Coupon "${couponInput.trim().toUpperCase()}" applied.`);
      setCouponInput('');
    } else {
      setCouponError(res.error || 'Invalid or ineligible coupon code.');
    }
    setApplyingCoupon(false);
  };

  if (items.length === 0 && paymentPhase === 'idle' && !confirmedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-white uppercase">Your Bag is Empty</h2>
        <p className="text-xs text-neutral-400 mt-2">Add T-shirts to proceed to checkout.</p>
        <button
          onClick={() => onNavigate('shop', { category: 'all' })}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const currentShipping = deliveryMethod === 'express' ? 199 : (subtotal >= 1999 ? 0 : 99);
  const currentTotal = Math.max(0, subtotal - discount + currentShipping + tax);

  const validateStep1 = () => {
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setErrorMsg('Please enter your full name, email, and mobile number.');
      return false;
    }
    if (!contact.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (contact.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep2 = () => {
    if (!address.street.trim() || !address.city.trim() || !address.pinCode.trim()) {
      setErrorMsg('Please enter your street address, city, and PIN code.');
      return false;
    }
    if (address.pinCode.trim().length !== 6 || isNaN(Number(address.pinCode))) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code (e.g. 500033).');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const submitOrderToBackend = async (gatewayMeta?: {
    cashfreeOrderId?: string;
    paymentSessionId?: string;
    paymentTransactionId?: string;
  }) => {
    const payload = {
      customer: contact,
      shippingAddress: {
        ...address,
        fullName: contact.name,
        phone: contact.phone
      },
      items: items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        productTitle: i.productTitle,
        colorName: i.colorName,
        size: i.size,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        customPrint: i.customPrint
      })),
      paymentMethod,
      cashfreeOrderId: gatewayMeta?.cashfreeOrderId,
      paymentSessionId: gatewayMeta?.paymentSessionId,
      paymentTransactionId: gatewayMeta?.paymentTransactionId,
      couponCode: coupon?.code,
      deliveryMethod
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('4lazy_token')
          ? { Authorization: `Bearer ${localStorage.getItem('4lazy_token')}` }
          : {})
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to process order.');
    }

    clearCart();
    onNavigate('order-success', { order: data.order });
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      if (paymentMethod === 'cod') {
        await submitOrderToBackend();
        return;
      }

      // Official Cashfree Payment Gateway: create order on backend
      const payload = {
        customer: contact,
        shippingAddress: {
          ...address,
          fullName: contact.name,
          phone: contact.phone
        },
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          productTitle: i.productTitle,
          colorName: i.colorName,
          size: i.size,
          sku: i.sku,
          price: i.price,
          quantity: i.quantity,
          customPrint: i.customPrint
        })),
        couponCode: coupon?.code,
        deliveryMethod,
        amount: currentTotal
      };

      const sessionRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('4lazy_token')
            ? { Authorization: `Bearer ${localStorage.getItem('4lazy_token')}` }
            : {})
        },
        body: JSON.stringify(payload)
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.paymentSessionId) {
        throw new Error(sessionData.error || 'Unable to create Cashfree payment order.');
      }

      sessionStorage.setItem('4lazy_pending_cf_order', sessionData.cashfreeOrderId);

      const mode: 'sandbox' | 'production' =
        sessionData.environment === 'production' ? 'production' : 'sandbox';
      const timeoutSec = Number(sessionData.timeoutSeconds) || paymentTimeoutSeconds;
      const expiresAtIso =
        sessionData.expiresAt || new Date(Date.now() + timeoutSec * 1000).toISOString();

      timeoutCancelFiredRef.current = null;
      setCancelledInfo(null);
      setPendingPayment({
        orderId: sessionData.orderId,
        orderNumber: sessionData.orderNumber,
        cashfreeOrderId: sessionData.cashfreeOrderId,
        paymentSessionId: sessionData.paymentSessionId,
        checkoutUrl: sessionData.checkoutUrl,
        amount: Number(sessionData.amount ?? currentTotal),
        currency: sessionData.currency || 'INR',
        expiresAt: expiresAtIso,
        timeoutSeconds: timeoutSec,
        environment: mode
      });
      setRemainingSeconds(computeRemainingSeconds(expiresAtIso));
      setPaymentPhase('awaiting');
      setLoading(false);

      // Open Cashfree modal checkout while keeping the timer overlay mounted
      await launchCashfreeModal(sessionData.paymentSessionId, mode);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred initializing Cashfree payment.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 gap-3">
        <button
          onClick={() => onNavigate('shop', { category: 'all' })}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors whitespace-nowrap"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 whitespace-nowrap">
          <Lock className="w-3.5 h-3.5 text-[#E5A914]" />
          <span className="hidden xs:inline">256-Bit Encrypted</span>
          <span className="xs:hidden">Secure</span>
        </div>
      </div>

      {/* Mobile-Safe 4-Column Stepper (zero overflow on 360px) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 max-w-2xl mx-auto">
        {[
          { num: 1, label: 'Contact' },
          { num: 2, label: 'Address' },
          { num: 3, label: 'Delivery' },
          { num: 4, label: 'Cashfree' }
        ].map(s => (
          <button
            key={s.num}
            onClick={() => {
              if (s.num < step) setStep(s.num);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 rounded-lg border text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
              step === s.num
                ? 'border-[#E5A914] bg-[#E5A914]/15 text-[#E5A914]'
                : step > s.num
                ? 'border-neutral-800 bg-neutral-900 text-white'
                : 'border-neutral-900 bg-neutral-950 text-neutral-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                step === s.num
                  ? 'bg-[#E5A914] text-black'
                  : step > s.num
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {s.num}
            </span>
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                Step 1: Contact Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={e => setContact({ ...contact, name: e.target.value })}
                    placeholder="Aryan Verma"
                    className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={e => setContact({ ...contact, email: e.target.value })}
                      placeholder="aryan@example.com"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Mobile Phone (+91)</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={e => setContact({ ...contact, phone: e.target.value })}
                      placeholder="9811223344"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full sm:w-auto bg-[#E5A914] text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#d49b10]"
                >
                  <span>Continue to Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Step 2: Shipping Address
                </h2>
                <button onClick={() => setStep(1)} className="text-xs text-neutral-400 hover:text-white">Back</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                    placeholder="Flat 402, Skyline Residency, 14th Road"
                    className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Apartment / Landmark (Optional)</label>
                  <input
                    type="text"
                    value={address.apartment}
                    onChange={e => setAddress({ ...address, apartment: e.target.value })}
                    placeholder="Road No. 36, Jubilee Hills"
                    className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      placeholder="Hyderabad"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">State</label>
                    <select
                      value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600 cursor-pointer"
                    >
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={address.pinCode}
                      onChange={e => setAddress({ ...address, pinCode: e.target.value.replace(/\D/g, '') })}
                      placeholder="500033"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white font-mono rounded focus:outline-none focus:border-neutral-600"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-neutral-400 hover:text-white px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="bg-[#E5A914] text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#d49b10]"
                >
                  <span>Delivery Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Step 3: Delivery Speed
                </h2>
                <button onClick={() => setStep(2)} className="text-xs text-neutral-400 hover:text-white">Back</button>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setDeliveryMethod('standard')}
                  className={`flex items-start justify-between gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    deliveryMethod === 'standard'
                      ? 'border-[#E5A914] bg-neutral-950'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#E5A914] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Standard Courier (Blue Dart / Delhivery)</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">3–5 business days with live SMS tracking.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white shrink-0 tabular-nums">
                    {subtotal >= 1999 ? 'FREE' : '₹99'}
                  </span>
                </label>

                <label
                  onClick={() => setDeliveryMethod('express')}
                  className={`flex items-start justify-between gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    deliveryMethod === 'express'
                      ? 'border-[#E5A914] bg-neutral-950'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#E5A914] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Express Air Priority</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">24–48 hour delivery across metro cities.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white shrink-0 tabular-nums">₹199</span>
                </label>
              </div>

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-neutral-400 hover:text-white px-4 py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="bg-[#E5A914] text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#d49b10]"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Step 4: Cashfree Payment Gateway
                </h2>
                <button onClick={() => setStep(3)} className="text-xs text-neutral-400 hover:text-white">Back</button>
              </div>

              <div className={`grid grid-cols-1 ${codEnabled ? 'sm:grid-cols-2' : ''} gap-3`}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cashfree')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    paymentMethod === 'cashfree'
                      ? 'border-[#E5A914] bg-neutral-950 ring-1 ring-[#E5A914]'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white">Cashfree Secure Gateway</p>
                    <span className="text-[10px] font-mono text-[#E5A914] font-bold">RECOMMENDED</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">UPI, GPay, PhonePe, Cards, NetBanking, Wallets</p>
                </button>

                {codEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#E5A914] bg-neutral-950 ring-1 ring-[#E5A914]'
                        : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Pay cash or UPI at your doorstep</p>
                  </button>
                )}
              </div>

              {!codEnabled && (
                <p className="text-[11px] text-neutral-400 bg-neutral-950 border border-neutral-800 px-3 py-2 rounded">
                  Cash on Delivery is currently disabled by store settings. Complete your order securely via Cashfree.
                </p>
              )}

              {/* Coupon Code Application on Payment Step */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#E5A914]" /> Apply Coupon Code
                  </span>
                  {coupon && (
                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon();
                        setCouponSuccess('');
                        setCouponError('');
                      }}
                      className="text-[11px] text-red-400 hover:underline font-semibold"
                    >
                      Remove ({coupon.code})
                    </button>
                  )}
                </div>

                {coupon ? (
                  <div className="flex items-center justify-between text-xs bg-neutral-900 border border-[#E5A914]/40 px-3 py-1.5 rounded">
                    <span className="font-mono font-bold text-[#E5A914]">{coupon.code} Applied</span>
                    <span className="font-mono text-emerald-400 font-bold tabular-nums">-₹{discount.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError('');
                      }}
                      placeholder="Enter code (e.g. LAZY10, FIRST4L)"
                      className="flex-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white font-mono uppercase rounded focus:outline-none focus:border-[#E5A914]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode()}
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-4 py-1.5 rounded text-xs uppercase tracking-wider disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}

                {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
                {couponSuccess && !couponError && <p className="text-[11px] text-emerald-400">{couponSuccess}</p>}
              </div>

              {paymentMethod === 'cashfree' && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5A914]">
                      Supported Payment Methods
                    </p>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      {cashfreeEnv === 'production' ? 'LIVE' : 'SANDBOX'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-neutral-300">
                    {[
                      { label: 'UPI (GPay, PhonePe, Paytm)', icon: Smartphone },
                      { label: 'Credit & Debit Cards', icon: CreditCard },
                      { label: 'Net Banking (All Banks)', icon: Building2 },
                      { label: 'Wallets', icon: Wallet },
                      { label: 'EMI Options', icon: Percent },
                      { label: 'Pay Later', icon: Clock }
                    ].map(mode => {
                      const Icon = mode.icon;
                      return (
                        <div
                          key={mode.label}
                          className="p-2 rounded border border-neutral-800 bg-neutral-900/50 flex items-center gap-2"
                        >
                          <Icon className="w-3.5 h-3.5 text-[#E5A914] shrink-0" />
                          <span className="truncate">{mode.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {!cashfreeConfigured && (
                    <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded px-3 py-1.5">
                      Note: Server Cashfree API keys (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`) are required in environment variables to open Cashfree Checkout.
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-400">
                    Clicking <strong>Pay Now</strong> opens Cashfree&apos;s secure checkout and starts a{' '}
                    <strong className="text-[#E5A914]">{formatCountdown(paymentTimeoutSeconds)} payment confirmation timer</strong>.
                    If confirmation is not received before the timer ends, the payment is automatically moved to Cancelled Payment.
                  </p>
                </div>
              )}

              <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg flex items-center gap-2.5 text-xs text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>256-bit TLS encrypted Cashfree PCI-DSS Level 1 compliant checkout.</span>
              </div>

              <div className="pt-1 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="text-xs text-neutral-400 hover:text-white py-2 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-8 py-3.5 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Cashfree Checkout...</span>
                    </>
                  ) : paymentMethod === 'cashfree' ? (
                    <>
                      <span>Pay Now · ₹{currentTotal.toLocaleString()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Confirm COD Order · ₹{currentTotal.toLocaleString()}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-neutral-800 pb-3">
            Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} Items)
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-neutral-800/60">
            {items.map(item => (
              <div key={item.id} className="pt-3 first:pt-0 flex gap-3 text-xs">
                <img
                  src={item.image}
                  alt={item.productTitle}
                  className="w-14 h-16 object-cover rounded bg-neutral-950 border border-neutral-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white leading-tight truncate">{item.productTitle}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {item.colorName} · Size {item.size} · Qty {item.quantity}
                  </p>
                  {item.customPrint && (
                    <div className="mt-1 p-1.5 bg-neutral-950/80 border border-[#E5A914]/30 rounded flex items-center gap-2 text-[10px]">
                      {item.customPrint.uploadedGraphicUrl &&
                        (item.customPrint.uploadedGraphicUrl.startsWith('data:') ||
                          item.customPrint.uploadedGraphicUrl.startsWith('/') ||
                          item.customPrint.uploadedGraphicUrl.startsWith('http')) && (
                          <img
                            src={item.customPrint.uploadedGraphicUrl}
                            alt="Custom graphic"
                            className="w-7 h-7 object-contain rounded bg-neutral-900 border border-neutral-800 shrink-0"
                          />
                        )}
                      <div className="min-w-0">
                        <span className="text-[#E5A914] font-mono block truncate">
                          {item.customPrint.printTechnique === 'Custom Image Print'
                            ? 'Custom Print Image Attached'
                            : `${item.customPrint.placement.replace('-', ' ')} · ${item.customPrint.printTechnique}`}
                        </span>
                        {item.customPrint.customText && (
                          <span className="text-neutral-300 italic truncate block">
                            &ldquo;{item.customPrint.customText}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="font-mono text-white font-bold mt-1 tabular-nums">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Promo / Coupon Code inside Order Summary */}
          <div className="space-y-2">
            {coupon ? (
              <div className="flex items-center justify-between bg-neutral-950 border border-[#E5A914]/40 px-3 py-2 rounded text-xs">
                <div className="flex items-center gap-1.5 text-[#E5A914]">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold">{coupon.code}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-mono tabular-nums">-₹{discount.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setCouponSuccess('');
                      setCouponError('');
                    }}
                    className="text-[10px] text-neutral-400 hover:text-red-400 uppercase"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyCouponCode} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => {
                    setCouponInput(e.target.value.toUpperCase());
                    if (couponError) setCouponError('');
                  }}
                  placeholder="Promo code (e.g. FIRST4L)"
                  className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded focus:outline-none focus:border-neutral-600 uppercase font-mono"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-white px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </form>
            )}
            {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
            {coupon && discount === 0 && coupon.minOrderValue && (
              <p className="text-[11px] text-amber-400">
                Add ₹{(coupon.minOrderValue - subtotal).toLocaleString()} more to activate {coupon.code}.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-neutral-200 tabular-nums">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Discount</span>
                <span className="font-mono tabular-nums">-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery ({deliveryMethod})</span>
              <span className="font-mono text-neutral-200 tabular-nums">
                {currentShipping === 0 ? 'COMPLIMENTARY' : `₹${currentShipping}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GST Included (5%)</span>
              <span className="font-mono text-neutral-200 tabular-nums">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Payable</span>
              <span className="font-mono text-lg text-[#E5A914] tabular-nums">₹{currentTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE CHECKOUT PAYMENT TIMER & CANCEL-ON-TIMEOUT OVERLAY */}
      {(paymentPhase === 'awaiting' || paymentPhase === 'cancelling' || paymentPhase === 'cancelled') && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-timer-title"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            {paymentPhase === 'cancelled' ? (
              <>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-red-950/70 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                    CANCELLED PAYMENT
                  </span>
                  <h2 id="payment-timer-title" className="font-display text-2xl font-black text-white uppercase tracking-tight">
                    Payment Cancelled
                  </h2>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {cancelledInfo?.reason || 'Confirmation was not received within the checkout timer. This order has been marked as Cancelled Payment.'}
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Order Reference</span>
                    <span className="font-mono font-bold text-[#E5A914]">{cancelledInfo?.orderNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Amount</span>
                    <span className="font-mono font-bold text-white">₹{Number(cancelledInfo?.amount || currentTotal).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-neutral-500 uppercase block">Cashfree Order ID</span>
                    <span className="font-mono text-[11px] text-neutral-400 break-all">{cancelledInfo?.cashfreeOrderId || '—'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentPhase('idle');
                      setPendingPayment(null);
                      setCancelledInfo(null);
                      setErrorMsg('');
                    }}
                    className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Payment</span>
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() => onNavigate('account')}
                      className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest"
                    >
                      View My Orders
                    </button>
                  )}
                </div>
              </>
            ) : (
              pendingPayment && (() => {
                const progressPct = Math.max(
                  0,
                  Math.min(100, Math.round((remainingSeconds / Math.max(1, pendingPayment.timeoutSeconds)) * 100))
                );
                const isUrgent = remainingSeconds <= 60;
                return (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E5A914]">
                          AWAITING PAYMENT CONFIRMATION
                        </span>
                        <h2 id="payment-timer-title" className="font-display text-xl font-black text-white uppercase tracking-tight mt-0.5">
                          Complete Your Payment
                        </h2>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-lg border font-mono text-lg font-black tabular-nums flex items-center gap-1.5 ${
                          isUrgent
                            ? 'bg-red-950/70 border-red-500/50 text-red-400 animate-pulse'
                            : 'bg-neutral-950 border-[#E5A914]/50 text-[#E5A914]'
                        }`}
                        aria-label="Payment confirmation countdown timer"
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatCountdown(remainingSeconds)}</span>
                      </div>
                    </div>

                    {/* Countdown Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            isUrgent ? 'bg-red-500' : 'bg-[#E5A914]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        {isUrgent
                          ? 'Hurry! Unconfirmed payments are automatically moved to Cancelled Payment when the timer hits 00:00.'
                          : 'Listening for Cashfree bank/UPI confirmation every 3 seconds. Unconfirmed orders auto-cancel at 00:00.'}
                      </p>
                    </div>

                    {/* Order & Amount Details */}
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase block">Order Number</span>
                        <span className="font-mono font-bold text-[#E5A914]">{pendingPayment.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase block">Payable Amount</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          ₹{pendingPayment.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-neutral-500 uppercase block">Cashfree Order ID</span>
                        <span className="font-mono text-[11px] text-neutral-300 break-all">
                          {pendingPayment.cashfreeOrderId}
                        </span>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 bg-amber-950/50 border border-amber-500/30 rounded text-[11px] text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => launchCashfreeModal(pendingPayment.paymentSessionId, pendingPayment.environment)}
                        disabled={paymentPhase === 'cancelling'}
                        className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 px-4 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Open Cashfree Payment Window</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => checkPendingPaymentStatus(true)}
                          disabled={verifyingNow || paymentPhase === 'cancelling'}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 px-3 rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${verifyingNow ? 'animate-spin' : ''}`} />
                          <span>{verifyingNow ? 'Checking...' : 'Check Status'}</span>
                        </button>

                        {pendingPayment.checkoutUrl && (
                          <a
                            href={pendingPayment.checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold py-2.5 px-3 rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <span>Hosted Page</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelPendingPayment('Customer cancelled payment during checkout.')}
                        disabled={paymentPhase === 'cancelling'}
                        className="w-full border border-red-500/30 bg-red-950/30 hover:bg-red-950/60 text-red-300 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider disabled:opacity-50"
                      >
                        {paymentPhase === 'cancelling' ? 'Cancelling Payment...' : 'Cancel Payment'}
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* PERSISTENT TOP TIMER & CANCEL BAR (stays interactive above Cashfree SDK modal iframe) */}
      {(paymentPhase === 'awaiting' || paymentPhase === 'cancelling') &&
        cashfreeModalOpen &&
        pendingPayment &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="cashfree-timer-floating-bar"
            style={{ zIndex: 2147483647 }}
            className="fixed top-0 inset-x-0 h-[52px] bg-neutral-950/95 border-b border-[#E5A914]/50 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 shadow-2xl"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span
                className={`px-2.5 py-1 rounded border font-mono text-xs sm:text-sm font-black tabular-nums flex items-center gap-1.5 shrink-0 ${
                  remainingSeconds <= 60
                    ? 'bg-red-950/80 border-red-500/50 text-red-300 animate-pulse'
                    : 'bg-neutral-900 border-[#E5A914]/50 text-[#E5A914]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{formatCountdown(remainingSeconds)}</span>
              </span>
              <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-300 truncate">
                <span className="font-mono font-bold text-white">{pendingPayment.orderNumber}</span>
                <span className="text-neutral-500">·</span>
                <span className="font-mono font-bold text-[#E5A914]">
                  ₹{pendingPayment.amount.toLocaleString()}
                </span>
                <span className="text-neutral-400 hidden md:inline">
                  — Auto-cancels at 00:00 if unconfirmed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => checkPendingPaymentStatus(true)}
                disabled={verifyingNow || paymentPhase === 'cancelling'}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded text-[11px] uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${verifyingNow ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">{verifyingNow ? 'Checking...' : 'Check Status'}</span>
                <span className="xs:hidden">Sync</span>
              </button>
              <button
                type="button"
                onClick={() => handleCancelPendingPayment('Customer cancelled payment during checkout.')}
                disabled={paymentPhase === 'cancelling'}
                className="border border-red-500/40 bg-red-950/70 hover:bg-red-900/80 text-red-200 font-bold px-2.5 sm:px-3.5 py-1.5 rounded text-[11px] uppercase tracking-wider disabled:opacity-50"
              >
                {paymentPhase === 'cancelling' ? 'Cancelling...' : 'Cancel Payment'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
