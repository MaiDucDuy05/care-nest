import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

export const CreatePaymentSchema = z.object({
  orderId: nonEmptyStringSchema,
  method: z.enum(['VNPAY', 'MOMO', 'ZALOPAY', 'COD', 'BANK_TRANSFER']),
  amount: z.coerce.number().int().positive(),
  idempotencyKey: nonEmptyStringSchema,
  returnUrl: z.string().url().optional(),
});

export type CreatePaymentDto = z.infer<typeof CreatePaymentSchema>;

export const RefundPaymentSchema = z.object({
  amount: z.coerce.number().int().positive().optional(),
  reason: z.string().min(1).max(500),
});

export type RefundPaymentDto = z.infer<typeof RefundPaymentSchema>;
