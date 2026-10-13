/**
 * TCP stream buffer — extract complete packets from a chunked byte stream
 *
 * TCP is a byte stream protocol: a single packet may arrive in multiple chunks,
 * or multiple packets may arrive in a single chunk. The `PacketBuffer` class
 * handles both safely and is the recommended API. The `appendChunk` /
 * `extractPackets` helpers are kept for low-level callers.
 *
 * @see device_simulator/lib/services/tcp_client_service.dart for reference
 */

import type { ExtractResult } from '../types/packets.js';

const DEFAULT_MAX_BUFFER_SIZE = 4096;

/**
 * Stateful TCP packet buffer. Use one instance per connection; the class
 * tracks incomplete data between calls and refuses to grow past the
 * configured cap (4KB by default — bump for fat packets).
 */
export class PacketBuffer {
  private buf = '';
  private readonly maxSize: number;

  constructor(maxSize: number = DEFAULT_MAX_BUFFER_SIZE) {
    this.maxSize = maxSize;
  }

  /** Append a chunk and return the complete packets extracted from it. */
  push(chunk: Buffer | string): string[] {
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
    this.buf += text;
    if (this.buf.length > this.maxSize) {
      // Refuse to grow — flush and start over. Connection should be closed by
      // the caller; this is a defensive bound against a malicious device
      // spamming the gateway.
      this.buf = '';
      throw new BufferOverflowError(this.maxSize);
    }
    const { packets, remaining } = extractPackets(this.buf);
    this.buf = remaining;
    return packets;
  }

  /** Current buffer state (mostly for tests / debugging). */
  get remaining(): string {
    return this.buf;
  }

  /** Bytes currently buffered (for back-pressure decisions). */
  get size(): number {
    return this.buf.length;
  }

  /** Maximum allowed size in bytes. */
  get capacity(): number {
    return this.maxSize;
  }

  /** Reset the buffer to empty. */
  reset(): void {
    this.buf = '';
  }
}

export class BufferOverflowError extends Error {
  constructor(public readonly maxSize: number) {
    super(`PacketBuffer overflow — exceeds ${maxSize} bytes`);
    this.name = 'BufferOverflowError';
  }
}

/**
 * Extract complete packets from a buffer. Returns the packets and any
 * remaining incomplete data to be carried over to the next call.
 *
 * @param buffer Accumulated buffer (state)
 * @returns Packets and remaining buffer
 */
export function extractPackets(buffer: string): ExtractResult {
  const packets: string[] = [];
  let i = 0;
  while (i < buffer.length) {
    const start = buffer.indexOf('[', i);
    if (start === -1) break;
    const end = buffer.indexOf(']', start);
    if (end === -1) {
      // incomplete packet — keep remainder for next call
      return { packets, remaining: buffer.substring(start) };
    }
    packets.push(buffer.substring(start, end + 1));
    i = end + 1;
  }
  return { packets, remaining: '' };
}

/**
 * Append a chunk of incoming bytes to the buffer. Returns the new buffer.
 * Throws `BufferOverflowError` if the new buffer would exceed `maxSize`.
 *
 * @param currentBuffer Current buffer state
 * @param chunk Incoming byte chunk
 * @param maxSize Maximum allowed buffer size (default 4KB)
 * @returns New buffer with chunk appended
 */
export function appendChunk(
  currentBuffer: string,
  chunk: Buffer | string,
  maxSize: number = DEFAULT_MAX_BUFFER_SIZE,
): string {
  const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
  const next = currentBuffer + text;
  if (next.length > maxSize) {
    throw new BufferOverflowError(maxSize);
  }
  return next;
}

export { DEFAULT_MAX_BUFFER_SIZE as MAX_BUFFER_SIZE };
