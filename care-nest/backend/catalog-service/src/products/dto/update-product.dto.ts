import { z } from 'zod';
import { CreateProductSchema } from './create-product.dto.js';

export const UpdateProductSchema = CreateProductSchema.partial()
  .extend({
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'REJECTED']).optional(),
  })
  .omit({ sellerId: true });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
