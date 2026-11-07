import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderSuccessPage } from './pages/OrderSuccessPage.tsx';
import { TrackOrderPage } from './pages/TrackOrderPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AuthPages } from './pages/AuthPages.tsx';
import { PolicyPages } from './pages/PolicyPages.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});

  // Sync with browser URL pathname on initial load
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/products/')) {
      const slug = path.replace('/products/', '');
      setCurrentPage('product-detail');
      setPageParams({ slug });
    } else if (path === '/shop') {
      setCurrentPage('shop');
    } else if (path === '/checkout') {
      setCurrentPage('checkout');
    } else if (path === '/account') {
      setCurrentPage('account');
    } else if (path === '/track-order') {
      setCurrentPage('track-order');
    } else if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/register') {
      setCurrentPage('register');
    } else if (['/about', '/contact', '/privacy-policy', '/terms', '/shipping-returns'].includes(path)) {
      setCurrentPage(path.replace('/', ''));
    }
  }, []);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL silently
    let newPath = '/';
    if (page === 'product-detail' && params.slug) {
      newPath = `/products/${params.slug}`;
    } else if (page !== 'home') {
      newPath = `/${page}`;
    }
    window.history.pushState({}, '', newPath);
  };

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'shop':
        return <ShopPage onNavigate={handleNavigate} initialParams={pageParams} />;
      case 'product-detail':
        return <ProductDetailPage slug={pageParams.slug || 'heavyweight-oversized-box-tee'} onNavigate={handleNavigate} />;
      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} />;
      case 'order-success':
        return <OrderSuccessPage order={pageParams.order} onNavigate={handleNavigate} />;
      case 'track-order':
        return <TrackOrderPage onNavigate={handleNavigate} initialParams={pageParams} />;
      case 'account':
        return <AccountPage onNavigate={handleNavigate} />;
      case 'wishlist':
        return <AccountPage onNavigate={handleNavigate} />;
      case 'login':
        return <AuthPages mode="login" onNavigate={handleNavigate} />;
      case 'register':
        return <AuthPages mode="register" onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <AuthPages mode="forgot-password" onNavigate={handleNavigate} />;
      case 'about':
      case 'contact':
      case 'shipping-returns':
      case 'privacy-policy':
      case 'terms':
      case 'size-guide':
        return <PolicyPages page={currentPage as any} onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isAdminView = currentPage === 'admin';

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f4f5]">
            {!isAdminView && (
              <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
            )}

            <main className="flex-1">
              {renderCurrentView()}
            </main>

            {!isAdminView && (
              <Footer onNavigate={handleNavigate} />
            )}

            {/* Persistent Luxury Slide-Out Cart Drawer */}
            <CartDrawer onNavigate={handleNavigate} />
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
