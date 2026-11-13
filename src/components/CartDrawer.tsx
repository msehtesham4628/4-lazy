import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  onNavigate: (page: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    coupon,
    applyCoupon,
    removeCoupon,
    freeShippingThreshold,
    freeShippingProgress
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');

    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.error || 'Failed to apply coupon.');
    } else {
      setCouponInput('');
    }
    setIsApplyingCoupon(false);
  };

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 text-neutral-100 flex flex-col shadow-2xl">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold uppercase tracking-wider text-white">
                Shopping Bag
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({items.reduce((s, i) => s + i.quantity, 0)})
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-neutral-400 mb-1.5">
                Add <span className="text-[#E5A914] font-semibold">₹{remainingForFreeShipping.toLocaleString()}</span> more for complimentary shipping.
              </p>
            ) : (
              <p className="text-emerald-400 font-medium mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> You unlocked Complimentary Express Shipping!
              </p>
            )}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#E5A914] h-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-neutral-800/60">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4 text-neutral-500">
                  <Tag className="w-8 h-8" />
                </div>
                <h3 className="font-display text-base font-semibold text-white uppercase tracking-wider mb-1">
                  Your bag is empty
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-6">
                  Explore our latest brutalist heavyweight drops and oversized cuts.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('shop');
                  }}
                  className="bg-white text-neutral-950 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors rounded"
                >
                  Explore Drops
                </button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-neutral-950 rounded-md overflow-hidden shrink-0 border border-neutral-800">
                    <img
                      src={item.image}
                      alt={item.productTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                          {item.productTitle}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-neutral-700"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          {item.colorName}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-neutral-300">Size: {item.size}</span>
                      </div>

                      {item.customPrint && (
                        <div className="mt-1.5 p-1.5 bg-neutral-950/80 border border-[#E5A914]/30 rounded text-[10px] space-y-0.5">
                          <div className="flex items-center justify-between text-[#E5A914] font-medium">
                            <span className="uppercase tracking-wider">Custom Print</span>
                            <span className="text-neutral-400 capitalize">{item.customPrint.placement.replace('-', ' ')}</span>
                          </div>
                          <p className="text-neutral-300">Technique: {item.customPrint.printTechnique}</p>
                          {item.customPrint.customText && (
                            <p className="text-neutral-400 truncate italic">"{item.customPrint.customText}" ({item.customPrint.fontStyle})</p>
                          )}
                          {item.customPrint.uploadedGraphicUrl && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {(item.customPrint.uploadedGraphicUrl.startsWith('data:') ||
                                item.customPrint.uploadedGraphicUrl.startsWith('/') ||
                                item.customPrint.uploadedGraphicUrl.startsWith('http')) && (
                                <img
                                  src={item.customPrint.uploadedGraphicUrl}
                                  alt="Custom graphic"
                                  className="w-6 h-6 object-contain rounded bg-neutral-900 border border-neutral-800 shrink-0"
                                />
                              )}
                              <span className="text-emerald-400 text-[9px]">Custom Graphic Uploaded</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-700 rounded bg-neutral-950">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-neutral-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="px-2 py-1 text-neutral-400 hover:text-white disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono text-xs font-bold text-white">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Calculations & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-6 bg-neutral-950 border-t border-neutral-800 space-y-4">
              
              {/* Coupon Form */}
              {coupon ? (
                <div className="flex items-center justify-between bg-neutral-900 border border-[#E5A914]/40 px-3 py-2 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#E5A914]" />
                    <span className="font-mono font-bold text-[#E5A914]">{coupon.code}</span>
                    <span className="text-neutral-400">(-₹{coupon.discount})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-500 hover:text-red-400 text-[11px] uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code (e.g. FIRST4L)"
                    className="flex-1 bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white rounded focus:outline-none focus:border-neutral-600 uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-neutral-200">₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Privilege Discount</span>
                    <span className="font-mono">-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-mono text-neutral-200">
                    {shippingFee === 0 ? 'COMPLIMENTARY' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST Included (5%)</span>
                  <span className="font-mono text-neutral-200">₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-base text-[#E5A914]">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('checkout');
                  }}
                  className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 px-4 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                >
                  Proceed to Secure Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center text-xs text-neutral-400 hover:text-white py-1.5"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
