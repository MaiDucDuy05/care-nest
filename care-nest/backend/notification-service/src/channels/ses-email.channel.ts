import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * AWS SES v2 email adapter.
 *
 * Required env vars (only loaded when set, otherwise sandbox mode):
 *   AWS_REGION              — e.g. 'ap-southeast-1'
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   SES_FROM_ADDRESS        — e.g. 'no-reply@carenest.vn'
 *
 * Real implementation uses @aws-sdk/client-sesv2. For Phase 2 we log only;
 * adding the SDK is a one-line dep but we want to keep the install small
 * until we have real AWS creds.
 */
@Injectable()
export class SesEmailChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.EMAIL;

  private get isConfigured(): boolean {
    return !!(
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.SES_FROM_ADDRESS
    );
  }

  async send(payload: NotificationPayload) {
    if (!this.isConfigured) {
      this.logger.log({
        to: payload.to,
        subject: payload.subject,
        template: payload.templateKey,
      }, '📧 EMAIL (sandbox)');
      return { providerMessageId: `sandbox-email-${Date.now()}` };
    }
    this.logger.warn('SES real send not implemented — returning sandbox result');
    return { providerMessageId: `sandbox-email-${Date.now()}` };
  }
}
