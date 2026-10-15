import { z } from 'zod';
import { VndAmountSchema } from '../shared/primitives.js';

export const CartItemSchema = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const AddToCartRequestSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(50),
});
export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;

export const CartResponseSchema = z.object({
  items: z.array(CartItemSchema.extend({
    name: z.string(),
    imageUrl: z.string().url().optional(),
    unitPriceVnd: VndAmountSchema,
    lineTotalVnd: VndAmountSchema,
    inStock: z.boolean(),
  })),
  subtotalVnd: VndAmountSchema,
  shippingVnd: VndAmountSchema.default(0),
  totalVnd: VndAmountSchema,
  sellerGroups: z.array(z.object({
    sellerId: z.string().uuid(),
    sellerName: z.string(),
    itemCount: z.number().int().nonnegative(),
    subtotalVnd: VndAmountSchema,
  })),
});
export type CartResponse = z.infer<typeof CartResponseSchema>;

export const AddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().regex(/^(\+?84|0)\d{9,10}$/u),
  province: z.string().min(1),
  district: z.string().min(1),
  ward: z.string().min(1),
  detail: z.string().min(1).max(500),
  isDefault: z.boolean().default(false),
});

export const CheckoutRequestSchema = z.object({
  address: AddressSchema,
  paymentMethod: z.enum(['VNPAY', 'MOMO', 'ZALOPAY', 'COD']),
  notes: z.string().max(500).optional(),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export const OrderStatusEnum = z.enum([
  'CREATED',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
