/**
 * Shipping enums.
 * Keep in sync with backend shipping-service/src/...
 */

import { z } from 'zod';

/** Shipment lifecycle status */
export const ShipmentStatusSchema = z.enum([
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURNED',
  'CANCELLED',
  'FAILED',
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

/** Supported carrier codes */
export const CarrierCodeSchema = z.enum(['GHN', 'GHTK', 'VIETTEL_POST', 'GHN_SLOW', 'GHTK_SLOW']);
export type CarrierCode = z.infer<typeof CarrierCodeSchema>;
