# CareNest — Lộ trình phát triển (Development Roadmap)

> **Cập nhật liên tục** bởi `project-manager` agent. Mỗi phase có status, milestones, và % hoàn thành.

**Cập nhật gần nhất:** 2026-10-15 (hoàn thành Phase 1: 8/8 microservices scaffolded)

---

## Tổng quan 5 giai đoạn (30 tuần)

| Phase | Tên | Thời gian | Tuần | Status | % |
|-------|-----|-----------|------|--------|---|
| 0 | Khởi động & R&D (Monorepo + Wonlex codec) | 2 tuần | W01–W02 | ✅ **Hoàn thành** | 100% |
| 1 | Xây dựng Core Platform | 8 tuần | W03–W10 | ✅ **Hoàn thành** | 100% |
| 2 | Tích hợp & Hoàn thiện | 8 tuần | W11–W18 | ⏳ Chưa bắt đầu | 0% |
| 3 | Thử nghiệm & Thẩm định | 6 tuần | W19–W24 | ⏳ Chưa bắt đầu | 0% |
| 4 | Ra mắt & Tăng tốc | 6 tuần | W25–W30 | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ dự án: 33% (10/30 tuần)**

---

## Phase 0 — Khởi động & R&D ✅ (W01–W02)

### Mục tiêu
- Dựng monorepo foundation (Turborepo + pnpm)
- R&D và implement đầy đủ codec cho giao thức Wonlex V3.2 (thiết bị IoT chủ lực)
- Setup Prisma schema 13 entity
- Setup CI/CD, Docker, K8s manifests

