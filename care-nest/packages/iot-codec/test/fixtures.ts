/**
 * Test fixtures for the iot-codec package.
 *
 * Fixtures match the device simulator's command set verbatim so the codec and
 * the simulator are validated against the same data.
 */

import { buildPacket, parsePacket } from '../src/codec';

const DEVICE_ID = '123456789012345';

export const LOGIN_CONTENT = 'login,0';
export const LOGIN_PACKET = buildPacket(DEVICE_ID, LOGIN_CONTENT);

export const HEARTBEAT_CONTENT = 'LK,1234,0,85';
export const HEARTBEAT_PACKET = buildPacket(DEVICE_ID, HEARTBEAT_CONTENT);

export const LOCATION_CONTENT =
  'UD,120126,103045,A,10.762622,N,106.660172,E,0.0,0.0,0.0,8,74,85,0,00000000,0,0,0';
export const LOCATION_PACKET = buildPacket(DEVICE_ID, LOCATION_CONTENT);

export const BPHRT_CONTENT = 'bphrt,120,80,72,170,1,68,70';
export const BPHRT_PACKET = buildPacket(DEVICE_ID, BPHRT_CONTENT);

export const OXYGEN_CONTENT = 'oxygen,0,98';
export const OXYGEN_PACKET = buildPacket(DEVICE_ID, OXYGEN_CONTENT);

export const BTEMP_CONTENT = 'btemp2,0,36.6';
export const BTEMP_PACKET = buildPacket(DEVICE_ID, BTEMP_CONTENT);

export const SOS_PACKET = buildPacket(DEVICE_ID, 'SOS');
export const FALL_PACKET = buildPacket(DEVICE_ID, 'fall');

export const PHBX_CONTENT = 'phbx,1';
export const PHBX_PACKET = buildPacket(DEVICE_ID, PHBX_CONTENT);

export const VERNO_CONTENT = 'VERNO,G29_BASE_V1.00_2014.04.23_17.46.49';
export const VERNO_PACKET = buildPacket(DEVICE_ID, VERNO_CONTENT);

export const TEST_DEVICE_ID = DEVICE_ID;

export { parsePacket };

export const ALL_FIXTURE_PACKETS: ReadonlyArray<readonly [string, string]> = [
  ['login', LOGIN_PACKET],
  ['heartbeat', HEARTBEAT_PACKET],
  ['location', LOCATION_PACKET],
  ['bphrt', BPHRT_PACKET],
  ['oxygen', OXYGEN_PACKET],
  ['btemp2', BTEMP_PACKET],
  ['SOS', SOS_PACKET],
  ['fall', FALL_PACKET],
  ['phbx', PHBX_PACKET],
  ['VERNO', VERNO_PACKET],
];
