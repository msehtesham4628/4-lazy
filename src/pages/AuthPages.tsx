import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Flame,
  MapPin,
  Eye,
  EyeOff,
  Send,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { OtpInput } from '../components/OtpInput.tsx';
import {
  INDIAN_STATES,
  GENDER_OPTIONS,
  parseLoginIdentifier,
  validateRegistrationStep1,
  validateRegistrationStep2,
  type GenderOption
} from '../utils/authValidation.ts';
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

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, returnTo, onNavigate }) => {
  const {
    login,
    loginWithGoogle,
    sendFirebasePhoneOtp,
    confirmFirebasePhoneForReset,
    sendRegistrationEmailOtp,
    verifyRegistrationEmailOtp,
    register
  } = useAuth();

  // Login state (Mail / Mobile Number + Password)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // 3-Step Registration State
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  // Step 1: Personal
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [gender, setGender] = useState<GenderOption>('Male');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  // Step 2: Address
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [stateName, setStateName] = useState('Telangana');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  // Step 3: Verify Mail (Resend) & Mobile (Firebase)
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailDeliveryMode, setEmailDeliveryMode] = useState<'resend' | 'smtp' | 'logged' | null>(null);
  const [devEmailOtp, setDevEmailOtp] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileMasked, setMobileMasked] = useState('');
  const [mobileConfirmation, setMobileConfirmation] = useState<ConfirmationResult | null>(null);
  const [verifiedFirebaseIdToken, setVerifiedFirebaseIdToken] = useState('');
  const [mobileSending, setMobileSending] = useState(false);
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileCooldown, setMobileCooldown] = useState(0);

  // Forgot Password (Firebase Phone OTP)
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp' | 'reset'>('phone');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotMasked, setForgotMasked] = useState('');
  const [forgotConfirmation, setForgotConfirmation] = useState<ConfirmationResult | null>(null);
  const [resetIdToken, setResetIdToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Global status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
    setErrorMsg('');
    setSuccessMsg('');
    setRegStep(1);
    setForgotStep('phone');
    setForgotOtp('');
    setResetIdToken('');
  }, [mode]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const id = window.setInterval(() => setEmailCooldown(c => (c > 1 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [emailCooldown]);

  useEffect(() => {
    if (mobileCooldown <= 0) return;
    const id = window.setInterval(() => setMobileCooldown(c => (c > 1 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [mobileCooldown]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const id = window.setInterval(() => setForgotCooldown(c => (c > 1 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [forgotCooldown]);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      setSuccessMsg(`Signed in with Google as ${res.user?.name || 'Member'}.`);
      setTimeout(() => navigateAfterAuth(res.user?.role), 350);
    } else {
      setErrorMsg(res.error || 'Google sign-in failed.');
    }
  };

  // Login Submit (Email OR Mobile Number + Password)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const check = parseLoginIdentifier(loginIdentifier);
    if (!check.valid) {
      setErrorMsg(check.error || 'Enter a valid email address or mobile number.');
      return;
    }

    setLoading(true);
    const res = await login(loginIdentifier, loginPassword);
    setLoading(false);
    if (res.success) {
      navigateAfterAuth(res.user?.role);
    } else {
      setErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  // Registration Step 1 -> Step 2
  const handleRegStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const check = validateRegistrationStep1({
      firstName,
      secondName,
      mobile: regMobile,
      email: regEmail,
      gender,
      password: regPassword,
      confirmPassword: regConfirmPassword
    });
    if (!check.valid) {
      setErrorMsg(check.error || 'Please fill in all required fields.');
      return;
    }
    setRegStep(2);
  };

  // Send Registration Email OTP via Resend
  const triggerEmailOtpSend = async () => {
    setEmailSending(true);
    setErrorMsg('');
    const res = await sendRegistrationEmailOtp(regEmail, firstName, regMobile);
    setEmailSending(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not send email verification code.');
      return false;
    }
    setEmailOtpSent(true);
    setEmailVerified(false);
    setEmailDeliveryMode(res.deliveryMode || 'logged');
    setDevEmailOtp(res.devOtp || null);
    setEmailCooldown(30);
    setSuccessMsg(res.message || `Verification OTP sent to ${regEmail}.`);
    return true;
  };

  // Registration Step 2 -> Step 3 (also dispatches Resend Email OTP)
  const handleRegStep2Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const check = validateRegistrationStep2({
      address1,
      address2,
      state: stateName,
      city,
      pinCode
    });
    if (!check.valid) {
      setErrorMsg(check.error || 'Please complete your address details.');
      return;
    }

    setLoading(true);
    const sent = await triggerEmailOtpSend();
    setLoading(false);
    if (sent) {
      setRegStep(3);
    }
  };

  // Step 3: Verify Email OTP (Resend)
  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit email verification code.');
      return;
    }
    setEmailVerifying(true);
    setErrorMsg('');
    const res = await verifyRegistrationEmailOtp(regEmail, emailOtp);
    setEmailVerifying(false);
    if (res.success) {
      setEmailVerified(true);
      setSuccessMsg('Email verified via Resend.');
    } else {
      setErrorMsg(res.error || 'Invalid email verification OTP.');
    }
  };

  // Step 3: Send Mobile OTP via Firebase
  const handleSendRegMobileOtp = async () => {
    setMobileSending(true);
    setErrorMsg('');
    const res = await sendFirebasePhoneOtp(regMobile, 'firebase-recaptcha-container');
    setMobileSending(false);
    if (res.success && res.confirmationResult) {
      setMobileConfirmation(res.confirmationResult);
      setMobileOtpSent(true);
      setMobileVerified(false);
      setVerifiedFirebaseIdToken('');
      setMobileMasked(res.maskedMobile || regMobile);
      setMobileCooldown(30);
      setMobileOtp('');
      setSuccessMsg(`Firebase SMS OTP sent to ${res.maskedMobile || regMobile}.`);
    } else {
      setErrorMsg(res.error || 'Could not send Firebase mobile OTP.');
    }
  };

  // Step 3: Verify Mobile OTP via Firebase
  const handleVerifyRegMobileOtp = async (): Promise<string | null> => {
    if (!mobileConfirmation) {
      setErrorMsg('Please send the Firebase Mobile OTP first.');
      return null;
    }
    if (mobileOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit Firebase mobile OTP.');
      return null;
    }
    setMobileVerifying(true);
    setErrorMsg('');
    const res = await confirmFirebasePhoneForReset(mobileConfirmation, mobileOtp);
    setMobileVerifying(false);
    if (res.success && res.idToken) {
      setMobileVerified(true);
      setVerifiedFirebaseIdToken(res.idToken);
      setSuccessMsg('Mobile number verified via Firebase OTP.');
      return res.idToken;
    }
    setErrorMsg(res.error || 'Incorrect Firebase mobile OTP.');
    return null;
  };

  // Step 3: Final Register Submit
  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let emailOk = emailVerified;
    if (!emailOk) {
      if (emailOtp.length === 6) {
        setEmailVerifying(true);
        const ev = await verifyRegistrationEmailOtp(regEmail, emailOtp);
        setEmailVerifying(false);
        if (!ev.success) {
          setErrorMsg(ev.error || 'Please verify your email OTP first.');
          return;
        }
        setEmailVerified(true);
        emailOk = true;
      } else {
        setErrorMsg('Please enter and verify the 6-digit OTP sent to your email.');
        return;
      }
    }

    let fbToken = verifiedFirebaseIdToken;
    if (!mobileVerified || !fbToken) {
      if (mobileConfirmation && mobileOtp.length === 6) {
        const verifiedToken = await handleVerifyRegMobileOtp();
        if (!verifiedToken) return;
        fbToken = verifiedToken;
      } else {
        setErrorMsg('Please send and verify your 6-digit Firebase mobile OTP before registering.');
        return;
      }
    }

    setLoading(true);
    const res = await register({
      firstName: firstName.trim(),
      secondName: secondName.trim(),
      email: regEmail.trim(),
      phone: regMobile.trim(),
      gender,
      password: regPassword,
      address1: address1.trim(),
      address2: address2.trim(),
      state: stateName,
      city: city.trim(),
      pinCode: pinCode.trim(),
      emailOtp,
      firebaseIdToken: fbToken
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Account created and verified! Redirecting...');
      setTimeout(() => navigateAfterAuth(res.user?.role || 'customer'), 400);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // Forgot Password Handlers
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const res = await sendFirebasePhoneOtp(forgotPhone, 'firebase-recaptcha-container');
    setLoading(false);
    if (res.success && res.confirmationResult) {
      setForgotConfirmation(res.confirmationResult);
      setForgotMasked(res.maskedMobile || forgotPhone);
      setForgotCooldown(30);
      setForgotOtp('');
      setForgotStep('otp');
      setSuccessMsg(`6-digit Firebase recovery OTP sent to ${res.maskedMobile || forgotPhone}.`);
    } else {
      setErrorMsg(res.error || 'Could not send Firebase recovery OTP.');
    }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotConfirmation) {
      setErrorMsg('OTP session expired. Request a new code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await confirmFirebasePhoneForReset(forgotConfirmation, forgotOtp);
    setLoading(false);
    if (res.success && res.idToken) {
      setResetIdToken(res.idToken);
      setForgotStep('reset');
      setSuccessMsg('Mobile verified via Firebase. Enter your new password below.');
    } else {
      setErrorMsg(res.error || 'Invalid Firebase OTP code.');
    }
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: resetIdToken, newPassword })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update password.');
        return;
      }
      setSuccessMsg('Password updated! Redirecting to Sign In...');
      setTimeout(() => onNavigate('login', returnTo ? { returnTo } : {}), 900);
    } catch {
      setLoading(false);
      setErrorMsg('Network error updating password.');
    }
  };

  const cardWidthClass = mode === 'register' ? 'max-w-xl' : 'max-w-md';

  const heading =
    mode === 'login'
      ? 'Sign In to 4LAAZY'
      : mode === 'register'
      ? regStep === 1
        ? 'Create Your Account'
        : regStep === 2
        ? 'Delivery Address'
        : 'Verify Mail & Mobile'
      : forgotStep === 'reset'
      ? 'Set New Password'
      : forgotStep === 'otp'
      ? 'Verify Recovery OTP'
      : 'Reset Password';

  const subheading =
    mode === 'login'
      ? returnTo === 'checkout'
        ? 'Sign in with your Email or Mobile Number to continue to Checkout.'
        : 'Sign in using your registered email address or mobile number.'
      : mode === 'register'
      ? regStep === 1
        ? 'Step 1 of 3 — Enter your personal details to get started.'
        : regStep === 2
        ? 'Step 2 of 3 — Add your primary shipping address for faster checkout.'
        : 'Step 3 of 3 — Verify your email (Resend) and mobile number (Firebase) to register.'
      : forgotStep === 'reset'
      ? 'Choose a strong new password for your 4LAAZY account.'
      : forgotStep === 'otp'
      ? `Enter the 6-digit Firebase SMS code sent to ${forgotMasked}.`
      : 'Enter your registered Indian mobile number to receive a Firebase recovery OTP.';

  return (
    <div className="min-h-[78vh] flex items-center justify-center px-4 py-12">
      <div
        className={`${cardWidthClass} w-full bg-neutral-900/65 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl transition-all`}
      >
        {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
        <div id="firebase-recaptcha-container" />

        {returnTo === 'checkout' && (
          <div className="p-3 bg-[#E5A914]/10 border border-[#E5A914]/35 rounded-lg text-xs text-[#E5A914] flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Sign in or create an account to unlock Secure Checkout &amp; GST invoice delivery.</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png"
            alt="4LAAZY Monogram"
            className="w-12 h-12 mx-auto object-contain rounded"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            {heading}
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">{subheading}</p>
        </div>

        {/* Registration 3-Step Indicator */}
        {mode === 'register' && (
          <div className="grid grid-cols-3 gap-2 pt-1" aria-label="Registration steps">
            {[
              { stepNum: 1, label: 'Personal' },
              { stepNum: 2, label: 'Address' },
              { stepNum: 3, label: 'Verify OTP' }
            ].map(item => {
              const active = regStep === item.stepNum;
              const completed = regStep > item.stepNum;
              return (
                <div
                  key={item.stepNum}
                  className={`rounded-lg px-3 py-2 border text-center transition-colors ${
                    active
                      ? 'bg-[#E5A914]/15 border-[#E5A914] text-[#E5A914]'
                      : completed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-500'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    {completed ? '✓ Done' : `Step 0${item.stepNum}`}
                  </div>
                  <div className="text-xs font-bold mt-0.5">{item.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div
            role="alert"
            className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-lg"
          >
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==================== LOGIN VIEW ==================== */}
        {mode === 'login' && (
          <div className="space-y-5">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5"
                >
                  Mail / Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    id="login-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="name@domain.com or 9811223344"
                    autoComplete="username"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] uppercase tracking-wider text-neutral-400"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password', returnTo ? { returnTo } : {})}
                    className="text-[11px] text-[#E5A914] hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-10 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(v => !v)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit-button"
                className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-[#141417] px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                Or continue with
              </span>
              <div className="border-t border-neutral-800 w-full" />
            </div>

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

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#E5A914]" />
                  Quick Demo Accounts
                </span>
                <span className="text-neutral-500 font-mono">Mail or Mobile</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoginIdentifier('aryan@example.com');
                  setLoginPassword('lazy123');
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
                  <span className="text-xs font-bold text-white block">Aryan Verma · Customer</span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    aryan@example.com · 9811223344
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#E5A914]">Sign In &rarr;</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoginIdentifier('admin@4lazyfashion.com');
                  setLoginPassword('admin123');
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

            <div className="pt-2 text-center text-xs text-neutral-400">
              New to 4LAAZY?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register', returnTo ? { returnTo } : {})}
                className="text-[#E5A914] hover:underline font-bold"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ==================== REGISTER STEP 1: PERSONAL DETAILS ==================== */}
        {mode === 'register' && regStep === 1 && (
          <form onSubmit={handleRegStep1Next} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-first-name"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  First Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    id="reg-first-name"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Aryan"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-second-name"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  Second Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    id="reg-second-name"
                    type="text"
                    value={secondName}
                    onChange={e => setSecondName(e.target.value)}
                    placeholder="Verma"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-mobile"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  Mobile Number *
                </label>
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg focus-within:border-[#E5A914] transition-colors">
                  <span className="px-2.5 py-2.5 text-xs font-mono text-neutral-400 border-r border-neutral-800 select-none">
                    +91
                  </span>
                  <input
                    id="reg-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={14}
                    value={regMobile}
                    onChange={e => setRegMobile(e.target.value)}
                    placeholder="9811223344"
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Gender Selector */}
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                Gender *
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Gender">
                {GENDER_OPTIONS.map(option => {
                  const selected = gender === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setGender(option)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                        selected
                          ? 'bg-[#E5A914]/15 border-[#E5A914] text-[#E5A914]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-9 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(v => !v)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-300"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              data-testid="reg-step1-next"
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg mt-2"
            >
              <span>Next: Delivery Address</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-[#141417] px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                Or quick sign up
              </span>
              <div className="border-t border-neutral-800 w-full" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-bold py-2.5 px-4 rounded-lg text-xs tracking-wide flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
            >
              <GoogleIcon />
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="pt-1 text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login', returnTo ? { returnTo } : {})}
                className="text-[#E5A914] hover:underline font-bold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ==================== REGISTER STEP 2: ADDRESS ==================== */}
        {mode === 'register' && regStep === 2 && (
          <form onSubmit={handleRegStep2Next} className="space-y-4">
            <div>
              <label
                htmlFor="reg-address1"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Address-1 *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  id="reg-address1"
                  type="text"
                  value={address1}
                  onChange={e => setAddress1(e.target.value)}
                  placeholder="House / Flat No., Building, Street"
                  className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-address2"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Address-2 (Landmark / Area)
              </label>
              <input
                id="reg-address2"
                type="text"
                value={address2}
                onChange={e => setAddress2(e.target.value)}
                placeholder="Near Landmark, Locality (Optional)"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-state"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  State *
                </label>
                <select
                  id="reg-state"
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  required
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st} className="bg-neutral-950 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reg-city"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
                >
                  City *
                </label>
                <input
                  id="reg-city"
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Hyderabad"
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-pincode"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Pin Code *
              </label>
              <input
                id="reg-pincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pinCode}
                onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="500033"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white font-mono rounded-lg focus:outline-none focus:border-[#E5A914]"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setRegStep(1);
                }}
                className="px-4 py-3.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading || emailSending}
                data-testid="reg-step2-next"
                className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg"
              >
                <span>{loading || emailSending ? 'Sending Mail OTP...' : 'Next: Verify Mail & Mobile'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ==================== REGISTER STEP 3: VERIFY MAIL (RESEND) & MOBILE (FIREBASE) ==================== */}
        {mode === 'register' && regStep === 3 && (
          <form onSubmit={handleFinalRegister} className="space-y-5">
            {/* Verification Target Summary */}
            <div className="p-3 bg-neutral-950/90 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="text-neutral-400">
                  Mail: <strong className="text-white font-mono">{regEmail}</strong>
                </div>
                <div className="text-neutral-400">
                  Mobile: <strong className="text-white font-mono">+91 {regMobile.replace(/\D/g, '').slice(-10)}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setRegStep(1);
                }}
                className="text-[11px] font-semibold text-[#E5A914] hover:underline"
              >
                Edit Details
              </button>
            </div>

            {/* 1. EMAIL OTP CARD (RESEND) */}
            <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#E5A914]" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Enter OTP Mail
                  </h2>
                </div>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mail Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Powered by Resend
                  </span>
                )}
              </div>

              {!emailVerified && (
                <>
                  {emailDeliveryMode === 'logged' && devEmailOtp && (
                    <div className="p-2.5 bg-[#E5A914]/10 border border-[#E5A914]/30 rounded-lg text-[11px] text-[#E5A914] flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        Resend API key not configured yet — preview OTP:
                      </span>
                      <button
                        type="button"
                        onClick={() => setEmailOtp(devEmailOtp)}
                        className="font-mono font-extrabold text-sm tracking-widest bg-neutral-950 px-2.5 py-0.5 rounded border border-[#E5A914]/50 hover:bg-[#E5A914] hover:text-black transition-colors"
                      >
                        {devEmailOtp}
                      </button>
                    </div>
                  )}

                  <OtpInput
                    idPrefix="reg-email-otp"
                    length={6}
                    value={emailOtp}
                    onChange={setEmailOtp}
                    disabled={emailVerifying || loading}
                    autoFocus
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={emailCooldown > 0 || emailSending}
                      onClick={() => triggerEmailOtpSend()}
                      className="text-[11px] font-semibold text-neutral-300 hover:text-[#E5A914] flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${emailSending ? 'animate-spin' : ''}`} />
                      {emailCooldown > 0
                        ? `Resend Mail OTP in ${emailCooldown}s`
                        : emailOtpSent
                        ? 'Resend Mail OTP'
                        : 'Send Mail OTP'}
                    </button>

                    <button
                      type="button"
                      disabled={emailOtp.length < 6 || emailVerifying}
                      onClick={handleVerifyEmailOtp}
                      data-testid="verify-email-otp-btn"
                      className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {emailVerifying ? 'Verifying...' : 'Verify Mail'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 2. MOBILE OTP CARD (FIREBASE) */}
            <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#E5A914]" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Enter OTP Mobile Number
                  </h2>
                </div>
                {mobileVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mobile Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#E5A914]">
                    <Flame className="w-3 h-3" /> Firebase Auth
                  </span>
                )}
              </div>

              {!mobileVerified && (
                <>
                  {!mobileOtpSent ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <p className="text-[11px] text-neutral-400">
                        Send a 6-digit Firebase SMS OTP to{' '}
                        <span className="text-white font-mono">
                          +91 {regMobile.replace(/\D/g, '').slice(-10)}
                        </span>
                        .
                      </p>
                      <button
                        type="button"
                        disabled={mobileSending}
                        onClick={handleSendRegMobileOtp}
                        data-testid="send-firebase-mobile-otp-btn"
                        className="px-4 py-2 rounded-lg bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{mobileSending ? 'Sending...' : 'Send Firebase OTP'}</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-neutral-400">
                        Enter the 6-digit Firebase SMS code sent to{' '}
                        <strong className="text-white font-mono">{mobileMasked}</strong>.
                      </p>
                      <OtpInput
                        idPrefix="reg-mobile-otp"
                        length={6}
                        value={mobileOtp}
                        onChange={setMobileOtp}
                        disabled={mobileVerifying || loading}
                        autoFocus={false}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={mobileCooldown > 0 || mobileSending}
                          onClick={handleSendRegMobileOtp}
                          className="text-[11px] font-semibold text-neutral-300 hover:text-[#E5A914] flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${mobileSending ? 'animate-spin' : ''}`} />
                          {mobileCooldown > 0 ? `Resend in ${mobileCooldown}s` : 'Resend Mobile OTP'}
                        </button>

                        <button
                          type="button"
                          disabled={mobileOtp.length < 6 || mobileVerifying}
                          onClick={handleVerifyRegMobileOtp}
                          data-testid="verify-mobile-otp-btn"
                          className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          {mobileVerifying ? 'Verifying...' : 'Verify Mobile'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Register Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setRegStep(2);
                }}
                className="px-4 py-3.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading || emailVerifying || mobileVerifying}
                data-testid="reg-final-submit"
                className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Creating Verified Account...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {/* ==================== FORGOT PASSWORD ==================== */}
        {mode === 'forgot-password' && forgotStep === 'phone' && (
          <form onSubmit={handleForgotSendOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="forgot-mobile"
                  className="block text-[11px] uppercase tracking-wider text-neutral-400"
                >
                  Registered Mobile Number (+91)
                </label>
                <span className="text-[10px] font-mono text-[#E5A914] flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Firebase OTP
                </span>
              </div>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg focus-within:border-[#E5A914]">
                <span className="px-3 py-2.5 text-xs font-mono text-neutral-400 border-r border-neutral-800 select-none">
                  +91
                </span>
                <input
                  id="forgot-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={forgotPhone}
                  onChange={e => setForgotPhone(e.target.value)}
                  placeholder="9811223344"
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Firebase OTP...' : 'Send Recovery OTP'}
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
        )}

        {mode === 'forgot-password' && forgotStep === 'otp' && (
          <form onSubmit={handleForgotVerifyOtp} className="space-y-5">
            <OtpInput
              idPrefix="forgot-otp"
              length={6}
              value={forgotOtp}
              onChange={setForgotOtp}
              disabled={loading}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || forgotOtp.length < 6}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setForgotStep('phone')}
                className="text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change number
              </button>
              <button
                type="button"
                disabled={forgotCooldown > 0 || loading}
                onClick={handleForgotSendOtp}
                className="text-[#E5A914] hover:underline font-semibold disabled:opacity-50"
              >
                {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot-password' && forgotStep === 'reset' && (
          <form onSubmit={handleForgotResetSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                New Password
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                required
                minLength={6}
              />
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
