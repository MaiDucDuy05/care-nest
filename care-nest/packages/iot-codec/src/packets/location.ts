/**
 * Location UD packet decoder (GPS update)
 *
 * Format: `UD,{date},{time},{fix},{lat},{latDir},{lon},{lonDir},{speed},{direction},{altitude},{satellites},{gsm},{battery},{steps},...`
 * - date: DDMMYY (UTC)
 * - time: HHMMSS (UTC)
 * - fix: A (active GPS) or V (void)
 * - lat/lon: absolute value (sign carried by latDir/lonDir)
 *
 * Example: `[3G*123456789012345*007E*UD,120126,103045,A,10.762622,N,106.660172,E,0.0,0.0,0.0,8,74,85,0,00000000,0,0,0]`
 */

import type { LocationPacket, ParsedPacket } from '../types/packets.js';

export function parseLocation(packet: ParsedPacket): LocationPacket | null {
  if (packet.commandName !== 'UD') return null;
  if (packet.params.length < 14) return null;

  const [
    date,
    time,
    fixRaw,
    absLatStr,
    latDir,
    absLonStr,
    lonDir,
    speedStr,
    directionStr,
    altitudeStr,
    satellitesStr,
    gsmStr,
    batteryStr,
    stepsStr,
  ] = packet.params;

  // Type guards
  if (
    date === undefined ||
    time === undefined ||
    fixRaw === undefined ||
    absLatStr === undefined ||
    latDir === undefined ||
    absLonStr === undefined ||
    lonDir === undefined ||
    speedStr === undefined ||
    directionStr === undefined ||
    altitudeStr === undefined ||
    satellitesStr === undefined ||
    gsmStr === undefined ||
    batteryStr === undefined ||
    stepsStr === undefined
  ) {
    return null;
  }

  // Strict fix validation: only 'A' (active GPS) or 'V' (void) are valid.
  // Anything else means the packet is malformed — surface as null rather than
  // silently coerce to 'V' and lose information.
  if (fixRaw !== 'A' && fixRaw !== 'V') return null;
  const fix: 'A' | 'V' = fixRaw;
  if (latDir !== 'N' && latDir !== 'S') return null;
  if (lonDir !== 'E' && lonDir !== 'W') return null;

  const absLat = Number.parseFloat(absLatStr);
  const absLon = Number.parseFloat(absLonStr);
  const speed = Number.parseFloat(speedStr);
  const heading = Number.parseFloat(directionStr);
  const altitude = Number.parseFloat(altitudeStr);
  const satellites = Number.parseInt(satellitesStr, 10);
  const gsmSignal = Number.parseInt(gsmStr, 10);
  const battery = Number.parseInt(batteryStr, 10);
  const steps = Number.parseInt(stepsStr, 10);

  if (
    Number.isNaN(absLat) ||
    Number.isNaN(absLon) ||
    Number.isNaN(speed) ||
    Number.isNaN(heading) ||
    Number.isNaN(altitude) ||
    Number.isNaN(satellites) ||
    Number.isNaN(gsmSignal) ||
    Number.isNaN(battery) ||
    Number.isNaN(steps)
  ) {
    return null;
  }

  return {
    ...packet,
    command: 'location',
    date,
    time,
    fix,
    lat: latDir === 'S' ? -absLat : absLat,
    latDir,
    lon: lonDir === 'W' ? -absLon : absLon,
    lonDir,
    speed,
    heading,
    altitude,
    satellites,
    gsmSignal,
    battery,
    steps,
  };
}
