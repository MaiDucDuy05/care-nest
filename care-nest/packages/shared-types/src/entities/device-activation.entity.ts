/**
 * Device activation code entity.
 * One-time use code sent to caregiver email/phone to pair a device.
 * Keep in sync with backend device-service/src/caregivers/.
 */

import { z } from 'zod';
import { isoDateSchema } from '../ids.js';
import { caregiverIdSchema, userIdSchema, deviceAssignmentIdSchema } from '../ids.js';

export const DeviceActivationCodeSchema = z.object({
  id: z.string().uuid(),
  caregiverId: caregiverIdSchema,
  userId: userIdSchema,
  deviceAssignmentId: deviceAssignmentIdSchema,
  code: z.string().length(6).regex(/^\d{6}$/),
  expiresAt: isoDateSchema,
  usedAt: isoDateSchema.nullable().optional(),
  createdAt: isoDateSchema,
});

export type DeviceActivationCode = z.infer<typeof DeviceActivationCodeSchema>;
