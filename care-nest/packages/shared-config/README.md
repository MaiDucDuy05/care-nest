# @carenest/shared-config

Centralized env loaders (Zod) and cross-service constants.

## Usage

```ts
import { loadDatabaseEnv, KAFKA_TOPICS, TIMEOUTS_MS } from '@carenest/shared-config';

const env = loadDatabaseEnv(); // throws on missing/invalid env at boot
await client.connect({ connectionString: env.DATABASE_URL });
```

## Rules

- **Never** read `process.env` outside this package.
- **Always** call the appropriate `load*Env()` at service boot to fail fast.
- Service-specific env vars live in that service (not here).
