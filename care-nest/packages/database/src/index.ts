/**
 * @carenest/database
 *
 * Re-exports the Prisma client plus typed helpers. Always import from this
 * package instead of `@prisma/client` directly so the schema stays in one
 * place and we can add middleware (audit log, PII masking, etc.) centrally.
 */

import { PrismaClient } from '@prisma/client';
import { loadDatabaseEnv } from '@carenest/shared-config';

export { PrismaClient };
export { Prisma } from '@prisma/client';
export * from '@prisma/client';

let prisma: PrismaClient | undefined;

/**
 * Get the singleton PrismaClient. The client is created on first use and
 * reused for the process lifetime. In development, we log queries; in
 * production, we rely on pgbouncer / pg_stat_statements.
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const env = loadDatabaseEnv();
    prisma = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } },
      log: env.NODE_ENV === 'production' ? ['warn', 'error'] : ['warn', 'error'],
    });
  }
  return prisma;
}

/** Disconnect the singleton — used in test teardown and graceful shutdown. */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
