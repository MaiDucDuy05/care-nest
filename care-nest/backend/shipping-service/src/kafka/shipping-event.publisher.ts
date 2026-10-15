import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface ShipmentCreatedEvent {
  shipmentId: string;
  orderId: string;
  trackingCode: string;
  carrier: string;
  estimatedAt?: string;
}

export interface ShipmentStatusChangedEvent {
  shipmentId: string;
  orderId: string;
  trackingCode: string;
  status: string;
  carrier: string;
  description?: string;
  location?: string;
}

export interface OrderDeliveredEvent {
  orderId: string;
  shipmentId: string;
  deliveredAt: string;
  trackingCode: string;
  carrier: string;
}

export interface ShipmentFailedEvent {
  shipmentId: string;
  orderId: string;
  reason: string;
}

@Injectable()
export class ShippingEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShippingEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — event publishing is best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('shipping-service');
      this.logger.log('ShippingEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init Kafka producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  async publishCreated(event: ShipmentCreatedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SHIPMENT_CREATED, event, { key: event.shipmentId });
  }

  async publishStatusChanged(event: ShipmentStatusChangedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SHIPMENT_STATUS_CHANGED, event, {
      key: event.shipmentId,
    });
  }

  async publishDelivered(event: OrderDeliveredEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.ORDER_DELIVERED, event, { key: event.orderId });
  }

  async publishFailed(event: ShipmentFailedEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.SHIPMENT_FAILED, event, { key: event.shipmentId });
  }
}
