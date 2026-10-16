import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface OrderPaidEvent {
  orderId: string;
  paymentId: string;
  amount: number;
  method: string;
}

export interface OrderRefundedEvent {
  orderId: string;
  paymentId: string;
  amountVnd: number;
  refundRef: string;
  reason?: string;
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
      this.producer = new TypedProducer('payment-service');
      this.logger.log('OrderEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  async publishOrderPaid(event: OrderPaidEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.ORDER_PAID, event, { key: event.orderId });
  }

  async publishOrderRefunded(event: OrderRefundedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.ORDER_REFUNDED, event, { key: event.orderId });
  }
}
