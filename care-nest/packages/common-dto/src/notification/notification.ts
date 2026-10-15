import { z } from 'zod';

export const NotificationChannelEnum = z.enum(['PUSH', 'EMAIL', 'SMS', 'IN_APP']);
export const NotificationEventEnum = z.enum([
  'ORDER_PLACED',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'DEVICE_LOW_BATTERY',
  'VITAL_ABNORMAL',
  'SOS_PRESSED',
  'FALL_DETECTED',
  'GEOFENCE_BREACHED',
]);

export const NotificationPreferenceSchema = z.object({
  event: NotificationEventEnum,
  channels: z.array(NotificationChannelEnum).min(0).max(4),
  enabled: z.boolean(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u).optional(),
});
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
  deviceId: z.string().max(128).optional(),
});
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
