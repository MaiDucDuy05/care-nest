import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

export const CreateSubscriptionSchema = z.object({
  planCode: nonEmptyStringSchema,
  /** If absent, defaults to now. Used to back-date during imports. */
  startAt: z.coerce.date().optional(),
  /** Trial days, if any. 0 = no trial. */
  trialDays: z.coerce.number().int().min(0).max(60).default(0),
  /** Free-form metadata to round-trip through Kafka. */
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type CreateSubscriptionDto = z.infer<typeof CreateSubscriptionSchema>;

export const ChangePlanSchema = z.object({
  newPlanCode: nonEmptyStringSchema,
  effectiveAt: z.coerce.date().optional(),
});

export type ChangePlanDto = z.infer<typeof ChangePlanSchema>;

export const CancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
  /** If true, cancel takes effect immediately. Otherwise it ends the current period. */
  immediate: z.coerce.boolean().default(false),
});

export type CancelSubscriptionDto = z.infer<typeof CancelSubscriptionSchema>;
