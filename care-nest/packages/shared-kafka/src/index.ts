/**
 * @carenest/shared-kafka
 *
 * Wraps KafkaJS with CareNest conventions:
 * - one Kafka client per process (created lazily)
 * - typed `publish(topic, message)` with JSON encoding
 * - typed `consume(groupId, topic, handler)` with retry, DLQ, and structured logging
 * - automatic producer/consumer teardown on `dispose()`
 */

export * from './kafka-client.js';
export * from './producer.js';
export * from './consumer.js';
export * from './topics.js';
export type { KafkaMessage, ConsumerConfig } from './types.js';
