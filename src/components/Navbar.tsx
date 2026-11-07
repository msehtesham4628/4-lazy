import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, User as UserIcon, Shield, X, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
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
      onNavigate('shop', { search: searchQuery.trim() });
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Top Promotional Announcement Bar */}
      <div className="bg-neutral-900 text-neutral-300 text-[11px] font-medium tracking-widest py-1.5 px-4 text-center border-b border-neutral-800 uppercase flex items-center justify-center gap-3">
        <span>COMPLIMENTARY SHIPPING ACROSS INDIA OVER ₹1,999</span>
        <span className="text-neutral-600 hidden sm:inline">|</span>
        <span className="text-[#E5A914] hidden sm:inline">USE CODE &quot;FIRST4L&quot; FOR ₹500 OFF</span>
      </div>

      {/* Main Header – Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Action Icons) */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single Brand element with Luxury Monogram */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="group flex items-center gap-3 text-left focus:outline-none"
            >
              <img
                src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
                alt="4 LAZY Monogram Logo"
                className="w-10 h-10 object-contain rounded-md transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-[#E5A914] transition-colors leading-none">
                  4 LAZY
                </span>
                <span className="text-[9px] tracking-[0.25em] text-neutral-400 uppercase font-medium mt-1">
                  STREETWEAR
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase text-neutral-300">
            <button
              onClick={() => onNavigate('shop')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
                currentPage === 'shop' ? 'border-[#E5A914] text-white' : 'border-transparent text-neutral-400'
              }`}
            >
              All Drops
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Oversized T-Shirts' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-400 hover:border-b hover:border-neutral-700"
            >
              Oversized Tees
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Hoodies & Sweatshirts' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-400 hover:border-b hover:border-neutral-700"
            >
              Hoodies
            </button>
            <button
              onClick={() => onNavigate('shop', { category: 'Trousers & Cargo' })}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-neutral-400 hover:border-b hover:border-neutral-700"
            >
              Cargos
            </button>
            <button
              onClick={() => onNavigate('about')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentPage === 'about' ? 'text-white border-b border-[#E5A914]' : 'text-neutral-400'
              }`}
            >
              Manifesto
            </button>
          </nav>

          {/* Zone 3: Actions (Search, Wishlist, Account/Admin, Bag) */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search catalog"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Direct Admin Portal Button in Menu Bar */}
            <button
              onClick={() => onNavigate(isAdmin ? 'admin' : 'admin-login')}
              aria-label="Admin Portal"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E5A914] bg-[#E5A914]/10 hover:bg-[#E5A914]/20 border border-[#E5A914]/40 px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isAdmin ? 'Admin Console' : 'Admin Sign In'}</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('wishlist')}
              aria-label="View wishlist"
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#E5A914] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Account / Admin Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User account"
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors flex items-center gap-1.5"
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
                          onClick={() => onNavigate('admin')}
                          className="w-full text-left px-4 py-2.5 text-[#E5A914] font-semibold hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Console
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

            {/* Shopping Bag CTA */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Open cart"
              className="flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-lg border border-neutral-800 transition-colors whitespace-nowrap shrink-0 group"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-neutral-300 group-hover:text-[#E5A914] transition-colors" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#E5A914] text-neutral-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold tracking-wider hidden sm:inline uppercase">
                Bag
              </span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white"
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
                placeholder="Search oversized tees, 500 GSM hoodies, cargos..."
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
          <div className="lg:hidden border-t border-neutral-800 bg-neutral-950 px-6 py-6 space-y-4">
            <div className="flex flex-col space-y-3 text-sm font-semibold tracking-wider uppercase">
              <button
                onClick={() => { onNavigate('shop'); setMobileMenuOpen(false); }}
                className="text-left py-2 text-white border-b border-neutral-900"
              >
                All Drops & Catalog
              </button>
              <button
                onClick={() => { onNavigate('shop', { category: 'Oversized T-Shirts' }); setMobileMenuOpen(false); }}
                className="text-left py-2 text-neutral-400 hover:text-white border-b border-neutral-900"
              >
                Oversized T-Shirts
              </button>
              <button
                onClick={() => { onNavigate('shop', { category: 'Hoodies & Sweatshirts' }); setMobileMenuOpen(false); }}
                className="text-left py-2 text-neutral-400 hover:text-white border-b border-neutral-900"
              >
                500 GSM Hoodies
              </button>
              <button
                onClick={() => { onNavigate('shop', { category: 'Trousers & Cargo' }); setMobileMenuOpen(false); }}
                className="text-left py-2 text-neutral-400 hover:text-white border-b border-neutral-900"
              >
                Pleated Cargos & Pants
              </button>
              <button
                onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
                className="text-left py-2 text-neutral-400 hover:text-white border-b border-neutral-900"
              >
                Manifesto & Brand Story
              </button>
              <button
                onClick={() => { onNavigate('track-order'); setMobileMenuOpen(false); }}
                className="text-left py-2 text-[#E5A914] border-b border-neutral-900"
              >
                Track My Order
              </button>

              <button
                onClick={() => { onNavigate(isAdmin ? 'admin' : 'admin-login'); setMobileMenuOpen(false); }}
                className="text-left py-2 text-[#E5A914] font-bold flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isAdmin ? 'Admin Console' : 'Admin Sign In'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
