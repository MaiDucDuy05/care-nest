import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global PrismaModule — one PrismaService per Node process.
 *
 * The PrismaService exposes:
 * - the standard Prisma client API via `this.client` (findMany, create, ...)
 * - `this.transaction(fn)` — wraps a callback in a Prisma transaction
 * - `this.isHealthy()` — SELECT 1 health probe
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
