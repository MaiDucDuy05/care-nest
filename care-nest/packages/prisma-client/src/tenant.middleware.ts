/**
 * Tenant isolation middleware.
 *
 * Every multi-tenant model (`User`, `Seller`, `Product`, `Order`, `Device`,
 * `Payment`, `Subscription`, `Notification`, etc.) has a `tenantId` column.
 * This middleware auto-injects the filter on `find*` / `count` / `aggregate`
 * calls **when the calling service has set a tenant on the AsyncLocalStorage
 * context** via `withTenantContext()`.
 *
 * Models that do NOT have a `tenantId` column (e.g. AuditLog, Category,
 * PublicConfig) are whitelisted here.
 *
 * **Defense in depth:** the DB also has RLS policies on the most sensitive
 * tables. See `packages/database/prisma/migrations/20260101000000_init/manual.sql`.
 */

import type { PrismaClient } from '@carenest/database';
import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage<{ tenantId: string | null; bypass?: boolean }>();

/** Models that have a tenantId column and must be filtered. */
const TENANT_SCOPED_MODELS = new Set([
  'User',
  'Seller',
  'SellerKycDocument',
  'Product',
  'ProductImage',
  'ProductVariant',
  'Certificate',
  'Inventory',
  'Order',
  'OrderItem',
  'Payment',
  'Refund',
  'Device',
  'DeviceAssignment',
  'Caregiver',
  'Subscription',
  'Shipment',
  'Notification',
]);

/** Models that are tenant-scoped on writes only (reads are global). */
const WRITE_ONLY_SCOPED = new Set(['Category']);

/** Run `fn` with `tenantId` set in the request context. */
export async function withTenantContext<T>(tenantId: string | null, fn: () => Promise<T>): Promise<T> {
  return als.run({ tenantId }, fn);
}

/** Get the current tenant from context (or null if outside one). */
export function getCurrentTenantId(): string | null {
  return als.getStore()?.tenantId ?? null;
}

export function applyTenantMiddleware(prisma: PrismaClient): void {
  prisma.$use(async (params, next) => {
    const store = als.getStore();
    if (!store || store.bypass) return next(params);

    const { tenantId } = store;
    if (tenantId === null) return next(params);

    const isScoped = TENANT_SCOPED_MODELS.has(params.model ?? '');
    const isWriteOnly = WRITE_ONLY_SCOPED.has(params.model ?? '');
    if (!isScoped) return next(params);

    // Reads
    if (isWriteOnly && ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
      return next(params);
    }

    // Inject tenantId on create / upsert
    if (params.action === 'create' || params.action === 'createMany') {
      const data = (params.args as { data?: unknown }).data;
      if (Array.isArray(data)) {
        (params.args as { data: unknown[] }).data = data.map((d) => ({ ...(d as object), tenantId }));
      } else if (data && typeof data === 'object') {
        (params.args as { data: object }).data = { ...(data as object), tenantId };
      }
      return next(params);
    }

    // Inject where tenantId on reads / updates / deletes
    const where = (params.args as { where?: object }).where;
    if (!where) {
      (params.args as { where: object }).where = { tenantId };
    } else if (typeof where === 'object') {
      (params.args as { where: object }).where = { ...(where as object), tenantId };
    }
    return next(params);
  });
}
