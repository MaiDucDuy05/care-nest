/**
 * Typed Kafka producer with JSON encoding.
 *
 * Usage:
 *   const producer = new TypedProducer('iot-gateway');
 *   await producer.publish(KAFKA_TOPICS.IOT_LOCATION_RECEIVED, { deviceId, lat, lon });
 */

import type { ProducerRecord } from 'kafkajs';
import { getProducer } from './kafka-client.js';

export class TypedProducer {
  constructor(public readonly name: string) {
    void name;
  }

  /**
   * Publish a JSON-serializable message to a topic.
   * The producer is connected lazily on first call.
   */
  async publish<T>(topic: string, value: T, options: { key?: string; headers?: Record<string, string> } = {}): Promise<void> {
    const p = await getProducer();
    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key: options.key,
          value: JSON.stringify(value),
          headers: options.headers,
        },
      ],
    };
    await p.send(record);
  }

  /** Publish to multiple topics in one call. */
  async publishBatch(records: Array<{ topic: string; value: unknown; key?: string }>): Promise<void> {
    const p = await getProducer();
    const producerRecords: ProducerRecord[] = records.map((r) => ({
      topic: r.topic,
      messages: [{ key: r.key, value: JSON.stringify(r.value) }],
    }));
    // kafkajs' send accepts ProducerRecord[] but TypeScript's overload resolution
    // doesn't widen a freshly built array — cast keeps the call site tidy.
    await p.send(producerRecords as unknown as ProducerRecord);
  }

  /** Disconnect the underlying kafkajs producer. */
  async disconnect(): Promise<void> {
    const p = await getProducer();
    await p.disconnect();
  }
}