### Deliverables
- [x] Monorepo root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.eslintrc.json`, `.prettierrc.json`, `.gitignore`, `.npmrc`, `.editorconfig`, `Makefile`, `.env.example`, `docker-compose.dev.yml`
- [x] `@carenest/iot-codec` (R&D Wonlex V3.2): build/parse, TCP stream extract, typed decoders, mock server
- [x] `@carenest/shared-types`: branded IDs, Zod schemas, enums (PaymentMethod, OrderStatus, AlertSeverity, …)
- [x] `@carenest/shared-config`: env loaders (base, database, kafka, redis, iot), cross-service constants
- [x] `@carenest/shared-utils`: logger (pino), retry (exponential backoff), withTimeout, PII masking
- [x] `@carenest/database`: Prisma schema **19 entity** (User, Seller, Category, Product, ProductImage, Inventory, Order, OrderItem, Payment, Device, DeviceAssignment, HealthRecord, Alert, **SellerKycDocument, Shipment, Subscription, Caregiver, Notification, AuditLog**) — UUID v7 (`dbgenerated("uuidv7()") @db.Uuid`)
- [x] `@carenest/shared-kafka`: `TypedProducer` (JSON publish), `TypedConsumer` (retry + DLQ), singleton KafkaJS client
- [x] `@carenest/shared-redis`: `cacheGet` / `cacheSet` / `cacheRemember`, `withLock` (SET NX EX + Lua release), singleton ioredis
- [x] **Initial Prisma migration** (`20260101000000_init`) with `pg_uuidv7` + TimescaleDB extensions, 7-year audit retention, RLS
- [x] `enable-timescale.ts` (parameterized) — converts `health_records`, `alerts`, `audit_logs` to hypertables
- [x] **CODEOWNERS** (`@care-nest/maintainers`, `iot-team`, `data-team`, `platform-team`)
- [x] `cd-staging.yml` — placeholder staging deploy workflow (Phase 0 only ships the build + smoke pipeline)
- [x] CI uses pnpm 12.11.2 (matches root pin)

### Test results
- **65 unit tests** in `@carenest/iot-codec` — all passing, 95.7% statement coverage
- Type-check: 7/7 packages clean
- Lint: 7/7 packages clean
- Build: 7/7 packages clean (CJS + ESM + DTS)

### Kế tiếp
- ✅ Phase 1: Scaffold NestJS services — **8/8 services done** (auth, catalog, device, iot-gateway, order, payment, notification, alert)
- Phase 2: Wire cross-service flows (full e2e order→payment→fulfillment, vitals→alert→notification, geofence→alert), tích hợp VNPay/MoMo sandbox keys, RabbitMQ outbox, role-based admin portal
- Apply Geofence migration to staging database

---

## Phase 1 — Xây dựng Core Platform ✅ (W03–W10)

### Mục tiêu
- Scaffold 8 microservices NestJS độc lập, mỗi service có port riêng, Dockerfile, prisma client chung
- Cài đặt cross-cutting auth: MFA TOTP (RFC 6238), RBAC 3-level, audit log module
- Triển khai luồng thương mại điện tử đầy đủ: catalog → order → payment → notification
- Triển khai luồng IoT/alert: device → iot-gateway → telemetry → alert (vitals thresholds + Socket.IO <5s)

### Deliverables
- [x] **`auth-service`** (port 3001): register/login/refresh/JWT, `RolesGuard` + `@Roles()` RBAC, MFA TOTP enable/verify/disable, `AuditService` + `AuditController` (admin-only)
- [x] **`catalog-service`** (port 3002): products CRUD + Redis caching, categories tree, KYC seller onboarding (submit/list pending/review) với Zod validation + transactional state transitions
- [x] **`device-service`** (port 3003): IMEI registration, user assignment, Kafka telemetry consumer, Geofence module (CRUD soft-delete, active-only filter)
- [x] **`iot-gateway`** (port 18800): TCP `net.Server` Wonlex V3.2, `PacketBuffer` stream parser, `SessionManager` (Map by IMEI), `PacketDispatcher` auto-ACK, `TelemetryPublisher` → Kafka
- [x] **`order-service`** (port 3004): Redis-backed multi-vendor cart, `groupBySeller()`, state machine (`CREATED → CONFIRMED → PACKING → SHIPPED → DELIVERED`), inventory hold với Prisma transaction + `quantity - reserved ≥ quantity` guard, ORDER_CREATED/SHIPPED Kafka events
- [x] **`payment-service`** (port 3005): 3 gateway adapters (VNPay HMAC-SHA512, MoMo HMAC-SHA256, COD no-op), idempotency by `transactionRef`, escrow 7-day Redis TTL hold, webhooks `/api/v1/webhooks/{vnpay,momo,cod/confirm}` verify HMAC before mutating state
- [x] **`notification-service`** (port 3006): Email/SMS/Push channels (mock — log to stdout in dev), 11 Vietnamese templates, `send()` render → persist → dispatch → SENT/FAILED, Kafka consumer ORDER_CREATED/ORDER_SHIPPED/ALERT_TRIGGERED
- [x] **`alert-service`** (port 3007): vitals thresholds (BP/HR/SpO2/Temp), haversine geofence, SOS/fall/low-battery, Socket.IO gateway `/alerts` path với JWT handshake, real-time push <5s
- [x] **Schema additions**: `User.mfaEnabled/mfaSecret/lastLoginAt`, `Product.isIotDevice/iotDeviceModel/compareAtPrice`, new `Geofence` model (circular safe zone, 50m–5km radius)
- [x] **`docker-compose.dev.yml`**: 4 new services (order/payment/notification/alert) added to `full` profile với proper depends_on (postgres healthy, kafka started)

### Test results
- **All 7 NestJS services + iot-gateway pass full pipeline**: build + type-check + test (27 backend tasks + 8 iot-gateway tasks = 35/35 turbo tasks green)
- **62 unit tests** across new services: order (14), payment (14), notification (7), alert (17), auth (4), catalog (8), iot-gateway (2) — all passing
- Type-check: 7/7 services clean
- Build: 8/8 services clean (dist artifacts produced)

### Kế tiếp
- Phase 2: Wire cross-service flows end-to-end với real Kafka events, apply Prisma migration cho Geofence model, integrate VNPay/MoMo sandbox keys, build admin portal RBAC UI
