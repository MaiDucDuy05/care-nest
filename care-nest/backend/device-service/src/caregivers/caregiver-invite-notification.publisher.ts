import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface CaregiverInvitePayload {
  caregiverId: string;
  caretakerUserId: string;
  inviterName: string;
  relationship: string;
  invitedAt: string;
}

/**
 * Publishes caregiver invite/resend notifications to notification.requests.
 * Mirrors notification-service's NotificationEventPublisher — best-effort
 * when KAFKA_BROKERS is unset so local/sandbox runs without Kafka still work.
 */
@Injectable()
export class CaregiverInviteNotificationPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CaregiverInviteNotificationPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — caregiver invite notifications are best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('device-service');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await disconnectKafka();
    } catch {
      /* swallow */
    }
  }

  /** Returns true if the notification was queued, false if best-effort skip/failure. */
  async publishInvite(payload: CaregiverInvitePayload): Promise<boolean> {
    if (!this.producer) return false;
    try {
      await this.producer.publish(
        KAFKA_TOPICS.NOTIFICATION_REQUESTS,
        {
          userId: payload.caretakerUserId,
          templateKey: 'caregiver.invite',
          payload: {
            inviterName: payload.inviterName,
            relationship: payload.relationship,
          },
          idempotencyKey: `caregiver-invite:${payload.caregiverId}:${payload.invitedAt}`,
        },
        { key: payload.caretakerUserId },
      );
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to publish caregiver invite notification: ${err.message}`);
      return false;
    }
  }
}
