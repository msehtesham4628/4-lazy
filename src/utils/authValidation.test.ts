import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLoginIdentifier,
  validateRegistrationStep1,
  validateRegistrationStep2
} from './authValidation.ts';

test('parseLoginIdentifier classifies email and Indian mobile numbers accurately', () => {
  const emailRes = parseLoginIdentifier('  Aryan@Example.COM ');
  assert.equal(emailRes.valid, true);
  assert.equal(emailRes.kind, 'email');
  assert.equal(emailRes.email, 'aryan@example.com');

  const phoneRes = parseLoginIdentifier('+91 98112-23344');
  assert.equal(phoneRes.valid, true);
  assert.equal(phoneRes.kind, 'phone');
  assert.equal(phoneRes.phoneLast10, '9811223344');
  assert.equal(phoneRes.e164, '+919811223344');

  const badRes = parseLoginIdentifier('not-an-email-or-phone');
  assert.equal(badRes.valid, false);
  assert.equal(badRes.kind, 'invalid');
});

test('validateRegistrationStep1 validates personal details, gender, and passwords', () => {
  const ok = validateRegistrationStep1({
    firstName: 'Aryan',
    secondName: 'Verma',
    mobile: '9811223344',
    email: 'aryan@example.com',
    gender: 'Male',
    password: 'password123',
    confirmPassword: 'password123'
  });
  assert.equal(ok.valid, true);

  const mismatch = validateRegistrationStep1({
    firstName: 'Aryan',
    secondName: 'Verma',
    mobile: '9811223344',
    email: 'aryan@example.com',
    gender: 'Male',
    password: 'password123',
    confirmPassword: 'different'
  });
  assert.equal(mismatch.valid, false);
  assert.match(mismatch.error || '', /do not match/i);

  const badGender = validateRegistrationStep1({
    firstName: 'Aryan',
    secondName: 'Verma',
    mobile: '9811223344',
    email: 'aryan@example.com',
    gender: '',
    password: 'password123'
  });
  assert.equal(badGender.valid, false);
});

test('validateRegistrationStep2 validates address fields and 6-digit Indian PIN code', () => {
  const ok = validateRegistrationStep2({
    address1: 'Flat 402, Road No. 36',
    address2: 'Jubilee Hills',
    state: 'Telangana',
    city: 'Hyderabad',
    pinCode: '500033'
  });
  assert.equal(ok.valid, true);

  const badPin = validateRegistrationStep2({
    address1: 'Flat 402, Road No. 36',
    state: 'Telangana',
    city: 'Hyderabad',
    pinCode: '50003'
  });
  assert.equal(badPin.valid, false);
  assert.match(badPin.error || '', /6-digit/i);
});
