# @carenest/shared-redis

ioredis wrapper with CareNest conventions: JSON cache helpers, distributed
lock with safe release, singleton client.

## Cache

```ts
import { cacheGet, cacheSet, cacheRemember } from '@carenest/shared-redis';

await cacheSet('order:42', { id: 42, total: 100_000 }, { ttlSeconds: 300 });
const order = await cacheGet<{ id: number; total: number }>('order:42');

const fresh = await cacheRemember('user:7', 60, () => loadUserFromDb(7));
```

## Distributed lock

```ts
import { withLock } from '@carenest/shared-redis';

await withLock(
  'inventory:reserve:product-42',
  async () => { /* critical section */ },
  { ttlMs: 5_000, waitTimeoutMs: 1_000 },
);
```
