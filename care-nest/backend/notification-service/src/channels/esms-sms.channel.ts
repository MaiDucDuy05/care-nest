import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * ESMS.vn SMS adapter — the most common Vietnamese bulk-SMS provider.
 *
 * Required env vars (only loaded when set, otherwise sandbox mode):
 *   ESMS_API_KEY
 *   ESMS_API_SECRET
 *   ESMS_BRANDNAME   (the registered alphanumeric sender)
 *   ESMS_BASE_URL    (default: https://rest.esms.vn/MainService.svc/json)
 *
 * ESMS uses GET/POST to /SendMultipleMessage_V4_post_json with the
 * signature = sha256(secretKey + apiKey + requestId). We mock the network
 * call for Phase 2 — Phase 3 will wire it up once we have sandbox creds.
 */
@Injectable()
export class EsmsSmsChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.SMS;

  private get isConfigured(): boolean {
    return !!(process.env.ESMS_API_KEY && process.env.ESMS_API_SECRET && process.env.ESMS_BRANDNAME);
  }

  async send(payload: NotificationPayload) {
    if (!this.isConfigured) {
      this.logger.log({ to: payload.to, template: payload.templateKey }, '📱 SMS (sandbox)');
      return { providerMessageId: `sandbox-sms-${Date.now()}` };
    }
    this.logger.warn('ESMS real send not implemented — returning sandbox result');
    return { providerMessageId: `sandbox-sms-${Date.now()}` };
  }
}
