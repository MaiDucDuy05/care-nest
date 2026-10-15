import { z } from 'zod';

export const CaregiverInviteSchema = z.object({
  caretakerEmail: z.string().email(),
  relationship: z.enum(['FAMILY', 'NURSE', 'DOCTOR', 'OTHER']),
  permissions: z
    .object({
      viewHealth: z.boolean(),
      receiveAlerts: z.boolean(),
      manageDevices: z.boolean(),
    })
    .strict()
    .default({ viewHealth: false, receiveAlerts: false, manageDevices: false }),
});

export type CaregiverInviteDto = z.infer<typeof CaregiverInviteSchema>;
