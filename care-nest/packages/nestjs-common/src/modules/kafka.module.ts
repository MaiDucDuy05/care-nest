import { Global, Module, OnApplicationShutdown, Inject, Logger } from '@nestjs/common';
import { getKafkaClient, disconnectKafka, type TypedProducer } from '@carenest/shared-kafka';
import { KAFKA_PRODUCER } from '../tokens.js';

/**
 * Global KafkaModule — exposes a singleton producer.
 *
 * Consumers are NOT module-scoped because each topic+group is a long-lived
 * runner; services should instantiate their own `createConsumer(...)` inside
 * a dedicated worker module (e.g. `DeviceVitalsConsumer`).
 */
@Global()
@Module({
  providers: [
    {
      provide: KAFKA_PRODUCER,
      useFactory: async (): Promise<TypedProducer> => {
        const log = new Logger('KafkaModule');
        const client = getKafkaClient();
        const producer = client.producer({ allowAutoTopicCreation: false, idempotent: true });
        await producer.connect();
        log.log('kafka producer connected');
        return producer as unknown as TypedProducer;
      },
    },
  ],
  exports: [KAFKA_PRODUCER],
})
export class KafkaModule implements OnApplicationShutdown {
  private readonly log = new Logger(KafkaModule.name);

  constructor(@Inject(KAFKA_PRODUCER) private readonly producer: TypedProducer) {}

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.producer.disconnect();
    } catch (e) {
      this.log.warn(`producer disconnect: ${(e as Error).message}`);
    }
    await disconnectKafka();
    this.log.log('kafka disconnected');
  }
}
