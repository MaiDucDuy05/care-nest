/**
 * Activation service — device activation flow.
 */
import { SUBSCRIPTION_API } from '../lib/api-client';

export interface ActivationPeekResult {
  valid: boolean;
  orderId?: string;
  devices: Array<{
    deviceId: string;
    imei: string;
    model: string;
  }>;
  expiresAt?: string;
}

export interface ActivationRedeemResult {
  success: boolean;
  activatedDevices: string[];
  subscriptionId?: string;
}

export const activationService = {
  async peekCode(token: string): Promise<ActivationPeekResult> {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/activation/codes/${encodeURIComponent(token)}`, {
      method: 'GET',
    });
    if (!res.ok) {
      if (res.status === 404) {
        return { valid: false, devices: [] };
      }
      throw new Error(await res.text());
    }
    return res.json();
  },

  async redeemCode(token: string, deviceIds: string[]): Promise<ActivationRedeemResult> {
    const res = await fetch(`${SUBSCRIPTION_API}/api/v1/activation/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, deviceIds }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
