/**
 * Common cross-cutting DTOs and enums.
 */

import { z } from 'zod';
import { isoDateSchema } from './ids.js';

export const PaginationInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
export type PaginationInput = z.infer<typeof PaginationInputSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** VNPay, MoMo, ZaloPay, COD, BANK_TRANSFER */
export const PaymentMethodSchema = z.enum([
  'VNPAY',
  'MOMO',
  'ZALOPAY',
  'COD',
  'BANK_TRANSFER',
]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'EXPIRED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const OrderStatusSchema = z.enum([
  'CREATED',
  'CONFIRMED',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const AlertSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

/** Soft-delete audit fields, common to most entities */
export const AuditTimestampsSchema = z.object({
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  deletedAt: isoDateSchema.nullable().optional(),
});
export type AuditTimestamps = z.infer<typeof AuditTimestampsSchema>;
