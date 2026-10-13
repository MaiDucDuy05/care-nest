import { z } from 'zod';

export const AssignDeviceSchema = z.object({
  deviceId: z.string().uuid('deviceId phải là UUID hợp lệ'),
  userId: z.string().uuid('userId phải là UUID hợp lệ'),
  notes: z.string().optional(),
});

export type AssignDeviceDto = z.infer<typeof AssignDeviceSchema>;
