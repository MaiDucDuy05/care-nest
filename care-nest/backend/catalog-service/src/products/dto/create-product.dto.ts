import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

export const CreateProductSchema = z.object({
  sellerId: nonEmptyStringSchema,
  categoryId: nonEmptyStringSchema,
  name: nonEmptyStringSchema.min(3, 'Tên sản phẩm tối thiểu 3 ký tự'),
  slug: z.string().trim().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Giá phải lớn hơn 0'),
  compareAtPrice: z.coerce.number().positive().optional(),
  sku: z.string().trim().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  isIotDevice: z.boolean().default(false),
  iotDeviceModel: z.string().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
