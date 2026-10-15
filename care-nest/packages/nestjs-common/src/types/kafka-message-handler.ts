/**
 * Helper type for `TypedConsumer` handlers.
 *
 *   consumer.subscribe('order.events', (msg: KafkaMessage<OrderCreatedEvent>) => { ... });
 */
export interface KafkaMessageHandler<T> {
  (msg: { key: string | null; value: T; headers: Record<string, string>; offset: string; partition: number }): Promise<void>;
}
