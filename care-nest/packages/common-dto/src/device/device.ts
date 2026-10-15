import { z } from 'zod';
import { NonEmptyString } from '../shared/primitives.js';

export const RegisterDeviceRequestSchema = z.object({
  serial: NonEmptyString.max(64),
  model: NonEmptyString.max(64),
  firmware: z.string().max(32).optional(),
  imei: z.string().regex(/^\d{15}$/u).optional(),
  mac: z.string().regex(/^[0-9A-Fa-f]{12}$/u).optional(),
});
export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;

export const VitalSampleSchema = z.object({
  ts: z.string().datetime(),
  heartRate: z.number().int().min(0).max(300).optional(),
  spo2: z.number().min(0).max(100).optional(),
  temperatureC: z.number().min(20).max(45).optional(),
  systolic: z.number().int().min(40).max(260).optional(),
  diastolic: z.number().int().min(20).max(180).optional(),
  steps: z.number().int().nonnegative().optional(),
  battery: z.number().int().min(0).max(100).optional(),
});
export type VitalSample = z.infer<typeof VitalSampleSchema>;

export const IngestVitalsRequestSchema = z.object({
  samples: z.array(VitalSampleSchema).min(1).max(500),
});
export type IngestVitalsRequest = z.infer<typeof IngestVitalsRequestSchema>;

export const InviteCaregiverRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  relationship: z.enum(['FAMILY', 'DOCTOR', 'NURSE', 'OTHER']),
  permissions: z.array(z.enum(['READ_VITALS', 'RECEIVE_ALERTS', 'CONTROL_DEVICE', 'VIEW_LOCATION'])).min(1),
});
export type InviteCaregiverRequest = z.infer<typeof InviteCaregiverRequestSchema>;
