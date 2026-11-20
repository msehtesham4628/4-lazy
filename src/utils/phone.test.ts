import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIndianMobile,
  maskMobileNumber,
  isValidOtpCode
} from './phone.ts';

test('normalizeIndianMobile handles 10-digit, +91, 91, 0-prefixed, and formatted numbers', () => {
  for (const input of ['9811223344', '+919811223344', '+91 98112-23344', '09811223344', '919811223344']) {
    const res = normalizeIndianMobile(input);
    assert.equal(res.valid, true, `Expected ${input} to be valid`);
    assert.equal(res.e164, '+919811223344');
    assert.equal(res.e164Digits, '919811223344');
    assert.equal(res.localTenDigit, '9811223344');
    assert.equal(res.formatted, '+91 98112 23344');
  }
});

test('normalizeIndianMobile rejects invalid or too-short numbers', () => {
  assert.equal(normalizeIndianMobile('12345').valid, false);
  assert.equal(normalizeIndianMobile('5123456789').valid, false);
  assert.equal(normalizeIndianMobile('').valid, false);
});

test('maskMobileNumber conceals middle digits', () => {
  assert.equal(maskMobileNumber('+919811223344'), '+91 98••••3344');
  assert.equal(maskMobileNumber('9811223344'), '+91 98••••3344');
});

test('isValidOtpCode checks exact 6-digit Firebase OTP code', () => {
  assert.equal(isValidOtpCode('482910'), true);
  assert.equal(isValidOtpCode('4829'), false);
  assert.equal(isValidOtpCode('48291a'), false);
});
