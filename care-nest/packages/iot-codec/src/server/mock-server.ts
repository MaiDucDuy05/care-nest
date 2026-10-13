/**
 * Local mock TCP server (development & integration tests)
 *
 * Listens on a port, accepts a Wonlex-style TCP connection, and replies with
 * pre-defined fixture packets. Mirrors the device simulator's command set so
 * the IoT gateway can be developed and tested end-to-end without real hardware.
 *
 * WARNING: dev/test only — do NOT enable in production. The server is single-shot
 * per connection and does not authenticate the device. Strip this entry from
 * production builds by importing from `@carenest/iot-codec/server` instead of
 * the root barrel.
 *
 * Wire format: each packet is terminated by a `\n` byte. This deviates from
 * the real Wonlex spec (which is a bare stream of `[…]…` packets) but
 * simplifies TCP framing in tests; the gateway should split on `\n` and strip
 * it before passing each line to `parsePacket`.
 */

import { createServer, type Server, type Socket } from 'node:net';
import { buildPacket } from '../codec.js';
import { isValidDeviceId } from '../types/device-id.js';
import { PACKET_RE } from '../utils/regex.js';

export interface MockFixture {
  /** deviceId the server identifies as (must be 10-15 digits) */
  deviceId: string;
  /**
   * list of *content* strings (without the `[3G*…*…*…]` envelope) the server
   * will send on connect. The first item is sent immediately after login ack.
   */
  initialBurst: readonly string[];
  /**
   * Optional handler called for each command the gateway sends. Return a
   * `content` string (without envelope) to be sent back, or `null` to reply
   * with nothing.
   */
  onCommand?: (commandName: string, params: readonly string[]) => string | null;
}

export interface MockServerOptions {
  port: number;
  host?: string;
  fixture: MockFixture;
  /** milliseconds before the server stops itself if no client connects */
  idleTimeoutMs?: number;
}

interface ActiveClient {
  socket: Socket;
  buffer: string;
}

const FRAME = '\n';

export async function startMockServer(options: MockServerOptions): Promise<Server> {
  const { port, host = '127.0.0.1', fixture, idleTimeoutMs = 30_000 } = options;

  if (!isValidDeviceId(fixture.deviceId)) {
    throw new Error(`mock-server: invalid deviceId "${fixture.deviceId}"`);
  }

  const server: Server = createServer((socket) => {
    const client: ActiveClient = { socket, buffer: '' };

    socket.on('data', (chunk: Buffer) => {
      client.buffer += chunk.toString('utf-8');
      let nlIdx = client.buffer.indexOf(FRAME);
      while (nlIdx >= 0) {
        const line = client.buffer.slice(0, nlIdx).trim();
        client.buffer = client.buffer.slice(nlIdx + 1);
        if (line.length > 0) handleEnvelope(client, line, fixture);
        nlIdx = client.buffer.indexOf(FRAME);
      }
    });

    socket.on('error', (err: Error) => {
      // Log only; connection errors are part of normal teardown
      // eslint-disable-next-line no-console
      console.warn(`[mock-server] socket error: ${err.message}`);
    });

    // Send initial burst (e.g. login packet, heartbeat, GPS) on connect
    queueMicrotask(() => {
      for (const content of fixture.initialBurst) {
        const env = buildPacket(fixture.deviceId, content);
        socket.write(env + FRAME);
      }
    });
  });

  // Idle timeout — if no client connects in idleTimeoutMs, shut down.
  const idleTimer = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.warn(`[mock-server] idle for ${idleTimeoutMs}ms — closing`);
    server.close();
  }, idleTimeoutMs);
  idleTimer.unref();

  // Clear the idle timer once a listener is up (someone might have connected
  // before the timer fired). Always unref the server so tests can exit.
  server.once('listening', () => clearTimeout(idleTimer));

  return new Promise<Server>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

function handleEnvelope(client: ActiveClient, envelope: string, fixture: MockFixture): void {
  const m = PACKET_RE.exec(envelope);
  if (!m) return; // ignore malformed
  const content = m[3] ?? '';
  const firstComma = content.indexOf(',');
  const commandName = firstComma >= 0 ? content.slice(0, firstComma) : content;
  const params = firstComma >= 0 ? content.slice(firstComma + 1).split(',') : [];
  const reply = fixture.onCommand?.(commandName, params);
  if (reply !== null && reply !== undefined) {
    const env = buildPacket(fixture.deviceId, reply);
    client.socket.write(env + FRAME);
  }
}
