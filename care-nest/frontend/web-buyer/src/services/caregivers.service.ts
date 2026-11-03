/**
 * Caregivers service — invite and manage caregivers & monitored patients.
 */
import { DEVICE_API, getToken } from '../lib/api-client';

export interface Caregiver {
  id: string;
  userId: string;
  caretakerId?: string;
  email: string;
  fullName?: string;
  phone?: string;
  relationship?: 'FAMILY' | 'NURSE' | 'DOCTOR' | 'OTHER';
  permissions?: {
    viewHealth: boolean;
    receiveAlerts: boolean;
    manageDevices: boolean;
  };
  role?: 'CARETAKER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export interface PatientDevice {
  id: string;
  deviceId?: string;
  imei?: string;
  model?: string;
  status?: string;
  batteryLevel?: number;
  lastSeenAt?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  relationship?: string;
  permissions?: {
    viewHealth: boolean;
    receiveAlerts: boolean;
    manageDevices: boolean;
  };
}

export interface PatientWithDevices {
  id: string;
  patientId: string;
  fullName: string;
  email: string;
  phone?: string;
  relationship: 'FAMILY' | 'NURSE' | 'DOCTOR' | 'OTHER';
  permissions: {
    viewHealth: boolean;
    receiveAlerts: boolean;
    manageDevices: boolean;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedAt: string;
  acceptedAt?: string;
  devices: PatientDevice[];
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const caregiversService = {
  /**
   * List all caregivers invited by the current user
   */
  async list(): Promise<Caregiver[]> {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) return [];
      throw new Error(await res.text());
    }
    return res.json();
  },

  /**
   * List all patients / family members who invited the current user as caregiver
   */
  async getPatients(): Promise<PatientWithDevices[]> {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers/patients`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) return [];
      throw new Error(await res.text());
    }
    return res.json();
  },

  /**
   * Invite a caregiver by email with relationship and permissions
   */
  async invite(
    email: string,
    relationship: 'FAMILY' | 'NURSE' | 'DOCTOR' | 'OTHER' = 'FAMILY',
    permissions?: { viewHealth: boolean; receiveAlerts: boolean; manageDevices: boolean },
  ) {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        caretakerEmail: email.trim().toLowerCase(),
        relationship,
        permissions: permissions || {
          viewHealth: true,
          receiveAlerts: true,
          manageDevices: true,
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      try {
        const parsed = JSON.parse(errText);
        throw new Error(parsed.message || errText);
      } catch {
        throw new Error(errText);
      }
    }
    return res.json();
  },

  /**
   * Accept an invitation as a caregiver
   */
  async accept(caregiverId: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers/${caregiverId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * Revoke a caregiver link
   */
  async revoke(caregiverId: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers/${caregiverId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  /**
   * Resend invitation
   */
  async resendInvite(caregiverId: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers/${caregiverId}/resend`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

