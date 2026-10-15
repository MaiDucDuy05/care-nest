/**
 * Geofence enums.
 * Backend uses these in device-service and notification-service.
 */

import { z } from 'zod';

/** Geometric shape of a geofence zone */
export const GeofenceShapeSchema = z.enum(['CIRCLE', 'POLYGON']);
export type GeofenceShape = z.infer<typeof GeofenceShapeSchema>;

/** Event type triggered when a device crosses a geofence boundary */
export const GeofenceEventSchema = z.enum(['ENTER', 'EXIT', 'DWELL']);
export type GeofenceEvent = z.infer<typeof GeofenceEventSchema>;
