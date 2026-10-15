import { z } from 'zod';

export const UpdateAlertStatusSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'RESOLVED', 'CLOSED_FALSE']),
  notes: z.string().max(500).optional(),
});

export type UpdateAlertStatusDto = z.infer<typeof UpdateAlertStatusSchema>;
