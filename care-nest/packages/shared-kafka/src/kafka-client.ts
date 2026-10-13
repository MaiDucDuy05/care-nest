/**
 * Singleton Kafka client — one per process.
 */

import { Kafka, type KafkaConfig, type Producer, type Consumer, logLevel } from 'kafkajs';
import { loadKafkaEnv } from '@carenest/shared-config';

let kafka: Kafka | undefined;
let producer: Producer | undefined;

export function getKafkaClient(): Kafka {
  if (kafka) return kafka;
  const env = loadKafkaEnv();
  const config: KafkaConfig = {
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.KAFKA_BROKERS.split(',').map((s) => s.trim()).filter(Boolean),
    ssl: env.KAFKA_SSL,
    logLevel: logLevel.NOTHING,
  };
  kafka = new Kafka(config);
  return kafka;
}

export async function getProducer(): Promise<Producer> {
  if (producer) return producer;
  const p = getKafkaClient().producer({
    allowAutoTopicCreation: true,
    idempotent: false, // safe for higher throughput; flip when payment events flow
  });
  await p.connect();
  producer = p;
  return p;
}

export function createConsumer(groupId: string): Consumer {
  return getKafkaClient().consumer({ groupId, allowAutoTopicCreation: true });
}

/** Disconnect the producer and clear the singleton. Call on graceful shutdown. */
export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect().catch(() => {});
    producer = undefined;
  }
  // KafkaJS has no explicit client disconnect — GC handles it.
  kafka = undefined;
}
