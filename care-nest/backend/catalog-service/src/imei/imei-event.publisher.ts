import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import type { ImeiRecord } from '@carenest/database';

export interface ImeiAllocatedEvent {
  orderId: string;
  orderItemId: string;
  sellerId: string;
  imeis: string[];
  productId: string;
  occurredAt: string;
}

export interface ImeiShippedEvent {
  orderId: string;
  sellerId: string;
  imeis: { imei: string; productId: string; orderItemId: string }[];
  occurredAt: string;
}

@Injectable()
export class ImeiEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImeiEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — IMEI event publishing is best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('catalog-service');
      this.logger.log('ImeiEventPublisher ready');
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

  async publishAllocated(records: ImeiRecord[]): Promise<void> {
    if (!this.producer || records.length === 0) return;
    // Group by orderId+orderItemId so each event is one allocation
    const groups = new Map<string, ImeiRecord[]>();
    for (const r of records) {
      if (!r.orderId || !r.orderItemId) continue;
      const key = `${r.orderId}:${r.orderItemId}`;
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    for (const [key, list] of groups) {
      const [orderId, orderItemId] = key.split(':');
      const event: ImeiAllocatedEvent = {
        orderId,
        orderItemId,
        sellerId: list[0].sellerId,
        imeis: list.map((r) => r.imei),
        productId: list[0].productId,
        occurredAt: new Date().toISOString(),
      };
      await this.producer.publish(KAFKA_TOPICS.IMEI_ALLOCATED, event, { key: orderId });
    }
  }

  async publishShipped(orderId: string, sellerId: string, records: ImeiRecord[]): Promise<void> {
    if (!this.producer || records.length === 0) return;
    const event: ImeiShippedEvent = {
      orderId,
      sellerId,
      imeis: records.map((r) => ({
        imei: r.imei,
        productId: r.productId,
        orderItemId: r.orderItemId ?? '',
      })),
      occurredAt: new Date().toISOString(),
    };
    await this.producer.publish(KAFKA_TOPICS.IMEI_SHIPPED, event, { key: orderId });
  }
}
