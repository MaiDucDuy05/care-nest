import { describe, it, expect } from 'vitest';
import { maskEmail, maskVnPhone, maskDeviceId } from '../src/index.js';

describe('maskEmail', () => {
  it('masks the local part', () => {
    expect(maskEmail('alice@example.com')).toBe('a***@example.com');
  });
  it('returns *** for invalid emails', () => {
    expect(maskEmail('not-an-email')).toBe('***');
  });
});

describe('maskVnPhone', () => {
  it('masks a 10-digit phone', () => {
    expect(maskVnPhone('0901234567')).toBe('090***4567');
  });
  it('masks a +84 phone', () => {
    expect(maskVnPhone('+84901234567')).toBe('090***4567');
  });
  it('returns *** for invalid input', () => {
    expect(maskVnPhone('abc')).toBe('***');
  });
});

describe('maskDeviceId', () => {
  it('masks a 15-digit device id', () => {
    expect(maskDeviceId('123456789012345')).toBe('1234*******2345');
  });
  it('returns *** for too-short ids', () => {
    expect(maskDeviceId('1234')).toBe('***');
  });
});
