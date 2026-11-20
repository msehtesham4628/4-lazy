import { normalizeIndianMobile } from './phone.ts';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
] as const;

export const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'] as const;
export type GenderOption = (typeof GENDER_OPTIONS)[number];

export interface ParsedLoginIdentifier {
  valid: boolean;
  kind: 'email' | 'phone' | 'invalid';
  email?: string;
  phoneLast10?: string;
  e164?: string;
  error?: string;
}

/**
 * Classifies a login identifier as either an email address or an Indian mobile number.
 */
export function parseLoginIdentifier(raw: string): ParsedLoginIdentifier {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return { valid: false, kind: 'invalid', error: 'Enter your email address or mobile number.' };
  }

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return { valid: false, kind: 'invalid', error: 'Enter a valid email address.' };
    }
    return { valid: true, kind: 'email', email };
  }

  const normPhone = normalizeIndianMobile(trimmed);
  if (normPhone.valid) {
    return {
      valid: true,
      kind: 'phone',
      phoneLast10: normPhone.localTenDigit,
      e164: normPhone.e164
    };
  }

  return {
    valid: false,
    kind: 'invalid',
    error: 'Enter a valid email address or 10-digit Indian mobile number.'
  };
}

export interface Step1Input {
  firstName: string;
  secondName: string;
  mobile: string;
  email: string;
  gender: string;
  password: string;
  confirmPassword?: string;
}

export function validateRegistrationStep1(input: Step1Input): { valid: boolean; error?: string } {
  if (!input.firstName?.trim() || input.firstName.trim().length < 2) {
    return { valid: false, error: 'Please enter your first name (at least 2 characters).' };
  }
  if (!input.secondName?.trim()) {
    return { valid: false, error: 'Please enter your second name (last name).' };
  }
  const phoneCheck = normalizeIndianMobile(input.mobile);
  if (!phoneCheck.valid) {
    return { valid: false, error: phoneCheck.error || 'Enter a valid 10-digit Indian mobile number.' };
  }
  const cleanEmail = String(input.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!GENDER_OPTIONS.includes(input.gender as GenderOption)) {
    return { valid: false, error: 'Please select your gender.' };
  }
  if (!input.password || input.password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long.' };
  }
  if (input.confirmPassword !== undefined && input.password !== input.confirmPassword) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  return { valid: true };
}

export interface Step2Input {
  address1: string;
  address2?: string;
  state: string;
  city: string;
  pinCode: string;
}

export function validateRegistrationStep2(input: Step2Input): { valid: boolean; error?: string } {
  if (!input.address1?.trim() || input.address1.trim().length < 4) {
    return { valid: false, error: 'Please enter Address-1 (street, house/flat number).' };
  }
  if (!input.state?.trim()) {
    return { valid: false, error: 'Please select your state.' };
  }
  if (!input.city?.trim() || input.city.trim().length < 2) {
    return { valid: false, error: 'Please enter your city.' };
  }
  const cleanPin = String(input.pinCode || '').trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return { valid: false, error: 'Please enter a valid 6-digit Indian PIN code (e.g. 500033).' };
  }
  return { valid: true };
}
