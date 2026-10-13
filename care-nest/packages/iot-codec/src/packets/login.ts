/**
 * Login packet decoder
 *
 * Format: `login,{loginType}`
 * Example: `[3G*123456789012345*0009*login,0]`
 */

import type { LoginPacket, ParsedPacket } from '../types/packets.js';

export function parseLogin(packet: ParsedPacket): LoginPacket | null {
  if (packet.commandName !== 'login') return null;
  const loginType = packet.params[0] ?? '';
  return { ...packet, command: 'login', loginType };
}
