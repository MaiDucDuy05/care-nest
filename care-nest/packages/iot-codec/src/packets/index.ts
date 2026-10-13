/**
 * Packet decoders — auto-dispatch to the right decoder based on command type
 *
 * Use `decodePacket` for the common case. For DLQ-style error handling, wrap
 * the call in a try/catch or check the returned `command` field.
 */

import type { AnyPacket, CommandType, ParsedPacket } from '../types/packets.js';
import { parseFall, parseSos } from './sos.js';
import { parseHeartbeat } from './heartbeat.js';
import { parseLocation } from './location.js';
import { parseLogin } from './login.js';
import { parsePhonebook } from './phonebook.js';
import { parseVersion } from './version.js';
import { parseVitalsBpHr, parseVitalsOxygen, parseVitalsTemperature } from './vitals.js';

/** A typed decoder: takes a ParsedPacket, returns a typed variant or null. */
export type Decoder = (packet: ParsedPacket) => AnyPacket | null;

const DECODERS: Record<CommandType, Decoder> = {
  login: (p) => parseLogin(p),
  heartbeat: (p) => parseHeartbeat(p),
  location: (p) => parseLocation(p),
  vitals_bp_hr: (p) => parseVitalsBpHr(p),
  vitals_oxygen: (p) => parseVitalsOxygen(p),
  vitals_temperature: (p) => parseVitalsTemperature(p),
  sos: (p) => parseSos(p),
  fall: (p) => parseFall(p),
  phonebook: (p) => parsePhonebook(p),
  version: (p) => parseVersion(p),
  poweroff: (p) => p, // pass through, command is already typed
  unknown: (p) => p,
};

/**
 * Decode a generic ParsedPacket into its typed variant.
 *
 * If the command is recognized but the payload is malformed (e.g. invalid
 * vitals), the decoder returns null. The caller can detect this via:
 *   - `result === null` (decode failed)
 *   - or by inspecting `result.command` and seeing it's still the generic
 *     'unknown' command.
 */
export function decodePacket(packet: ParsedPacket): AnyPacket | null {
  const decoder = DECODERS[packet.command];
  return decoder(packet);
}

export {
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
};
