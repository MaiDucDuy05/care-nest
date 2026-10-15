/**
 * Notification enums — extends NotificationChannel (already in common.ts).
 * Keep in sync with backend notification-service/src/...
 */

import { z } from 'zod';

/** Kind of scheduled reminder */
export const ReminderKindSchema = z.enum([
  'MEDICATION',
  'APPOINTMENT',
  'BILLING',
  'DEVICE_BATTERY',
  'GEOFENCE_EXIT',
  'CUSTOM',
]);
export type ReminderKind = z.infer<typeof ReminderKindSchema>;
