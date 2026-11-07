import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminSignInPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminSignInPage: React.FC<AdminSignInPageProps> = ({ onNavigate }) => {
  const { login, isAdmin } = useAuth();
  const [email, setEmail] = useState('admin@4lazyfashion.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (isAdmin) {
    onNavigate('admin');
    return null;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onNavigate('admin');
    } else {
      setErrorMsg(res.error || 'Invalid administrator credentials.');
    }
  };

  const handleQuickAdminLogin = async () => {
    setEmail('admin@4lazyfashion.com');
    setPassword('admin123');
    setLoading(true);
    setErrorMsg('');

    const res = await login('admin@4lazyfashion.com', 'admin123');
    setLoading(false);
    if (res.success) {
      onNavigate('admin');
    } else {
      setErrorMsg(res.error || 'Failed to authenticate.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 space-y-6 shadow-2xl relative">
        
        {/* Top Monogram */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center mx-auto shadow-inner">
            <img
              src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
              alt="4 LAZY Logo"
              className="w-10 h-10 object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#E5A914] uppercase">
              EXECUTIVE PORTAL
            </span>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight mt-0.5">
              Admin Console Sign In
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Authorized access for store management, catalog editing, orders, inventory, returns, and Tally export.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick One-Click Admin Access */}
        <div className="p-3.5 bg-neutral-950 border border-[#E5A914]/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#E5A914]" />
              Super Admin Quick Access
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">1-CLICK</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Instant authentication for evaluation with pre-seeded demo store credentials.
          </p>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={loading}
            className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-2.5 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            {loading ? 'Authenticating...' : 'Sign In as Super Admin'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-neutral-800"></div>
          <span className="px-3 text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Or enter credentials</span>
          <div className="flex-1 border-t border-neutral-800"></div>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@4lazyfashion.com"
                className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-black font-extrabold py-3 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-neutral-500">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-white transition-colors"
          >
            &larr; Return to Storefront
          </button>
        </div>

      </div>
    </div>
  );
};
