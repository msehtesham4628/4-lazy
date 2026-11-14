import type { PaymentStatus, PaymentTransactionStatus } from '../types/index.ts';

export const DEFAULT_PAYMENT_TIMEOUT_SECONDS = 300; // 5 minutes

export function computeRemainingSeconds(expiresAt?: string | number, nowMs: number = Date.now()): number {
  if (!expiresAt) return 0;
  const expiryMs = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime();
  if (!Number.isFinite(expiryMs)) return 0;
  return Math.max(0, Math.ceil((expiryMs - nowMs) / 1000));
}

export function isPaymentExpired(expiresAt?: string | number, nowMs: number = Date.now()): boolean {
  if (!expiresAt) return false;
  return computeRemainingSeconds(expiresAt, nowMs) <= 0;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeExpiresAtIso(
  startDateIso?: string,
  timeoutSeconds: number = DEFAULT_PAYMENT_TIMEOUT_SECONDS
): string {
  const startMs = startDateIso ? new Date(startDateIso).getTime() : Date.now();
  const safeStart = Number.isFinite(startMs) ? startMs : Date.now();
  return new Date(safeStart + Math.max(10, timeoutSeconds) * 1000).toISOString();
}

export function getPaymentBadgeMeta(
  orderPaymentStatus?: PaymentStatus | string,
  txStatus?: PaymentTransactionStatus | string
): {
  label: string;
  tone: 'success' | 'pending' | 'cancelled' | 'failed' | 'refunded';
} {
  const raw = String(txStatus || orderPaymentStatus || 'pending').toUpperCase();
  if (raw === 'SUCCESS' || raw === 'COMPLETED' || raw === 'PAID') {
    return { label: 'Paid', tone: 'success' };
  }
  if (raw === 'CANCELLED' || raw === 'USER_DROPPED') {
    return { label: 'Payment Cancelled', tone: 'cancelled' };
  }
  if (raw === 'FAILED') {
    return { label: 'Payment Failed', tone: 'failed' };
  }
  if (raw === 'REFUNDED') {
    return { label: 'Refunded', tone: 'refunded' };
  }
  return { label: 'Pending', tone: 'pending' };
}
