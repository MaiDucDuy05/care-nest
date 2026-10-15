import { z } from 'zod';

export const ShippingAddressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(8),
  line1: z.string().min(1),
  ward: z.string().optional(),
  district: z.string().min(1),
  province: z.string().min(1),
  country: z.string().default('VN'),
});

export const CheckoutSchema = z.object({
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['VNPAY', 'MOMO', 'ZALOPAY', 'COD', 'BANK_TRANSFER']),
  note: z.string().max(500).optional(),
  voucherCode: z.string().optional(),
});

export type CheckoutDto = z.infer<typeof CheckoutSchema>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
  reason: z.string().max(500).optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
