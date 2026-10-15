import { z } from 'zod';

export const PushSubscriptionCreateSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }).strict(),
  userAgent: z.string().optional(),
}).strict();

export type PushSubscriptionCreateDto = z.infer<typeof PushSubscriptionCreateSchema>;
