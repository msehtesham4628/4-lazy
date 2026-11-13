import React, { useState } from 'react';
import { CATEGORY_ROUTE_META } from '../utils/routes.ts';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-xs">
      {/* Upper Newsletter & VIP Membership Strip */}
      <div className="border-b border-neutral-800/80 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md text-center md:text-left">
            <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
              JOIN THE 4LAAZY VANGUARD
            </h3>
            <p className="text-neutral-400 mt-1 text-xs">
              Receive secret drop passwords, early release access, and private editorial lookbooks.
            </p>
          </div>

          <div className="w-full md:w-auto">
            {subscribed ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded text-xs font-semibold">
                Welcome to the private vanguard. Check your inbox for your exclusive code.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md w-full mx-auto md:mx-0">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600 w-full sm:w-72"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-5 py-2.5 rounded text-xs uppercase tracking-widest whitespace-nowrap transition-colors shrink-0"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          
          {/* Brand Manifesto & Monogram */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
                alt="4LAAZY Monogram"
                className="w-10 h-10 object-contain rounded"
                referrerPolicy="no-referrer"
              />
              <span className="font-display text-2xl font-black text-white tracking-wider">
                4LAAZY
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-xs max-w-sm">
              Modern luxury streetwear engineered exclusively around T-shirts. Heavyweight 280–320 GSM combed cotton, architectural collars, and bespoke studio prints.
            </p>
            <div className="pt-2 text-[11px] text-neutral-400">
              <p>Studio Concierge: concierge@4lazyfashion.com</p>
              <p>Headquarters: Jubilee Hills, Hyderabad, Telangana, India</p>
            </div>
          </div>

          {/* Catalog Columns */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-widest text-[11px]">
              T-Shirt Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('shop', { category: 'trending' })} className="hover:text-white transition-colors">
                  Trending Products
                </button>
              </li>
              {CATEGORY_ROUTE_META.map(cat => (
                <li key={cat.slug}>
                  <button
                    onClick={() => onNavigate('shop', { category: cat.name })}
                    className="hover:text-white transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Concierge */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-widest text-[11px]">
              Customer Care
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('track-order')} className="text-[#E5A914] hover:underline font-medium">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('account')} className="hover:text-white transition-colors">
                  Customer Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('size-guide')} className="hover:text-white transition-colors">
                  Sizing &amp; Fit Matrix
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping-returns')} className="hover:text-white transition-colors">
                  Complimentary Shipping &amp; Returns
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact Concierge
                </button>
              </li>
            </ul>
          </div>

          {/* Policies & Institutional */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white uppercase tracking-widest text-[11px]">
              Policies
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  Brand Manifesto
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy-policy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping-returns')} className="hover:text-white transition-colors">
                  Cancellation &amp; Refund Terms
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Payment Logos & Copyright */}
        <div className="mt-10 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} 4LAAZY APPAREL INC. LESS EFFORT. MORE STYLE. ALL RIGHTS RESERVED.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-neutral-300 font-mono text-[10px]">
            <span className="text-[#E5A914] font-bold">CASHFREE</span>
            <span>·</span>
            <span>UPI</span>
            <span>·</span>
            <span>VISA</span>
            <span>·</span>
            <span>MASTERCARD</span>
            <span>·</span>
            <span>NETBANKING</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
