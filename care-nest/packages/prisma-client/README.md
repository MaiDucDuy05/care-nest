# @carenest/prisma-client

Single Prisma client shared by all back-end services. Wraps the generated
client from `@carenest/database` with:

- NestJS lifecycle (`onModuleInit` / `onModuleDestroy`)
- Tenant-aware middleware via `AsyncLocalStorage`
- Slow-query logging via `@carenest/shared-utils`
- Health probe (`isHealthy()`)

```ts
import { PrismaService, withTenantContext } from '@carenest/prisma-client';

const prisma = new PrismaService();
await prisma.onModuleInit();

await withTenantContext('tenant-uuid', async () => {
  const products = await prisma.product.findMany(); // auto-filtered by tenantId
});
```
