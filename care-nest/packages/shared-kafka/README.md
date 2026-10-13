# @carenest/shared-kafka

KafkaJS wrapper with CareNest conventions: typed `TypedProducer.publish` /
`TypedConsumer.start|stop`, JSON encoding, retry with DLQ, and structured
logging.

## Producer

```ts
import { TypedProducer, KAFKA_TOPICS } from '@carenest/shared-kafka';

const producer = new TypedProducer('iot-gateway');
await producer.publish(KAFKA_TOPICS.IOT_LOCATION_RECEIVED, {
  deviceId,
  lat: 10.76,
  lon: 106.66,
});
```

## Consumer

```ts
import { TypedConsumer, KAFKA_TOPICS } from '@carenest/shared-kafka';

const consumer = new TypedConsumer({
  groupId: 'health-service',
  topics: [KAFKA_TOPICS.IOT_LOCATION_RECEIVED, KAFKA_TOPICS.IOT_VITALS_RECEIVED],
  handler: async (msg) => {
    // ack on resolve, retry on throw, DLQ after maxRetries
  },
});
await consumer.start();
```
