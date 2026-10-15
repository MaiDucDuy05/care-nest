import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedConsumer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationChannel } from '@carenest/database';

interface OrderCreatedEvent { orderId: string; buyerId: string; orderNumber: string; }
interface OrderShippedEvent { orderId: string; buyerId: string; orderNumber: string; trackingCode?: string; }
interface AlertTriggeredEvent { subjectId: string; type: string; severity: string; payload: any; }
interface NotificationRequestEvent {
  userId: string;
  templateKey: string;
  payload: Record<string, unknown>;
  channel?: 'ZNS' | 'PUSH' | 'SMS' | 'EMAIL';
  idempotencyKey?: string;
}

@Injectable()
export class NotificationKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationKafkaConsumer.name);
  private consumer: TypedConsumer | null = null;
  /** In-process idempotency cache — bounded LRU, cleared on restart. */
  private readonly seenKeys = new Set<string>();

  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — Kafka consumer disabled');
      return;
    }
    try {
      this.consumer = new TypedConsumer({
        groupId: 'notification-service',
        topics: [
          KAFKA_TOPICS.ORDER_CREATED,
          KAFKA_TOPICS.ORDER_SHIPPED,
          KAFKA_TOPICS.ALERT_TRIGGERED,
          KAFKA_TOPICS.NOTIFICATION_REQUESTS,
        ],
        handler: async (msg) => {
          await this.handle(msg.topic, msg.value);
        },
      });
      await this.consumer.start();
      this.logger.log('Listening for order, alert and notification.request events');
    } catch (err: any) {
      this.logger.error(`Failed to start Kafka consumer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { if (this.consumer) await this.consumer.stop(); } catch { /* swallow */ }
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  private async handle(topic: string, value: any) {
    try {
      if (topic === KAFKA_TOPICS.ORDER_CREATED) {
        const e = value as OrderCreatedEvent;
        await this.notificationsService.send({
          userId: e.buyerId,
          channel: NotificationChannel.EMAIL,
          templateKey: 'order.created',
          payload: { orderNumber: e.orderNumber, total: '—' },
        });
      } else if (topic === KAFKA_TOPICS.ORDER_SHIPPED) {
        const e = value as OrderShippedEvent;
        await this.notificationsService.send({
          userId: e.buyerId,
          channel: NotificationChannel.EMAIL,
          templateKey: 'order.shipped',
          payload: { orderNumber: e.orderNumber, trackingCode: e.trackingCode },
        });
      } else if (topic === KAFKA_TOPICS.ALERT_TRIGGERED) {
        const e = value as AlertTriggeredEvent;
        const template = e.type === 'SOS' ? 'alert.sos' : e.type === 'FALL' ? 'alert.fall' : 'alert.vitals';
        await this.notificationsService.send({
          userId: e.subjectId,
          channel: undefined, // dispatcher picks — critical alerts fan out
          templateKey: template,
          payload: e.payload as Record<string, unknown>,
        });
      } else if (topic === KAFKA_TOPICS.NOTIFICATION_REQUESTS) {
        const e = value as NotificationRequestEvent;
        if (e.idempotencyKey && this.seenKeys.has(e.idempotencyKey)) {
          this.logger.log({ key: e.idempotencyKey }, 'Duplicate notification request — skipping');
          return;
        }
        if (e.idempotencyKey) {
          this.seenKeys.add(e.idempotencyKey);
          // Bounded cleanup: if cache grows past 10k entries, clear the half
          if (this.seenKeys.size > 10_000) {
            const half = Array.from(this.seenKeys).slice(0, 5_000);
            for (const k of half) this.seenKeys.delete(k);
          }
        }
        await this.notificationsService.send({
          userId: e.userId,
          channel: e.channel as any,
          templateKey: e.templateKey,
          payload: e.payload,
        });
      }
    } catch (err: any) {
      this.logger.warn({ err: err.message, topic }, 'Failed to handle Kafka message');
    }
  }
}
