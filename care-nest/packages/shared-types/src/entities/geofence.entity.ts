/**
 * Geofence entity schema — supports CIRCLE and POLYGON zones.
 * Backend uses this in device-service and notification-service.
 * Geofence IDs use UUID v7 for time-ordered queries.
 */

import { z } from 'zod';
import { AuditTimestampsSchema } from '../common.js';
import { GeofenceShapeSchema, GeofenceEventSchema } from '../enums/geofence.js';
import { geofenceIdSchema, userIdSchema } from '../ids.js';

/** Lat/lng point */
export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

/** Circle: center + radius in metres */
export const CircleConfigSchema = z.object({
  center: GeoPointSchema,
  radiusM: z.number().positive(),
});
export type CircleConfig = z.infer<typeof CircleConfigSchema>;

/** Polygon: ordered list of vertices (min 3) */
export const PolygonConfigSchema = z.object({
  vertices: z.array(GeoPointSchema).min(3),
});
export type PolygonConfig = z.infer<typeof PolygonConfigSchema>;

/** Geofence entity */
export const GeofenceSchema = z.object({
  id: geofenceIdSchema,
  userId: userIdSchema,
  name: z.string().min(1).max(100),
  shape: GeofenceShapeSchema,
  /** Discriminated union — use `shape` field to pick variant */
  circle: CircleConfigSchema.nullable().optional(),
  polygon: PolygonConfigSchema.nullable().optional(),
  alertEvents: z.array(GeofenceEventSchema).default(['ENTER', 'EXIT']),
  isActive: z.boolean().default(true),
  ...AuditTimestampsSchema.shape,
}).refine(
  (d) => (d.shape === 'CIRCLE' ? d.circle != null : d.polygon != null),
  { message: 'circle required for CIRCLE shape, polygon required for POLYGON shape' },
);

export type Geofence = z.infer<typeof GeofenceSchema>;
