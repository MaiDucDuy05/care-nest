import type { Socket } from 'node:net';
import { decodePacket, buildPacket, type ParsedPacket } from '@carenest/iot-codec';
import { KAFKA_TOPICS } from '@carenest/shared-config';
import { createLogger } from '@carenest/shared-utils';
import { SessionManager } from '../sessions/session-manager.js';
import { TelemetryPublisher } from '../kafka/telemetry-publisher.js';

const logger = createLogger({ service: 'packet-dispatcher' });
const sessions = SessionManager.getInstance();

const DEVICE_SERVICE_URL =
  process.env.DEVICE_SERVICE_URL || 'http://localhost:3003';

/**
 * Resolve the userId bound to this IMEI by calling device-service.
 * Returns null if the device is not yet activated (i.e. activation
 * code not redeemed, no assignment row). The gateway rejects login
 * packets that arrive from unactivated devices, with one exception:
 * SOS packets are still published so a lost watch can still call for
 * help even before pairing.
 */
async function resolveOwner(deviceId: string): Promise<string | null> {
  try {
    const res = await fetch(`${DEVICE_SERVICE_URL}/api/v1/activation/internal/resolve-owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imei: deviceId }),
    });
    if (!res.ok) {
      logger.warn({ deviceId, status: res.status }, 'resolve-owner non-2xx');
      return null;
    }
    const body = (await res.json()) as { userId: string | null };
    return body.userId;
  } catch (err: any) {
    logger.error({ deviceId, err: err.message }, 'resolve-owner failed');
    return null;
  }
}

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
        // S16: validate the device has been activated (activation code
        // redeemed). We still ack the login so the watch goes idle, but
        // the device is flagged unactivated in our session map so
        // non-SOS packets are dropped downstream.
        const owner = await resolveOwner(deviceId);
        if (!owner) {
          logger.warn(
            { deviceId },
            'Login from unactivated device — accepting but not binding to user'
          );
        } else {
          sessions.setOwner(deviceId, owner);
          logger.info({ deviceId, owner }, 'Device login accepted and bound to user');
        }
        const ack = buildPacket(deviceId, 'login');
        socket.write(ack);
        break;
      }

      case 'heartbeat': {
        if (!sessions.getOwner(deviceId)) {
          logger.debug({ deviceId }, 'Heartbeat from unbound device — dropping (awaiting activation)');
          break;
        }
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
        if (!sessions.getOwner(deviceId)) {
          logger.debug({ deviceId }, 'Location from unbound device — dropping');
          break;
        }
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
        if (!sessions.getOwner(deviceId)) {
          logger.debug({ deviceId }, 'BP/HR from unbound device — dropping');
          break;
        }
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
        if (!sessions.getOwner(deviceId)) {
          logger.debug({ deviceId }, 'SpO2 from unbound device — dropping');
          break;
        }
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
        if (!sessions.getOwner(deviceId)) {
          logger.debug({ deviceId }, 'Temp from unbound device — dropping');
          break;
        }
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
