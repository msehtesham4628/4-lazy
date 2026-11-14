import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PAYMENT_TIMEOUT_SECONDS,
  computeExpiresAtIso,
  computeRemainingSeconds,
  formatCountdown,
  getPaymentBadgeMeta,
  isPaymentExpired
} from './paymentTimer';

test('formatCountdown formats minutes and seconds with zero padding', () => {
  assert.equal(formatCountdown(300), '05:00');
  assert.equal(formatCountdown(65), '01:05');
  assert.equal(formatCountdown(9), '00:09');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(-12), '00:00');
});

test('computeRemainingSeconds and isPaymentExpired clamp accurately', () => {
  const startMs = 1_700_000_000_000;
  const expiresIso = computeExpiresAtIso(new Date(startMs).toISOString(), DEFAULT_PAYMENT_TIMEOUT_SECONDS);

  assert.equal(computeRemainingSeconds(expiresIso, startMs), 300);
  assert.equal(computeRemainingSeconds(expiresIso, startMs + 125_400), 175);
  assert.equal(isPaymentExpired(expiresIso, startMs + 125_400), false);

  assert.equal(computeRemainingSeconds(expiresIso, startMs + 300_000), 0);
  assert.equal(isPaymentExpired(expiresIso, startMs + 300_000), true);
  assert.equal(isPaymentExpired(expiresIso, startMs + 310_000), true);
});

test('getPaymentBadgeMeta maps gateway and order statuses consistently', () => {
  assert.deepEqual(getPaymentBadgeMeta('completed'), { label: 'Paid', tone: 'success' });
  assert.deepEqual(getPaymentBadgeMeta('pending', 'SUCCESS'), { label: 'Paid', tone: 'success' });
  assert.deepEqual(getPaymentBadgeMeta('cancelled'), { label: 'Payment Cancelled', tone: 'cancelled' });
  assert.deepEqual(getPaymentBadgeMeta('pending', 'USER_DROPPED'), { label: 'Payment Cancelled', tone: 'cancelled' });
  assert.deepEqual(getPaymentBadgeMeta('failed'), { label: 'Payment Failed', tone: 'failed' });
  assert.deepEqual(getPaymentBadgeMeta('refunded'), { label: 'Refunded', tone: 'refunded' });
  assert.deepEqual(getPaymentBadgeMeta('pending'), { label: 'Pending', tone: 'pending' });
});
