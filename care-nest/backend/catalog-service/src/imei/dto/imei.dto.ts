import { z } from 'zod';

/**
 * Zod schemas for IMEI module API. Validation happens at the controller
 * boundary via `safeParse` (matches the project's existing pattern).
 */

export const IMEI_15_REGEX = /^\d{15}$/;

export const BulkImportImeiSchema = z.object({
  productId: z.string().uuid('productId phải là UUID hợp lệ'),
  imeis: z
    .array(z.string().regex(IMEI_15_REGEX, 'IMEI phải đúng 15 chữ số'))
    .min(1, 'Cần ít nhất 1 IMEI')
    .max(500, 'Tối đa 500 IMEI mỗi lần import'),
});

export type BulkImportImeiDto = z.infer<typeof BulkImportImeiSchema>;

export const AllocateImeiSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  imeis: z
    .array(z.string().regex(IMEI_15_REGEX))
    .min(1, 'Cần ít nhất 1 IMEI'),
});

export type AllocateImeiDto = z.infer<typeof AllocateImeiSchema>;

export const ReleaseImeiSchema = z.object({
  orderId: z.string().uuid(),
});

export type ReleaseImeiDto = z.infer<typeof ReleaseImeiSchema>;

export const ListImeiQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  status: z
    .enum(['IN_STOCK', 'RESERVED', 'SHIPPED', 'ACTIVATED', 'RETURNED', 'FAULTY'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export type ListImeiQueryDto = z.infer<typeof ListImeiQuerySchema>;
