import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypedConsumer, disconnectKafka } from '@carenest/shared-kafka';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import { AlertsService } from '../alerts/alerts.service.js';

@Injectable()
export class AlertKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertKafkaConsumer.name);
  private consumer: TypedConsumer | null = null;

  constructor(private readonly alertsService: AlertsService) {}

  async onModuleInit() {
    if (!process.env.KAFKA_BROKERS) {
      this.logger.warn('KAFKA_BROKERS not set — Kafka consumer disabled');
      return;
    }
    try {
      this.consumer = new TypedConsumer({
        groupId: 'alert-service',
        topics: [
          KAFKA_TOPICS.IOT_VITALS_RECEIVED,
          KAFKA_TOPICS.IOT_LOCATION_RECEIVED,
          KAFKA_TOPICS.IOT_SOS_RECEIVED,
          KAFKA_TOPICS.IOT_FALL_RECEIVED,
          KAFKA_TOPICS.IOT_HEARTBEAT_RECEIVED,
        ],
        handler: async (msg) => {
          await this.handle(msg.topic, msg.value);
        },
      });
      await this.consumer.start();
      this.logger.log('Listening for IoT telemetry + alert topics');
    } catch (err: any) {
      this.logger.error(`Failed to start consumer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try { if (this.consumer) await this.consumer.stop(); } catch { /* swallow */ }
    try { await disconnectKafka(); } catch { /* swallow */ }
  }

  private async handle(topic: string, value: any) {
    try {
      if (topic === KAFKA_TOPICS.IOT_VITALS_RECEIVED) {
        const v = value;
        const reading: any = { measuredAt: new Date(v.measuredAt || Date.now()) };
        if (v.systolic !== undefined) reading.systolic = v.systolic;
        if (v.diastolic !== undefined) reading.diastolic = v.diastolic;
        if (v.heartRate !== undefined) reading.heartRate = v.heartRate;
        if (v.oxygen !== undefined) reading.oxygen = v.oxygen;
        if (v.bodyTempC !== undefined) reading.bodyTempC = v.bodyTempC;
        await this.alertsService.handleVitals({ deviceId: v.deviceId, subjectId: v.userId, reading });
      } else if (topic === KAFKA_TOPICS.IOT_SOS_RECEIVED) {
        const v = value;
        await this.alertsService.handleSos({ deviceId: v.deviceId, subjectId: v.userId, occurredAt: new Date(v.occurredAt || Date.now()), lat: v.lat, lon: v.lon });
      } else if (topic === KAFKA_TOPICS.IOT_FALL_RECEIVED) {
        const v = value;
        await this.alertsService.handleFall({ deviceId: v.deviceId, subjectId: v.userId, occurredAt: new Date(v.occurredAt || Date.now()), lat: v.lat, lon: v.lon });
      } else if (topic === KAFKA_TOPICS.IOT_HEARTBEAT_RECEIVED) {
        const v = value;
        if (typeof v.battery === 'number') {
          await this.alertsService.handleLowBattery({ deviceId: v.deviceId, subjectId: v.userId, occurredAt: new Date(v.receivedAt || Date.now()), battery: v.battery });
        }
      }
      // IOT_LOCATION_RECEIVED is handled by the geofence path inside alertsService
      // when geofences are registered. Phase 1 keeps it simple — we only
      // emit when explicitly triggered by a separate geofence event.
    } catch (err: any) {
      this.logger.warn({ err: err.message, topic }, 'Alert consumer handler failed');
    }
  }
}
