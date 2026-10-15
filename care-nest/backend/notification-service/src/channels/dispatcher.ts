import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { VapidPushChannel } from './vapid-push.channel.js';
import { EsmsSmsChannel } from './esms-sms.channel.js';
import { SesEmailChannel } from './ses-email.channel.js';
import { ZnsZaloChannel } from './zns-zalo.channel.js';
import { UserChannelResolver, type UserContactInfo } from './user-channel-resolver.js';
import { type NotificationPayload } from './channel.adapter.js';

export interface DispatchPlan {
  channels: Array<{
    channel: NotificationChannel;
    recipient: string;
    adapter: { send: (p: NotificationPayload) => Promise<{ providerMessageId?: string; error?: string }> };
  }>;
}

/**
 * Builds a dispatch plan for a notification. The plan is a list of
 * (channel, recipient, adapter) tuples to call in order.
 *
 * Default priority (Phase 2):
 *   1. ZNS  — if user has linked Zalo account (highest open rate in VN)
 *   2. PUSH  — if user has a Web Push subscription
 *   3. SMS   — if user has a phone
 *   4. EMAIL — if user has an email (always fallback)
 *
 * Critical alerts (SOS, FALL) force PUSH + SMS in parallel regardless of
 * priority, so the user gets the warning even if ZNS is the only channel
 * and Zalo is offline.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly push: VapidPushChannel,
    private readonly sms: EsmsSmsChannel,
    private readonly email: SesEmailChannel,
    private readonly zns: ZnsZaloChannel,
    private readonly resolver: UserChannelResolver,
  ) {}

  async buildPlan(
    userId: string,
    templateKey: string,
    payload: NotificationPayload,
  ): Promise<DispatchPlan> {
    const contact = await this.resolver.resolve(userId);

    // Critical alerts bypass the priority chain and fan out to PUSH + SMS.
    if (this.isCriticalAlert(templateKey)) {
      return {
        channels: this.buildCriticalPlan(contact, payload),
      };
    }

    const plan: DispatchPlan['channels'] = [];

    // 1. ZNS first (highest open rate in Vietnam)
    if (contact.zaloUserId) {
      plan.push({ channel: NotificationChannel.ZNS, recipient: contact.zaloUserId, adapter: this.zns });
    }
    // 2. Web Push if a subscription is registered
    if (contact.deviceToken) {
      plan.push({ channel: NotificationChannel.PUSH, recipient: contact.deviceToken, adapter: this.push });
    }
    // 3. SMS if we have a phone
    if (contact.phone) {
      plan.push({ channel: NotificationChannel.SMS, recipient: contact.phone, adapter: this.sms });
    }
    // 4. Email is always the fallback if available
    if (contact.email) {
      plan.push({ channel: NotificationChannel.EMAIL, recipient: contact.email, adapter: this.email });
    }

    if (plan.length === 0) {
      this.logger.warn({ userId, templateKey }, 'No contact info for user — notification will be dropped');
    }
    return { channels: plan };
  }

  private isCriticalAlert(templateKey: string): boolean {
    return templateKey === 'alert.sos' || templateKey === 'alert.fall';
  }

  private buildCriticalPlan(
    contact: UserContactInfo,
    payload: NotificationPayload,
  ): DispatchPlan['channels'] {
    const plan: DispatchPlan['channels'] = [];
    if (contact.deviceToken) {
      plan.push({ channel: NotificationChannel.PUSH, recipient: contact.deviceToken, adapter: this.push });
    }
    if (contact.phone) {
      plan.push({ channel: NotificationChannel.SMS, recipient: contact.phone, adapter: this.sms });
    }
    if (contact.zaloUserId) {
      plan.push({ channel: NotificationChannel.ZNS, recipient: contact.zaloUserId, adapter: this.zns });
    }
    if (plan.length === 0 && contact.email) {
      plan.push({ channel: NotificationChannel.EMAIL, recipient: contact.email, adapter: this.email });
    }
    return plan;
  }

  /**
   * Execute a plan: try each channel in order, stop on the first SUCCESS.
   * Critical alerts fan out to ALL channels and return the first success.
   *
   * Returns an array of per-channel outcomes so the caller can persist them.
   */
  async execute(
    plan: DispatchPlan,
    basePayload: NotificationPayload,
    isCritical = false,
  ): Promise<Array<{ channel: NotificationChannel; recipient: string; providerMessageId?: string; error?: string }>> {
    const results: Array<{ channel: NotificationChannel; recipient: string; providerMessageId?: string; error?: string }> = [];
    for (const step of plan.channels) {
      try {
        const res = await step.adapter.send({ ...basePayload, to: step.recipient });
        results.push({ channel: step.channel, recipient: step.recipient, ...res });
        if (!res.error && !isCritical) {
          // First success wins for non-critical — stop
          break;
        }
      } catch (err: any) {
        results.push({ channel: step.channel, recipient: step.recipient, error: err.message });
        if (!isCritical) break;
      }
    }
    return results;
  }
}
