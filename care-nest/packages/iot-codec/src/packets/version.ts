/**
 * Firmware version packet decoder
 *
 * Format: `VERNO,{version_string}`
 *
 * Example: `[3G*123456789012345*0027*VERNO,G29_BASE_V1.00_2014.04.23_17.46.49]`
 */

import type { ParsedPacket, VersionPacket } from '../types/packets.js';

export function parseVersion(packet: ParsedPacket): VersionPacket | null {
  if (packet.commandName !== 'VERNO') return null;
  return { ...packet, command: 'version', versionString: packet.payload };
}
