import { z } from 'zod';

export const RegisterDeviceSchema = z.object({
  deviceId: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'IMEI thiết bị phải chứa 10-15 chữ số'),
  model: z.string().trim().default('care-nest-V3.2'),
  firmware: z.string().trim().optional(),
});

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>;
