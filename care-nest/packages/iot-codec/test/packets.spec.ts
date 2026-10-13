import { describe, it, expect } from 'vitest';
import {
  decodePacket,
  parseLogin,
  parseHeartbeat,
  parseLocation,
  parseVitalsBpHr,
  parseVitalsOxygen,
  parseVitalsTemperature,
  parseSos,
  parseFall,
  parsePhonebook,
  parseVersion,
  buildPacket,
} from '../src/index';
import {
  LOGIN_PACKET,
  HEARTBEAT_PACKET,
  LOCATION_PACKET,
  BPHRT_PACKET,
  OXYGEN_PACKET,
  BTEMP_PACKET,
  SOS_PACKET,
  FALL_PACKET,
  PHBX_PACKET,
  VERNO_PACKET,
  TEST_DEVICE_ID,
  parsePacket,
} from './fixtures';

function parsed(packet: string) {
  const p = parsePacket(packet);
  if (!p) throw new Error('fixture invalid');
  return p;
}

describe('packet decoders', () => {
  it('decodes login', () => {
    const out = parseLogin(parsed(LOGIN_PACKET))!;
    expect(out.command).toBe('login');
    expect(out.loginType).toBe('0');
  });

  it('decodes heartbeat', () => {
    const out = parseHeartbeat(parsed(HEARTBEAT_PACKET))!;
    expect(out.command).toBe('heartbeat');
    expect(out.steps).toBe(1234);
    expect(out.overturnCount).toBe(0);
    expect(out.battery).toBe(85);
  });

  it('decodes location with signed lat/lon', () => {
    const out = parseLocation(parsed(LOCATION_PACKET))!;
    expect(out.command).toBe('location');
    expect(out.date).toBe('120126');
    expect(out.time).toBe('103045');
    expect(out.fix).toBe('A');
    expect(out.lat).toBeCloseTo(10.762622);
    expect(out.lon).toBeCloseTo(106.660172);
    expect(out.satellites).toBe(8);
    expect(out.battery).toBe(85);
  });

  it('decodes location with south hemisphere as negative lat', () => {
    // 15 params: date,time,fix,lat,latDir,lon,lonDir,speed,heading,alt,sats,gsm,batt,steps,+
    const south = buildPacket(TEST_DEVICE_ID, 'UD,010126,000000,A,33.8688,S,151.2093,E,0,0,0,6,80,90,0');
    const out = parseLocation(parsed(south))!;
    expect(out.lat).toBeCloseTo(-33.8688);
    expect(out.lon).toBeCloseTo(151.2093);
  });

  it('decodes vitals BP+HR', () => {
    const out = parseVitalsBpHr(parsed(BPHRT_PACKET))!;
    expect(out.command).toBe('vitals_bp_hr');
    expect(out.systolic).toBe(120);
    expect(out.diastolic).toBe(80);
    expect(out.heartRate).toBe(72);
    expect(out.gender).toBe(1);
  });

  it('rejects vitals BP+HR with invalid gender', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'bphrt,120,80,72,170,5,68,70');
    const out = parseVitalsBpHr(parsed(bad));
    expect(out).toBeNull();
  });

  it('decodes vitals oxygen', () => {
    const out = parseVitalsOxygen(parsed(OXYGEN_PACKET))!;
    expect(out.command).toBe('vitals_oxygen');
    expect(out.oxygen).toBe(98);
  });

  it('decodes vitals temperature', () => {
    const out = parseVitalsTemperature(parsed(BTEMP_PACKET))!;
    expect(out.command).toBe('vitals_temperature');
    expect(out.temperature).toBe(36.6);
  });

  it('decodes SOS', () => {
    const out = parseSos(parsed(SOS_PACKET))!;
    expect(out.command).toBe('sos');
  });

  it('decodes fall', () => {
    const out = parseFall(parsed(FALL_PACKET))!;
    expect(out.command).toBe('fall');
  });

  it('decodes phonebook', () => {
    const out = parsePhonebook(parsed(PHBX_PACKET))!;
    expect(out.command).toBe('phonebook');
    expect(out.status).toBe(1);
  });

  it('decodes version', () => {
    const out = parseVersion(parsed(VERNO_PACKET))!;
    expect(out.command).toBe('version');
    expect(out.versionString).toBe('G29_BASE_V1.00_2014.04.23_17.46.49');
  });

  it('returns null for the wrong command', () => {
    const p = parsed(LOGIN_PACKET);
    expect(parseHeartbeat(p)).toBeNull();
    expect(parseLocation(p)).toBeNull();
  });

  it('returns null for heartbeat with missing or invalid params', () => {
    const tooFew = buildPacket(TEST_DEVICE_ID, 'LK,1,2');
    expect(parseHeartbeat(parsed(tooFew))).toBeNull();
    const nonNumeric = buildPacket(TEST_DEVICE_ID, 'LK,abc,def,ghi');
    expect(parseHeartbeat(parsed(nonNumeric))).toBeNull();
  });

  it('returns null for location with malformed fix flag', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'UD,010126,000000,X,33.8688,S,151.2093,E,0,0,0,6,80,90,0');
    expect(parseLocation(parsed(bad))).toBeNull();
  });

  it('returns null for location with bad lat/lon direction', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'UD,010126,000000,A,33.8688,X,151.2093,E,0,0,0,6,80,90,0');
    expect(parseLocation(parsed(bad))).toBeNull();
  });

  it('returns null for location with too few params', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'UD,010126,000000,A,33.8688,S');
    expect(parseLocation(parsed(bad))).toBeNull();
  });

  it('returns null for vitals with NaN values', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'bphrt,abc,80,72,170,1,68,70');
    expect(parseVitalsBpHr(parsed(bad))).toBeNull();
  });

  it('returns null for oxygen with NaN value', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'oxygen,0,abc');
    expect(parseVitalsOxygen(parsed(bad))).toBeNull();
  });

  it('returns null for temperature with NaN value', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'btemp2,0,abc');
    expect(parseVitalsTemperature(parsed(bad))).toBeNull();
  });

  it('returns null for phonebook with non-numeric status', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'phbx,abc');
    expect(parsePhonebook(parsed(bad))).toBeNull();
  });

  it('returns null for phonebook with no params', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'phbx');
    expect(parsePhonebook(parsed(bad))).toBeNull();
  });

  it('returns null for sos when commandName is not SOS', () => {
    const p = parsed(LOGIN_PACKET);
    expect(parseSos(p)).toBeNull();
  });

  it('returns null for fall when commandName is not fall', () => {
    const p = parsed(LOGIN_PACKET);
    expect(parseFall(p)).toBeNull();
  });

  it('returns null for version when commandName is not VERNO', () => {
    const p = parsed(LOGIN_PACKET);
    expect(parseVersion(p)).toBeNull();
  });

  it('decodePacket dispatches to the right typed decoder', () => {
    expect(decodePacket(parsed(LOGIN_PACKET))!.command).toBe('login');
    expect(decodePacket(parsed(HEARTBEAT_PACKET))!.command).toBe('heartbeat');
    expect(decodePacket(parsed(LOCATION_PACKET))!.command).toBe('location');
    expect(decodePacket(parsed(BPHRT_PACKET))!.command).toBe('vitals_bp_hr');
    expect(decodePacket(parsed(OXYGEN_PACKET))!.command).toBe('vitals_oxygen');
    expect(decodePacket(parsed(BTEMP_PACKET))!.command).toBe('vitals_temperature');
    expect(decodePacket(parsed(SOS_PACKET))!.command).toBe('sos');
    expect(decodePacket(parsed(FALL_PACKET))!.command).toBe('fall');
    expect(decodePacket(parsed(PHBX_PACKET))!.command).toBe('phonebook');
    expect(decodePacket(parsed(VERNO_PACKET))!.command).toBe('version');
  });

  it('decodePacket returns the original packet for unknown commands', () => {
    const raw = buildPacket(TEST_DEVICE_ID, 'PW,off');
    const typed = decodePacket(parsed(raw))!;
    expect(typed.command).toBe('poweroff');
  });

  it('decodePacket returns null for known command with malformed payload', () => {
    // bphrt with bad gender (was 5) — should be rejected by the strict decoder
    const bad = buildPacket(TEST_DEVICE_ID, 'bphrt,120,80,72,170,5,68,70');
    expect(decodePacket(parsed(bad))).toBeNull();
  });

  it('decodePacket returns null for vitals with clinical-out-of-range values', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'bphrt,500,80,72,170,1,68,70'); // systolic 500 > 250
    expect(decodePacket(parsed(bad))).toBeNull();

    const badO2 = buildPacket(TEST_DEVICE_ID, 'oxygen,0,150'); // oxygen 150 > 100
    expect(decodePacket(parsed(badO2))).toBeNull();

    const badTemp = buildPacket(TEST_DEVICE_ID, 'btemp2,0,10'); // 10 < 30
    expect(decodePacket(parsed(badTemp))).toBeNull();
  });

  it('decodePacket returns null for location with invalid fix flag', () => {
    const bad = buildPacket(TEST_DEVICE_ID, 'UD,010126,000000,X,33.8688,S,151.2093,E,0,0,0,6,80,90,0');
    expect(decodePacket(parsed(bad))).toBeNull();
  });
});
