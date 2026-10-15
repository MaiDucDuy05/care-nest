/**
 * Local type aliases for shared-types entities that are not yet exported in the index.
 * These are kept in sync with packages/shared-types/src/entities/.
 */

// Re-export what we need from shared-types
export type {
  Plan,
  Subscription,
  ProrationPreview,
  SubscriptionReminder,
} from '@carenest/shared-types';

export type {
  PlanId,
  SubscriptionId,
  GeofenceId,
  CaregiverId,
  UserId,
} from '@carenest/shared-types';

export type {
  PlanInterval,
  SubStatus,
  ProrationMode,
} from '@carenest/shared-types';

export type { GeofenceShape, GeofenceEvent } from '@carenest/shared-types';

// Define Geofence locally (not yet in shared-types entities index)
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface CircleConfig {
  center: GeoPoint;
  radiusM: number;
}

export interface PolygonConfig {
  vertices: GeoPoint[];
}

export interface Geofence {
  id: string;
  userId: string;
  name: string;
  shape: 'CIRCLE' | 'POLYGON';
  circle?: CircleConfig | null;
  polygon?: PolygonConfig | null;
  alertEvents: Array<'ENTER' | 'EXIT' | 'DWELL'>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ReminderKind =
  | 'MEDICATION'
  | 'APPOINTMENT'
  | 'BILLING'
  | 'DEVICE_BATTERY'
  | 'GEOFENCE_EXIT'
  | 'CUSTOM';
