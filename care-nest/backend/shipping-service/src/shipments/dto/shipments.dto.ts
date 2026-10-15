import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

const addressSchema = z.object({
  name: nonEmptyStringSchema,
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, 'Số điện thoại không hợp lệ'),
  address: nonEmptyStringSchema.max(200),
  ward: nonEmptyStringSchema.max(100),
  district: nonEmptyStringSchema.max(100),
  province: nonEmptyStringSchema.max(100),
  country: z.string().max(2).default('VN'),
});

const packageSchema = z.object({
  weightGrams: z.coerce.number().int().min(1).max(50_000),
  lengthCm: z.coerce.number().int().min(1).max(200).optional(),
  widthCm: z.coerce.number().int().min(1).max(200).optional(),
  heightCm: z.coerce.number().int().min(1).max(200).optional(),
});

export const QuoteFeeSchema = z.object({
  fromAddress: addressSchema,
  toAddress: addressSchema,
  package: packageSchema,
  carrier: z.enum(['GHN', 'GHTK']).optional(),
  serviceCode: z.string().max(50).optional(),
});

export type QuoteFeeDto = z.infer<typeof QuoteFeeSchema>;

export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: nonEmptyStringSchema,
  sellerId: z.string().uuid(),
  carrier: z.enum(['GHN', 'GHTK']).optional(),
  fromAddress: addressSchema,
  toAddress: addressSchema,
  package: packageSchema,
  codAmount: z.coerce.number().int().min(0).max(100_000_000).default(0),
  serviceCode: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
  declaredValue: z.coerce.number().int().min(0).max(100_000_000).optional(),
});

export type CreateShipmentDto = z.infer<typeof CreateShipmentSchema>;
