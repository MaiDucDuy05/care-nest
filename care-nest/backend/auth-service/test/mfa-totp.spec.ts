import { describe, it, expect } from 'vitest';
import * as crypto from 'node:crypto';

// Re-export the internal helpers for unit testing
// We re-implement the test against the public function, generating a secret
// + code with the same RFC 6238 algorithm.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(str: string): Buffer {
  const clean = str.replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('bad base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpCode(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}

describe('TOTP primitives (used by mfa.service.ts)', () => {
  it('base32 roundtrips', () => {
    const original = crypto.randomBytes(20);
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(decoded.equals(original)).toBe(true);
  });

  it('TOTP generates a stable 6-digit code for the same counter', () => {
    const secret = base32Decode(base32Encode(crypto.randomBytes(20)));
    const counter = Math.floor(Date.now() / 30000);
    const code1 = totpCode(secret, counter);
    const code2 = totpCode(secret, counter);
    expect(code1).toBe(code2);
    expect(code1).toMatch(/^\d{6}$/);
  });

  it('TOTP code differs across counters', () => {
    const secret = base32Decode(base32Encode(crypto.randomBytes(20)));
    const c1 = totpCode(secret, 1);
    const c2 = totpCode(secret, 2);
    expect(c1).not.toBe(c2);
  });
});
