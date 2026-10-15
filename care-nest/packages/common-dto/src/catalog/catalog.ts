import { z } from 'zod';
import { NonEmptyString, VndAmountSchema, PaginationQuerySchema } from '../shared/primitives.js';

export const ProductStatusEnum = z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']);
export type ProductStatus = z.infer<typeof ProductStatusEnum>;

export const ProductClassEnum = z.enum(['GENERAL', 'MEDICAL_DEVICE', 'PRESCRIPTION_DRUG', 'OTC_DRUG', 'SUPPLEMENT']);
export type ProductClass = z.infer<typeof ProductClassEnum>;

export const CreateProductRequestSchema = z.object({
  categoryId: z.string().uuid(),
  sku: z.string().trim().min(1).max(64),
  name: NonEmptyString.max(200),
  description: z.string().max(5000).optional(),
  class: ProductClassEnum,
  requiresPrescription: z.boolean().default(false),
  variants: z.array(z.object({
    sku: z.string().trim().min(1).max(64),
    name: NonEmptyString.max(200),
    priceVnd: VndAmountSchema,
    stock: z.number().int().nonnegative().default(0),
  })).min(1),
  certificateIds: z.array(z.string().uuid()).default([]),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const ProductSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  class: ProductClassEnum.optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  status: ProductStatusEnum.optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest']).default('relevance'),
});
export type ProductSearchQuery = z.infer<typeof ProductSearchQuerySchema>;

export const ReviewProductRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  reason: z.string().max(1000).optional(),
});
export type ReviewProductRequest = z.infer<typeof ReviewProductRequestSchema>;
