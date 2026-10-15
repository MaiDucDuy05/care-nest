/**
 * Standalone Prisma client singleton + factory.
 *
 * Service code should call `getPrisma()` to obtain the shared client. The
 * client is created on first use and reused for the process lifetime.
 */

import { PrismaClient, Prisma } from '@carenest/database';
import { createLogger } from '@carenest/shared-utils';
import { applyTenantMiddleware } from './tenant.middleware.js';

let prisma: PrismaClient | undefined;

const log = createLogger({ service: 'prisma' });

/** Get (or lazily create) the shared Prisma client. */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({ log: ['warn', 'error'] });
    applyTenantMiddleware(prisma);
    log.info('prisma client created');
  }
  return prisma;
}

/** Dispose the shared Prisma client. Idempotent. */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

/** Health probe — true if the DB is reachable. */
export async function isPrismaHealthy(): Promise<boolean> {
  try {
    const c = getPrisma();
    await c.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Re-exported Prisma namespace. */
export { Prisma };
