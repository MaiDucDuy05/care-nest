/**
 * Subscription + reminder entity schemas.
 * Keep in sync with backend notification-service/src/subscriptions/.
 */

import { z } from 'zod';
import { AuditTimestampsSchema } from '../common.js';
import { PlanIntervalSchema, ProrationModeSchema, SubStatusSchema } from '../enums/subscription.js';
import { ReminderKindSchema } from '../enums/notification.js';
import { subscriptionIdSchema, planIdSchema, userIdSchema } from '../ids.js';

/** SubscriptionReminder — a scheduled notification for a subscription */
export const SubscriptionReminderSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: subscriptionIdSchema,
  kind: ReminderKindSchema,
  triggerAt: z.string().datetime({ offset: true }),
  message: z.string().max(500).optional(),
  isSent: z.boolean().default(false),
});

export type SubscriptionReminder = z.infer<typeof SubscriptionReminderSchema>;

/** ProrationPreview — billing preview when switching plan mid-cycle */
export const ProrationPreviewSchema = z.object({
  mode: ProrationModeSchema,
  creditVnd: z.number().int().min(0).default(0),
  chargeVnd: z.number().int().min(0).default(0),
  netVnd: z.number().int().default(0),
});

export type ProrationPreview = z.infer<typeof ProrationPreviewSchema>;

/** Subscription entity */
export const SubscriptionSchema = z.object({
  id: subscriptionIdSchema,
  userId: userIdSchema,
  planId: planIdSchema,
  status: SubStatusSchema,
  interval: PlanIntervalSchema,
  currentPeriodStart: z.string().datetime({ offset: true }),
  currentPeriodEnd: z.string().datetime({ offset: true }),
  cancelledAt: z.string().datetime({ offset: true }).nullable().optional(),
  pausedAt: z.string().datetime({ offset: true }).nullable().optional(),
  ...AuditTimestampsSchema.shape,
});

export type Subscription = z.infer<typeof SubscriptionSchema>;
