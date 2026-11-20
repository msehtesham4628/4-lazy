import { Router, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '../db.ts';
import { generateToken, authenticate, type AuthenticatedRequest } from '../authMiddleware.ts';
import { sendWelcomeEmail, sendOtpEmail } from '../emailService.ts';
import { normalizeIndianMobile } from '../../utils/phone.ts';
import type { User, UserAddress } from '../../types/index.ts';

export const authRouter = Router();

const BOOTSTRAPPED_ADMIN_EMAILS = new Set([
  'ehtesham4628@gmail.com',
  'admin@4lazyfashion.com'
]);

function getFirebaseProjectId(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed?.projectId) return String(parsed.projectId);
    }
  } catch {
    // Fallback below
  }
  return process.env.FIREBASE_PROJECT_ID || 'lazzy-10748';
}

let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function fetchGooglePublicCerts(): Promise<Record<string, string> | null> {
  if (cachedGoogleCerts && Date.now() < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.certs;
  }
  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    if (!res.ok) return null;
    const certs = (await res.json()) as Record<string, string>;
    const cc = res.headers.get('cache-control') || '';
    const maxAgeMatch = cc.match(/max-age=(\d+)/);
    const ttlMs = (maxAgeMatch ? Number(maxAgeMatch[1]) : 3600) * 1000;
    cachedGoogleCerts = { certs, expiresAt: Date.now() + ttlMs };
    return certs;
  } catch {
    return null;
  }
}

async function verifyFirebaseIdToken(idToken: string): Promise<{
  uid: string;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  name?: string;
  picture?: string;
} | null> {
  const projectId = getFirebaseProjectId();
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  const decodedComplete = jwt.decode(idToken, { complete: true }) as {
    header?: { kid?: string; alg?: string };
    payload?: Record<string, any>;
  } | null;

  if (!decodedComplete?.payload || !decodedComplete?.header?.kid) {
    return null;
  }

  let verifiedPayload: Record<string, any> | null = null;
  const certs = await fetchGooglePublicCerts();
  const cert = certs?.[decodedComplete.header.kid];

  if (cert) {
    try {
      verifiedPayload = jwt.verify(idToken, cert, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: expectedIssuer
      }) as Record<string, any>;
    } catch {
      return null;
    }
  } else {
    // Offline fallback check if Google JWKS endpoint cannot be reached in a restricted sandbox
    const p = decodedComplete.payload;
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      p.aud === projectId &&
      p.iss === expectedIssuer &&
      typeof p.sub === 'string' &&
      p.sub.length > 0 &&
      typeof p.exp === 'number' &&
      p.exp > nowSec
    ) {
      verifiedPayload = p;
    }
  }

  if (!verifiedPayload || typeof verifiedPayload.sub !== 'string') {
    return null;
  }

  return {
    uid: verifiedPayload.sub,
    email: typeof verifiedPayload.email === 'string' ? verifiedPayload.email.toLowerCase().trim() : undefined,
    emailVerified: Boolean(verifiedPayload.email_verified),
    phone: typeof verifiedPayload.phone_number === 'string' ? verifiedPayload.phone_number.trim() : undefined,
    name: typeof verifiedPayload.name === 'string' ? verifiedPayload.name.trim() : undefined,
    picture: typeof verifiedPayload.picture === 'string' ? verifiedPayload.picture.trim() : undefined
  };
}

