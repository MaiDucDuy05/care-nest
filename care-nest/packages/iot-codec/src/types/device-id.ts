/**
 * DeviceId branded type and validation utilities
 */

import { DEVICE_ID_RE } from '../utils/regex.js';

/** 10-15 digit device identifier (IMEI-style) */
export type DeviceId = string & { readonly __brand: 'DeviceId' };

/** Device ID must be 10-15 digits (matches Wonlex spec) */
export const DEVICE_ID_MIN_LENGTH = 10;
export const DEVICE_ID_MAX_LENGTH = 15;

/** Type guard: check if string is a valid device ID */
export function isValidDeviceId(value: string): value is DeviceId {
  return DEVICE_ID_RE.test(value);
}

/** Cast string to DeviceId, throws if invalid */
export function toDeviceId(value: string): DeviceId {
  if (!isValidDeviceId(value)) {
    throw new InvalidDeviceIdError(value);
  }
  return value as DeviceId;
}

export class InvalidDeviceIdError extends Error {
  constructor(public readonly deviceId: string) {
    super(`Invalid deviceId: "${deviceId}" — must be 10-15 digits`);
    this.name = 'InvalidDeviceIdError';
  }
}
