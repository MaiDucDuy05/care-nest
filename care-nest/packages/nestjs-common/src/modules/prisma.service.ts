/**
 * NestJS-managed PrismaService — wraps `getPrisma()` from
 * `@carenest/prisma-client` with `OnModuleInit` / `OnModuleDestroy` so
 * services can `constructor(private readonly prisma: PrismaService) {}`
 * without thinking about lifecycles.
 */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { getPrisma, disconnectPrisma, isPrismaHealthy, type Prisma } from '@carenest/prisma-client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** Underlying client. Most code uses this directly (`this.prisma.user.findMany()`). */
  readonly client = getPrisma();

  async onModuleInit(): Promise<void> {
    // No-op: getPrisma() lazily creates the singleton.
    // Kept as a lifecycle hook so consumers don't need to special-case.
    void this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await disconnectPrisma();
  }

  /** Run a callback inside a Prisma transaction. */
  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction(fn);
  }

  /** Health probe for /healthz. */
  isHealthy(): Promise<boolean> {
    return isPrismaHealthy();
  }
}