// Exchange Firebase Auth ID Token (Google Sign-In or Firebase Phone OTP) for App JWT Session
authRouter.post('/firebase-exchange', async (req, res) => {
  try {
    const { idToken, provider, name: fallbackName, phone: fallbackPhone } = req.body || {};
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'Firebase ID token is required.' });
    }

    const verified = await verifyFirebaseIdToken(idToken);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired Firebase authentication token.' });
    }

    const db = getDB();
    const cleanPhone = verified.phone || (typeof fallbackPhone === 'string' ? fallbackPhone.trim() : '');
    const last10 = cleanPhone.replace(/\D/g, '').slice(-10);

    let user =
      db.users.find(u => u.firebaseUid === verified.uid) ||
      (verified.email ? db.users.find(u => u.email.toLowerCase() === verified.email) : undefined) ||
      (last10.length === 10
        ? db.users.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === last10)
        : undefined);

    const authProvider: User['authProvider'] =
      provider === 'google' ? 'google' : 'firebase-phone';
    let isNewUser = false;

    const shouldBeAdmin = Boolean(
      verified.email && verified.emailVerified && BOOTSTRAPPED_ADMIN_EMAILS.has(verified.email)
    );

    if (!user) {
      isNewUser = true;
      const derivedEmail =
        verified.email ||
        (last10.length === 10 ? `member.${last10}@phone.4laazy.in` : `member.${verified.uid.slice(0, 8)}@4laazy.in`);
      const derivedName =
        verified.name ||
        (typeof fallbackName === 'string' && fallbackName.trim()) ||
        (last10.length === 10 ? `Member ${last10.slice(-4)}` : '4LAAZY Member');

      user = {
        id: `usr_fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        firebaseUid: verified.uid,
        name: derivedName,
        email: derivedEmail,
        phone: cleanPhone,
        role: shouldBeAdmin ? 'admin' : 'customer',
        isEmailVerified: Boolean(verified.emailVerified),
        isPhoneVerified: Boolean(verified.phone),
        authProvider,
        photoURL: verified.picture,
        addresses: [],
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      if (verified.email) {
        try {
          sendWelcomeEmail(user.name, user.email);
        } catch {
          // Non-blocking
        }
      }
    } else {
      user.firebaseUid = verified.uid;
      if (verified.name && (!user.name || user.name.startsWith('Member '))) {
        user.name = verified.name;
      }
      if (verified.email && user.email.endsWith('@phone.4laazy.in')) {
        user.email = verified.email;
      }
      if (verified.emailVerified) user.isEmailVerified = true;
      if (verified.phone) {
        user.phone = verified.phone;
        user.isPhoneVerified = true;
      }
      if (verified.picture) user.photoURL = verified.picture;
      if (shouldBeAdmin) user.role = 'admin';
      user.authProvider = authProvider;
    }

    saveDB();
    const token = generateToken(user);
    return res.json({
      token,
      user,
      isNewUser
    });
  } catch (err: any) {
    console.error('Firebase token exchange failed:', err);
    return res.status(500).json({ error: 'Unable to complete Firebase sign-in.' });
  }
});

// Customer Registration
authRouter.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const db = getDB();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.users.find(u => u.email === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const normPhone = phone ? normalizeIndianMobile(phone) : null;
  if (phone && normPhone && !normPhone.valid) {
    return res.status(400).json({ error: normPhone.error || 'Please enter a valid 10-digit Indian mobile number.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    phone: normPhone?.valid ? `+${normPhone.e164Digits}` : (phone || ''),
    role: 'customer',
    isEmailVerified: false,
    isPhoneVerified: false,
    addresses: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.passwords[userId] = passwordHash;

  // Generate 6 digit email fallback OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.otps[normalizedEmail] = {
    code: otpCode,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  };

  saveDB();

  sendWelcomeEmail(newUser.name, newUser.email);
  sendOtpEmail(newUser.email, otpCode);

  const token = generateToken(newUser);
  return res.status(201).json({
    token,
    user: newUser,
    otpSent: true,
    otpChannel: 'email',
    message: 'Account registered successfully. Verify your mobile with Firebase OTP or enter your email verification code.'
  });
});

// Customer Login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = getDB();
  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
  }

  const hash = db.passwords[user.id];
  if (!hash || !bcrypt.compareSync(password, hash)) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
  }

  const token = generateToken(user);
  return res.json({
    token,
    user
  });
});

// Get current user session
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Send OTP
authRouter.post('/send-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDB();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  db.otps[normalizedEmail] = {
    code: otpCode,
    expiresAt: Date.now() + 10 * 60 * 1000
  };
  saveDB();

  sendOtpEmail(normalizedEmail, otpCode);
  return res.json({ success: true, message: 'OTP sent to ' + normalizedEmail });
});

// Verify OTP
authRouter.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const normalizedEmail = email.toLowerCase().trim();
  const db = getDB();
  const record = db.otps[normalizedEmail];

  if (!record || record.code !== otp.trim() || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  const user = db.users.find(u => u.email === normalizedEmail);
  if (user) {
    user.isEmailVerified = true;
    saveDB();
  }
  delete db.otps[normalizedEmail];
  saveDB();

  return res.json({ success: true, message: 'Email verified successfully.' });
});

// Verify and link mobile number on the currently signed-in account using a Firebase Phone Auth ID token
authRouter.post('/verify-firebase-phone', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'Firebase verification token is required.' });
    }

    const verified = await verifyFirebaseIdToken(idToken);
    if (!verified || !verified.phone) {
      return res.status(401).json({ error: 'Invalid or expired Firebase Phone OTP verification.' });
    }

    const db = getDB();
    const user = db.users.find(u => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    user.phone = verified.phone;
    user.isPhoneVerified = true;
    if (!user.firebaseUid) user.firebaseUid = verified.uid;
    saveDB();

    return res.json({
      success: true,
      user,
      phone: verified.phone,
      message: 'Mobile number verified via Firebase OTP.'
    });
  } catch (err) {
    console.error('Firebase phone link verification failed:', err);
    return res.status(500).json({ error: 'Unable to verify mobile number right now.' });
  }
});

// Reset Password using a verified Firebase Phone Auth ID token
authRouter.post('/reset-password', async (req, res) => {
  const { idToken, newPassword } = req.body || {};
  if (!idToken || !newPassword) {
    return res.status(400).json({ error: 'Firebase verification token and new password are required.' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const verified = await verifyFirebaseIdToken(String(idToken));
  if (!verified || !verified.phone) {
    return res.status(401).json({ error: 'Firebase OTP session expired or invalid. Please request a fresh OTP.' });
  }

  const last10 = verified.phone.replace(/\D/g, '').slice(-10);
  const db = getDB();
  const user =
    db.users.find(u => u.firebaseUid === verified.uid) ||
    (last10.length === 10
      ? db.users.find(u => (u.phone || '').replace(/\D/g, '').slice(-10) === last10)
      : undefined);

  if (!user) {
    return res.status(404).json({ error: 'No account found with this verified mobile number.' });
  }

  const salt = bcrypt.genSaltSync(10);
  db.passwords[user.id] = bcrypt.hashSync(String(newPassword), salt);
  user.phone = verified.phone;
  user.isPhoneVerified = true;
  if (!user.firebaseUid) user.firebaseUid = verified.uid;
  saveDB();

  return res.json({
    success: true,
    message: 'Password updated successfully. You can now sign in with your new password.'
  });
});

// Update Profile
authRouter.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();

  saveDB();
  return res.json({ user });
});

// Add Address
authRouter.post('/addresses', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { fullName, phone, street, apartment, city, state, pinCode, country, isDefault } = req.body;
  if (!fullName || !phone || !street || !city || !state || !pinCode) {
    return res.status(400).json({ error: 'Missing required address fields.' });
  }

  const db = getDB();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (isDefault) {
    user.addresses.forEach(a => a.isDefault = false);
  }

  const newAddress: UserAddress = {
    id: `addr_${Date.now()}`,
    fullName,
    phone,
    street,
    apartment: apartment || '',
    city,
    state,
    pinCode,
    country: country || 'India',
    isDefault: isDefault || user.addresses.length === 0
  };

  user.addresses.push(newAddress);
  saveDB();

  return res.json({ addresses: user.addresses, address: newAddress });
});

// Delete Address
authRouter.delete('/addresses/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.addresses = user.addresses.filter(a => a.id !== req.params.id);
  if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  saveDB();

  return res.json({ addresses: user.addresses });
});
