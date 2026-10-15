import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface NotificationRequestEvent {
  /** ID of the user to notify. */
  userId: string;
  /** Template key (e.g. 'order.shipped', 'alert.sos'). */
  templateKey: string;
  /** Variables to substitute in the template. */
  payload: Record<string, unknown>;
  /** Optional explicit channel; if absent, dispatcher decides. */
  channel?: 'ZNS' | 'PUSH' | 'SMS' | 'EMAIL';
  /** Idempotency key — replays are deduped by the consumer. */
  idempotencyKey?: string;
}

/**
 * Producer for NOTIFICATION_REQUESTS. Other services publish to this topic
 * instead of calling the notification REST API directly. This decouples
 * caller and receiver and lets us scale consumers independently.
 */
@Injectable()
export class NotificationEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — event publishing is best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('notification-service');
      this.logger.log('NotificationEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  async publishRequest(event: NotificationRequestEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.NOTIFICATION_REQUESTS, event, {
      key: event.userId,
    });
  }
}
