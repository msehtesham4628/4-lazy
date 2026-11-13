import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, User as UserIcon, Shield, X, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { CATEGORY_ROUTE_META } from '../utils/routes.ts';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const { items, setIsCartOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('shop', { category: 'trending', search: searchQuery.trim() });
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Non-sticky Announcement Strip */}
      <div className="bg-neutral-900 text-neutral-300 text-[10px] sm:text-[11px] font-medium tracking-widest py-1.5 px-3 text-center border-b border-neutral-800 uppercase flex items-center justify-center gap-3">
        <span className="truncate">COMPLIMENTARY SHIPPING ACROSS INDIA OVER ₹1,999</span>
        <span className="text-neutral-600 hidden sm:inline">|</span>
        <span className="text-[#E5A914] hidden sm:inline whitespace-nowrap">USE CODE &quot;FIRST4L&quot; FOR ₹500 OFF</span>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Zone 1: Brand Monogram */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="group flex items-center gap-2.5 text-left focus:outline-none min-h-[44px]"
            >
              <img
                src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
                alt="4LAAZY Monogram Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-md transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-[#E5A914] transition-colors leading-none whitespace-nowrap">
                  4LAAZY
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.22em] text-neutral-400 uppercase font-medium mt-0.5 whitespace-nowrap">
                  STREETWEAR
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Desktop Category Navigation (6 T-Shirt Categories cleanly, no All T-Shirts or 3D pill) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-[11px] font-semibold tracking-wider uppercase text-neutral-300">
            <button
              onClick={() => onNavigate('shop', { category: 'Round Neck T-Shirt' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-300 hover:border-b hover:border-neutral-600"
            >
              Round Neck
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Polo Neck T-Shirt' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-300 hover:border-b hover:border-neutral-600"
            >
              Polo
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Down Shoulder T-Shirt' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-300 hover:border-b hover:border-neutral-600"
            >
              Down Shoulder
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Customise T-Shirt' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-300 hover:border-b hover:border-neutral-600"
            >
              Customise
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Laazy Designs' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-300 hover:border-b hover:border-neutral-600"
            >
              Laazy Designs
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Limited Design' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-[#E5A914] hover:border-b hover:border-[#E5A914]"
            >
              Limited Design
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search catalog"
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate(isAdmin ? 'admin' : 'admin-login', isAdmin ? { tab: 'overview' } : {})}
              aria-label="Admin Portal"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E5A914] bg-[#E5A914]/10 hover:bg-[#E5A914]/20 border border-[#E5A914]/40 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isAdmin ? 'Dashboard' : 'Admin'}</span>
            </button>

            <button
              onClick={() => onNavigate('wishlist')}
              aria-label="View wishlist"
              className="hidden xs:flex sm:flex p-2 min-w-[40px] min-h-[40px] items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#E5A914] text-black text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User account"
                className="p-2 min-w-[40px] min-h-[40px] text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                {isAdmin ? (
                  <Shield className="w-5 h-5 text-[#E5A914]" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
                {user && (
                  <span className="hidden xl:inline text-xs text-neutral-300 font-medium max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                )}
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-2 z-50 text-xs"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-neutral-800">
                        <p className="font-semibold text-white truncate">{user.name}</p>
                        <p className="text-neutral-400 text-[11px] truncate">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#E5A914] bg-[#E5A914]/10 px-1.5 py-0.5 rounded">
                            Super Admin
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => onNavigate('admin', { tab: 'overview' })}
                          className="w-full text-left px-4 py-2.5 text-[#E5A914] font-semibold hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate('account')}
                        className="w-full text-left px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      >
                        Customer Dashboard
                      </button>
                      <button
                        onClick={() => onNavigate('track-order')}
                        className="w-full text-left px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      >
                        Track Order
                      </button>
                      <div className="border-t border-neutral-800 my-1"></div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-neutral-800"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onNavigate('login')}
                        className="w-full text-left px-4 py-2 text-white font-medium hover:bg-neutral-800"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => onNavigate('register')}
                        className="w-full text-left px-4 py-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      >
                        Create Account
                      </button>
                      <button
                        onClick={() => onNavigate('track-order')}
                        className="w-full text-left px-4 py-2 text-neutral-400 hover:bg-neutral-800 hover:text-white border-t border-neutral-800 mt-1"
                      >
                        Track Order (Guest)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Open cart"
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 sm:px-3.5 py-2 min-h-[40px] rounded-lg border border-neutral-800 transition-colors whitespace-nowrap shrink-0 group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-300 group-hover:text-[#E5A914] transition-colors" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#E5A914] text-neutral-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tracking-wider hidden sm:inline uppercase">
                Bag
              </span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-300 hover:text-white rounded-md hover:bg-neutral-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar Expansion */}
        {searchOpen && (
          <div className="border-t border-neutral-800 bg-neutral-900/95 px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search round neck, polo, down shoulder, customise, laazy designs..."
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-neutral-500 font-medium"
                autoFocus
              />
              <button
                type="submit"
                className="bg-neutral-800 hover:bg-neutral-700 text-xs text-white px-3 py-1.5 rounded font-semibold uppercase tracking-wider shrink-0"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-800 bg-neutral-950 px-5 py-4 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            <div className="flex flex-col text-sm font-semibold tracking-wider uppercase divide-y divide-neutral-900">
              <button
                onClick={() => { onNavigate('shop', { category: 'trending' }); setMobileMenuOpen(false); }}
                className="text-left py-3 min-h-[44px] text-[#E5A914] font-bold flex items-center justify-between"
              >
                <span>Trending Products</span>
                <span className="text-[10px] font-mono text-neutral-400">VIEW</span>
              </button>
              {CATEGORY_ROUTE_META.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    onNavigate('shop', { category: cat.name });
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-3 min-h-[44px] text-neutral-300 hover:text-white flex items-center justify-between"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono text-neutral-500">VIEW</span>
                </button>
              ))}
              <button
                onClick={() => { onNavigate('wishlist'); setMobileMenuOpen(false); }}
                className="text-left py-3 min-h-[44px] text-neutral-300 hover:text-white flex items-center justify-between"
              >
                <span>Saved Wishlist</span>
                <span className="text-xs font-mono text-[#E5A914] tabular-nums">{wishlistIds.length}</span>
              </button>
              <button
                onClick={() => { onNavigate('track-order'); setMobileMenuOpen(false); }}
                className="text-left py-3 min-h-[44px] text-neutral-400 hover:text-white"
              >
                Track My Order
              </button>
              <button
                onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
                className="text-left py-3 min-h-[44px] text-neutral-400 hover:text-white"
              >
                Brand Story
              </button>
              <button
                onClick={() => {
                  onNavigate(isAdmin ? 'admin' : 'admin-login', isAdmin ? { tab: 'overview' } : {});
                  setMobileMenuOpen(false);
                }}
                className="text-left py-3 min-h-[44px] text-[#E5A914] font-bold flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isAdmin ? 'Admin Dashboard' : 'Admin Sign In'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
