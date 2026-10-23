/**
 * Enable TimescaleDB hypertables on `health_records`, `alerts`, and `audit_logs`.
 * Idempotent — safe to run on every boot.
 *
 * Usage:
 *   pnpm --filter @carenest/database exec tsx scripts/enable-timescale.ts
 *
 * Requires the `timescaledb` extension to be installed in the target database.
 */

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HypertableSpec {
  table: string;
  timeColumn: string;
  chunkInterval: string;
}

const HYPERTABLES: readonly HypertableSpec[] = [
  { table: 'health_records', timeColumn: 'measuredAt', chunkInterval: '1 day' },
  { table: 'alerts', timeColumn: 'receivedAt', chunkInterval: '7 days' },
  { table: 'audit_logs', timeColumn: 'occurredAt', chunkInterval: '30 days' },
];

async function ensureHypertable(spec: HypertableSpec): Promise<void> {
  // Use Prisma.sql for parameter binding — never interpolate into raw SQL.
  const sql = Prisma.sql`
    SELECT create_hypertable(${spec.table}::regclass, ${spec.timeColumn}::text,
      chunk_time_interval => ${spec.chunkInterval}::interval,
      if_not_exists => TRUE)
  `;
  await prisma.$queryRaw(sql);
  // eslint-disable-next-line no-console
  console.log(`[timescale] ${spec.table} hypertable ready (${spec.timeColumn}, ${spec.chunkInterval})`);
}

async function main(): Promise<void> {
  for (const spec of HYPERTABLES) {
    await ensureHypertable(spec);
  }
  // 7-year retention on audit logs (PDPA)
  await prisma.$queryRaw(
    Prisma.sql`SELECT add_retention_policy('audit_logs', INTERVAL '7 years', if_not_exists => TRUE)`,
  );
  // eslint-disable-next-line no-console
  console.log('[timescale] audit_logs 7-year retention policy set');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[timescale] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
