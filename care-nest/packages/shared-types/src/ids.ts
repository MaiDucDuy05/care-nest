/**
 * Branded ID types — prevents accidentally passing a UserId where an OrderId
 * is expected, even though both are strings at runtime.
 */

import { z } from 'zod';

export type UserId = string & { readonly __brand: 'UserId' };
export type SellerId = string & { readonly __brand: 'SellerId' };
export type OrderId = string & { readonly __brand: 'OrderId' };
export type ProductId = string & { readonly __brand: 'ProductId' };
export type DeviceAssignmentId = string & { readonly __brand: 'DeviceAssignmentId' };

/** CUID-style ID (Prisma default) */
const CUID_RE = /^c[a-z0-9]{20,}$/i;

/** UUID v4 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const idSchema = z.string().refine((v) => CUID_RE.test(v) || UUID_RE.test(v), {
  message: 'must be a CUID or UUID',
});

export const userIdSchema = idSchema;
export const sellerIdSchema = idSchema;
export const orderIdSchema = idSchema;
export const productIdSchema = idSchema;
export const deviceAssignmentIdSchema = idSchema;

/** ISO 8601 timestamp string */
export const isoDateSchema = z.string().datetime({ offset: true });

/** Non-empty trimmed string */
export const nonEmptyStringSchema = z.string().trim().min(1);

/** Vietnam phone number (10-11 digits, optional +84 prefix) */
export const vnPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-.]/g, ''))
  .refine((v) => /^(\+?84|0)\d{9,10}$/.test(v), {
    message: 'must be a valid Vietnamese phone number',
  });

/** Email (loose — RFC compliance is the mail server's job) */
export const emailSchema = z.string().trim().toLowerCase().email();

export function asUserId(v: string): UserId {
  return userIdSchema.parse(v) as UserId;
}
export function asSellerId(v: string): SellerId {
  return sellerIdSchema.parse(v) as SellerId;
}
export function asOrderId(v: string): OrderId {
  return orderIdSchema.parse(v) as OrderId;
}
export function asProductId(v: string): ProductId {
  return productIdSchema.parse(v) as ProductId;
}
export function asDeviceAssignmentId(v: string): DeviceAssignmentId {
  return deviceAssignmentIdSchema.parse(v) as DeviceAssignmentId;
}
