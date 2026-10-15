/**
 * Caregivers service — invite and manage caregivers.
 */
import { DEVICE_API } from '../lib/api-client';

export interface Caregiver {
  id: string;
  userId: string;
  email: string;
  fullName?: string;
  role: 'CARETAKER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export const caregiversService = {
  async list(): Promise<Caregiver[]> {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async invite(email: string, role?: 'CARETAKER' | 'VIEWER') {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: role ?? 'CARETAKER' }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async revoke(caregiverId: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers/${caregiverId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resendInvite(caregiverId: string) {
    const res = await fetch(`${DEVICE_API}/api/v1/caregivers/${caregiverId}/resend`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
