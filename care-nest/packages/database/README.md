# @carenest/database

Prisma schema + client for the CareNest platform. **13 entities** spanning
e-commerce, IoT, and health monitoring.

## Entities

| # | Entity             | Purpose                                          |
|---|--------------------|--------------------------------------------------|
| 1 | `User`             | Account (buyer/seller/admin/support)             |
| 2 | `Seller`           | Multi-vendor seller profile                      |
| 3 | `Category`         | Product taxonomy                                 |
| 4 | `Product`          | Catalog item                                     |
| 5 | `ProductImage`     | Product gallery                                  |
| 6 | `Inventory`        | Stock per warehouse                              |
| 7 | `Order`            | Order header                                     |
| 8 | `OrderItem`        | Order line item                                  |
| 9 | `Payment`          | Payment record                                   |
| 10 | `Device`          | IoT GPS watch (Wonlex V3.2)                      |
| 11 | `DeviceAssignment`| User ↔ Device link                               |
| 12 | `HealthRecord`    | Vitals/location/heartbeat data points (TSDB)     |
| 13 | `Alert`           | SOS / fall / vitals alerts                       |

## Usage

```ts
import { getPrismaClient, Prisma } from '@carenest/database';

const prisma = getPrismaClient();
const user = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
```

## Migration workflow

```bash
# Local dev
pnpm --filter @carenest/database db:migrate

# CI / production
pnpm --filter @carenest/database db:migrate:deploy
```

## TimescaleDB

`health_records` and `alerts` are time-series heavy. After running
`prisma migrate dev`, apply the hypertable conversion:

```sql
SELECT create_hypertable('health_records', 'measured_at',
  chunk_time_interval => INTERVAL '1 day');
SELECT create_hypertable('alerts', 'received_at',
  chunk_time_interval => INTERVAL '7 days');
```

A migration helper script is at `packages/database/scripts/enable-timescale.ts`.
