import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { TypedConsumer } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import { TelemetryService } from './telemetry.service.js';

@Injectable()
export class TelemetryConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryConsumer.name);
  private consumer: TypedConsumer | null = null;

  constructor(private readonly telemetryService: TelemetryService) {}

  async onModuleInit() {
    // Only connect if KAFKA_BROKERS is configured
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set, skipping Kafka telemetry consumer');
      return;
    }

    try {
      this.consumer = new TypedConsumer({
        groupId: 'device-service-telemetry',
        topics: [
          KAFKA_TOPICS.IOT_HEARTBEAT_RECEIVED,
          KAFKA_TOPICS.IOT_LOCATION_RECEIVED,
          KAFKA_TOPICS.IOT_VITALS_RECEIVED,
        ],
        handler: async (msg) => {
          await this.telemetryService.handleTelemetryEvent(msg.topic, msg.value);
        },
      });

      await this.consumer.start();
      this.logger.log('TelemetryConsumer connected and listening to Kafka topics');
    } catch (err: any) {
      this.logger.error(`Failed to start Kafka consumer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.stop();
      this.logger.log('TelemetryConsumer disconnected');
    }
  }
}
