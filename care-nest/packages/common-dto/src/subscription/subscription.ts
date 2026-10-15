import { z } from 'zod';
import { VndAmountSchema } from '../shared/primitives.js';

export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  priceVnd: VndAmountSchema,
  intervalMonths: z.number().int().positive(),
  features: z.array(z.string()),
});
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const SubscribeRequestSchema = z.object({
  planCode: z.string().min(1).max(64),
  paymentMethod: z.enum(['VNPAY', 'MOMO']),
});
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
