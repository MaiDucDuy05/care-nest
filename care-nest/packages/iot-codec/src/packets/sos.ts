/**
 * Emergency packet decoders (SOS, fall detection)
 *
 * SOS: highest priority, device-side hard button press
 * Fall: detected by accelerometer, near-SOS priority
 */

import type { FallPacket, ParsedPacket, SosPacket } from '../types/packets.js';

/**
 * SOS — no params, just the command name
 *
 * Example: `[3G*123456789012345*0003*SOS]`
 */
export function parseSos(packet: ParsedPacket): SosPacket | null {
  if (packet.commandName !== 'SOS') return null;
  return { ...packet, command: 'sos' };
}

/**
 * Fall detection — no params, just the command name
 *
 * Example: `[3G*123456789012345*0004*fall]`
 */
export function parseFall(packet: ParsedPacket): FallPacket | null {
  if (packet.commandName !== 'fall') return null;
  return { ...packet, command: 'fall' };
}
