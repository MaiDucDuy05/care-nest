/**
 * Devices service — device management and telemetry.
 */
import { apiClient, DEVICE_API } from '../lib/api-client';

export interface TelemetryPoint {
  deviceId: string;
  timestamp: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  spo2?: number;
  temperature?: number;
  battery?: number;
  lat?: number;
  lng?: number;
  inGeofence?: string;
}

/** Argument shape for createGeofence / updateGeofence. */
export interface GeofenceInput {
  name: string;
  shape: 'CIRCLE' | 'POLYGON';
  center?: { lat: number; lng: number };
  radiusM?: number;
  vertices?: Array<{ lat: number; lng: number }>;
  alertEvents?: string[];
  isActive?: boolean;
}

export const devicesService = {
  async getMyDevices() {
    return apiClient.devices.getMyDevices();
  },

  async getDevice(id: string) {
    return apiClient.devices.getDevice(id);
  },

  async getLatestVitals(deviceId: string) {
    return apiClient.devices.getLatestVitals(deviceId);
  },

  async getTelemetryHistory(
    deviceId: string,
    params?: { from?: string; to?: string; limit?: number }
  ) {
    return apiClient.devices.getTelemetryHistory(deviceId, params);
  },

  async getGeofences() {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createGeofence(data: GeofenceInput) {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateGeofence(id: string, data: Partial<GeofenceInput>) {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteGeofence(id: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
