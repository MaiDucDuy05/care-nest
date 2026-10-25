import { z } from 'zod';

export const CreateConversationSchema = z.object({
  sellerId: z.string().uuid().optional(),
  type: z.enum(['BUYER_SELLER', 'CARE_CIRCLE', 'PHARMACIST_CONSULT']).default('BUYER_SELLER'),
  title: z.string().max(255).optional(),
  metadata: z.record(z.any()).optional(),
  initialMessage: z.string().min(1).max(5000).optional(),
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  type: z.enum(['TEXT', 'IMAGE', 'PRODUCT_SNIPPET', 'ORDER_SNIPPET', 'SYSTEM_ALERT']).default('TEXT'),
  metadata: z.record(z.any()).optional(),
  clientTempId: z.string().optional(),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;

export const MarkReadSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
});

export type MarkReadDto = z.infer<typeof MarkReadSchema>;

