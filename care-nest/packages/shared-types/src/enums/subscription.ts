/**
 * Subscription enums.
 * Keep in sync with backend notification-service/src/preferences/dto/*.dto.ts
 */

import { z } from 'zod';

/** Subscription plan interval */
export const PlanIntervalSchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']);
export type PlanInterval = z.infer<typeof PlanIntervalSchema>;

/** Subscription status */
export const SubStatusSchema = z.enum([
  'ACTIVE',
  'PAUSED',
  'CANCELLED',
  'EXPIRED',
  'PENDING',
]);
export type SubStatus = z.infer<typeof SubStatusSchema>;

/** Proration billing mode when switching plans mid-cycle */
export const ProrationModeSchema = z.enum(['NONE', 'FULL_REFUND', 'PRORATA']);
export type ProrationMode = z.infer<typeof ProrationModeSchema>;
