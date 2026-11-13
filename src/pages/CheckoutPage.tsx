import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

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
  const { items, subtotal, discount, tax, coupon, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    state: defaultAddr?.state || 'Maharashtra',
    pinCode: defaultAddr?.pinCode || '',
    country: 'India'
  });

  // Step 3: Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');

  // Step 4: Cashfree Gateway + COD
  const [paymentMethod, setPaymentMethod] = useState<'cashfree' | 'cod'>('cashfree');
  const [cashfreeChannel, setCashfreeChannel] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Cashfree Payment Session Modal
  const [cashfreeSession, setCashfreeSession] = useState<{
    cashfreeOrderId: string;
    paymentSessionId: string;
    environment: string;
    appId: string;
  } | null>(null);
  const [verifyingCashfree, setVerifyingCashfree] = useState(false);

  if (items.length === 0) {
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
      setErrorMsg('Please enter a valid 6-digit Indian PIN code (e.g. 400050).');
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

      // Cashfree Payment Gateway: create real payment session
      const sessionRes = await fetch('/api/payments/cashfree/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentTotal,
          customer: contact,
          returnUrl: `${window.location.origin}/order-success`
        })
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Unable to initialize Cashfree payment session.');
      }

      setCashfreeSession({
        cashfreeOrderId: sessionData.cashfreeOrderId,
        paymentSessionId: sessionData.paymentSessionId,
        environment: sessionData.environment || 'sandbox',
        appId: sessionData.appId || 'TEST1029384756CF'
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred initializing payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCashfreePayment = async () => {
    if (!cashfreeSession) return;
    setVerifyingCashfree(true);
    setErrorMsg('');

    try {
      const verifyRes = await fetch('/api/payments/cashfree/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashfreeOrderId: cashfreeSession.cashfreeOrderId,
          paymentSessionId: cashfreeSession.paymentSessionId,
          paymentMethod: cashfreeChannel
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Cashfree verification failed.');
      }

      await submitOrderToBackend({
        cashfreeOrderId: cashfreeSession.cashfreeOrderId,
        paymentSessionId: cashfreeSession.paymentSessionId,
        paymentTransactionId: verifyData.transactionId
      });
      setCashfreeSession(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cashfree payment could not be completed.');
    } finally {
      setVerifyingCashfree(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-8 space-y-6">
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
                    placeholder="Near Linking Road, Bandra West"
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
                      placeholder="Mumbai"
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
                      placeholder="400050"
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Step 4: Cashfree Payment Gateway
                </h2>
                <button onClick={() => setStep(3)} className="text-xs text-neutral-400 hover:text-white">Back</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cashfree')}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    paymentMethod === 'cashfree'
                      ? 'border-[#E5A914] bg-neutral-950 ring-1 ring-[#E5A914]'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">Cashfree Secure Gateway</p>
                    <span className="text-[10px] font-mono text-[#E5A914] font-bold">RECOMMENDED</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">UPI, GPay, PhonePe, Cards, NetBanking, Wallets</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#E5A914] bg-neutral-950 ring-1 ring-[#E5A914]'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                  }`}
                >
                  <p className="text-xs font-bold text-white">Cash on Delivery (COD)</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Pay cash or UPI at your doorstep</p>
                </button>
              </div>

              {paymentMethod === 'cashfree' && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5A914]">
                    Select Preferred Cashfree Mode
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                      { id: 'card', label: 'Cards', icon: CreditCard },
                      { id: 'netbanking', label: 'NetBanking', icon: Building2 },
                      { id: 'wallet', label: 'Wallets', icon: Wallet }
                    ].map(mode => {
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setCashfreeChannel(mode.id as any)}
                          className={`p-2.5 rounded border text-xs flex flex-col items-center gap-1 transition-colors ${
                            cashfreeChannel === mode.id
                              ? 'border-[#E5A914] bg-[#E5A914]/10 text-white font-bold'
                              : 'border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-[#E5A914]" />
                          <span className="text-[11px]">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Clicking below initializes a verified Cashfree payment session and completes settlement before order dispatch.
                  </p>
                </div>
              )}

              <div className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-lg flex items-center gap-3 text-xs text-neutral-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>256-bit TLS encrypted Cashfree PCI-DSS Level 1 compliant checkout.</span>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-neutral-400 hover:text-white py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full sm:w-auto bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-7 py-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Initializing Cashfree...'
                      : paymentMethod === 'cashfree'
                      ? `Pay ₹${currentTotal.toLocaleString()} via Cashfree`
                      : `Confirm COD Order ₹${currentTotal.toLocaleString()}`}
                  </span>
                  <CheckCircle2 className="w-4 h-4" />
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
                  <p className="font-mono text-white font-bold mt-1 tabular-nums">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {coupon && (
            <div className="flex items-center justify-between bg-neutral-950 border border-[#E5A914]/40 px-3 py-2 rounded text-xs">
              <div className="flex items-center gap-1.5 text-[#E5A914]">
                <Tag className="w-3.5 h-3.5" />
                <span className="font-mono font-bold">{coupon.code}</span>
              </div>
              <span className="text-emerald-400 font-mono tabular-nums">-₹{discount.toLocaleString()}</span>
            </div>
          )}

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

      {/* Cashfree Payment Gateway Sheet */}
      {cashfreeSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-neutral-900 px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#E5A914]">
                  CASHFREE PAYMENTS · {cashfreeSession.environment.toUpperCase()}
                </p>
                <h3 className="text-sm font-bold text-white">4 LAZY APPAREL INC.</h3>
              </div>
              <button
                onClick={() => setCashfreeSession(null)}
                className="p-1.5 text-neutral-400 hover:text-white"
                aria-label="Cancel Cashfree Payment"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between bg-neutral-900/70 border border-neutral-800 rounded-lg p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">Order Reference</p>
                  <p className="text-xs font-mono text-white truncate max-w-[190px]">{cashfreeSession.cashfreeOrderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">Amount</p>
                  <p className="text-base font-mono font-bold text-[#E5A914] tabular-nums">₹{currentTotal.toLocaleString()}</p>
                </div>
              </div>

              {cashfreeChannel === 'upi' && (
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400">
                    UPI ID / VPA (GPay · PhonePe · Paytm)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@okaxis"
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-[#E5A914]"
                  />
                </div>
              )}

              {cashfreeChannel === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• 8891"
                      className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM / YY"
                      className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                    />
                  </div>
                </div>
              )}

              {cashfreeChannel === 'netbanking' && (
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400">Select Bank</label>
                  <select className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {cashfreeChannel === 'wallet' && (
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400">Select Wallet</label>
                  <select className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded">
                    <option>Amazon Pay</option>
                    <option>Paytm Wallet</option>
                    <option>PhonePe Wallet</option>
                    <option>MobiKwik</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmCashfreePayment}
                disabled={verifyingCashfree}
                className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verifyingCashfree ? 'Verifying with Cashfree...' : `Authorize ₹${currentTotal.toLocaleString()}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
