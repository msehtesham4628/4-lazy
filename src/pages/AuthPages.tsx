import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  ArrowLeft,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { OtpInput } from '../components/OtpInput.tsx';
import type { ConfirmationResult } from '../firebase.ts';

interface AuthPagesProps {
  mode: 'login' | 'register' | 'forgot-password';
  returnTo?: string;
  initialMethod?: 'otp' | 'password';
  onNavigate: (page: string, params?: any) => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

export const AuthPages: React.FC<AuthPagesProps> = ({
  mode,
  returnTo,
  initialMethod,
  onNavigate
}) => {
  const {
    login,
    loginWithGoogle,
    sendFirebasePhoneOtp,
    verifyFirebasePhoneOtp,
    confirmFirebasePhoneForReset,
    linkVerifiedFirebasePhone,
    register,
    verifyOtp
  } = useAuth();

  // Login method toggle (Firebase Phone OTP vs Email & Password)
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>(initialMethod || 'otp');

  // Common form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // OTP flow state
  const [step, setStep] = useState<'form' | 'otp' | 'reset-password'>('form');
  const [otpChannel, setOtpChannel] = useState<'firebase-sms' | 'email'>('firebase-sms');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetIdToken, setResetIdToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigateAfterAuth = (role?: string) => {
    if (returnTo) {
      onNavigate(returnTo);
      return;
    }
    onNavigate(role === 'admin' ? 'admin' : 'account');
  };

  useEffect(() => {
    setStep('form');
    setOtp('');
    setErrorMsg('');
    setSuccessMsg('');
    setResendCooldown(0);
    setResetIdToken('');
    setFirebaseConfirmation(null);
  }, [mode]);

  useEffect(() => {
    if (initialMethod) {
      setLoginMethod(initialMethod);
    }
  }, [initialMethod]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      setSuccessMsg(`Signed in with Google as ${res.user?.name || 'Member'}.`);
      setTimeout(() => navigateAfterAuth(res.user?.role), 400);
    } else {
      setErrorMsg(res.error || 'Google sign-in failed.');
    }
  };

  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigateAfterAuth(res.user?.role);
    } else {
      setErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  const handleSendFirebaseOtp = async (
    e: React.FormEvent,
    purpose: 'login' | 'forgot-password'
  ) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await sendFirebasePhoneOtp(phone, 'firebase-recaptcha-container');
    setLoading(false);

    if (res.success && res.confirmationResult) {
      setFirebaseConfirmation(res.confirmationResult);
      setOtpChannel('firebase-sms');
      setOtpPurpose(purpose);
      setMaskedMobile(res.maskedMobile || phone);
      setResendCooldown(30);
      setOtp('');
      setStep('otp');
      setSuccessMsg(`A 6-digit Firebase SMS OTP has been sent to ${res.maskedMobile || phone}.`);
    } else {
      setErrorMsg(res.error || 'Could not send Firebase Phone OTP.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await register(name, email, phone, password);
    if (!res.success) {
      setLoading(false);
      setErrorMsg(res.error || 'Registration failed.');
      return;
    }

    // Attempt Firebase Phone OTP immediately for the newly registered mobile number
    if (phone.replace(/\D/g, '').length >= 10) {
      const fbRes = await sendFirebasePhoneOtp(phone, 'firebase-recaptcha-container');
      setLoading(false);
      if (fbRes.success && fbRes.confirmationResult) {
        setFirebaseConfirmation(fbRes.confirmationResult);
        setOtpChannel('firebase-sms');
        setOtpPurpose('register');
        setMaskedMobile(fbRes.maskedMobile || phone);
        setResendCooldown(30);
        setOtp('');
        setStep('otp');
        setSuccessMsg(`Account created! Enter the 6-digit Firebase OTP sent to ${fbRes.maskedMobile || phone}.`);
        return;
      }
      // If Firebase Phone Auth isn't enabled yet in Console, proceed cleanly with the new account
      navigateAfterAuth('customer');
      return;
    }

    setLoading(false);
    navigateAfterAuth('customer');
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (otpChannel === 'email') {
      const res = await verifyOtp(email, otp);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Email verified successfully. Welcome to 4LAAZY.');
        setTimeout(() => navigateAfterAuth('customer'), 600);
      } else {
        setErrorMsg(res.error || 'Invalid verification code.');
      }
      return;
    }

    if (!firebaseConfirmation) {
      setLoading(false);
      setErrorMsg('Firebase OTP session expired. Please request a fresh code.');
      return;
    }

    if (otpPurpose === 'forgot-password') {
      const res = await confirmFirebasePhoneForReset(firebaseConfirmation, otp);
      setLoading(false);
      if (res.success && res.idToken) {
        setResetIdToken(res.idToken);
        setPassword('');
        setConfirmPassword('');
        setStep('reset-password');
        setSuccessMsg('Mobile verified via Firebase OTP. Choose a new password below.');
      } else {
        setErrorMsg(res.error || 'Invalid Firebase OTP code.');
      }
      return;
    }

    if (otpPurpose === 'register') {
      const res = await linkVerifiedFirebasePhone(firebaseConfirmation, otp);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Mobile number verified with Firebase. Welcome to 4LAAZY.');
        setTimeout(() => navigateAfterAuth(res.user?.role || 'customer'), 500);
      } else {
        setErrorMsg(res.error || 'Invalid Firebase OTP code.');
      }
      return;
    }

    const res = await verifyFirebasePhoneOtp(firebaseConfirmation, otp);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Phone verified with Firebase. Signing you in...');
      setTimeout(() => navigateAfterAuth(res.user?.role), 500);
    } else {
      setErrorMsg(res.error || 'Invalid Firebase OTP code.');
    }
  };

  const handleRetryFirebaseOtp = async () => {
    if (resendCooldown > 0 || retrying) return;
    setRetrying(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await sendFirebasePhoneOtp(phone, 'firebase-recaptcha-container');
    setRetrying(false);
    if (res.success && res.confirmationResult) {
      setFirebaseConfirmation(res.confirmationResult);
      setResendCooldown(30);
      setSuccessMsg(`Fresh Firebase SMS OTP sent to ${maskedMobile}.`);
    } else {
      setErrorMsg(res.error || 'Could not resend Firebase OTP.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: resetIdToken, newPassword: password })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update password.');
        return;
      }
      setSuccessMsg('Password updated successfully. Redirecting to Sign In...');
      setTimeout(() => onNavigate('login', returnTo ? { returnTo } : {}), 900);
    } catch {
      setLoading(false);
      setErrorMsg('Network error updating password.');
    }
  };

  const pageHeading =
    step === 'otp'
      ? otpChannel === 'firebase-sms'
        ? 'Verify Firebase OTP'
        : 'Verify Email Address'
      : step === 'reset-password'
      ? 'Set New Password'
      : mode === 'login'
      ? 'Sign In to 4LAAZY'
      : mode === 'register'
      ? 'Create Vanguard Account'
      : 'Reset Password via Firebase OTP';

  const pageSubhead =
    step === 'otp'
      ? otpChannel === 'firebase-sms'
        ? `Enter the 6-digit Firebase Auth code sent to ${maskedMobile}.`
        : 'Enter the 6-digit one-time code sent to your email.'
      : step === 'reset-password'
      ? 'Your mobile number is verified via Firebase. Create a fresh password below.'
      : returnTo === 'checkout'
      ? 'Sign in with Google, Firebase Phone OTP, or Email to continue straight to Checkout.'
      : mode === 'login'
      ? loginMethod === 'otp'
        ? 'Instant sign-in with Google or a one-time Firebase Phone OTP.'
        : 'Sign in with your email and password to manage orders and invoices.'
      : mode === 'register'
      ? 'Access limited drops, instant GST tax invoices, and verified order tracking.'
      : 'Enter your registered Indian mobile number to receive a Firebase recovery OTP.';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Invisible reCAPTCHA mount point for Firebase Phone Auth */}
        <div id="firebase-recaptcha-container" />

        {/* Checkout redirect notice */}
        {returnTo === 'checkout' && step === 'form' && (
          <div className="p-3 bg-[#E5A914]/10 border border-[#E5A914]/35 rounded-lg text-xs text-[#E5A914] flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Sign in to unlock Secure Checkout &amp; automatic GST invoice delivery.</span>
          </div>
        )}

        {/* Header with Monogram */}
        <div className="text-center space-y-2">
          <img
            src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
            alt="4LAAZY Monogram"
            className="w-12 h-12 mx-auto object-contain rounded"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            {pageHeading}
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">{pageSubhead}</p>
        </div>

        {/* Google Sign-In Button (Login & Register forms) */}
        {(mode === 'login' || mode === 'register') && step === 'form' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              data-testid="google-signin-button"
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-bold py-3 px-4 rounded-lg text-xs tracking-wide flex items-center justify-center gap-2.5 transition-colors shadow-md disabled:opacity-60"
            >
              <GoogleIcon />
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-[#141417] px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                Or continue with
              </span>
              <div className="border-t border-neutral-800 w-full" />
            </div>
          </div>
        )}

        {/* Login Mode Segmented Switcher */}
        {mode === 'login' && step === 'form' && (
          <div
            className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg"
            role="tablist"
            aria-label="Sign in method"
          >
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'otp'}
              onClick={() => {
                setLoginMethod('otp');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-md text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                loginMethod === 'otp'
                  ? 'bg-[#E5A914] text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Firebase OTP</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'password'}
              onClick={() => {
                setLoginMethod('password');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 rounded-md text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                loginMethod === 'password'
                  ? 'bg-[#E5A914] text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email &amp; Password</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-lg"
          >
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP: RESET PASSWORD */}
        {step === 'reset-password' ? (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="reset-new-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-[#E5A914]"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="reset-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-[#E5A914]"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        ) : step === 'otp' ? (
          /* STEP: FIREBASE OTP VERIFICATION */
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="uppercase tracking-wider">
                  {otpChannel === 'firebase-sms' ? '6-Digit Firebase OTP' : '6-Digit Email OTP'}
                </span>
                {otpChannel === 'firebase-sms' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setOtp('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[#E5A914] hover:underline flex items-center gap-1 font-medium"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Change number
                  </button>
                )}
              </div>

              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            {otpChannel === 'firebase-sms' && (
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2 text-xs">
                {resendCooldown > 0 ? (
                  <span className="text-neutral-400 tabular-nums">
                    Resend available in <strong className="text-white">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={handleRetryFirebaseOtp}
                    className="text-[#E5A914] hover:underline font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                    Resend Firebase OTP
                  </button>
                )}
                {otpPurpose === 'register' && (
                  <button
                    type="button"
                    onClick={() => navigateAfterAuth('customer')}
                    className="text-neutral-400 hover:text-white text-[11px]"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            )}
          </form>
        ) : mode === 'forgot-password' ? (
          /* FORGOT PASSWORD VIA FIREBASE PHONE OTP */
          <form onSubmit={e => handleSendFirebaseOtp(e, 'forgot-password')} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="forgot-mobile"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400"
                >
                  Registered Mobile Number (+91)
                </label>
                <span className="text-[10px] font-mono text-[#E5A914] flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Firebase Phone OTP
                </span>
              </div>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded focus-within:border-[#E5A914] transition-colors">
                <span className="px-3 py-2.5 text-xs font-mono text-neutral-400 border-r border-neutral-800 select-none">
                  +91
                </span>
                <input
                  id="forgot-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9811223344"
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Sending Firebase OTP...' : 'Send Firebase Recovery OTP'}
            </button>

            <div className="pt-2 text-center text-xs text-neutral-400">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login', returnTo ? { returnTo } : {})}
                className="text-white hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : mode === 'login' && loginMethod === 'otp' ? (
          /* LOGIN WITH FIREBASE PHONE OTP */
          <form onSubmit={e => handleSendFirebaseOtp(e, 'login')} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-mobile-otp"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400"
                >
                  Mobile Number (+91)
                </label>
                <span className="text-[10px] font-mono text-[#E5A914] flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Firebase Phone OTP
                </span>
              </div>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded focus-within:border-[#E5A914] transition-colors">
                <span className="px-3 py-2.5 text-xs font-mono text-neutral-400 border-r border-neutral-800 select-none">
                  +91
                </span>
                <input
                  id="login-mobile-otp"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9811223344"
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                Receive a 6-digit Firebase Auth verification code via SMS.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Sending Firebase OTP...' : 'Send Firebase OTP'}
            </button>

            <div className="pt-4 border-t border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#E5A914]" />
                  Quick Demo Accounts
                </span>
                <span className="text-neutral-500 font-mono">Firebase Auth</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setErrorMsg('');
                    const res = await login('aryan@example.com', 'lazy123');
                    setLoading(false);
                    if (res.success) navigateAfterAuth(res.user?.role);
                    else setErrorMsg(res.error || 'Failed to sign in.');
                  }}
                  className="w-full bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 p-2.5 rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">Aryan Verma · Buyer</span>
                    <span className="text-[11px] text-neutral-400 font-mono">aryan@example.com · +91 98112 23344</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#E5A914]">Sign In &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setErrorMsg('');
                    const res = await login('admin@4lazyfashion.com', 'admin123');
                    setLoading(false);
                    if (res.success) onNavigate('admin');
                    else setErrorMsg(res.error || 'Failed to sign in.');
                  }}
                  className="w-full bg-[#E5A914]/10 hover:bg-[#E5A914]/20 border border-[#E5A914]/30 p-2.5 rounded-lg text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-[#E5A914] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Super Admin Console
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">admin@4lazyfashion.com</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#E5A914]">Open &rarr;</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-neutral-400">
              New to 4LAAZY?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register', returnTo ? { returnTo } : {})}
                className="text-white hover:underline font-semibold"
              >
                Create Account
              </button>
            </div>
          </form>
        ) : mode === 'login' ? (
          /* LOGIN WITH EMAIL & PASSWORD */
          <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="login-email"
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
                <label
                  htmlFor="login-password"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password', returnTo ? { returnTo } : {})}
                  className="text-[11px] text-[#E5A914] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="login-password"
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

            <div className="pt-4 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#E5A914]" />
                  Instant Demo Accounts
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setEmail('aryan@example.com');
                  setPassword('lazy123');
                  setLoading(true);
                  setErrorMsg('');
                  const res = await login('aryan@example.com', 'lazy123');
                  setLoading(false);
                  if (res.success) navigateAfterAuth(res.user?.role);
                  else setErrorMsg(res.error || 'Failed to login.');
                }}
                className="w-full bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 p-2.5 rounded-lg text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-white block">Aryan Verma · Buyer</span>
                  <span className="text-[11px] text-neutral-400 font-mono">aryan@example.com</span>
                </div>
                <span className="text-[11px] font-semibold text-[#E5A914]">Sign In &rarr;</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setEmail('admin@4lazyfashion.com');
                  setPassword('admin123');
                  setLoading(true);
                  setErrorMsg('');
                  const res = await login('admin@4lazyfashion.com', 'admin123');
                  setLoading(false);
                  if (res.success) onNavigate('admin');
                  else setErrorMsg(res.error || 'Failed to login.');
                }}
                className="w-full bg-[#E5A914]/10 hover:bg-[#E5A914]/20 border border-[#E5A914]/30 p-2.5 rounded-lg text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-[#E5A914] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Super Admin (Founder)
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">admin@4lazyfashion.com</span>
                </div>
                <span className="text-[11px] font-bold text-[#E5A914]">Admin &rarr;</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-neutral-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register', returnTo ? { returnTo } : {})}
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
              <label
                htmlFor="reg-name"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="reg-name"
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
              <label
                htmlFor="reg-email"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="reg-email"
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
              <label
                htmlFor="reg-phone"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Mobile Number (+91)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="reg-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9811223344"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white font-mono rounded focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg mt-2"
            >
              {loading ? 'Creating Account...' : 'Register & Verify via Firebase OTP'}
            </button>

            <div className="pt-2 text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login', returnTo ? { returnTo } : {})}
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
