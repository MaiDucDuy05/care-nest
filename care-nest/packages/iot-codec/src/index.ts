/**
 * @carenest/iot-codec — Wonlex V3.2 protocol codec
 *
 * Provides:
 * - `buildPacket` / `parsePacket` — build and parse a single packet
 * - `PacketBuffer` — TCP stream packet extraction (preferred)
 * - `appendChunk` / `extractPackets` — low-level helpers (kept for compat)
 * - `decodePacket` — typed packet decoder (per-command)
 * - `startMockServer` — local TCP server emitting fixtures (dev/test only)
 *
 * @example
 * ```ts
 * import { buildPacket, parsePacket, decodePacket } from '@carenest/iot-codec';
 *
 * const out = buildPacket('123456789012345', 'UD,120126,103045,A,10.76,N,106.66,E,0,0,0,8,74,85,0');
 * // => "[3G*123456789012345*0054*UD,120126,103045,A,10.76,N,106.66,E,0,0,0,8,74,85,0]"
 *
 * const parsed = parsePacket(out);
 * if (parsed) {
 *   const typed = decodePacket(parsed);
 *   if (typed) console.log(typed.command); // "location"
 * }
 * ```
 */

export {
  buildPacket,
  parsePacket,
  PACKET_PREFIX,
  PACKET_SUFFIX,
} from './codec.js';
export { appendChunk, extractPackets, PacketBuffer, BufferOverflowError } from './utils/buffer.js';
export { PACKET_RE, DEVICE_ID_RE } from './utils/regex.js';
export {
  decodePacket,
  parseFall,
  parseHeartbeat,
  parseLocation,
  parseLogin,
  parsePhonebook,
  parseSos,
  parseVersion,
  parseVitalsBpHr,
  parseVitalsOxygen,
  parseVitalsTemperature,
} from './packets/index.js';
export type { Decoder } from './packets/index.js';

export {
  isValidDeviceId,
  toDeviceId,
  DEVICE_ID_MIN_LENGTH,
  DEVICE_ID_MAX_LENGTH,
  InvalidDeviceIdError,
  type DeviceId,
} from './types/device-id.js';

export type {
  ParsedPacket,
  AnyPacket,
  LoginPacket,
  HeartbeatPacket,
  LocationPacket,
  VitalsBpHrPacket,
  VitalsOxygenPacket,
  VitalsTempPacket,
  SosPacket,
  FallPacket,
  PhonebookPacket,
  VersionPacket,
  ExtractResult,
} from './types/packets.js';

export { startMockServer, type MockServerOptions, type MockFixture } from './server/mock-server.js';
