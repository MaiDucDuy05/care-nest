import { AlertType, AlertSeverity } from '@carenest/database';

/**
 * Vital threshold rules — clinical ranges based on standard adult norms.
 * Adjustments for pediatric/elderly subjects are out of scope for Phase 1.
 *
 * Sources: WHO/ESC guidelines. These are conservative ranges chosen to err
 * on the side of MORE alerts in Phase 1 (we can tighten in Phase 2 based
 * on false-positive feedback from caregivers).
 */

export interface VitalsReading {
  type: 'BP' | 'HR' | 'OXYGEN' | 'TEMP';
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  oxygen?: number;
  bodyTempC?: number;
  measuredAt: Date;
}

export interface ThresholdResult {
  triggered: boolean;
  type?: AlertType;
  severity?: AlertSeverity;
  reason?: string;
  metric?: string;
  value?: number;
}

const HR_LOW = 50;
const HR_HIGH = 120;
const SYS_HIGH = 140;
const SYS_LOW = 90;
const DIA_HIGH = 90;
const DIA_LOW = 60;
const OXYGEN_LOW = 92;
const TEMP_LOW = 35.0;
const TEMP_HIGH = 38.5;

export function evaluateVitals(reading: VitalsReading): ThresholdResult {
  // Blood pressure
  if (reading.systolic !== undefined && reading.diastolic !== undefined) {
    if (reading.systolic >= 180 || reading.diastolic >= 120) {
      return { triggered: true, type: AlertType.VITALS_BP_HIGH, severity: AlertSeverity.CRITICAL, reason: 'Huyết áp tăng cao nguy hiểm', metric: 'BP', value: reading.systolic };
    }
    if (reading.systolic >= SYS_HIGH || reading.diastolic >= DIA_HIGH) {
      return { triggered: true, type: AlertType.VITALS_BP_HIGH, severity: AlertSeverity.HIGH, reason: 'Huyết áp cao', metric: 'BP', value: reading.systolic };
    }
    if (reading.systolic < SYS_LOW || reading.diastolic < DIA_LOW) {
      return { triggered: true, type: AlertType.VITALS_BP_LOW, severity: AlertSeverity.MEDIUM, reason: 'Huyết áp thấp', metric: 'BP', value: reading.systolic };
    }
  }

  // Heart rate
  if (reading.heartRate !== undefined) {
    if (reading.heartRate > HR_HIGH) {
      return { triggered: true, type: AlertType.VITALS_HR_HIGH, severity: AlertSeverity.HIGH, reason: 'Nhịp tim nhanh', metric: 'HR', value: reading.heartRate };
    }
    if (reading.heartRate < HR_LOW) {
      return { triggered: true, type: AlertType.VITALS_HR_LOW, severity: AlertSeverity.HIGH, reason: 'Nhịp tim chậm', metric: 'HR', value: reading.heartRate };
    }
  }

  // SpO2
  if (reading.oxygen !== undefined) {
    if (reading.oxygen < OXYGEN_LOW) {
      return { triggered: true, type: AlertType.VITALS_OXYGEN_LOW, severity: AlertSeverity.CRITICAL, reason: 'SpO2 thấp', metric: 'OXYGEN', value: reading.oxygen };
    }
  }

  // Body temp
  if (reading.bodyTempC !== undefined) {
    if (reading.bodyTempC >= TEMP_HIGH) {
      return { triggered: true, type: AlertType.VITALS_TEMP_HIGH, severity: AlertSeverity.MEDIUM, reason: 'Sốt cao', metric: 'TEMP', value: reading.bodyTempC };
    }
    if (reading.bodyTempC < TEMP_LOW) {
      return { triggered: true, type: AlertType.VITALS_TEMP_LOW, severity: AlertSeverity.HIGH, reason: 'Hạ thân nhiệt', metric: 'TEMP', value: reading.bodyTempC };
    }
  }

  return { triggered: false };
}

/**
 * Haversine distance between two lat/lon points in meters.
 */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface GeofencePoint { lat: number; lon: number; }

export function isOutsideGeofence(current: GeofencePoint, center: GeofencePoint, radiusMeters: number): boolean {
  return haversineMeters(current.lat, current.lon, center.lat, center.lon) > radiusMeters;
}
