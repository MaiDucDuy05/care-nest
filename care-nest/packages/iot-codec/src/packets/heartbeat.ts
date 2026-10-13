/**
 * Heartbeat LK packet decoder
 *
 * Format: `LK,{steps},{overturn},{battery}`
 * Example: `[3G*123456789012345*0016*LK,1234,0,85]`
 */

import type { HeartbeatPacket, ParsedPacket } from '../types/packets.js';

export function parseHeartbeat(packet: ParsedPacket): HeartbeatPacket | null {
  if (packet.commandName !== 'LK') return null;
  const [stepsStr, overturnStr, batteryStr] = packet.params;
  if (stepsStr === undefined || overturnStr === undefined || batteryStr === undefined) {
    return null;
  }
  const steps = Number.parseInt(stepsStr, 10);
  const overturnCount = Number.parseInt(overturnStr, 10);
  const battery = Number.parseInt(batteryStr, 10);
  if (Number.isNaN(steps) || Number.isNaN(overturnCount) || Number.isNaN(battery)) {
    return null;
  }
  return { ...packet, command: 'heartbeat', steps, overturnCount, battery };
}
