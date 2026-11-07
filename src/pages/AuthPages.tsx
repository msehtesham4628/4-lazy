import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthPagesProps {
  mode: 'login' | 'register' | 'forgot-password';
  onNavigate: (page: string, params?: any) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, onNavigate }) => {
  const { login, register, verifyOtp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onNavigate('home');
    } else {
      setErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await register(name, email, phone, password);
    setLoading(false);
    if (res.success) {
      if (res.otpSent) {
        setStep('otp');
        setSuccessMsg('A 6-digit verification code has been dispatched to your email.');
      } else {
        onNavigate('home');
      }
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await verifyOtp(email, otp);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Email verified successfully! Welcome to 4 LAZY.');
      setTimeout(() => {
        onNavigate('home');
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Invalid code.');
    }
  };

  const fillAdmin = () => {
    setEmail('admin@4lazyfashion.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  const fillCustomer = () => {
    setEmail('aryan@example.com');
    setPassword('lazy123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header with Monogram */}
        <div className="text-center space-y-2">
          <img
            src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
            alt="4 LAZY Monogram"
            className="w-12 h-12 mx-auto object-contain rounded"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            {step === 'otp'
              ? 'Verify Email Address'
              : mode === 'login'
              ? 'Sign In to 4 LAZY'
              : mode === 'register'
              ? 'Create Vanguard Account'
              : 'Password Assistance'}
          </h1>
          <p className="text-xs text-neutral-400">
            {step === 'otp'
              ? 'Enter the 6-digit one-time code sent to your email.'
              : mode === 'login'
              ? 'Enter your credentials to manage orders and track shipments.'
              : 'Access limited drops, priority shipping, and private sales.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* OTP VERIFICATION STEP */}
        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                6-Digit Security OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-3 text-center text-xl text-white font-mono tracking-widest rounded focus:outline-none focus:border-[#E5A914]"
                required
                autoFocus
              />
              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Check Admin Console &gt; Email Logs or your inbox for test code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        ) : mode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-[10px] text-[#E5A914] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
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
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* Quick Demo Autofill Helper */}
            <div className="pt-3 border-t border-neutral-800 text-center space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                Quick Test Credentials:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillAdmin}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-xs py-1.5 px-2 rounded text-[#E5A914] font-medium border border-neutral-700"
                >
                  Autofill Admin
                </button>
                <button
                  type="button"
                  onClick={fillCustomer}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-xs py-1.5 px-2 rounded text-neutral-200 font-medium border border-neutral-700"
                >
                  Autofill Customer
                </button>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-neutral-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-white hover:underline font-semibold"
              >
                Create Account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Aryan Verma"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Mobile Number (+91)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9811223344"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Password
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
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg mt-2"
            >
              {loading ? 'Creating...' : 'Register & Receive OTP'}
            </button>

            <div className="pt-2 text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-white hover:underline font-semibold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
