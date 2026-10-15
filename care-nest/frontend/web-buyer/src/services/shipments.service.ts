/**
 * Shipments service — order tracking.
 */
import { SHIPPING_API } from '../lib/api-client';

export const shipmentsService = {
  async listMyShipments() {
    const res = await fetch(`${SHIPPING_API}/api/v1/shipments/me`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getShipment(id: string) {
    const res = await fetch(`${SHIPPING_API}/api/v1/shipments/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
