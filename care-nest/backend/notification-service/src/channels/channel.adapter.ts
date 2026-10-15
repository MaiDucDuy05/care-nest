import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@carenest/database';

export interface NotificationPayload {
  to: string;          // email / phone / deviceToken / zaloUserId
  subject?: string;    // for email
  body: string;
  templateKey: string;
  payload: Record<string, unknown>;
}

/**
 * Channel adapter contract. Each channel (email/sms/push/zalo) implements
 * this. The dispatch service routes to one or more channels based on the
 * notification's channel config.
 *
 * In dev/test, all channels log to stdout instead of calling real
 * providers. Production swap-in is via env-driven configuration.
 */
@Injectable()
export abstract class NotificationChannelAdapter {
  abstract readonly name: NotificationChannel;
  protected readonly logger = new Logger(this.constructor.name);

  abstract send(payload: NotificationPayload): Promise<{ providerMessageId?: string; error?: string }>;
}
