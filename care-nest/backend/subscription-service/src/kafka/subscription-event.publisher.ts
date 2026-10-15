import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface SubscriptionCreatedEvent {
  subscriptionId: string;
  userId: string;
  planCode: string;
  startedAt: string; // ISO
  currentPeriodEnd: string; // ISO
}

export interface SubscriptionCancelledEvent {
  subscriptionId: string;
  userId: string;
  cancelledAt: string; // ISO
  reason?: string;
}

export interface SubscriptionRenewedEvent {
  subscriptionId: string;
  userId: string;
  planCode: string;
  periodStart: string; // ISO
  periodEnd: string; // ISO
  amount: number; // VND
}

export interface SubscriptionExpiredEvent {
  subscriptionId: string;
  userId: string;
  expiredAt: string; // ISO
}

export interface DeviceActivationRequestedEvent {
  activationCodeId: string;
  orderId: string;
  userId: string;
  imeiList: string[];
  token: string; // raw UUID v7 — gateway verifies HMAC separately
  expiresAt: string; // ISO
}

@Injectable()
export class SubscriptionEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — event publishing is best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('subscription-service');
      this.logger.log('SubscriptionEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  async publishCreated(event: SubscriptionCreatedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SUBSCRIPTION_CREATED, event, {
      key: event.subscriptionId,
    });
  }

  async publishRenewed(event: SubscriptionRenewedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SUBSCRIPTION_RENEWED, event, {
      key: event.subscriptionId,
    });
  }

  async publishCancelled(event: SubscriptionCancelledEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SUBSCRIPTION_CANCELLED, event, {
      key: event.subscriptionId,
    });
  }

  async publishExpired(event: SubscriptionExpiredEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SUBSCRIPTION_EXPIRED, event, {
      key: event.subscriptionId,
    });
  }

  async publishDeviceActivationRequested(event: DeviceActivationRequestedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.DEVICE_ACTIVATION_REQUESTED, event, {
      key: event.orderId,
    });
  }
}
