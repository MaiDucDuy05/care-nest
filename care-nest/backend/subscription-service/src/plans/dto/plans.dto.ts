import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

/**
 * Create plan schema. Admin-only endpoint. `code` is the immutable
 * identifier used in API URLs and migrations (e.g. 'basic', 'family',
 * 'enterprise') — once created, it cannot be changed without a migration.
 */
export const CreatePlanSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, 'code phải là snake_case viết thường'),
  name: nonEmptyStringSchema.max(120),
  description: z.string().max(2000).optional(),
  priceMonthly: z.coerce.number().int().min(0).max(100_000_000),
  deviceLimit: z.coerce.number().int().min(1).max(50).default(1),
  caregiverLimit: z.coerce.number().int().min(1).max(20).default(1),
  retentionMonths: z.coerce.number().int().min(1).max(60).default(6),
  features: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = CreatePlanSchema.partial().omit({ code: true });
export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;
