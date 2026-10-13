# CareNest — Nhật ký thay đổi (Changelog)

> Ghi lại tất cả thay đổi quan trọng: features, fixes, security, breaking changes.
> Format theo [Keep a Changelog](https://keepachangelog.com/).

---

## [0.1.0] — 2026-10-13 — Phase 0: Khởi động & R&D

### Added
- **Monorepo foundation** (Turborepo + pnpm 12.11.2, Node 22)
  - Root config: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.eslintrc.json`, `.prettierrc.json`, `.editorconfig`, `.gitignore`, `.npmrc` (shamefully-hoist=false), `Makefile`
  - Workspace globs: `apps/*`, `packages/*`, `services/*`
  - pnpm `allowBuilds` for `@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`
  - `.github/CODEOWNERS` (maintainers, iot-team, data-team, platform-team)

- **`@carenest/iot-codec`** — Wonlex V3.2 protocol codec (R&D)
  - `buildPacket(deviceId, content)` / `parsePacket(raw)` — single packet build/parse
  - `PacketBuffer` — stateful TCP stream extraction (4KB max buffer, throws `BufferOverflowError`)
  - `appendChunk` / `extractPackets` — low-level helpers
  - `decodePacket` — typed decoders for 10+ commands: login, LK (heartbeat), UD (location GPS), bphrt (BP+HR), oxygen (SpO2), btemp2 (body temp), SOS, fall, phbx, VERNO, PW
  - Branded `DeviceId` type with validation (10–15 digits, IMEI-style)
  - `startMockServer` (Node TCP) for dev/test
  - **Strict validation**: location GPS fix must be `A` or `V` (no silent coercion); clinical range checks (systolic 60–250, diastolic 40–150, HR 30–250, SpO2 0–100, body temp 30–45°C)
  - **65 unit tests** passing
  - Coverage: build/parse round-trip, UTF-8 (Vietnamese diacritics), south hemisphere, invalid gender, malformed packets, partial chunks, mock server integration, overflow

- **`@carenest/shared-types`** — Zod schemas + branded IDs
  - Branded types: `UserId`, `SellerId`, `OrderId`, `ProductId`, `DeviceAssignmentId`
  - VN phone validator (supports +84, 0xx, dashes, spaces, dots)
  - Enums: `PaymentMethod`, `PaymentStatus`, `OrderStatus`, `AlertSeverity`
  - `PaginationInputSchema` (page/pageSize with coercion)
  - **12 unit tests** passing

- **`@carenest/shared-config`** — Env loader + cross-service constants
  - `loadBaseEnv`, `loadDatabaseEnv`, `loadKafkaEnv`, `loadRedisEnv`, `loadIotEnv` (Zod-validated, fail-fast on boot)
  - `KAFKA_TOPICS`, `SERVICE_NAMES`, `TIMEOUTS_MS`, `PAGINATION`, `IOT` constants
  - **13 unit tests** passing

- **`@carenest/shared-utils`** — Logger, retry, timeout, PII masking
  - `createLogger({ service })` — pino-based structured logging
  - `retry(fn, { attempts, initialDelayMs, factor, jitter, shouldRetry, onRetry, signal })` — exponential backoff
  - `withTimeout(promise, ms)` — race against deadline
  - `maskEmail`, `maskVnPhone`, `maskDeviceId` — PII masking
  - **6 unit tests** passing

- **`@carenest/shared-kafka`** — KafkaJS wrapper
  - `TypedProducer.publish(topic, value, { key, headers })` / `publishBatch(records)` — JSON-encoded
  - `TypedConsumer({ groupId, topics, handler, maxRetries, dlqSuffix, fromBeginning })` — retry with exponential backoff, DLQ on exhaustion
  - Singleton `getKafkaClient()` / `getProducer()` / `createConsumer(groupId)` — lazy init
  - `disconnectKafka()` for graceful shutdown

- **`@carenest/shared-redis`** — ioredis wrapper
  - `cacheGet` / `cacheSet` / `cacheRemember` — JSON-encoded cache with TTL + NX
  - `withLock(key, fn, { ttlMs, waitTimeoutMs, retryMs })` — SET NX PX + Lua release script
  - `LockNotAcquiredError`
  - Singleton `getRedis()` / `disconnectRedis()`

- **`@carenest/database`** — Prisma schema **19 entity** (UUID v7)
  - **Core**: User, Seller, Category, Product, ProductImage, Inventory, Order, OrderItem, Payment, Device, DeviceAssignment, HealthRecord, Alert
  - **Phase 1+**: SellerKycDocument, Shipment, Subscription, Caregiver, Notification, AuditLog
  - All IDs use `@default(dbgenerated("uuidv7()")) @db.Uuid` (time-ordered UUIDs via `pg_uuidv7` extension)
  - All relationships, indexes, soft delete, PDPA consent fields
  - **Initial migration** (`20260101000000_init/manual.sql`): `pg_uuidv7` + `timescaledb` extensions, 7-year audit log retention policy, RLS on sensitive tables
  - `enable-timescale.ts` — parameterized Prisma.sql, converts `health_records`, `alerts`, `audit_logs` to hypertables

- **CI/CD**: GitHub Actions
  - `ci.yml` — install, build, type-check, lint, test, prisma-format (pnpm 12.11.2, Node 22)
  - `commit-lint.yml` — conventional commit enforcement
  - `cd-staging.yml` — placeholder staging deploy (Phase 0 only ships the build + smoke pipeline)
  - `.commitlintrc.json`

- **Docker**
  - `Dockerfile.service` — multi-stage for NestJS microservices
  - `iot-gateway.Dockerfile` — TCP server
  - `docker-compose.dev.yml` — local stack: Postgres+TimescaleDB, Redis, Kafka (KRaft), MeiliSearch

- **K8s** (dev)
  - `namespace.yaml`, `config.yaml` — minimal manifests for k3d/kind/minikube

### Quality metrics
- **65 unit tests** (iot-codec), 100% passing
- **7/7 packages** type-check clean
- **7/7 packages** lint clean
- **7/7 packages** build clean (CJS + ESM + DTS)
- iot-codec coverage: **95.7%** statements, **82.1%** branches

### Security & PDPA
- PII masking helpers ready for log aggregation
- `pdpaConsent` + `pdpaConsentedAt` fields on `User`
- `PDPA_DATA_RETENTION_DAYS`, `PDPA_ENCRYPTION_KEY` env slots
- Soft delete (`deletedAt`) on User, Seller, Product, Order
- Row-Level Security on sensitive tables (initial migration)
- 7-year audit log retention policy (initial migration)
- UUID v7 (time-ordered) — improved index locality vs. UUID v4

### Up next (Phase 1)
- `services/auth-service/` — JWT auth, PDPA consent flow
- `services/catalog-service/` — Product CRUD, MeiliSearch sync
- `services/iot-gateway/` — NestJS TCP server using `@carenest/iot-codec`
- `services/device-service/` — Device registry, assignments
- `apps/web-buyer/` — Next.js 14 buyer portal
- Apply initial Prisma migration to staging database
