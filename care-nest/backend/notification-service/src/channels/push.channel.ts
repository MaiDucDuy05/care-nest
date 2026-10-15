import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * Push notification adapter — mock FCM. Production uses Firebase Admin SDK
 * with service account credentials.
 */
@Injectable()
export class PushChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.PUSH;

  async send(payload: NotificationPayload) {
    this.logger.log({ to: payload.to, template: payload.templateKey }, '🔔 PUSH (mock)');
    return { providerMessageId: `mock-push-${Date.now()}` };
  }
}
