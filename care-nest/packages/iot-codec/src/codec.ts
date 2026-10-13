/**
 * Wonlex V3.2 main codec — build & parse packets
 *
 * Packet format: `[3G*{deviceId}*{LLLL}*{content}]`
 * - LLLL = 4-digit uppercase hex of content UTF-8 byte length
 *
 * @see device_simulator/lib/services/wonlex_protocol.dart for reference
 */

import { InvalidDeviceIdError, isValidDeviceId, toDeviceId } from './types/device-id.js';
import type { CommandType, ParsedPacket } from './types/packets.js';
import { PACKET_RE } from './utils/regex.js';

export const PACKET_PREFIX = '[3G*';
export const PACKET_SUFFIX = ']';

/** Map of known command names to typed command type */
const COMMAND_MAP: Record<string, CommandType> = {
  login: 'login',
  LK: 'heartbeat',
  UD: 'location',
  bphrt: 'vitals_bp_hr',
  oxygen: 'vitals_oxygen',
  btemp2: 'vitals_temperature',
  SOS: 'sos',
  fall: 'fall',
  phbx: 'phonebook',
  VERNO: 'version',
  PW: 'poweroff',
};

/** Map raw command name to normalized command type */
function mapCommand(commandName: string): CommandType {
  return COMMAND_MAP[commandName] ?? 'unknown';
}

/**
 * Build a packet to send to/from the device.
 * @param deviceId 10-15 digit IMEI-style device ID
 * @param content Command payload (e.g. "UD,120126,103045,A,...")
 * @returns Formatted packet wrapped in brackets
 * @throws {InvalidDeviceIdError} if deviceId is not 10-15 digits
 */
export function buildPacket(deviceId: string, content: string): string {
  if (!isValidDeviceId(deviceId)) {
    throw new InvalidDeviceIdError(deviceId);
  }
  const byteLen = Buffer.byteLength(content, 'utf-8');
  const len = byteLen.toString(16).padStart(4, '0').toUpperCase();
  return `${PACKET_PREFIX}${deviceId}*${len}*${content}${PACKET_SUFFIX}`;
}

/**
 * Parse a raw packet from the device.
 * @param raw Raw packet text (with or without leading/trailing whitespace)
 * @returns Parsed packet or null if malformed
 */
export function parsePacket(raw: string): ParsedPacket | null {
  const trimmed = raw.trim();
  const match = PACKET_RE.exec(trimmed);
  if (!match) return null;

  const [, deviceIdRaw, lenHex, content] = match;
  // Length validation
  const expectedLen = Buffer.byteLength(content, 'utf-8');
  const declaredLen = parseInt(lenHex, 16);
  if (declaredLen !== expectedLen) {
    return null;
  }

  const commandName = content.split(',')[0] ?? '';
  const payload = content.substring(commandName.length + 1);
  const params = payload.length > 0 ? payload.split(',') : [];

  return {
    deviceId: toDeviceId(deviceIdRaw),
    command: mapCommand(commandName),
    commandName,
    payload,
    params,
    raw: trimmed,
    direction: 'inbound',
  };
}

/** Re-export the regex for advanced use cases */
export { PACKET_RE };
