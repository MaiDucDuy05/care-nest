import { z } from 'zod';

export const NotificationChannelSchema = z.enum(['EMAIL', 'PUSH', 'SMS', 'ZNS']);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const NotificationCategorySchema = z.enum(['ORDER', 'ALERT', 'SUBSCRIPTION', 'KYC']);
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;

/** Default channels: all 4 channels ON for all 4 categories. */
export const DEFAULT_CHANNELS: Record<string, Record<string, boolean>> = {
  ORDER: { EMAIL: true, PUSH: true, SMS: false, ZNS: true },
  ALERT: { EMAIL: true, PUSH: true, SMS: true, ZNS: true },
  SUBSCRIPTION: { EMAIL: true, PUSH: true, SMS: false, ZNS: true },
  KYC: { EMAIL: true, PUSH: false, SMS: false, ZNS: false },
};

export const ChannelToggleSchema = z.object({
  EMAIL: z.boolean(),
  PUSH: z.boolean(),
  SMS: z.boolean(),
  ZNS: z.boolean(),
}).strict();

export const NotificationPreferencesSchema = z.object({
  ORDER: ChannelToggleSchema,
  ALERT: ChannelToggleSchema,
  SUBSCRIPTION: ChannelToggleSchema,
  KYC: ChannelToggleSchema,
}).strict();

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

/** PATCH body — all fields optional */
export const UpdatePreferencesSchema = NotificationPreferencesSchema.partial();
export type UpdatePreferencesDto = z.infer<typeof UpdatePreferencesSchema>;
