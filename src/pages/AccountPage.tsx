import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  LogOut,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { Order, Product } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface AccountPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, logout, token } = useAuth();
  const { wishlistIds } = useWishlist();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // New Address modal state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    apartment: '',
    city: '',
    state: 'Maharashtra',
    pinCode: '',
    country: 'India'
  });

  useEffect(() => {
    if (token) {
      setLoadingOrders(true);
      fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setOrders(data.orders || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'wishlist' && wishlistIds.length > 0) {
      fetch('/api/products')
        .then(r => r.json())
        .then(d => {
          const prods = (d.products || []).filter((p: Product) => wishlistIds.includes(p.id));
          setWishlistProducts(prods);
        });
    }
  }, [activeTab, wishlistIds]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="font-display text-2xl font-bold text-white uppercase">Authentication Required</h2>
        <p className="text-xs text-neutral-400 mt-2">Sign in to access your order history and saved preferences.</p>
        <button
          onClick={() => onNavigate('login')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });
      if (res.ok) {
        setShowAddAddress(false);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await fetch(`/api/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Account Overview Header */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center font-display text-xl font-bold text-[#E5A914] border border-neutral-700">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-white uppercase">{user.name}</h1>
              {user.isEmailVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" /> Verified Customer
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.email} · {user.phone}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider px-3 py-1.5 border border-red-500/20 rounded hover:bg-red-500/10 w-fit"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 gap-6 text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'orders' ? 'border-[#E5A914] text-[#E5A914]' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'addresses' ? 'border-[#E5A914] text-[#E5A914]' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Addresses ({user.addresses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'wishlist' ? 'border-[#E5A914] text-[#E5A914]' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          Wishlist ({wishlistIds.length})
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map(n => <div key={n} className="h-28 bg-neutral-900 rounded-lg animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-xl border border-neutral-800">
              <Package className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white uppercase">No Orders Yet</h3>
              <p className="text-xs text-neutral-400 mt-1">Explore Drop 04 to place your first piece.</p>
              <button
                onClick={() => onNavigate('shop')}
                className="mt-4 bg-[#E5A914] text-black font-extrabold px-5 py-2 text-xs uppercase tracking-widest rounded"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-neutral-800/80">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#E5A914]">{order.orderNumber}</span>
                    <span className="text-xs text-neutral-400 ml-3">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white uppercase px-2.5 py-1 bg-neutral-800 rounded">
                      {order.status}
                    </span>
                    <button
                      onClick={() => onNavigate('track-order', { orderNumber: order.orderNumber, email: order.customer.email })}
                      className="text-xs text-[#E5A914] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Track <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs bg-neutral-950 p-2.5 rounded border border-neutral-800/60">
                      <img src={item.image} alt={item.productTitle} className="w-12 h-14 object-cover rounded bg-neutral-900" />
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">{item.productTitle}</p>
                        <p className="text-[11px] text-neutral-400">{item.colorName} · {item.size}</p>
                        <p className="font-mono font-bold text-white mt-1">₹{item.price.toLocaleString()} × {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs border-t border-neutral-800/60">
                  <span className="text-neutral-400">Total: <strong className="font-mono text-white">₹{order.total.toLocaleString()}</strong></span>
                  <span className="text-neutral-400">{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADDRESSES TAB */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Saved Delivery Destinations</h3>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="bg-[#E5A914] text-black font-extrabold px-4 py-2 rounded text-xs uppercase tracking-widest flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Address
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleCreateAddress} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 max-w-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">New Indian Address</h4>
              <input
                type="text"
                placeholder="Full Name"
                value={newAddress.fullName}
                onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                required
              />
              <input
                type="text"
                placeholder="Mobile Phone"
                value={newAddress.phone}
                onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                required
              />
              <input
                type="text"
                placeholder="Street Address"
                value={newAddress.street}
                onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="6-Digit PIN Code"
                  value={newAddress.pinCode}
                  onChange={e => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddAddress(false)} className="text-xs text-neutral-400 px-3 py-1.5">Cancel</button>
                <button type="submit" className="bg-white text-black font-bold px-4 py-1.5 rounded text-xs">Save Address</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.addresses && user.addresses.length > 0 ? (
              user.addresses.map(addr => (
                <div key={addr.id} className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{addr.fullName}</span>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-neutral-400">{addr.street}</p>
                  <p className="text-neutral-400">{addr.city}, {addr.state} - {addr.pinCode}</p>
                  <p className="text-neutral-400">Phone: {addr.phone}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400">No addresses saved yet.</p>
            )}
          </div>
        </div>
      )}

      {/* WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-16 bg-neutral-900/30 rounded-xl border border-neutral-800">
              <Heart className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white uppercase">Your Wishlist is Empty</h3>
              <p className="text-xs text-neutral-400 mt-1">Tap the heart on any drop to save pieces for later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistProducts.map(p => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
