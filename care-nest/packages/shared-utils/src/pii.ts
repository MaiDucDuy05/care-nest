/**
 * PII masking helpers for logs.
 *
 * Use these before logging user data to make sure we never leak emails,
 * phone numbers, or device IDs into log aggregators.
 */

import { vnPhoneSchema } from '@carenest/shared-types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mask an email: "alice@example.com" → "a***@example.com" */
export function maskEmail(email: string): string {
  if (!EMAIL_RE.test(email)) return '***';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local[0] ?? '*';
  return `${head}***@${domain}`;
}

/** Mask a Vietnamese phone number: "0901234567" → "090***4567" */
export function maskVnPhone(phone: string): string {
  const parsed = vnPhoneSchema.safeParse(phone);
  if (!parsed.success) return '***';
  const digits = parsed.data.replace(/^\+?84/, '0');
  if (digits.length < 7) return '***';
  return `${digits.slice(0, 3)}***${digits.slice(-4)}`;
}

/** Mask a device IMEI: "123456789012345" → "1234*******2345" */
export function maskDeviceId(deviceId: string): string {
  if (deviceId.length < 8) return '***';
  return `${deviceId.slice(0, 4)}*******${deviceId.slice(-4)}`;
}
