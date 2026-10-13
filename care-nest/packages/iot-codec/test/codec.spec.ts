import { describe, it, expect } from 'vitest';
import { buildPacket, parsePacket, InvalidDeviceIdError } from '../src/index';
import {
  LOGIN_CONTENT,
  HEARTBEAT_CONTENT,
  LOCATION_CONTENT,
  BPHRT_CONTENT,
  OXYGEN_CONTENT,
  BTEMP_CONTENT,
  VERNO_CONTENT,
  PHBX_CONTENT,
  TEST_DEVICE_ID,
} from './fixtures';

describe('buildPacket', () => {
  it('wraps content with [3G*…*…*…] envelope', () => {
    const out = buildPacket(TEST_DEVICE_ID, LOGIN_CONTENT);
    expect(out.startsWith('[3G*')).toBe(true);
    expect(out.endsWith(']')).toBe(true);
  });

  it('embeds the device ID between the 1st and 2nd asterisks', () => {
    const out = buildPacket(TEST_DEVICE_ID, LOGIN_CONTENT);
    const parts = out.split('*');
    expect(parts[1]).toBe(TEST_DEVICE_ID);
  });

  it('computes the 4-char uppercase hex length of content UTF-8 bytes', () => {
    // "login,0" = 7 bytes
    const out = buildPacket(TEST_DEVICE_ID, LOGIN_CONTENT);
    const parts = out.split('*');
    expect(parts[2]).toBe('0007');
  });

  it('handles multibyte UTF-8 content (Vietnamese)', () => {
    // "xin chào" = 8 chars; "à" (U+00E0) is 2 UTF-8 bytes → 9 bytes total
    const out = buildPacket(TEST_DEVICE_ID, 'xin chào');
    const parts = out.split('*');
    expect(parts[2]).toBe('0009');
  });

  it('throws InvalidDeviceIdError for too-short device ID', () => {
    expect(() => buildPacket('12345', LOGIN_CONTENT)).toThrow(InvalidDeviceIdError);
  });

  it('throws InvalidDeviceIdError for too-long device ID', () => {
    expect(() => buildPacket('1'.repeat(16), LOGIN_CONTENT)).toThrow(InvalidDeviceIdError);
  });

  it('throws InvalidDeviceIdError for non-numeric device ID', () => {
    expect(() => buildPacket('abc123456789', LOGIN_CONTENT)).toThrow(InvalidDeviceIdError);
  });

  it('throws InvalidDeviceIdError for empty string', () => {
    expect(() => buildPacket('', LOGIN_CONTENT)).toThrow(InvalidDeviceIdError);
  });
});

describe('parsePacket', () => {
  it('round-trips a login packet', () => {
    const raw = buildPacket(TEST_DEVICE_ID, LOGIN_CONTENT);
    const parsed = parsePacket(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.deviceId).toBe(TEST_DEVICE_ID);
    expect(parsed?.commandName).toBe('login');
    expect(parsed?.params).toEqual(['0']);
  });

  it('parses each known command correctly', () => {
    const cases: Array<[string, string, string[]]> = [
      [HEARTBEAT_CONTENT, 'LK', ['1234', '0', '85']],
      [LOCATION_CONTENT, 'UD', LOCATION_CONTENT.substring(3).split(',')],
      [BPHRT_CONTENT, 'bphrt', ['120', '80', '72', '170', '1', '68', '70']],
      [OXYGEN_CONTENT, 'oxygen', ['0', '98']],
      [BTEMP_CONTENT, 'btemp2', ['0', '36.6']],
      [VERNO_CONTENT, 'VERNO', ['G29_BASE_V1.00_2014.04.23_17.46.49']],
      [PHBX_CONTENT, 'phbx', ['1']],
    ];
    for (const [content, commandName, params] of cases) {
      const raw = buildPacket(TEST_DEVICE_ID, content);
      const parsed = parsePacket(raw);
      expect(parsed, `parse ${commandName}`).not.toBeNull();
      expect(parsed?.commandName).toBe(commandName);
      expect(parsed?.params).toEqual(params);
    }
  });

  it('returns null on malformed input', () => {
    expect(parsePacket('garbage')).toBeNull();
    expect(parsePacket('[3G*12345*0000*abc]')).toBeNull(); // deviceId too short
    expect(parsePacket('[3G*123456789012345*GGGG*abc]')).toBeNull(); // invalid hex
  });

  it('returns null when declared length does not match content', () => {
    const bad = `[3G*${TEST_DEVICE_ID}*FFFF*login,0]`;
    expect(parsePacket(bad)).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    const raw = buildPacket(TEST_DEVICE_ID, LOGIN_CONTENT);
    expect(parsePacket(`   ${raw}   \n`)).not.toBeNull();
  });

  it('marks parsed packets as inbound by default', () => {
    const raw = buildPacket(TEST_DEVICE_ID, LOGIN_CONTENT);
    const parsed = parsePacket(raw);
    expect(parsed?.direction).toBe('inbound');
  });
});
