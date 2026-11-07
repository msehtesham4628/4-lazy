import React, { useState, useEffect } from 'react';
import { Package, Search, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Order, OrderStatus } from '../types/index.ts';

interface TrackOrderPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: { orderNumber?: string; email?: string };
}

const ORDER_STATUS_STEPS: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ onNavigate, initialParams }) => {
  const [orderNumber, setOrderNumber] = useState(initialParams?.orderNumber || '');
  const [emailOrPhone, setEmailOrPhone] = useState(initialParams?.email || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim() || !emailOrPhone.trim()) {
      setErrorMsg('Please enter both your Order Number and Email / Phone.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, emailOrPhone })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to locate order.');
      }
      setOrder(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'Order not found.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialParams?.orderNumber && initialParams?.email) {
      handleTrack();
    }
  }, [initialParams]);

  const currentStepIndex = order ? ORDER_STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
          REAL-TIME SHIPMENT DISPATCH
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Track Your 4 LAZY Order
        </h1>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Enter your order reference (e.g. <strong>4L-2026-1001</strong>) and contact email to view live courier transit milestones.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 max-w-2xl mx-auto">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="4L-2026-1001"
                className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white font-mono rounded focus:outline-none focus:border-neutral-600 uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Customer Email or Phone
              </label>
              <input
                type="text"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                placeholder="aryan@example.com"
                className="w-full bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-neutral-400">
              Demo sample: Try <strong>4L-2026-1001</strong> with <strong>aryan@example.com</strong>
            </span>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-6 py-2.5 rounded text-xs uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? 'Locating...' : 'Track Package'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Live Order Timeline Card */}
      {order && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-8">
          
          {/* Top Status Strip */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-neutral-800 gap-4">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Tracking Reference</span>
              <p className="font-mono text-xl font-bold text-white mt-0.5">{order.orderNumber}</p>
              <p className="text-xs text-neutral-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Current Milestone</span>
              <p className="text-sm font-bold text-[#E5A914] uppercase mt-0.5 flex items-center sm:justify-end gap-1.5">
                <Truck className="w-4 h-4" /> {order.status}
              </p>
              {order.tracking?.estimatedDeliveryDate && (
                <p className="text-xs text-neutral-300 mt-1">
                  Est. Delivery: <strong>{order.tracking.estimatedDeliveryDate}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Courier Details Box if dispatched */}
          {order.tracking && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">Logistics Partner</span>
                <p className="font-bold text-white mt-0.5">{order.tracking.courierCompany}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{order.tracking.statusNotes || 'In transit'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">AWB Tracking Number</span>
                <p className="font-mono font-bold text-[#E5A914] mt-0.5">{order.tracking.trackingNumber}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">Destination</span>
                <p className="text-neutral-200 mt-0.5">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              </div>
            </div>
          )}

          {/* Stepper Progress Bar */}
          <div className="py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-6">
              Milestone Progress
            </h3>

            <div className="relative">
              {/* Stepper Items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                {ORDER_STATUS_STEPS.map((st, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={st} className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-[#E5A914] text-black ring-4 ring-[#E5A914]/20'
                            : isDone
                            ? 'bg-white text-black'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isCurrent ? 'text-[#E5A914]' : isDone ? 'text-white' : 'text-neutral-500'}`}>
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status History Logs */}
          <div className="pt-6 border-t border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Transit Log History
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-4 p-3 bg-neutral-950/80 rounded border border-neutral-800/80">
                  <Clock className="w-4 h-4 text-[#E5A914] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white uppercase">{h.status}</span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {h.note && <p className="text-[11px] text-neutral-400 font-sans mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
