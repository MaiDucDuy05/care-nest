import { describe, it, expect } from 'vitest';
import { isValidImei, computeImeiCheckDigit } from '../src/imei/imei-luhn.js';

describe('isValidImei', () => {
  it('accepts a known-valid IMEI', () => {
    // 352099001761488 is a valid Luhn-15 IMEI derived from head 35209900176148
    // (check digit 8). Used as a "looks real" fixture.
    expect(isValidImei('352099001761488')).toBe(true);
  });

  it('accepts a freshly generated IMEI', () => {
    const head = '49015420323751';
    const tail = computeImeiCheckDigit(head);
    expect(isValidImei(head + tail)).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    // Same head, wrong tail (use 0 when real is 8)
    expect(isValidImei('352099001761480')).toBe(false);
  });

  it('rejects a non-15-digit string', () => {
    expect(isValidImei('1234567890')).toBe(false);
    expect(isValidImei('1234567890123456')).toBe(false);
  });

  it('rejects a non-numeric string', () => {
    expect(isValidImei('35209900176148A')).toBe(false);
    expect(isValidImei('abcdefghijklmno')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidImei('')).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(isValidImei(null as any)).toBe(false);
    expect(isValidImei(undefined as any)).toBe(false);
  });

  it('handles IMEIs starting with 0', () => {
    const head = '01392400053974';
    const tail = computeImeiCheckDigit(head);
    expect(isValidImei(head + tail)).toBe(true);
  });

  it('handles IMEIs starting with 9', () => {
    const head = '99000086247185';
    const tail = computeImeiCheckDigit(head);
    expect(isValidImei(head + tail)).toBe(true);
  });

  it('check digit is deterministic for same input', () => {
    expect(computeImeiCheckDigit('35209900176148')).toBe(8);
    expect(computeImeiCheckDigit('35209900176148')).toBe(8);
  });

  it('check digit throws on wrong input length', () => {
    expect(() => computeImeiCheckDigit('12345')).toThrow();
    expect(() => computeImeiCheckDigit('1234567890123456')).toThrow();
  });
});
