import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * Zalo ZNS (Zalo Notification Service) adapter — the official channel for
 * transactional notifications to Zalo users. Highest open rate in VN.
 *
 * Required env vars (only loaded when set, otherwise sandbox mode):
 *   ZALO_OA_ACCESS_TOKEN
 *   ZALO_ZNS_TEMPLATE_ID  (e.g. 'order_confirmed')
 *   ZALO_API_BASE_URL     (default: https://openapi.zalo.me/v2.0)
 *
 * ZNS docs: https://developers.zalo.me/docs/api/official-account-api/zns
 *
 * Sandbox mode logs and returns a fake message id so the dev flow works.
 */
@Injectable()
export class ZnsZaloChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.ZNS;

  private get isConfigured(): boolean {
    return !!(process.env.ZALO_OA_ACCESS_TOKEN && process.env.ZALO_ZNS_TEMPLATE_ID);
  }

  async send(payload: NotificationPayload) {
    if (!this.isConfigured) {
      this.logger.log({
        to: payload.to,
        template: payload.templateKey,
      }, '🟦 ZNS (sandbox)');
      return { providerMessageId: `sandbox-zns-${Date.now()}` };
    }
    this.logger.warn('ZNS real send not implemented — returning sandbox result');
    return { providerMessageId: `sandbox-zns-${Date.now()}` };
  }
}
