import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Truck, ArrowRight, Package } from 'lucide-react';
import { Order } from '../types/index.ts';

interface OrderSuccessPageProps {
  order?: Order;
  onNavigate: (page: string, params?: any) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ order, onNavigate }) => {
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E5A914', '#ffffff', '#27272a']
    });
  }, []);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="w-16 h-16 text-[#E5A914] mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-white uppercase">Order Confirmed</h2>
        <p className="text-xs text-neutral-400 mt-2">Your payment has been verified by the server.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto text-[#E5A914]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-mono tracking-widest text-[#E5A914] uppercase">
          PAYMENT VERIFIED & CONFIRMED
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          Thank you, {order.customer.name}
        </h1>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          We have received your order. A digital invoice and confirmation email has been dispatched to <strong>{order.customer.email}</strong>.
        </p>
      </div>

      {/* Order Card */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        
        {/* Top Summary Bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 border-b border-neutral-800 gap-3">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Order Reference</span>
            <p className="font-mono text-base font-bold text-[#E5A914] mt-0.5">{order.orderNumber}</p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Estimated Delivery</span>
            <p className="text-xs text-white font-medium mt-0.5 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#E5A914]" />
              {order.tracking?.estimatedDeliveryDate || '3 to 5 business days'}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Status</span>
            <p className="text-xs text-emerald-400 font-bold uppercase mt-0.5">{order.status}</p>
          </div>
        </div>

        {/* Ordered Items List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Reserved Pieces
          </h3>
          <div className="space-y-3 divide-y divide-neutral-800/80">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex gap-4 text-xs">
                <img
                  src={item.image}
                  alt={item.productTitle}
                  className="w-16 h-20 object-cover rounded bg-neutral-950 border border-neutral-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{item.productTitle}</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Color: {item.colorName} · Size: {item.size} · SKU: {item.sku}
                    </p>
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-neutral-400">Qty: {item.quantity}</span>
                    <span className="text-white font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Delivery Address */}
        <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1 text-neutral-400">
            <span className="font-bold text-white uppercase tracking-wider block mb-1">
              Delivery Destination:
            </span>
            <p className="text-neutral-200 font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}</p>
            <p>Phone: {order.shippingAddress.phone}</p>
          </div>

          <div className="space-y-1.5 text-neutral-400 sm:text-right">
            <span className="font-bold text-white uppercase tracking-wider block mb-1">
              Payment Summary:
            </span>
            <div className="flex justify-between sm:justify-end gap-6">
              <span>Subtotal:</span>
              <span className="font-mono text-white">₹{order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between sm:justify-end gap-6 text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">-₹{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between sm:justify-end gap-6">
              <span>Shipping:</span>
              <span className="font-mono text-white">{order.shippingFee === 0 ? 'COMPLIMENTARY' : `₹${order.shippingFee}`}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-6 text-sm font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Paid:</span>
              <span className="font-mono text-[#E5A914]">₹{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onNavigate('track-order', { orderNumber: order.orderNumber, email: order.customer.email })}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
            <Package className="w-4 h-4 text-[#E5A914]" />
            Live Shipment Tracker
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
            Continue Browsing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
