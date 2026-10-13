import { z } from 'zod';
import { PaginationInputSchema } from '@carenest/shared-types';

export const ProductQuerySchema = PaginationInputSchema.extend({
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isIotDevice: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
});

export type ProductQueryDto = z.infer<typeof ProductQuerySchema>;
