/**
 * Devices service — device management and telemetry.
 */
import { apiClient, DEVICE_API, getToken } from '../lib/api-client';

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

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const devicesService = {
  async getDevices() {
    return apiClient.devices.getDevices();
  },

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
    const res = await fetch(`${DEVICE_API}/api/v1/geofences`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) return [];
      throw new Error(await res.text());
    }
    return res.json();
  },

  async createGeofence(data: GeofenceInput) {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateGeofence(id: string, data: Partial<GeofenceInput>) {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteGeofence(id: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/geofences/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
