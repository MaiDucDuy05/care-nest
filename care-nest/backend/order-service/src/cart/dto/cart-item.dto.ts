import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

export const CartItemSchema = z.object({
  productId: nonEmptyStringSchema,
  sellerId: nonEmptyStringSchema,
  name: z.string(),
  unitPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive().max(999),
  imageUrl: z.string().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const AddToCartSchema = z.object({
  productId: nonEmptyStringSchema,
  sellerId: nonEmptyStringSchema,
  name: z.string(),
  unitPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive().max(999),
  imageUrl: z.string().optional(),
});

export type AddToCartDto = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(999),
});

export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;
