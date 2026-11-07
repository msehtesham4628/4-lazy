import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDB, saveDB } from '../db.ts';
import { generateToken, authenticate, AuthenticatedRequest } from '../authMiddleware.ts';
import { sendWelcomeEmail, sendOtpEmail } from '../emailService.ts';
import { User, UserAddress } from '../../types/index.ts';

export const authRouter = Router();

// Customer Registration
authRouter.post('/register', (req, res) => {
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

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newUser: User = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone || '',
    role: 'customer',
    isEmailVerified: false,
    addresses: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.passwords[userId] = passwordHash;

  // Generate 6 digit OTP for verification
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
    message: 'Account registered successfully. Verification code sent.'
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
