import { z } from 'zod';
import { CreateProductSchema } from './create-product.dto.js';

export const UpdateProductSchema = CreateProductSchema.partial().omit({ sellerId: true });

export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
