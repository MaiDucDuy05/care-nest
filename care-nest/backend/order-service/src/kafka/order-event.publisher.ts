import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  total: number;
  paymentMethod: string;
}

export interface OrderShippedEvent {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  /** S12: IMEIs that shipped with this order. Empty array for non-IMEI items. */
  imeis: { imei: string; productId: string; orderItemId: string }[];
}

@Injectable()
export class OrderEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — event publishing is best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('order-service');
      this.logger.log('OrderEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  async publishOrderCreated(event: OrderCreatedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.ORDER_CREATED, event, { key: event.orderId });
  }

  async publishOrderShipped(event: OrderShippedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.ORDER_SHIPPED, event, { key: event.orderId });
  }
}
