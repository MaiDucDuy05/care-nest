import { describe, it, expect } from 'vitest';
import { appendChunk, extractPackets, PacketBuffer, BufferOverflowError, buildPacket } from '../src/index';
import { LOGIN_PACKET, HEARTBEAT_PACKET, LOCATION_PACKET, TEST_DEVICE_ID } from './fixtures';

describe('extractPackets', () => {
  it('extracts a single complete packet', () => {
    const buf = LOGIN_PACKET;
    const out = extractPackets(buf);
    expect(out.packets).toEqual([LOGIN_PACKET]);
    expect(out.remaining).toBe('');
  });

  it('extracts multiple packets in one chunk', () => {
    const buf = `${LOGIN_PACKET}${HEARTBEAT_PACKET}${LOCATION_PACKET}`;
    const out = extractPackets(buf);
    expect(out.packets).toEqual([LOGIN_PACKET, HEARTBEAT_PACKET, LOCATION_PACKET]);
    expect(out.remaining).toBe('');
  });

  it('keeps an incomplete packet as remaining', () => {
    const partial = LOGIN_PACKET.slice(0, LOGIN_PACKET.length - 5);
    const out = extractPackets(partial);
    expect(out.packets).toEqual([]);
    expect(out.remaining).toBe(partial);
  });

  it('handles a mix of complete and incomplete packets', () => {
    const incomplete = LOGIN_PACKET.slice(0, 12);
    const buf = `${LOGIN_PACKET}${HEARTBEAT_PACKET}${incomplete}`;
    const out = extractPackets(buf);
    expect(out.packets).toEqual([LOGIN_PACKET, HEARTBEAT_PACKET]);
    expect(out.remaining).toBe(incomplete);
  });

  it('handles leading garbage', () => {
    const buf = `garbage${LOGIN_PACKET}`;
    const out = extractPackets(buf);
    expect(out.packets).toEqual([LOGIN_PACKET]);
    expect(out.remaining).toBe('');
  });
});

describe('appendChunk', () => {
  it('appends a string chunk to the buffer', () => {
    const next = appendChunk('', LOGIN_PACKET);
    expect(next).toBe(LOGIN_PACKET);
  });

  it('appends a Buffer chunk to the buffer', () => {
    const next = appendChunk('', Buffer.from(LOGIN_PACKET, 'utf-8'));
    expect(next).toBe(LOGIN_PACKET);
  });

  it('flushes (returns empty) when the buffer would overflow', () => {
    const huge = 'x'.repeat(5000);
    expect(() => appendChunk(huge, 'y')).toThrow(BufferOverflowError);
  });

  it('round-trips a multi-chunk stream', () => {
    let buf = '';
    const chunks = [LOGIN_PACKET.slice(0, 5), LOGIN_PACKET.slice(5, 20), LOGIN_PACKET.slice(20)];
    const all: string[] = [];
    for (const c of chunks) {
      buf = appendChunk(buf, c);
      const out = extractPackets(buf);
      buf = out.remaining;
      all.push(...out.packets);
    }
    expect(all).toEqual([LOGIN_PACKET]);
  });

  it('handles two packets split across chunks', () => {
    let buf = '';
    const halfLen = Math.floor(LOGIN_PACKET.length / 2);
    const split1 = LOGIN_PACKET.slice(0, halfLen);
    const split2 = LOGIN_PACKET.slice(halfLen) + HEARTBEAT_PACKET.slice(0, 5);
    const split3 = HEARTBEAT_PACKET.slice(5);

    buf = appendChunk(buf, split1);
    let out = extractPackets(buf);
    buf = out.remaining;
    // First packet is split: we get the half after the `[`, no complete packet yet
    expect(out.packets).toEqual([]);

    buf = appendChunk(buf, split2);
    out = extractPackets(buf);
    buf = out.remaining;
    // First packet is now complete (its `]` arrived in split2), second is still split
    expect(out.packets).toEqual([LOGIN_PACKET]);

    buf = appendChunk(buf, split3);
    out = extractPackets(buf);
    expect(out.packets).toEqual([HEARTBEAT_PACKET]);
    expect(out.remaining).toBe('');
  });
});

describe('device id validation (sanity)', () => {
  it('rejects an invalid device id when building', () => {
    expect(() => buildPacket('short', 'login,0')).toThrow();
  });
  it('accepts a 10-digit device id', () => {
    expect(buildPacket('1234567890', 'login,0').length).toBeGreaterThan(0);
  });
  it('accepts a 15-digit device id', () => {
    expect(buildPacket(TEST_DEVICE_ID, 'login,0').length).toBeGreaterThan(0);
  });
});

describe('PacketBuffer class', () => {
  it('extracts complete packets across pushes', () => {
    const buf = new PacketBuffer();
    const halfLen = Math.floor(LOGIN_PACKET.length / 2);
    let packets = buf.push(LOGIN_PACKET.slice(0, halfLen));
    expect(packets).toEqual([]);
    packets = buf.push(LOGIN_PACKET.slice(halfLen));
    expect(packets).toEqual([LOGIN_PACKET]);
    expect(buf.size).toBe(0);
  });

  it('handles multiple packets in one push', () => {
    const buf = new PacketBuffer();
    const packets = buf.push(`${LOGIN_PACKET}${HEARTBEAT_PACKET}`);
    expect(packets).toEqual([LOGIN_PACKET, HEARTBEAT_PACKET]);
  });

  it('throws BufferOverflowError on overflow', () => {
    const buf = new PacketBuffer(16);
    expect(() => buf.push('x'.repeat(17))).toThrow(BufferOverflowError);
  });

  it('resets cleanly', () => {
    const buf = new PacketBuffer();
    buf.push(LOGIN_PACKET.slice(0, 10));
    expect(buf.size).toBe(10);
    buf.reset();
    expect(buf.size).toBe(0);
  });

  it('accepts a Buffer chunk', () => {
    const buf = new PacketBuffer();
    const packets = buf.push(Buffer.from(LOGIN_PACKET, 'utf-8'));
    expect(packets).toEqual([LOGIN_PACKET]);
  });
});
