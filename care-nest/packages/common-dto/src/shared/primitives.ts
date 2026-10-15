import { z } from 'zod';

/** UUID v7 string. */
export const UuidSchema = z.string().uuid();

/** ISO-8601 datetime. */
export const IsoDateSchema = z.string().datetime({ offset: true });

/** Positive integer (VND amounts are stored in minor units, i.e. * 100). */
export const VndAmountSchema = z.number().int().positive().max(1_000_000_000_000);

/** Pagination — page is 1-based, pageSize ≤ 100. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });

/** 10-digit Vietnamese phone number, E.164-ish. */
export const PhoneSchema = z.string().regex(/^(\+?84|0)(3|5|7|8|9|1[2|6|8|9])\d{8}$/u, 'invalid VN phone number');

/** Strong password policy — FR-1.3. */
export const PasswordSchema = z
  .string()
  .min(10, 'password must be ≥10 chars')
  .max(128)
  .regex(/[a-z]/u, 'must contain lowercase')
  .regex(/[A-Z]/u, 'must contain uppercase')
  .regex(/[0-9]/u, 'must contain digit')
  .regex(/[^A-Za-z0-9]/u, 'must contain symbol');

/** Non-empty trimmed string. */
export const NonEmptyString = z.string().trim().min(1).max(500);
