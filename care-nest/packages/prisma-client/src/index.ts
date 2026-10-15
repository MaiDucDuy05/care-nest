/**
 * @carenest/prisma-client
 *
 * Standalone wrapper around `@carenest/database`'s Prisma client.
 * Provides:
 *   - getPrisma() singleton (no NestJS dep)
 *   - withTenantContext() / getCurrentTenantId() helpers
 *   - applyTenantMiddleware() so any PrismaClient can be made tenant-aware
 *
 * NestJS services that want a managed PrismaService should import it from
 * `@carenest/nestjs-common` (which composes the helpers from this package
 * into an `OnModuleInit` lifecycle).
 */

export * from './prisma-client.js';
export * from './tenant.middleware.js';
