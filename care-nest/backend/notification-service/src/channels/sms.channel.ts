import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * SMS adapter — mock ESMS.vn. Production uses REST API at api.esms.vn.
 */
@Injectable()
export class SmsChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.SMS;

  async send(payload: NotificationPayload) {
    this.logger.log({ to: payload.to, template: payload.templateKey }, '📱 SMS (mock)');
    return { providerMessageId: `mock-sms-${Date.now()}` };
  }
}
