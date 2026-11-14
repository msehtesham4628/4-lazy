import React, { useState, useEffect, useCallback } from 'react';
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
import { PaymentStatusPage } from './pages/PaymentStatusPage.tsx';
import { TrackOrderPage } from './pages/TrackOrderPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AuthPages } from './pages/AuthPages.tsx';
import { PolicyPages } from './pages/PolicyPages.tsx';
import { CustomizeStudioPage } from './pages/CustomizeStudioPage.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminSignInPage } from './pages/admin/AdminSignInPage.tsx';
import {
  VALID_DASHBOARD_TABS,
  categoryToSlug,
  resolveCategoryFromSlugOrName
} from './utils/routes.ts';

function parseRouteFromPath(pathname: string): { page: string; params: Record<string, any> } {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  const segments = clean.split('/').filter(Boolean);

  if (clean === '/' || clean === '/home') {
    return { page: 'home', params: {} };
  }

  // Dashboard nested routes: /dashbord/:tab, /dashboard/:tab, /admin/:tab
  if (segments[0] === 'dashbord' || segments[0] === 'dashboard' || segments[0] === 'admin') {
    if (segments[1] === 'login') {
      return { page: 'admin-login', params: {} };
    }
    const rawTab = (segments[1] || 'overview').toLowerCase();
    const validTab = (VALID_DASHBOARD_TABS as readonly string[]).includes(rawTab)
      ? rawTab
      : 'overview';
    return { page: 'admin', params: { tab: validTab } };
  }

  if (clean === '/admin-login') {
    return { page: 'admin-login', params: {} };
  }

  // 3D Studio shortcuts
  if (
    clean === '/customize' ||
    clean === '/customise' ||
    clean === '/custom' ||
    clean === '/home/customise-t-shirt/studio' ||
    clean === '/home/customise/studio'
  ) {
    return { page: 'customize', params: {} };
  }

  // Nested /home/:categorySlug and /home/:categorySlug/:productSlug
  if (segments[0] === 'home' && segments.length >= 2) {
    const resolvedCategory = resolveCategoryFromSlugOrName(segments[1]);
    if (segments.length >= 3) {
      return {
        page: 'product-detail',
        params: { category: resolvedCategory, slug: segments[2] }
      };
    }
    return {
      page: 'shop',
      params: { category: resolvedCategory }
    };
  }

  if (segments[0] === 'products' && segments[1]) {
    return { page: 'product-detail', params: { slug: segments[1] } };
  }

  if (segments[0] === 'shop') {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      page: 'shop',
      params: {
        category: searchParams.get('category')
          ? resolveCategoryFromSlugOrName(searchParams.get('category') || undefined)
          : 'all',
        search: searchParams.get('search') || ''
      }
    };
  }

  if (segments[0] === 'payment-status' || segments[0] === 'order-success') {
    const searchParams = new URLSearchParams(window.location.search);
    const cfOrderId = searchParams.get('order_id') || searchParams.get('orderId') || '';
    if (segments[0] === 'payment-status' || cfOrderId) {
      return { page: 'payment-status', params: { orderId: cfOrderId } };
    }
    return { page: 'order-success', params: {} };
  }

  if (
    ['checkout', 'account', 'wishlist', 'track-order', 'login', 'register', 'forgot-password', 'about', 'contact', 'shipping-returns', 'privacy-policy', 'terms', 'size-guide'].includes(
      segments[0]
    )
  ) {
    return { page: segments[0], params: {} };
  }

  return { page: 'home', params: {} };
}

function buildPathForRoute(page: string, params: Record<string, any> = {}): string {
  switch (page) {
    case 'home':
      return '/home';
    case 'shop': {
      const catSlug = categoryToSlug(params.category || 'all');
      const query = params.search ? `?search=${encodeURIComponent(params.search)}` : '';
      return `/home/${catSlug}${query}`;
    }
    case 'product-detail': {
      const catSlug = categoryToSlug(params.category || 'round-neck-t-shirt');
      return `/home/${catSlug}/${params.slug || ''}`;
    }
    case 'customize':
      return '/home/customise-t-shirt/studio';
    case 'admin': {
      const tab = (VALID_DASHBOARD_TABS as readonly string[]).includes(params.tab)
        ? params.tab
        : 'overview';
      return `/dashbord/${tab}`;
    }
    case 'admin-login':
      return '/admin-login';
    case 'order-success':
      return '/order-success';
    default:
      return `/${page}`;
  }
}

export default function App() {
  const initialRoute = parseRouteFromPath(window.location.pathname);
  const [currentPage, setCurrentPage] = useState<string>(initialRoute.page);
  const [pageParams, setPageParams] = useState<any>(initialRoute.params);

  useEffect(() => {
    const onPopState = () => {
      const next = parseRouteFromPath(window.location.pathname);
      setCurrentPage(next.page);
      setPageParams(next.params);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = useCallback((page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const newPath = buildPathForRoute(page, params);
    if (window.location.pathname + window.location.search !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, []);

  const handleDashboardTabChange = useCallback((tab: string) => {
    const validTab = (VALID_DASHBOARD_TABS as readonly string[]).includes(tab) ? tab : 'overview';
    setPageParams((prev: any) => ({ ...prev, tab: validTab }));
    const targetPath = `/dashbord/${validTab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, []);

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'shop':
        return <ShopPage onNavigate={handleNavigate} initialParams={pageParams} />;
      case 'customize':
        return <CustomizeStudioPage onNavigate={handleNavigate} />;
      case 'product-detail':
        return (
          <ProductDetailPage
            slug={pageParams.slug || 'signature-heavy-combed-round-neck-t-shirt'}
            categoryHint={pageParams.category}
            onNavigate={handleNavigate}
          />
        );
      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} />;
      case 'payment-status':
        return <PaymentStatusPage orderId={pageParams.orderId} onNavigate={handleNavigate} />;
      case 'order-success':
        return <OrderSuccessPage order={pageParams.order} onNavigate={handleNavigate} />;
      case 'track-order':
        return <TrackOrderPage onNavigate={handleNavigate} initialParams={pageParams} />;
      case 'account':
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
        return (
          <AdminDashboard
            onNavigate={handleNavigate}
            initialTab={pageParams.tab}
            onTabChange={handleDashboardTabChange}
          />
        );
      case 'admin-login':
        return <AdminSignInPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  const isAdminView = currentPage === 'admin';

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-[#f4f4f5] overflow-x-clip">
            {!isAdminView && (
              <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
            )}

            <main className="flex-1 min-w-0">
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
