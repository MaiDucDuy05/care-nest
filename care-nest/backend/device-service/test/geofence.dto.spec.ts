import { describe, it, expect } from 'vitest';
import { CreateGeofenceSchema, UpdateGeofenceSchema } from '../src/geofence/geofence.dto.js';

describe('CreateGeofenceSchema', () => {
  it('accepts a valid geofence', () => {
    const r = CreateGeofenceSchema.safeParse({
      name: 'Nhà riêng',
      centerLat: 10.776,
      centerLon: 106.701,
      radiusMeters: 200,
    });
    expect(r.success).toBe(true);
  });

  it('uses default radius of 150', () => {
    const r = CreateGeofenceSchema.safeParse({
      name: 'Nhà',
      centerLat: 10.776,
      centerLon: 106.701,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.radiusMeters).toBe(150);
  });

  it('rejects out-of-range lat', () => {
    const r = CreateGeofenceSchema.safeParse({
      name: 'X',
      centerLat: 91,
      centerLon: 0,
    });
    expect(r.success).toBe(false);
  });

  it('rejects radius < 50m', () => {
    const r = CreateGeofenceSchema.safeParse({
      name: 'X',
      centerLat: 0,
      centerLon: 0,
      radiusMeters: 10,
    });
    expect(r.success).toBe(false);
  });
});

describe('UpdateGeofenceSchema', () => {
  it('accepts empty update', () => {
    const r = UpdateGeofenceSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('accepts partial update with active flag', () => {
    const r = UpdateGeofenceSchema.safeParse({ active: false });
    expect(r.success).toBe(true);
  });
});
