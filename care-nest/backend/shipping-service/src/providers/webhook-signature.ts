import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-SHA256 signature verification, constant-time comparison.
 * Used by every carrier adapter — they all sign webhooks the same way,
 * they just use different secret env vars.
 *
 * @returns `{ isValid: true }` if the signature matches, otherwise
 *          `{ isValid: false, reason: '...' }`.
 */
export function verifyHmacSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): { isValid: boolean; reason?: string } {
  if (!signature || !secret) {
    return { isValid: false, reason: 'Missing signature or secret' };
  }
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  // timingSafeEqual requires equal-length buffers
  if (expected.length !== signature.length) {
    return { isValid: false, reason: 'Signature length mismatch' };
  }
  try {
    const ok = timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
    return ok ? { isValid: true } : { isValid: false, reason: 'Signature mismatch' };
  } catch {
    return { isValid: false, reason: 'Signature not valid hex' };
  }
}
