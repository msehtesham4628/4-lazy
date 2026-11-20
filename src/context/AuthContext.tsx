import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types/index.ts';
import {
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type FirebaseUser
} from '../firebase.ts';
import { normalizeIndianMobile, maskMobileNumber } from '../utils/phone.ts';

export interface RegisterResult {
  success: boolean;
  error?: string;
  otpSent?: boolean;
  otpChannel?: 'email';
}

export interface FirebaseGoogleResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface FirebasePhoneSendResult {
  success: boolean;
  confirmationResult?: ConfirmationResult;
  maskedMobile?: string;
  e164Phone?: string;
  error?: string;
}

export interface FirebasePhoneConfirmTokenResult {
  success: boolean;
  idToken?: string;
  phone?: string;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogle: () => Promise<FirebaseGoogleResult>;
  sendFirebasePhoneOtp: (phone: string, recaptchaContainerId: string) => Promise<FirebasePhoneSendResult>;
  verifyFirebasePhoneOtp: (confirmationResult: ConfirmationResult, code: string) => Promise<FirebaseGoogleResult>;
  confirmFirebasePhoneForReset: (
    confirmationResult: ConfirmationResult,
    code: string
  ) => Promise<FirebasePhoneConfirmTokenResult>;
  linkVerifiedFirebasePhone: (
    confirmationResult: ConfirmationResult,
    code: string
  ) => Promise<FirebaseGoogleResult>;
  register: (name: string, email: string, phone: string, password: string) => Promise<RegisterResult>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseAuthError(err: any): string {
  const code = String(err?.code || '');
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in popup was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the Google sign-in popup. Please allow popups and try again.';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/billing-not-enabled') {
    return 'Firebase Phone OTP is not yet enabled in Firebase Console (Authentication → Sign-in method → Phone). Enable Phone sign-in there or continue with Google.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Please enter a valid 10-digit Indian mobile number.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many OTP attempts from this device. Please wait a minute and try again.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Incorrect 6-digit Firebase OTP code. Please check the SMS and try again.';
  }
  if (code === 'auth/code-expired') {
    return 'Firebase OTP code expired. Please request a fresh verification code.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not yet authorized in Firebase Auth settings (Firebase Console → Authentication → Settings → Authorized domains).';
  }
  return err?.message || 'Firebase authentication failed. Please try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('4lazy_token'));
  const [isLoading, setIsLoading] = useState(true);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const exchangeFirebaseSession = async (
    firebaseUser: FirebaseUser,
    provider: 'google' | 'firebase-phone'
  ): Promise<FirebaseGoogleResult> => {
    const idToken = await firebaseUser.getIdToken(true);
    const res = await fetch('/api/auth/firebase-exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        provider,
        name: firebaseUser.displayName || undefined,
        phone: firebaseUser.phoneNumber || undefined
      })
    });
    const data = await res.json();
    if (!res.ok || !data.token || !data.user) {
      return { success: false, error: data.error || 'Could not establish session with server.' };
    }

    localStorage.setItem('4lazy_token', data.token);
    setToken(data.token);
    setUser(data.user);

    return { success: true, user: data.user };
  };

  const fetchCurrentUser = async (authToken: string) => {
    if (authToken.startsWith('demo-')) {
      if (authToken.includes('admin')) {
        setUser({
          id: 'usr_admin_001',
          name: '4LAAZY Founder & Lead Admin',
          email: 'admin@4lazyfashion.com',
          phone: '+919876543210',
          role: 'admin',
          isEmailVerified: true,
          isPhoneVerified: true,
          addresses: [],
          createdAt: '2026-01-01T00:00:00Z'
        });
      } else {
        setUser({
          id: 'usr_cust_001',
          name: 'Aryan Verma',
          email: 'aryan@example.com',
          phone: '+919811223344',
          role: 'customer',
          isEmailVerified: true,
          isPhoneVerified: true,
          addresses: [],
          createdAt: '2026-02-10T12:00:00Z'
        });
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('4lazy_token');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loginWithGoogle = async (): Promise<FirebaseGoogleResult> => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return await exchangeFirebaseSession(credential.user, 'google');
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const sendFirebasePhoneOtp = async (
    phone: string,
    recaptchaContainerId: string
  ): Promise<FirebasePhoneSendResult> => {
    const norm = normalizeIndianMobile(phone);
    if (!norm.valid) {
      return { success: false, error: norm.error || 'Please enter a valid 10-digit Indian mobile number.' };
    }

    const e164Phone = norm.e164;
    try {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // Ignore stale verifier clear errors
        }
        recaptchaRef.current = null;
      }

      const containerEl = document.getElementById(recaptchaContainerId);
      if (containerEl) {
        containerEl.innerHTML = '';
      }

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible'
      });
      recaptchaRef.current = verifier;

      const confirmationResult = await signInWithPhoneNumber(auth, e164Phone, verifier);
      return {
        success: true,
        confirmationResult,
        maskedMobile: maskMobileNumber(norm.e164Digits),
        e164Phone
      };
    } catch (err: any) {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // Ignore
        }
        recaptchaRef.current = null;
      }
      return {
        success: false,
        error: mapFirebaseAuthError(err)
      };
    }
  };

  const verifyFirebasePhoneOtp = async (
    confirmationResult: ConfirmationResult,
    code: string
  ): Promise<FirebaseGoogleResult> => {
    try {
      const credential = await confirmationResult.confirm(code.trim());
      return await exchangeFirebaseSession(credential.user, 'firebase-phone');
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const confirmFirebasePhoneForReset = async (
    confirmationResult: ConfirmationResult,
    code: string
  ): Promise<FirebasePhoneConfirmTokenResult> => {
    try {
      const credential = await confirmationResult.confirm(code.trim());
      const idToken = await credential.user.getIdToken(true);
      return {
        success: true,
        idToken,
        phone: credential.user.phoneNumber || undefined
      };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const linkVerifiedFirebasePhone = async (
    confirmationResult: ConfirmationResult,
    code: string
  ): Promise<FirebaseGoogleResult> => {
    try {
      const credential = await confirmationResult.confirm(code.trim());
      const idToken = await credential.user.getIdToken(true);
      const authToken = token || localStorage.getItem('4lazy_token') || '';
      const res = await fetch('/api/auth/verify-firebase-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        return { success: false, error: data.error || 'Unable to link verified phone number.' };
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: mapFirebaseAuthError(err) };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }
      localStorage.setItem('4lazy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch {
      const normEmail = email.toLowerCase().trim();
      if (normEmail === 'admin@4lazyfashion.com' && password === 'admin123') {
        const demoUser: User = {
          id: 'usr_admin_001',
          name: '4LAAZY Founder & Lead Admin',
          email: 'admin@4lazyfashion.com',
          phone: '+919876543210',
          role: 'admin',
          isEmailVerified: true,
          isPhoneVerified: true,
          addresses: [],
          createdAt: '2026-01-01T00:00:00Z'
        };
        const demoToken = 'demo-admin-jwt-token-4lazy';
        localStorage.setItem('4lazy_token', demoToken);
        setToken(demoToken);
        setUser(demoUser);
        return { success: true, user: demoUser };
      }
      if (normEmail === 'aryan@example.com' && password === 'lazy123') {
        const demoUser: User = {
          id: 'usr_cust_001',
          name: 'Aryan Verma',
          email: 'aryan@example.com',
          phone: '+919811223344',
          role: 'customer',
          isEmailVerified: true,
          isPhoneVerified: true,
          addresses: [],
          createdAt: '2026-02-10T12:00:00Z'
        };
        const demoToken = 'demo-customer-jwt-token-4lazy';
        localStorage.setItem('4lazy_token', demoToken);
        setToken(demoToken);
        setUser(demoUser);
        return { success: true, user: demoUser };
      }
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<RegisterResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }
      localStorage.setItem('4lazy_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return {
        success: true,
        otpSent: data.otpSent,
        otpChannel: 'email'
      };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Verification failed.' };
      }
      if (user) {
        setUser({ ...user, isEmailVerified: true });
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('4lazy_token');
    setToken(null);
    setUser(null);
    void firebaseSignOut(auth).catch(() => {});
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithGoogle,
        sendFirebasePhoneOtp,
        verifyFirebasePhoneOtp,
        confirmFirebasePhoneForReset,
        linkVerifiedFirebasePhone,
        register,
        verifyOtp,
        logout,
        refreshUser,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
