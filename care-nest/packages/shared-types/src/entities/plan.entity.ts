/**
 * Plan entity schema.
 * Keep in sync with backend Plan DTO in notification-service or billing service.
 */

import { z } from 'zod';
import { AuditTimestampsSchema } from '../common.js';
import { PlanIntervalSchema } from '../enums/subscription.js';
import { planIdSchema } from '../ids.js';

export const PlanSchema = z.object({
  id: planIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  interval: PlanIntervalSchema,
  /** Price in VND smallest unit (e.g., 99000 = 99,000 VND) */
  priceVnd: z.number().int().min(0),
  /** Null = unlimited */
  deviceSlots: z.number().int().positive().nullable().optional(),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  ...AuditTimestampsSchema.shape,
});

export type Plan = z.infer<typeof PlanSchema>;
