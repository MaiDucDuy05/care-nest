# CareNest — Lộ trình phát triển (Development Roadmap)

> **Cập nhật liên tục** bởi `project-manager` agent. Mỗi phase có status, milestones, và % hoàn thành.

**Cập nhật gần nhất:** 2025-10-16 (Phase 1: build pipeline cleanup — 3 shared packages mới + fix toàn bộ type/test/lint/build across 22 packages)

---

## Tổng quan 5 giai đoạn (30 tuần)

| Phase | Tên | Thời gian | Tuần | Status | % |
|-------|-----|-----------|------|--------|---|
| 0 | Khởi động & R&D (Monorepo + Wonlex codec) | 2 tuần | W01–W02 | ✅ **Hoàn thành** | 100% |
| 1 | Xây dựng Core Platform | 8 tuần | W03–W10 | ✅ **Hoàn thành** | 100% |
| 2 | Tích hợp & Hoàn thiện | 8 tuần | W11–W18 | 🚧 **Đang thực hiện** | ~20% |
| 3 | Thử nghiệm & Thẩm định | 6 tuần | W19–W24 | ⏳ Chưa bắt đầu | 0% |
| 4 | Ra mắt & Tăng tốc | 6 tuần | W25–W30 | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ dự án: 38% (10/30 tuần Phase 0–1 + 2 tuần đầu Phase 2)**

### Phase 1 — Build pipeline hardening (2025-10-16)
- **3 shared packages mới**:
  - `@carenest/prisma-client` — standalone Prisma wrapper + tenant middleware
  - `@carenest/nestjs-common` — NestJS module (Prisma/Kafka/Redis/Health/Config), guards, decorators, interceptors, filters, middleware, pipes
  - `@carenest/common-dto` — Zod schemas shared backend ↔ frontend
- **Route structure cleanup**:
  - web-buyer + web-admin: chuyển từ route groups `(name)` sang real URL segments để tránh Next.js parallel-page conflict
  - URL mới: `/en/health/dashboard`, `/en/audit/[id]/[subId]`, v.v.
- **Pipeline xanh trên 22 packages**:
  - `pnpm -r type-check`: 0 errors
  - `pnpm -r test`: 426 tests passing
  - `pnpm -r lint`: 0 errors (warnings allowed)
  - `pnpm -r build`: tất cả packages build được (CJS + ESM dual output)

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
- ✅ Phase 1: Build pipeline hardening — shared packages + fix toàn bộ 22 packages
- Phase 2: Tiếp tục các stream còn lại (S10 buyer dashboard, S11 web-seller + web-admin, S13 SEO/PWA), RabbitMQ outbox, role-based admin portal
- Apply Prisma migration cho Plan + SubscriptionReminder + DeviceActivationCode + Shipment fields

---

## Phase 2 — Tích hợp & Hoàn thiện 🚧 (W11–W18, đang ở W12)

### Mục tiêu
Đóng kín e2e commerce → fulfillment loop (order → payment → shipping → subscription → activation → monitoring) và mở rộng notification infrastructure thật. Phase 2 được chia thành 5 sprint (S9–S13) theo spec gốc. S9 (Subscription + Device Activation Bridge) và S12 (Shipping Adapter) vừa hoàn thành trong session này.

### Sprint breakdown

| Sprint | Tên | FR-IDs | Trạng thái |
|--------|-----|--------|------------|
| **S9** | Subscription service + Device Activation Bridge | FR-2.1 → 2.12 | ✅ Hoàn thành |
| **S10** | Web-buyer Health Dashboard + Activation Wizard | FR-2.13 → 2.24 | ⏳ Chưa bắt đầu |
| **S11** | Web-seller Portal + Web-admin Console | FR-2.25 → 2.40 | ⏳ Chưa bắt đầu |
| **S12** | Shipping adapter (GHN/GHTK) + Webhook + Failover | FR-2.41 → 2.55 | ✅ Hoàn thành |
| **S13** | SEO + PWA + Lighthouse + Lighthouse CI | FR-2.56 → 2.70 | ⏳ Chưa bắt đầu |

### Phase 2.1 — Fulfillment backend (S9 + S12) ✅

