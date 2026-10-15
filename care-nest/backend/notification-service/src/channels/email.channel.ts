import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * Email adapter — mock SES. In production, set AWS_* env vars and use
 * @aws-sdk/client-sesv2. For dev/test we just log the payload.
 */
@Injectable()
export class EmailChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.EMAIL;

  async send(payload: NotificationPayload) {
    this.logger.log({ to: payload.to, subject: payload.subject, template: payload.templateKey }, '📧 EMAIL (mock)');
    return { providerMessageId: `mock-email-${Date.now()}` };
  }
}
