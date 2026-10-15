/**
 * Shipment entity schema.
 * Keep in sync with backend shipping-service/src/shipments/.
 */

import { z } from 'zod';
import { AuditTimestampsSchema } from '../common.js';
import { ShipmentStatusSchema, CarrierCodeSchema } from '../enums/shipping.js';
import { shipmentIdSchema, userIdSchema, isoDateSchema } from '../ids.js';

export const ShipmentItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
});

export type ShipmentItem = z.infer<typeof ShipmentItemSchema>;

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  addressLine: z.string().min(1).max(300),
  ward: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const ShipmentSchema = z.object({
  id: shipmentIdSchema,
  userId: userIdSchema,
  status: ShipmentStatusSchema,
  carrierCode: CarrierCodeSchema,
  trackingNumber: z.string().max(100).nullable().optional(),
  items: z.array(ShipmentItemSchema).min(1),
  shippingAddress: ShippingAddressSchema,
  shippingFeeVnd: z.number().int().min(0).default(0),
  estimatedDeliveryAt: isoDateSchema.nullable().optional(),
  deliveredAt: isoDateSchema.nullable().optional(),
  ...AuditTimestampsSchema.shape,
});

export type Shipment = z.infer<typeof ShipmentSchema>;