**Stream A — `subscription-service` (port 3008) — NEW**
- Plan catalog CRUD (seed: Basic 99k VND, Family 249k VND, Enterprise tuỳ biến)
- Subscription lifecycle: create từ `order.paid`, renew, cancel, upgrade, downgrade
- **Proration calculator** (pure function) — 26 edge cases: mid-cycle upgrade, downgrade no-refund, leap day (29/02), free plans, exact cycle boundary, 24h grace refund, cumulative changes
- 3 cron jobs idempotent: `reminder.job` (D-30/15/7/3) với `INSERT … ON CONFLICT DO NOTHING` cho cặp `(subscriptionId, reminderType)`, `grace-period.job` (D+0→D+3 → `PAST_DUE`), `suspend-expired.job` (D+3+ → device SUSPENDED)
- **Device activation bridge**: UUID v4 + HMAC-SHA256 signed, 30-day TTL, redeem bằng IMEI scan, link tới Order + User + Device
- Kafka: CONSUMES `order.paid`, `order.delivered`; PRODUCES `subscription.created`, `subscription.cancelled`, `activation.code.created`, `device.activated`, `notification.requests`

**Stream B — `shipping-service` (port 3009) — NEW**
- Adapter pattern: `IShippingProvider` (createOrder / trackOrder / cancelOrder / verifyWebhookSignature)
- **GHN primary** + **GHTK backup** với sandbox mode (deterministic mock khi thiếu token)
- `ShippingProviderFactory` với circuit-breaker: 3 lần 5xx liên tiếp → mark provider unhealthy → auto-failover; health check 5 phút/lần → tự phục hồi
- HMAC-SHA256 webhook signature verify qua `crypto.timingSafeEqual` cho cả `/webhooks/ghn` và `/webhooks/ghtk`
- Kafka: CONSUMES `order.ready_to_ship`; PRODUCES `order.shipped`, `order.delivered`, `shipment.failed`
- Sử dụng `Shipment` model có sẵn (11 fields), không thay đổi schema

**Stream C — `notification-service` (port 3006) — EXPAND**
- 4 channel thật (thay vì 3 mock log-to-stdout): VAPID Web Push, ESMS SMS HTTP client, AWS SES email, Zalo ZNS
- `NotificationDispatcher` với channel priority `ZNS > PUSH > SMS > EMAIL`; critical alerts (SOS/FALL) fan-out đồng thời sang cả PUSH + SMS thay vì fallback
- Handlebars template engine với helpers `formatVnd`, `upper`; chuyển 11 inline templates → 8 file `.hbs` (order-confirm, kyc-status, activation-guide, renewal-reminder, payment-failed, sos-alert, fall-detected, order-delivered)
- VAPID keypair generate lazily trên lần boot đầu, cache trong file `keys/vapid.json` (gitignored); public key endpoint `GET /api/v1/notifications/vapid-public-key`
- Kafka consumer cho topic mới `notification.requests` (bounded LRU idempotency 10k entries)
- Kafka producer `notification.sent` / `notification.failed`

### Schema additions (Phase 2.1)
- `Plan` model: code unique, priceMonthly, deviceLimit, caregiverLimit, retentionMonths, features (Json)
- `SubscriptionReminder` model: unique `(subscriptionId, reminderType)` cho idempotency, index `(scheduledFor, sentAt)`
- `DeviceActivationCode` model: token UUID v4 + hmac, FK tới Order + User, expiresAt, usedAt, deviceId
- `Subscription`: thêm `planId` FK nullable tới `Plan` (giữ enum cũ cho backward compat)
- `Order`: đổi `activationCode` (1-1) → `activationCodes` (1-n) để hỗ trợ re-issue
- `NotificationChannel` enum: thêm `ZNS`

### Kafka topics mới (Phase 2.1)
- `device.activation.requested` (subscription → device-service)
- `shipment.status_changed` (shipping → order-service)

### Test results
- **123 unit tests** across 3 services: subscription (59) + shipping (45) + notification (19) — all passing
- Type-check: 3/3 services clean
- Build: 3/3 services clean (dist artifacts produced)

### Kế tiếp (Phase 2.2)
- S10: web-buyer Health Dashboard + Activation Wizard
- S11: web-seller Portal + web-admin Console
- S13: SEO + PWA + Lighthouse CI
