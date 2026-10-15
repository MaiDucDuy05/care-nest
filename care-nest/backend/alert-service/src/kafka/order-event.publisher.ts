import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedProducer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';

export interface AlertTriggeredEvent {
  alertId: string;
  subjectId: string;
  deviceId: string;
  type: string;
  severity: string;
  payload: any;
}

@Injectable()
export class OrderEventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderEventPublisher.name);
  private producer: TypedProducer | null = null;

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — ALERT_TRIGGERED publishes are best-effort');
      return;
    }
    try {
      this.producer = new TypedProducer('alert-service');
      this.logger.log('OrderEventPublisher ready');
    } catch (err: any) {
      this.logger.error(`Failed to init producer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  async publishAlertTriggered(event: AlertTriggeredEvent): Promise<void> {
    if (!this.producer) return;
    await this.producer.publish(KAFKA_TOPICS.ALERT_TRIGGERED, event, { key: event.subjectId });
  }
}
