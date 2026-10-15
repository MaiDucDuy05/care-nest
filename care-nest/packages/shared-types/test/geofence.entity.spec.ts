import { describe, it, expect } from 'vitest';
import { GeofenceSchema } from '../src/entities/geofence.entity.js';

const BASE_GEOFENCE = {
  id: '0180c19c-0000-4000-8000-000000000001',
  userId: '0180c19c-0000-4000-8000-000000000002',
  name: 'Home Zone',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  deletedAt: null,
};

describe('GeofenceSchema — CIRCLE', () => {
  it('parses a valid circle geofence', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'CIRCLE' as const,
      circle: { center: { lat: 10.762622, lng: 106.660172 }, radiusM: 100 },
      alertEvents: ['ENTER', 'EXIT'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects CIRCLE without circle config', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'CIRCLE' as const,
      alertEvents: ['ENTER'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects radiusM <= 0', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'CIRCLE' as const,
      circle: { center: { lat: 10.762622, lng: 106.660172 }, radiusM: 0 },
      alertEvents: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects lat outside [-90, 90]', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'CIRCLE' as const,
      circle: { center: { lat: 91, lng: 106.660172 }, radiusM: 100 },
      alertEvents: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('GeofenceSchema — POLYGON', () => {
  it('parses a valid polygon geofence', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'POLYGON' as const,
      polygon: {
        vertices: [
          { lat: 10.76, lng: 106.65 },
          { lat: 10.77, lng: 106.65 },
          { lat: 10.77, lng: 106.67 },
          { lat: 10.76, lng: 106.67 },
        ],
      },
      alertEvents: ['ENTER'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects polygon with fewer than 3 vertices', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'POLYGON' as const,
      polygon: {
        vertices: [
          { lat: 10.76, lng: 106.65 },
          { lat: 10.77, lng: 106.65 },
        ],
      },
      alertEvents: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects POLYGON without polygon config', () => {
    const result = GeofenceSchema.safeParse({
      ...BASE_GEOFENCE,
      shape: 'POLYGON' as const,
      alertEvents: ['EXIT'],
    });
    expect(result.success).toBe(false);
  });
});
