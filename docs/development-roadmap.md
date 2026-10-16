# CareNest — Lộ trình phát triển (Development Roadmap)

> **Cập nhật liên tục** bởi `project-manager` agent. Mỗi phase có status, milestones, và % hoàn thành.

**Cập nhật gần nhất:** 2025-10-16 (S18 hoàn thành: observability — Prometheus metrics + Redis rate limit + Grafana; mở đầu Phase 3)

---

## Tổng quan 5 giai đoạn (30 tuần)

| Phase | Tên | Thời gian | Tuần | Status | % |
|-------|-----|-----------|------|--------|---|
| 0 | Khởi động & R&D (Monorepo + Wonlex codec) | 2 tuần | W01–W02 | ✅ **Hoàn thành** | 100% |
| 1 | Xây dựng Core Platform | 8 tuần | W03–W10 | ✅ **Hoàn thành** | 100% |
| 2 | Tích hợp & Hoàn thiện | 8 tuần | W11–W18 | ✅ **Hoàn thành** | 100% |
| 3 | Thử nghiệm & Thẩm định | 6 tuần | W19–W24 | 🚧 **Đang thực hiện** | ~10% |
| 4 | Ra mắt & Tăng tốc | 6 tuần | W25–W30 | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ dự án: 63% (Phase 0–2 xong + S18 mở đầu Phase 3)**

### Phase 3 — Thử nghiệm & Thẩm định 🚧 (W19–W24, đang ở W19)

| Sprint | Tên | Commit | Trạng thái |
|--------|-----|--------|------------|
| **S18** | Observability (Prometheus + Redis rate limit + Grafana) | — | ✅ Hoàn thành |
| **S19** | API gateway + cross-service auth + OTel tracing | — | ⏳ Chưa bắt đầu |
| **S20** | Staging deploy + smoke tests | — | ⏳ Chưa bắt đầu |
| **S21** | Security audit + pentest prep | — | ⏳ Chưa bắt đầu |

**S18 deliverables:**
- `@carenest/nestjs-common`: `MetricsModule`/`MetricsService` (prom-client), `RequestMetricsMiddleware`, `RedisThrottlerGuard` (atomic INCR+EXPIRE, fail-open), `HealthModule` fix
- `/metrics` trên cả 9 NestJS service; `/health/healthz`+`/livez` trên 6 service nhận request
- Payment-service: webhook rate limit chuyển sang Redis; metrics `payments_total`, `refunds_total`, `webhook_events_total`
- Prometheus (9090) + Grafana (3100) trong docker-compose `full`/`monitoring` profile + starter dashboard
- 294 backend tests xanh (nestjs-common +10)

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
| **S10** | Web-buyer Health Dashboard + Activation Wizard | FR-2.13 → 2.24 | ✅ Hoàn thành |
| **S11** | Web-seller Portal + Web-admin Console | FR-2.25 → 2.40 | ✅ Hoàn thành |
| **S12** | Shipping adapter (GHN/GHTK) + Webhook + Failover | FR-2.41 → 2.55 | ✅ Hoàn thành |
| **S13** | SEO + PWA + Lighthouse + Lighthouse CI | FR-2.56 → 2.70 | ✅ Hoàn thành |
| **S14** | Public marketplace + SEO sitemap | FR-2.71 → 2.80 | ✅ Hoàn thành |
| **S15** | Seller analytics + Buyer reviews | FR-2.81 → 2.90 | ✅ Hoàn thành |
| **S16** | IoT device onboarding (BE + gateway) | FR-2.91 → 3.00 | ✅ Hoàn thành |
| **S17** | Payment hardening + webhook audit log | FR-3.01 → 3.10 | ✅ Hoàn thành |

### Phase 2.2 (W11–W18) — tiến độ tổng

| Sprint | PR / commit | Notes |
|--------|-------------|-------|
| S9 + S12 | prior session | subscription + shipping adapter |
| S10 + S11 | prior session | web-buyer + web-seller + web-admin MVP |
| S13 | prior session | SEO + PWA + Lighthouse |
| S14 | `7f1e2fd` | public marketplace + sitemap |
| S15 | `7f1e2fd` | analytics + reviews aggregation |
| S16 | `1c58338` | IoT device onboarding + activation redemption |
| S17 BE | `50f187b` | refund orchestration + webhook audit log |
| S17 UI | `72fb255` | escrow timeline on web-seller payouts page |

### Phase 2.2 — S17 (vừa hoàn thành)

**Backend — payment-service**
- `PaymentWebhookEvent` model + `payment_webhook_events` table (UNIQUE trên `(gateway, gateway_event_id)` + partial idx `transaction_ref`)
- `WebhookEventService.recordOnce()`: findUnique short-circuit + P2002-safe create — mọi webhook attempt (valid + invalid signature) đều được audit-log
- `WebhookRateLimitGuard`: token bucket in-memory, 100 req/min per `(gateway, IP)`; trả 429 khi vượt
- `PaymentsService.refund()` orchestration đầy đủ: validate → call gateway `refund()` → reverse wallet credit → mark REFUNDED → publish `ORDER_REFUNDED`
- `PayoutsRepository.reverseCreditForOrder()`: idempotent qua `REFUND_DEBIT` lookup; cancel mọi PENDING Payout cho cùng order
- Shared-config: thêm `ORDER_REFUNDED` topic + `OrderEventPublisher.publishOrderRefunded()`

**Schema additions (S17)**
- `PaymentWebhookEvent`: gateway, gatewayEventId, transactionRef, signatureValid, responseCode, processedAction, payload, receivedAt
- `indexes`: UNIQUE `(gateway, gateway_event_id)` (dedup), partial index `WHERE transaction_ref IS NOT NULL` (replay lookup)

**Test results (S17)**
- 12 tests mới: `webhook-event.service.spec.ts` (3) + `refund.repository.spec.ts` (4) + `refund.orchestration.spec.ts` (5)
- Full suite: 94/94 tests green across order (25) + device (35) + payment (30) + iot-gateway (2) + nestjs-common (2)
- Build: 22 packages type-check + build sạch

### Kế tiếp (Phase 2.3 / 3.0)
- S18 (Phase 3 mở đầu): observability stack (Prometheus + Grafana + OTel tracing), rate-limit Redis-backed
- S19: staging deploy + smoke tests
- S20: security audit + penetration test prep
- S21: Phase 3 chính thức (real bank partner, Zalo ZNS template approval, real GHN/GHTK keys)
- S22-S24: load testing, DR plan, on-call runbook

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
