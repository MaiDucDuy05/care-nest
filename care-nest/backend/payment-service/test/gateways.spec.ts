import { describe, it, expect } from 'vitest';
import { hmacSha256, sha256Hex } from '../src/gateways/payment-gateway.js';

describe('crypto helpers', () => {
  it('hmacSha256 returns deterministic hex', () => {
    const a = hmacSha256('secret', 'data');
    const b = hmacSha256('secret', 'data');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hmacSha256 differs for different secrets', () => {
    expect(hmacSha256('s1', 'data')).not.toBe(hmacSha256('s2', 'data'));
  });

  it('sha256Hex produces known hash for "abc"', () => {
    // SHA-256("abc") = ba7816bf...f20015ad
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
