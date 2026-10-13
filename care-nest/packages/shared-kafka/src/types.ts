/**
 * Shared types for the Kafka wrapper.
 */

export interface KafkaMessage<T = unknown> {
  /** topic the message was published to */
  topic: string;
  /** partition number */
  partition: number;
  /** offset within the partition */
  offset: string;
  /** message key (string-encoded) */
  key?: string;
  /** parsed JSON payload, or raw string if the payload was not JSON */
  value: T;
  /** ISO timestamp from the broker (or local clock if not available) */
  timestamp: string;
  /** message headers */
  headers?: Record<string, string | undefined>;
}

export interface ConsumerConfig {
  /** consumer group id (must be unique per logical subscriber) */
  groupId: string;
  /** topics to subscribe to */
  topics: readonly string[];
  /** per-message handler — throw to retry, return to ack */
  handler: (msg: KafkaMessage) => Promise<void> | void;
  /** max retry attempts before sending to DLQ (default 5) */
  maxRetries?: number;
  /** DLQ topic suffix (default `.dlq`) */
  dlqSuffix?: string;
  /** run from earliest available offset on first connect (default false) */
  fromBeginning?: boolean;
  /** graceful shutdown timeout in ms (default 10_000) */
  shutdownTimeoutMs?: number;
}
