/**
 * Wonlex V3.2 packet type definitions
 *
 * Packet format: `[3G*{deviceId}*{LLLL}*{content}]`
 * - LLLL = 4-digit uppercase hex of content UTF-8 byte length
 * - content = comma-separated command + params
 */

import type { DeviceId } from './device-id.js';

export type { DeviceId } from './device-id.js';

export type PacketDirection = 'inbound' | 'outbound';

export type CommandType =
  | 'login'
  | 'heartbeat'
  | 'location'
  | 'vitals_bp_hr'
  | 'vitals_oxygen'
  | 'vitals_temperature'
  | 'sos'
  | 'fall'
  | 'phonebook'
  | 'version'
  | 'poweroff'
  | 'unknown';

/** Base parsed packet from raw bytes */
export interface ParsedPacket {
  /** 10-15 digit device identifier (IMEI) */
  deviceId: DeviceId;
  /** Command name (e.g. "UD", "LK", "bphrt") */
  command: CommandType;
  /** Raw command string (e.g. "UD,...") */
  commandName: string;
  /** Full content payload (after command and comma) */
  payload: string;
  /** All parameters split by comma */
  params: string[];
  /** Original raw packet text */
  raw: string;
  /** Direction: inbound (device → server) or outbound (server → device) */
  direction: PacketDirection;
}

/** Login packet from device */
export interface LoginPacket extends ParsedPacket {
  command: 'login';
  /**
   * Login reason / sub-type. Wonlex spec is loose but typically:
   * - '0' = first login (after power on)
   * - '1' = re-login (after network reconnect)
   */
  loginType: '0' | '1' | string;
}

/** Heartbeat LK (steps + battery) */
export interface HeartbeatPacket extends ParsedPacket {
  command: 'heartbeat';
  steps: number;
  overturnCount: number;
  battery: number;
}

/** Location UD (GPS update) */
export interface LocationPacket extends ParsedPacket {
  command: 'location';
  date: string; // DDMMYY
  time: string; // HHMMSS
  fix: 'A' | 'V'; // A=active GPS, V=void
  lat: number;
  latDir: 'N' | 'S';
  lon: number;
  lonDir: 'E' | 'W';
  speed: number; // km/h
  heading: number; // degrees (compass bearing)
  altitude: number; // meters
  satellites: number;
  gsmSignal: number; // 0-100
  battery: number; // 0-100
  steps: number;
}

/** Blood pressure + heart rate */
export interface VitalsBpHrPacket extends ParsedPacket {
  command: 'vitals_bp_hr';
  systolic: number;
  diastolic: number;
  heartRate: number;
  height: number; // cm
  gender: 0 | 1; // 0=female, 1=male
  age: number;
  weight: number; // kg
}

/** SpO2 oxygen saturation */
export interface VitalsOxygenPacket extends ParsedPacket {
  command: 'vitals_oxygen';
  type: number;
  oxygen: number; // percentage 0-100
}

/** Body temperature */
export interface VitalsTempPacket extends ParsedPacket {
  command: 'vitals_temperature';
  type: number;
  temperature: number; // Celsius
}

/** SOS alert (highest priority) */
export interface SosPacket extends ParsedPacket {
  command: 'sos';
}

/** Fall detection */
export interface FallPacket extends ParsedPacket {
  command: 'fall';
}

/** Phone book status */
export interface PhonebookPacket extends ParsedPacket {
  command: 'phonebook';
  status: number;
}

/** Firmware version */
export interface VersionPacket extends ParsedPacket {
  command: 'version';
  versionString: string;
}

export type AnyPacket =
  | LoginPacket
  | HeartbeatPacket
  | LocationPacket
  | VitalsBpHrPacket
  | VitalsOxygenPacket
  | VitalsTempPacket
  | SosPacket
  | FallPacket
  | PhonebookPacket
  | VersionPacket
  | ParsedPacket;

/** Stream extraction result */
export interface ExtractResult {
  /** Complete packets found in buffer */
  packets: string[];
  /** Remaining buffer for next chunk (incomplete packet at end) */
  remaining: string;
}
