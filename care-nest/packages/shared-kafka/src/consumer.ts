/**
 * Typed Kafka consumer with retry + DLQ.
 *
 * Usage:
 *   const consumer = new TypedConsumer({ groupId: 'health-service', topics: [...] });
 *   await consumer.start();
 *   // … on shutdown:
 *   await consumer.stop();
 */

import type { Consumer, EachMessagePayload } from 'kafkajs';
import { createLogger, retry } from '@carenest/shared-utils';
import { createConsumer, getProducer } from './kafka-client.js';
import type { ConsumerConfig, KafkaMessage } from './types.js';

export class TypedConsumer {
  private consumer: Consumer | undefined;
  private running = false;
  private readonly log;

  constructor(private readonly config: ConsumerConfig) {
    this.log = createLogger({ service: `kafka-consumer:${config.groupId}` });
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.consumer = createConsumer(this.config.groupId);
    await this.consumer.connect();

    for (const topic of this.config.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: this.config.fromBeginning ?? false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleOne(payload);
      },
    });

    this.running = true;
    this.log.info(
      { groupId: this.config.groupId, topics: this.config.topics },
      'kafka consumer started',
    );
  }

  async stop(): Promise<void> {
    if (!this.consumer || !this.running) return;
    try {
      await this.consumer.disconnect();
    } finally {
      this.running = false;
      this.log.info({ groupId: this.config.groupId }, 'kafka consumer stopped');
    }
  }

  private async handleOne(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const valueStr = message.value?.toString('utf-8') ?? '';
    let value: unknown;
    try {
      value = valueStr ? JSON.parse(valueStr) : null;
    } catch {
      value = valueStr; // raw string passthrough
    }

    const msg: KafkaMessage = {
      topic,
      partition,
      offset: message.offset,
      key: message.key?.toString('utf-8'),
      value,
      timestamp: new Date(Number(message.timestamp)).toISOString(),
      headers: this.parseHeaders(message.headers),
    };

    try {
      await retry(
        async () => this.config.handler(msg),
        {
          attempts: this.config.maxRetries ?? 5,
          initialDelayMs: 500,
          shouldRetry: (err) => {
            // Don't retry validation errors — straight to DLQ
            if (err instanceof Error && err.name === 'ValidationError') return false;
            return true;
          },
          onRetry: (err, attempt) => {
            this.log.warn({ err, attempt, topic, offset: message.offset }, 'kafka handler retry');
          },
        },
      );
    } catch (err) {
      this.log.error({ err, topic, offset: message.offset }, 'kafka handler exhausted retries — DLQ');
      // DLQ topic: append suffix
      const dlqTopic = `${topic}${this.config.dlqSuffix ?? '.dlq'}`;
      const producer = await getProducer();
      await producer.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: {
              ...this.parseHeaders(message.headers),
              'x-original-topic': topic,
              'x-error': String(err),
            },
          },
        ],
      });
    }
  }

  private parseHeaders(headers: EachMessagePayload['message']['headers']): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {};
    if (!headers) return out;
    for (const [k, v] of Object.entries(headers)) {
      if (v == null) {
        out[k] = undefined;
        continue;
      }
      const buf = Array.isArray(v) ? Buffer.concat(v.map((b) => Buffer.isBuffer(b) ? b : Buffer.from(b))) : (Buffer.isBuffer(v) ? v : Buffer.from(v));
      out[k] = buf.toString('utf-8');
    }
    return out;
  }
}
