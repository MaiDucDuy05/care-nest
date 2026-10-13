import { describe, it, expect, afterEach } from 'vitest';
import { startMockServer } from '../src/server';
import { createConnection, type Socket } from 'node:net';
import { extractPackets, appendChunk, decodePacket } from '../src/index';
import { TEST_DEVICE_ID, parsePacket } from './fixtures';
import type { Server } from 'node:net';

let server: Server | null = null;
let sock: Socket | null = null;

afterEach(async () => {
  if (sock) {
    sock.destroy();
    sock = null;
  }
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
});

describe('mock-server', () => {
  it('accepts a TCP connection and emits the initial burst', async () => {
    const port = 18811;
    server = await startMockServer({
      port,
      fixture: {
        deviceId: TEST_DEVICE_ID,
        initialBurst: ['login,0', 'LK,100,0,90'],
      },
    });

    const received: string[] = [];
    await new Promise<void>((resolve, reject) => {
      sock = createConnection(port, '127.0.0.1', () => {
        // connection established
      });
      let buf = '';
      sock.on('data', (chunk: Buffer) => {
        buf = appendChunk(buf, chunk);
        const out = extractPackets(buf);
        buf = out.remaining;
        for (const p of out.packets) received.push(p);
        if (received.length >= 2) resolve();
      });
      sock.on('error', reject);
      setTimeout(() => reject(new Error('timeout')), 3000);
    });

    expect(received).toHaveLength(2);
    const first = parsePacket(received[0]!);
    expect(first?.commandName).toBe('login');
    const second = parsePacket(received[1]!);
    expect(second?.commandName).toBe('LK');
  });

  it('responds to inbound commands via onCommand handler', async () => {
    const port = 18812;
    server = await startMockServer({
      port,
      fixture: {
        deviceId: TEST_DEVICE_ID,
        initialBurst: [],
        onCommand: (cmd) => {
          if (cmd === 'VERNO') return 'VERNO,G29_BASE_V1.00_2014.04.23_17.46.49';
          return null;
        },
      },
    });

    const replyPackets: string[] = [];
    await new Promise<void>((resolve, reject) => {
      sock = createConnection(port, '127.0.0.1', () => {
        // send VERNO request after 50ms to give server time to attach handlers
        setTimeout(() => {
          sock!.write(`[3G*${TEST_DEVICE_ID}*0005*VERNO]\n`);
        }, 50);
      });
      let buf = '';
      sock.on('data', (chunk: Buffer) => {
        buf = appendChunk(buf, chunk);
        const out = extractPackets(buf);
        buf = out.remaining;
        for (const p of out.packets) replyPackets.push(p);
        if (replyPackets.length >= 1) resolve();
      });
      sock.on('error', reject);
      setTimeout(() => reject(new Error('timeout')), 3000);
    });

    expect(replyPackets).toHaveLength(1);
    const p = parsePacket(replyPackets[0]!);
    expect(p?.commandName).toBe('VERNO');
    const typed = decodePacket(p!);
    expect(typed.command).toBe('version');
  });

  it('rejects invalid deviceId in fixture', async () => {
    await expect(
      startMockServer({
        port: 18813,
        fixture: { deviceId: 'bad', initialBurst: [] },
      }),
    ).rejects.toThrow();
  });
});
