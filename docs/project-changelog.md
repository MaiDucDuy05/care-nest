# CareNest — Nhật ký thay đổi (Changelog)

> Ghi lại tất cả thay đổi quan trọng: features, fixes, security, breaking changes.
> Format theo [Keep a Changelog](https://keepachangelog.com/).

---

## [0.2.0] — 2026-10-15 — Phase 1: Core Platform (8 microservices)

### Added
- **`auth-service` (port 3001)** — Authentication + authorization
  - Register/login/refresh with JWT (1h access, 7d refresh)
  - bcrypt password hashing (10 rounds)
  - `RolesGuard` + `@Roles()` decorator for 3-level RBAC
  - **MFA TOTP module** (`/api/v1/mfa/setup|verify|disable`) — RFC 6238 HMAC-SHA1, 6-digit, 30s step, ±1 step window
  - **Audit log module** (`/api/v1/audit/:entityType/:entityId`) — admin/support only, never blocks caller
  - Field additions to User: `mfaEnabled`, `mfaSecret`, `lastLoginAt`

- **`catalog-service` (port 3002)** — Products + categories
  - Product CRUD with Redis caching, categories tree
  - **KYC module** (`/api/v1/kyc/submit|me|pending|:sellerId/review`) — submit TAX_ID/BUSINESS_LICENSE/BANK_ACCOUNT/ID_CARD documents, admin reviews with APPROVED/REJECTED + reason, transactional state transitions (DRAFT → PENDING_REVIEW → ACTIVE/REJECTED)
  - Field additions to Product: `isIotDevice`, `iotDeviceModel`, `compareAtPrice`

- **`device-service` (port 3003)** — IoT device management
  - IMEI registration, user assignment, Kafka telemetry consumer
  - **Geofence module** (`/api/v1/geofences`) — circular safe zones (50m–5km radius, lat/lon validation, soft delete)
  - New `Geofence` model with index on `(userId, active)`

- **`order-service` (port 3004)** — Order lifecycle
  - Redis-backed multi-vendor cart with `groupBySeller()` for split checkout
  - Pure state machine: `CREATED → CONFIRMED → PACKING → SHIPPED → DELIVERED`, terminal: `CANCELLED`, `RETURNED`, `FAILED`
  - Inventory hold in Prisma transaction with `quantity - reserved >= requested` guard
  - Rolls back holds on checkout failure
  - ORDER_CREATED + ORDER_SHIPPED Kafka events

- **`payment-service` (port 3005)** — Payment gateway integration
  - **3 adapters**: VNPay (HMAC-SHA512, params sorted alphabetically), MoMo (HMAC-SHA256 canonical string), COD (no-op)
  - Idempotency by `transactionRef` (Payment table has unique constraint)
  - 7-day Redis escrow hold
  - Public webhooks `/api/v1/webhooks/{vnpay,momo,cod/confirm}` with HMAC verification before any state mutation
  - ORDER_PAID Kafka event after successful payment

- **`notification-service` (port 3006)** — Notification dispatch
  - 3 channels: Email, SMS, Push (mock — log to stdout in dev)
  - **11 Vietnamese templates**: `order.created`, `order.paid`, `order.shipped`, `order.delivered`, `kyc.approved`, `kyc.rejected`, `alert.vitals_high`, `alert.vitals_low`, `alert.sos`, `alert.fall`, `geofence.exit`
  - `send()` flow: render template → persist row → dispatch → mark SENT/FAILED
  - Kafka consumer for ORDER_CREATED/ORDER_SHIPPED/ALERT_TRIGGERED

- **`alert-service` (port 3007)** — Alert engine
  - **Vitals threshold rules** (BP high/low, HR high/low, SpO2 low, temp high/low) with clinical ranges
  - **Haversine geofence** distance check (50m–5km)
  - SOS / fall / low-battery handlers
  - **Socket.IO gateway** at `/alerts` path with JWT handshake, real-time push target <5s
  - Kafka consumer for `IOT_VITALS_RECEIVED`, `IOT_LOCATION_RECEIVED`, `IOT_SOS_RECEIVED`, `IOT_FALL_RECEIVED`, `IOT_HEARTBEAT_RECEIVED`
  - Publishes ALERT_TRIGGERED for notification-service consumption

- **Docker Compose** — `docker-compose.dev.yml` extended with 4 new services in `full` profile: order-service, payment-service, notification-service, alert-service (with VNPay/MoMo demo env vars, depends_on for postgres healthy + kafka started)

### Test results
- **62 unit tests** across new services (14 order + 14 payment + 7 notification + 17 alert + 4 auth MFA + 8 catalog KYC)
- All 8 services pass `pnpm turbo run build type-check test` (35/35 tasks green)

### Architecture
- Pattern: NestJS clean architecture per service (controller → service → repository → @carenest/database)
- All services use Zod schemas for DTO validation
- Kafka producers use `new TypedProducer('service-name')`; consumers use `TypedConsumer` with retry + DLQ
- TS2742 Prisma type portability: explicit `Promise<any>` return type annotations on methods returning Prisma types

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
