import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types/index.ts';

interface CouponState {
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  value: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  coupon: CouponState | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  freeShippingThreshold: number;
  freeShippingProgress: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 99;
const TAX_RATE = 0.05;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('4lazy_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<CouponState | null>(() => {
    try {
      const saved = localStorage.getItem('4lazy_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('4lazy_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem('4lazy_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('4lazy_coupon');
      }
    } catch (e) {
      console.error('Error saving coupon:', e);
    }
  }, [coupon]);

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        i => i.productId === newItem.productId && i.variantId === newItem.variantId && i.size === newItem.size
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(updated[existingIndex].maxStock, updated[existingIndex].quantity + newItem.quantity);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };
        return updated;
      }

      const id = `${newItem.productId}_${newItem.variantId}_${newItem.size}_${Date.now()}`;
      return [...prevItems, { ...newItem, id }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prev =>
      prev.map(i => {
        if (i.id === itemId) {
          const finalQty = Math.min(i.maxStock, quantity);
          return { ...i, quantity: finalQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discount = coupon ? coupon.discount : 0;
  const shippingFee = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * TAX_RATE);
  const total = taxableAmount + shippingFee + tax;

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const applyCoupon = async (code: string) => {
    if (!code.trim()) {
      return { success: false, error: 'Please enter a coupon code.' };
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid coupon.' };
      }

      setCoupon({
        code: data.code,
        discount: data.discount,
        type: data.type,
        value: data.value
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to validate coupon.' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        discount,
        shippingFee,
        tax,
        total,
        coupon,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingProgress
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
