/**
 * Vitals packet decoders (BP+HRT, SpO2, body temperature)
 */

import type { ParsedPacket, VitalsBpHrPacket, VitalsOxygenPacket, VitalsTempPacket } from '../types/packets.js';

/**
 * Blood pressure + heart rate
 *
 * Format: `bphrt,{systolic},{diastolic},{hr},{height},{gender},{age},{weight}`
 * - gender: 0=female, 1=male
 *
 * Clinical sanity range (out-of-range packets are still parsed but flagged):
 * - systolic:   60-250 mmHg
 * - diastolic:  40-150 mmHg
 * - heartRate:  30-250 bpm
 * - height:    50-250 cm
 * - age:        0-130 years
 * - weight:     1-400 kg
 *
 * Example: `[3G*123456789012345*0023*bphrt,120,80,72,170,1,68,70]`
 */
export function parseVitalsBpHr(packet: ParsedPacket): VitalsBpHrPacket | null {
  if (packet.commandName !== 'bphrt') return null;
  if (packet.params.length < 7) return null;
  const [systolicStr, diastolicStr, hrStr, heightStr, genderStr, ageStr, weightStr] = packet.params;
  if (
    systolicStr === undefined ||
    diastolicStr === undefined ||
    hrStr === undefined ||
    heightStr === undefined ||
    genderStr === undefined ||
    ageStr === undefined ||
    weightStr === undefined
  ) {
    return null;
  }
  const systolic = Number.parseInt(systolicStr, 10);
  const diastolic = Number.parseInt(diastolicStr, 10);
  const heartRate = Number.parseInt(hrStr, 10);
  const height = Number.parseInt(heightStr, 10);
  const gender = Number.parseInt(genderStr, 10);
  const age = Number.parseInt(ageStr, 10);
  const weight = Number.parseInt(weightStr, 10);
  if (
    Number.isNaN(systolic) ||
    Number.isNaN(diastolic) ||
    Number.isNaN(heartRate) ||
    Number.isNaN(height) ||
    Number.isNaN(gender) ||
    Number.isNaN(age) ||
    Number.isNaN(weight) ||
    (gender !== 0 && gender !== 1)
  ) {
    return null;
  }
  // Clinical sanity — the device may send weird numbers during measurement
  // glitches. Reject anything outside the human-plausible range.
  if (systolic < 60 || systolic > 250) return null;
  if (diastolic < 40 || diastolic > 150) return null;
  if (heartRate < 30 || heartRate > 250) return null;
  if (height < 50 || height > 250) return null;
  if (age < 0 || age > 130) return null;
  if (weight < 1 || weight > 400) return null;

  return {
    ...packet,
    command: 'vitals_bp_hr',
    systolic,
    diastolic,
    heartRate,
    height,
    gender,
    age,
    weight,
  };
}

/**
 * SpO2 oxygen saturation
 *
 * Format: `oxygen,{type},{value}`
 * - type: 0=measurement, 1=alert?
 * - value: 0-100 percentage (clinical sanity)
 *
 * Example: `[3G*123456789012345*000E*oxygen,0,98]`
 */
export function parseVitalsOxygen(packet: ParsedPacket): VitalsOxygenPacket | null {
  if (packet.commandName !== 'oxygen') return null;
  if (packet.params.length < 2) return null;
  const [typeStr, oxygenStr] = packet.params;
  if (typeStr === undefined || oxygenStr === undefined) return null;
  const type = Number.parseInt(typeStr, 10);
  const oxygen = Number.parseFloat(oxygenStr);
  if (Number.isNaN(type) || Number.isNaN(oxygen)) return null;
  if (oxygen < 0 || oxygen > 100) return null;
  return { ...packet, command: 'vitals_oxygen', type, oxygen };
}

/**
 * Body temperature
 *
 * Format: `btemp2,{type},{celsius}`
 * - Clinical range: 30-45°C (anything outside = sensor error)
 *
 * Example: `[3G*123456789012345*000F*btemp2,0,36.6]`
 */
export function parseVitalsTemperature(packet: ParsedPacket): VitalsTempPacket | null {
  if (packet.commandName !== 'btemp2') return null;
  if (packet.params.length < 2) return null;
  const [typeStr, tempStr] = packet.params;
  if (typeStr === undefined || tempStr === undefined) return null;
  const type = Number.parseInt(typeStr, 10);
  const temperature = Number.parseFloat(tempStr);
  if (Number.isNaN(type) || Number.isNaN(temperature)) return null;
  if (temperature < 30 || temperature > 45) return null;
  return { ...packet, command: 'vitals_temperature', type, temperature };
}
