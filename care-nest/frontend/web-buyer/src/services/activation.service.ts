/**
 * Activation service — device activation flow.
 * S16: this now hits device-service (3003) which owns the
 * activation-code lifecycle. peek is public; redeem requires auth.
 */
import { ACTIVATION_API, getToken } from '../lib/api-client';

export interface ActivationPeekResult {
  valid: boolean;
  expiresAt?: string;
  deviceCount: number;
  devices: Array<{
    deviceId: string;
    imei: string;
    model: string;
  }>;
}

export interface ActivationRedeemResult {
  success: boolean;
  activatedDeviceIds: string[];
}

async function jsonFetch<T>(url: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const activationService = {
  async peekCode(token: string): Promise<ActivationPeekResult> {
    const res = await fetch(`${ACTIVATION_API}/api/v1/activation/codes/${encodeURIComponent(token)}`, {
      method: 'GET',
    });
    if (res.status === 404) {
      return { valid: false, deviceCount: 0, devices: [] };
    }
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { valid: boolean; expiresAt?: string; deviceCount: number; devices?: ActivationPeekResult['devices'] };
    return {
      valid: data.valid,
      expiresAt: data.expiresAt,
      deviceCount: data.deviceCount ?? 0,
      devices: data.devices ?? [],
    };
  },

  async redeemCode(token: string, _deviceIds: string[]): Promise<ActivationRedeemResult> {
    const authToken = getToken();
    if (!authToken) throw new Error('not authenticated');
    return jsonFetch<ActivationRedeemResult>(`${ACTIVATION_API}/api/v1/activation/redeem`, {
      method: 'POST',
      token: authToken,
      body: JSON.stringify({ token }),
    });
  },
};
