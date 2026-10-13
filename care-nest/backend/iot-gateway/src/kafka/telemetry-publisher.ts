import { TypedProducer } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import { createLogger } from '@carenest/shared-utils';

const logger = createLogger({ service: 'iot-telemetry-publisher' });
const producer = new TypedProducer('iot-gateway');

export class TelemetryPublisher {
  static async publishLocation(data: {
    deviceId: string;
    lat: number;
    lon: number;
    timestamp: string;
    accuracy?: number;
    battery?: number;
  }): Promise<void> {
    try {
      await producer.publish(KAFKA_TOPICS.IOT_LOCATION_RECEIVED, data, { key: data.deviceId });
    } catch (err: any) {
      logger.error({ err, deviceId: data.deviceId }, 'Failed to publish location event to Kafka');
    }
  }

  static async publishVitals(data: {
    deviceId: string;
    type: 'bp_hr' | 'oxygen' | 'temp';
    values: Record<string, number>;
    timestamp: string;
  }): Promise<void> {
    try {
      await producer.publish(KAFKA_TOPICS.IOT_VITALS_RECEIVED, data, { key: data.deviceId });
    } catch (err: any) {
      logger.error({ err, deviceId: data.deviceId }, 'Failed to publish vitals event to Kafka');
    }
  }

  static async publishAlert(
    topic: typeof KAFKA_TOPICS.IOT_SOS_RECEIVED | typeof KAFKA_TOPICS.IOT_FALL_RECEIVED,
    data: {
      deviceId: string;
      timestamp: string;
      lat?: number;
      lon?: number;
    },
  ): Promise<void> {
    try {
      await producer.publish(topic, data, { key: data.deviceId });
    } catch (err: any) {
      logger.error({ err, deviceId: data.deviceId, topic }, 'Failed to publish emergency alert to Kafka');
    }
  }

  static async publishHeartbeat(data: {
    deviceId: string;
    battery: number;
    steps?: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await producer.publish(KAFKA_TOPICS.IOT_HEARTBEAT_RECEIVED, data, { key: data.deviceId });
    } catch (err: any) {
      logger.error({ err, deviceId: data.deviceId }, 'Failed to publish heartbeat to Kafka');
    }
  }
}
