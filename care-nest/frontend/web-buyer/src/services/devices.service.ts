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

function normalizeGeofence(g: any) {
  const centerLat = g.centerLat != null ? Number(g.centerLat) : g.circle?.center?.lat ?? 10.7769;
  const centerLon = g.centerLon != null ? Number(g.centerLon) : g.circle?.center?.lng ?? 106.7009;
  const radiusM = g.radiusMeters != null ? Number(g.radiusMeters) : g.circle?.radiusM ?? 150;

  return {
    id: g.id,
    userId: g.userId || '',
    name: g.name || 'Vùng an toàn',
    shape: g.shape || 'CIRCLE',
    circle: {
      center: { lat: centerLat, lng: centerLon },
      radiusM,
    },
    polygon: g.polygon || null,
    alertEvents: Array.isArray(g.alertEvents) && g.alertEvents.length > 0 ? g.alertEvents : ['ENTER', 'EXIT'],
    isActive: g.isActive !== undefined ? Boolean(g.isActive) : g.active !== undefined ? Boolean(g.active) : true,
    createdAt: g.createdAt || new Date().toISOString(),
    updatedAt: g.updatedAt || new Date().toISOString(),
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
    try {
      const res = await fetch(`${DEVICE_API}/api/v1/geofences`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        return [];
      }
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map(normalizeGeofence);
    } catch {
      return [];
    }
  },

  async createGeofence(data: GeofenceInput) {
    const centerLat = data.center?.lat ?? 10.7769;
    const centerLon = data.center?.lng ?? 106.7009;
    const radiusMeters = data.radiusM ?? 150;

    const backendPayload = {
      name: data.name,
      centerLat,
      centerLon,
      radiusMeters,
    };

    const res = await fetch(`${DEVICE_API}/api/v1/geofences`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload),
    });
    if (!res.ok) throw new Error(await res.text());
    const g = await res.json();
    return normalizeGeofence(g);
  },

  async updateGeofence(id: string, data: Partial<GeofenceInput>) {
    const backendPayload: Record<string, any> = {};
    if (data.name) backendPayload.name = data.name;
    if (data.center) {
      backendPayload.centerLat = data.center.lat;
      backendPayload.centerLon = data.center.lng;
    }
    if (data.radiusM) backendPayload.radiusMeters = data.radiusM;
    if (data.isActive !== undefined) backendPayload.active = data.isActive;

    const res = await fetch(`${DEVICE_API}/api/v1/geofences/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload),
    });
    if (!res.ok) throw new Error(await res.text());
    const g = await res.json();
    return normalizeGeofence(g);
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
