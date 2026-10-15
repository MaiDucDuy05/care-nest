import type { Socket } from 'node:net';
import { PacketBuffer, parsePacket } from '@carenest/iot-codec';
import { createLogger } from '@carenest/shared-utils';
import { PacketDispatcher } from '../handlers/packet-dispatcher.js';
import { SessionManager } from '../sessions/session-manager.js';

const logger = createLogger({ service: 'connection-handler' });
const sessions = SessionManager.getInstance();

export function handleConnection(socket: Socket): void {
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  logger.info({ remoteAddress }, 'New TCP connection established');

  const buffer = new PacketBuffer();
  let boundDeviceId: string | null = null;

  socket.setKeepAlive(true, 30_000);
  socket.setTimeout(120_000); // 2 min idle timeout

  socket.on('data', async (chunk: Buffer) => {
    try {
      const extractedPackets = buffer.push(chunk);
      for (const rawPacket of extractedPackets) {
        const parsed = parsePacket(rawPacket);
        if (parsed) {
          boundDeviceId = parsed.deviceId;
          await PacketDispatcher.dispatch(parsed, socket);
        } else {
          logger.warn({ raw: rawPacket }, 'Unparsable packet');
        }
      }
    } catch (err: any) {
      logger.error({ err, remoteAddress }, 'Error handling socket data');
    }
  });

  socket.on('timeout', () => {
    logger.warn({ remoteAddress, boundDeviceId }, 'Socket timed out due to inactivity');
    socket.end();
  });

  socket.on('error', (err) => {
    logger.error({ err, remoteAddress, boundDeviceId }, 'Socket error');
  });

  socket.on('close', () => {
    if (boundDeviceId) {
      sessions.unregister(boundDeviceId);
    }
    logger.info({ remoteAddress, boundDeviceId }, 'Socket closed and unregistered');
  });
}
