import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';
import webpush from 'web-push';
import { NotificationChannelAdapter, type NotificationPayload } from './channel.adapter.js';

/**
 * Web Push adapter using the W3C Push API + VAPID auth.
 *
 * Required env vars (only loaded when set, otherwise we run in sandbox mode):
 *   VAPID_PUBLIC_KEY   — base64url VAPID public key
 *   VAPID_PRIVATE_KEY  — base64url VAPID private key
 *   VAPID_SUBJECT      — mailto: or https:// subject claim
 *
 * Sandbox mode logs the payload to stdout so the dev flow works without
 * a real VAPID key pair. Generate keys once with:
 *   npx web-push generate-vapid-keys
 */
@Injectable()
export class VapidPushChannel extends NotificationChannelAdapter {
  readonly name = NotificationChannel.PUSH;
  private configured = false;

  onModuleInit() {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (pub && priv && subject) {
      try {
        webpush.setVapidDetails(subject, pub, priv);
        this.configured = true;
        this.logger.log('VAPID configured — real Web Push enabled');
      } catch (err: any) {
        this.logger.error(`VAPID setup failed: ${err.message}`);
      }
    } else {
      this.logger.warn('VAPID env vars missing — running in sandbox mode');
    }
  }

  async send(payload: NotificationPayload) {
    if (!this.configured) {
      this.logger.log({ to: payload.to, template: payload.templateKey }, '🔔 PUSH (sandbox)');
      return { providerMessageId: `sandbox-push-${Date.now()}` };
    }
    // `to` is the subscription JSON string from the client
    let subscription: any;
    try {
      subscription = typeof payload.to === 'string' ? JSON.parse(payload.to) : payload.to;
    } catch {
      return { error: 'Invalid push subscription JSON' };
    }
    try {
      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.subject ?? 'CareNest',
          body: payload.body,
          tag: payload.templateKey,
          data: payload.payload,
        }),
      );
      return { providerMessageId: result.headers?.location as string ?? `vapid-${Date.now()}` };
    } catch (err: any) {
      // 404/410 mean the subscription is gone — surface to caller
      return { error: `Web Push failed: ${err.statusCode ?? err.message}` };
    }
  }
}
