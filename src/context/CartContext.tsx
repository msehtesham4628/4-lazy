import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types/index.ts';

interface CouponState {
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
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

  // Helper to sanitize items before saving to localStorage to prevent QuotaExceededError
  const sanitizeForStorage = (cartItems: CartItem[]): CartItem[] => {
    return cartItems.map(item => {
      let sanitizedImage = item.image;
      // If image is a heavy data URL, store a lightweight static fallback
      if (sanitizedImage && sanitizedImage.startsWith('data:') && sanitizedImage.length > 5000) {
        sanitizedImage = '/assets/images/tshirt_custom_print_1794456303137.jpg';
      }

      let sanitizedCustomPrint = item.customPrint;
      if (sanitizedCustomPrint && sanitizedCustomPrint.uploadedGraphicUrl && sanitizedCustomPrint.uploadedGraphicUrl.startsWith('data:') && sanitizedCustomPrint.uploadedGraphicUrl.length > 5000) {
        sanitizedCustomPrint = {
          ...sanitizedCustomPrint,
          uploadedGraphicUrl: '[CUSTOM_GRAPHIC_UPLOADED]'
        };
      }

      return {
        ...item,
        image: sanitizedImage,
        customPrint: sanitizedCustomPrint
      };
    });
  };

  useEffect(() => {
    try {
      const sanitized = sanitizeForStorage(items);
      localStorage.setItem('4lazy_cart', JSON.stringify(sanitized));
    } catch (e) {
      // Safe fallback if origin quota is constrained
      try {
        const minimal = items.map(({ id, productId, variantId, productTitle, colorName, colorHex, size, sku, price, originalPrice, quantity, maxStock }) => ({
          id, productId, variantId, productTitle, colorName, colorHex, size, sku, price, originalPrice, quantity, maxStock, image: '/assets/images/tshirt_custom_print_1794456303137.jpg'
        }));
        localStorage.setItem('4lazy_cart', JSON.stringify(minimal));
      } catch (innerErr) {
        // In-memory cart continues functioning smoothly across session
        console.warn('LocalStorage quota reached, maintaining cart in session memory.');
      }
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
      // Only merge if not a custom print or if identical custom print specs
      const existingIndex = prevItems.findIndex(i => {
        const isSameBase = i.productId === newItem.productId && i.variantId === newItem.variantId && i.size === newItem.size;
        if (!isSameBase) return false;
        if (!i.customPrint && !newItem.customPrint) return true;
        if (i.customPrint && newItem.customPrint) {
          return (
            i.customPrint.placement === newItem.customPrint.placement &&
            i.customPrint.printTechnique === newItem.customPrint.printTechnique &&
            i.customPrint.customText === newItem.customPrint.customText &&
            i.customPrint.fontStyle === newItem.customPrint.fontStyle &&
            i.customPrint.textColor === newItem.customPrint.textColor &&
            i.customPrint.uploadedGraphicUrl === newItem.customPrint.uploadedGraphicUrl
          );
        }
        return false;
      });

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

  const discount = (() => {
    if (!coupon || subtotal <= 0) return 0;
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) return 0;
    if (coupon.type === 'percent') {
      let calc = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount && calc > coupon.maxDiscount) {
        calc = coupon.maxDiscount;
      }
      return Math.min(subtotal, calc);
    }
    return Math.min(subtotal, coupon.value);
  })();

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
        value: data.value,
        minOrderValue: data.minOrderValue || 0,
        maxDiscount: data.maxDiscount
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
