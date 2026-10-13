/**
 * Phone book status packet decoder
 *
 * Format: `phbx,{status}`
 *
 * Example: `[3G*123456789012345*0007*phbx,1]`
 */

import type { ParsedPacket, PhonebookPacket } from '../types/packets.js';

export function parsePhonebook(packet: ParsedPacket): PhonebookPacket | null {
  if (packet.commandName !== 'phbx') return null;
  if (packet.params.length < 1) return null;
  const statusStr = packet.params[0];
  if (statusStr === undefined) return null;
  const status = Number.parseInt(statusStr, 10);
  if (Number.isNaN(status)) return null;
  return { ...packet, command: 'phonebook', status };
}
