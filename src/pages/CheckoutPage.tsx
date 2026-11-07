import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronLeft,
  Tag
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
  const { items, subtotal, discount, shippingFee, tax, total, coupon, clearCart } = useCart();
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

  // Step 3: Shipping Method
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'razorpay' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-white uppercase">Your Bag is Empty</h2>
        <p className="text-xs text-neutral-400 mt-2">Add items to proceed to checkout.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const validateStep1 = () => {
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setErrorMsg('Please enter your full name, email, and phone number.');
      return false;
    }
    if (!contact.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (contact.phone.length < 10) {
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

  const handlePlaceOrder = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
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
          quantity: i.quantity
        })),
        paymentMethod,
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

      // Clear local cart and proceed to success
      clearCart();
      onNavigate('order-success', { order: data.order });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during order placement.');
    } finally {
      setLoading(false);
    }
  };

  const currentShipping = deliveryMethod === 'express' ? 199 : (subtotal >= 1999 ? 0 : 99);
  const currentTotal = subtotal - discount + currentShipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Checkout Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <button
          onClick={() => onNavigate('shop')}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Continue Shopping
        </button>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <Lock className="w-3.5 h-3.5 text-[#E5A914]" />
          <span>256-Bit Encrypted Checkout</span>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#E5A914]' : step > 1 ? 'text-white' : ''}`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-[#E5A914] text-black' : step > 1 ? 'bg-neutral-800 text-white' : 'bg-neutral-900'}`}>1</span>
          Contact
        </button>
        <span className="text-neutral-700">———</span>
        <button
          onClick={() => step > 1 && setStep(2)}
          className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#E5A914]' : step > 2 ? 'text-white' : ''}`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-[#E5A914] text-black' : step > 2 ? 'bg-neutral-800 text-white' : 'bg-neutral-900'}`}>2</span>
          Shipping
        </button>
        <span className="text-neutral-700">———</span>
        <button
          onClick={() => step > 2 && setStep(3)}
          className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#E5A914]' : step > 3 ? 'text-white' : ''}`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-[#E5A914] text-black' : step > 3 ? 'bg-neutral-800 text-white' : 'bg-neutral-900'}`}>3</span>
          Delivery
        </button>
        <span className="text-neutral-700">———</span>
        <button
          onClick={() => step > 3 && setStep(4)}
          className={`flex items-center gap-1.5 ${step === 4 ? 'text-[#E5A914]' : ''}`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 4 ? 'bg-[#E5A914] text-black' : 'bg-neutral-900'}`}>4</span>
          Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Form: Multi-Step Panels */}
        <div className="lg:col-span-7 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Contact Information */}
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
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Email Address (for Receipt & Tracking)</label>
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
                  className="bg-[#E5A914] text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#d49b10]"
                >
                  Continue to Shipping
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Address */}
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
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Apartment, Suite, Landmark (Optional)</label>
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
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">PIN Code (6 Digits)</label>
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

              <div className="pt-4 flex justify-between">
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
                  Continue to Delivery Method
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Shipping Method */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Step 3: Select Delivery Speed
                </h2>
                <button onClick={() => setStep(2)} className="text-xs text-neutral-400 hover:text-white">Back</button>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setDeliveryMethod('standard')}
                  className={`flex items-start justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                    deliveryMethod === 'standard'
                      ? 'border-[#E5A914] bg-neutral-950'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#E5A914] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Standard Inspected Courier (Blue Dart / Delhivery)</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Delivered in 3 to 5 business days with live SMS tracking.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {subtotal >= 1999 ? 'COMPLIMENTARY' : '₹99'}
                  </span>
                </label>

                <label
                  onClick={() => setDeliveryMethod('express')}
                  className={`flex items-start justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                    deliveryMethod === 'express'
                      ? 'border-[#E5A914] bg-neutral-950'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-[#E5A914] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Express Air Priority (Blue Dart Apex)</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Guaranteed 24-48 hours delivery across metro cities.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    ₹199
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between">
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
                  Continue to Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Step 4: Select Payment Provider
                </h2>
                <button onClick={() => setStep(3)} className="text-xs text-neutral-400 hover:text-white">Back</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[#E5A914] bg-neutral-950 ring-1 ring-[#E5A914]'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                  }`}
                >
                  <p className="text-xs font-bold text-white">Instant UPI</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">GPay, PhonePe, Paytm, QR</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-[#E5A914] bg-neutral-950 ring-1 ring-[#E5A914]'
                      : 'border-neutral-800 bg-neutral-950/40 text-neutral-400'
                  }`}
                >
                  <p className="text-xs font-bold text-white">Card / NetBanking</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Visa, Mastercard, RuPay</p>
                </button>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400">
                    Enter Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. aryan@okaxis or mobile@paytm"
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-400">
                    A collect request or QR will be validated server-side upon confirmation.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
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
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">MM / YY</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white font-mono rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-lg flex items-center gap-3 text-xs text-neutral-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Payments are processed with 256-bit bank grade encryption. Inventory is reserved in real-time.
                </span>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-8 py-4 rounded text-xs uppercase tracking-widest flex items-center gap-2 transition-transform active:scale-95 shadow-xl disabled:opacity-50"
                >
                  {loading ? 'Processing Order...' : `Pay ₹${currentTotal.toLocaleString()} & Confirm`}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Order Summary & Receipt Breakdown */}
        <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 space-y-5">
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
                <div className="flex-1">
                  <p className="font-semibold text-white leading-tight line-clamp-1">{item.productTitle}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {item.colorName} · Size {item.size} · Qty {item.quantity}
                  </p>
                  <p className="font-mono text-white font-bold mt-1">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Active Badge */}
          {coupon && (
            <div className="flex items-center justify-between bg-neutral-950 border border-[#E5A914]/40 px-3 py-2 rounded text-xs">
              <div className="flex items-center gap-1.5 text-[#E5A914]">
                <Tag className="w-3.5 h-3.5" />
                <span className="font-mono font-bold">{coupon.code}</span>
              </div>
              <span className="text-emerald-400 font-mono">-₹{discount.toLocaleString()}</span>
            </div>
          )}

          {/* Detailed Calculations */}
          <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-neutral-200">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Privilege</span>
                <span className="font-mono">-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee ({deliveryMethod})</span>
              <span className="font-mono text-neutral-200">
                {currentShipping === 0 ? 'COMPLIMENTARY' : `₹${currentShipping}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GST Included (5%)</span>
              <span className="font-mono text-neutral-200">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Payable</span>
              <span className="font-mono text-lg text-[#E5A914]">₹{currentTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
