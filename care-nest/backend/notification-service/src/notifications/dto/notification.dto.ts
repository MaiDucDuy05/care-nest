import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

export const CreateNotificationSchema = z.object({
  userId: nonEmptyStringSchema,
  /** Optional — if omitted, the dispatcher picks the best channel(s) for the user. */
  channel: z.enum(['IN_APP', 'PUSH', 'SMS', 'EMAIL', 'ZNS']).optional(),
  templateKey: nonEmptyStringSchema,
  payload: z.record(z.unknown()).default({}),
  subject: z.string().optional(),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
