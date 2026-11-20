export const DEFAULT_OTP_LENGTH = 6;

export interface NormalizedMobileResult {
  valid: boolean;
  /** Canonical E.164 format without leading +, e.g. 919811223344 */
  e164Digits: string;
  /** Standard E.164 format with leading +, e.g. +919811223344 */
  e164: string;
  /** 10-digit Indian local number, e.g. 9811223344 */
  localTenDigit: string;
  /** Display format, e.g. +91 98112 23344 */
  formatted: string;
  error?: string;
}

/**
 * Normalizes an Indian mobile number input into E.164 `+91XXXXXXXXXX` format for Firebase Phone Auth.
 * Accepts: 9811223344, +919811223344, +91 98112-23344, 09811223344, 919811223344.
 */
export function normalizeIndianMobile(rawInput: string): NormalizedMobileResult {
  const digits = String(rawInput || '').replace(/\D/g, '');
  let local = digits;

  if (local.length === 12 && local.startsWith('91')) {
    local = local.slice(2);
  } else if (local.length === 11 && local.startsWith('0')) {
    local = local.slice(1);
  }

  if (local.length !== 10 || !/^[6-9]\d{9}$/.test(local)) {
    return {
      valid: false,
      e164Digits: '',
      e164: '',
      localTenDigit: '',
      formatted: '',
      error: 'Enter a valid 10-digit Indian mobile number starting with 6–9.'
    };
  }

  return {
    valid: true,
    e164Digits: `91${local}`,
    e164: `+91${local}`,
    localTenDigit: local,
    formatted: `+91 ${local.slice(0, 5)} ${local.slice(5)}`
  };
}

/**
 * Returns a privacy-masked mobile string, e.g. "+91 98••••3344".
 */
export function maskMobileNumber(rawInput: string): string {
  const norm = normalizeIndianMobile(rawInput);
  if (!norm.valid) {
    const digits = String(rawInput || '').replace(/\D/g, '');
    if (digits.length >= 4) {
      return `••••${digits.slice(-4)}`;
    }
    return '••••••';
  }
  const local = norm.localTenDigit;
  return `+91 ${local.slice(0, 2)}••••${local.slice(6)}`;
}

/**
 * Validates that a Firebase OTP code consists exclusively of digits of the expected length (6).
 */
export function isValidOtpCode(code: string, expectedLength: number = DEFAULT_OTP_LENGTH): boolean {
  const clean = String(code || '').trim();
  const len = Math.min(9, Math.max(4, Math.round(expectedLength || DEFAULT_OTP_LENGTH)));
  return new RegExp(`^\\d{${len}}$`).test(clean);
}
