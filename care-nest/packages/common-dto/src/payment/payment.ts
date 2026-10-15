import { z } from 'zod';
import { VndAmountSchema } from '../shared/primitives.js';

export const PaymentProviderEnum = z.enum(['VNPAY', 'MOMO', 'ZALOPAY', 'COD']);
export type PaymentProvider = z.infer<typeof PaymentProviderEnum>;

export const CreatePaymentRequestSchema = z.object({
  orderId: z.string().uuid(),
  provider: PaymentProviderEnum,
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;

export const CreatePaymentResponseSchema = z.object({
  paymentId: z.string().uuid(),
  checkoutUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});
export type CreatePaymentResponse = z.infer<typeof CreatePaymentResponseSchema>;

export const PaymentWebhookSchema = z.object({
  provider: PaymentProviderEnum,
  providerTxnId: z.string().min(1).max(200),
  orderId: z.string().uuid(),
  amountVnd: VndAmountSchema,
  signature: z.string().min(10).max(500),
  rawPayload: z.record(z.unknown()),
});
export type PaymentWebhook = z.infer<typeof PaymentWebhookSchema>;

export const RefundRequestSchema = z.object({
  paymentId: z.string().uuid(),
  amountVnd: VndAmountSchema,
  reason: z.string().min(1).max(500),
});
export type RefundRequest = z.infer<typeof RefundRequestSchema>;
