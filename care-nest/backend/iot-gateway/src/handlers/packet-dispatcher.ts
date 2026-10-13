import type { Socket } from 'node:net';
import { decodePacket, buildPacket, type ParsedPacket } from '@carenest/iot-codec';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import { createLogger } from '@carenest/shared-utils';
import { SessionManager } from '../sessions/session-manager.js';
import { TelemetryPublisher } from '../kafka/telemetry-publisher.js';

const logger = createLogger({ service: 'packet-dispatcher' });
const sessions = SessionManager.getInstance();

export class PacketDispatcher {
  static async dispatch(parsed: ParsedPacket, socket: Socket): Promise<void> {
    const typed = decodePacket(parsed);
    if (!typed) {
      logger.warn({ raw: parsed.raw }, 'Packet decode failed or payload malformed');
      return;
    }

    const { deviceId } = parsed;

    // Track active connection by deviceId
    sessions.register(deviceId, socket);

    switch (typed.command) {
      case 'login': {
        logger.info({ deviceId }, 'Device login accepted');
        // Acknowledge login packet back to watch
        const ack = buildPacket(deviceId, 'login');
        socket.write(ack);
        break;
      }

      case 'heartbeat': {
        const payload = typed as any;
        const battery = payload.battery ?? 100;
        const steps = payload.steps;
        logger.debug({ deviceId, battery, steps }, 'Heartbeat received');

        await TelemetryPublisher.publishHeartbeat({
          deviceId,
          battery,
          steps,
          timestamp: new Date().toISOString(),
        });

        // Acknowledge heartbeat
        const ack = buildPacket(deviceId, 'LK');
        socket.write(ack);
        break;
      }

      case 'location': {
        const payload = typed as any;
        logger.info({ deviceId, lat: payload.lat, lon: payload.lon }, 'Location report received');

        await TelemetryPublisher.publishLocation({
          deviceId,
          lat: payload.lat,
          lon: payload.lon,
          accuracy: payload.accuracy,
          battery: payload.battery,
          timestamp: payload.timestamp ? payload.timestamp.toISOString() : new Date().toISOString(),
        });
        break;
      }

      case 'vitals_bp_hr': {
        const payload = typed as any;
        logger.info({ deviceId, systolic: payload.systolic, diastolic: payload.diastolic, hr: payload.heartRate }, 'BP/HR vitals received');

        await TelemetryPublisher.publishVitals({
          deviceId,
          type: 'bp_hr',
          values: {
            systolic: payload.systolic,
            diastolic: payload.diastolic,
            heartRate: payload.heartRate,
          },
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'vitals_oxygen': {
        const payload = typed as any;
        logger.info({ deviceId, spo2: payload.spo2 }, 'SpO2 vitals received');

        await TelemetryPublisher.publishVitals({
          deviceId,
          type: 'oxygen',
          values: { spo2: payload.spo2 },
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'vitals_temperature': {
        const payload = typed as any;
        logger.info({ deviceId, temp: payload.temperature }, 'Body temperature vitals received');

        await TelemetryPublisher.publishVitals({
          deviceId,
          type: 'temp',
          values: { temperature: payload.temperature },
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'sos': {
        logger.warn({ deviceId }, 'CRITICAL: SOS signal received from device!');
        await TelemetryPublisher.publishAlert(KAFKA_TOPICS.IOT_SOS_RECEIVED, {
          deviceId,
          timestamp: new Date().toISOString(),
        });
        // Send ack so watch stops repeating alarm tone
        const ack = buildPacket(deviceId, 'SOS');
        socket.write(ack);
        break;
      }

      case 'fall': {
        logger.warn({ deviceId }, 'CRITICAL: Fall detected from device accelerometer!');
        await TelemetryPublisher.publishAlert(KAFKA_TOPICS.IOT_FALL_RECEIVED, {
          deviceId,
          timestamp: new Date().toISOString(),
        });
        const ack = buildPacket(deviceId, 'fall');
        socket.write(ack);
        break;
      }

      default:
        logger.debug({ command: typed.command, deviceId }, 'Unhandled or info command received');
        break;
    }
  }
}
