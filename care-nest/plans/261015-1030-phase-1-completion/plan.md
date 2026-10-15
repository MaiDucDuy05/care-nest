# Phase 1 Completion — Implementation Plan

> **Bối cảnh**: Plan gốc `plans/261012-0900-carenest-implementation-plan/phase-01-xay-dung-core-platform.md`  
> **Tham chiếu spec**: 696 dòng, FR-1.1 → FR-1.94, 8 sprints (S1–S8) × 2 tuần  
> **Trạng thái trước session này**: 4/8 services scaffolded (auth, catalog, device, iot-gateway) + Phase 0 done. ~40% complete.  
> **Mục tiêu**: Đẩy Phase 1 lên 100% — 4 services còn lại (order, payment, notification, alert) + bổ sung FRs còn thiếu cho 4 services hiện có.

---

## Sprint mapping (theo phase-01 gốc)

| Sprint | Phạm vi | Service(s) | FR-IDs |
|--------|---------|-----------|--------|
| **S1** | Auth + MFA + RBAC + Audit (bổ sung) | auth-service | FR-1.4, 1.6, 1.7 |
| **S2** | Seller Onboarding + KYC | catalog-service (seller module mới) | FR-1.8 → 1.13 |
| **S3** | Catalog tree + Medical Review (đã có 80%) | catalog-service | FR-1.14, 1.18, 1.19 |
| **S4** | Cart + Checkout + Inventory hold | order-service (NEW) | FR-1.20 → 1.26 |
| **S5** | Payment + VNPay + MoMo + Escrow | payment-service (NEW) | FR-1.27 → 1.33 |
| **S6** | Order state machine + Kafka | order-service + notification-service (NEW) | FR-1.34 → 1.40 |
| **S7** | Notification multi-channel | notification-service (NEW) | FR-1.41 → 1.46 |
| **S8** | Alert engine + WebSocket + IoT pipeline end-to-end | alert-service (NEW) | FR-1.47 → 1.55 |

---

## Workstreams (songs song, không overlap file ownership)

### Stream A — `backend/order-service` (port 3004) — **NEW**
**Files to create:**
- `backend/order-service/package.json` + `tsconfig.json` + `nest-cli.json` + `Dockerfile` + `vitest.config.ts`
- `src/main.ts`, `src/app.module.ts`
- `src/cart/` — `cart.controller.ts`, `cart.service.ts`, `cart.repository.ts`, `cart.module.ts`, `dto/*`
- `src/orders/` — `orders.controller.ts`, `orders.service.ts`, `orders.repository.ts`, `orders.module.ts`, `dto/*`
- `src/inventory/` — `inventory.service.ts`, `inventory.repository.ts`, `inventory.module.ts` (stock hold, release, deduct)
- `src/kafka/` — `order-event.publisher.ts`, `kafka.module.ts`
- `src/state-machine/order-state.ts` — pure state transition validator
- `test/*.spec.ts`

**Endpoints:** `GET/POST/DELETE /api/v1/cart`, `POST /api/v1/orders`, `GET /api/v1/orders/:id`, `POST /api/v1/orders/:id/cancel`, `GET /api/v1/orders`, internal `/internal/inventory/hold`

**Kafka events:** publishes `ORDER_CREATED`, `ORDER_PAID` (consumed from payment), `ORDER_SHIPPED`; subscribes `PAYMENT_SUCCESS`

### Stream B — `backend/payment-service` (port 3005) — **NEW**
**Files to create:**
- `backend/payment-service/package.json` + configs + `Dockerfile`
- `src/main.ts`, `src/app.module.ts`
- `src/payments/` — `payments.controller.ts`, `payments.service.ts`, `payments.repository.ts`, `payments.module.ts`
- `src/gateways/vnpay.ts`, `src/gateways/momo.ts` — adapter pattern, mock in dev
- `src/webhooks/` — `webhooks.controller.ts` (HMAC verify)
- `src/escrow/` — `escrow.service.ts` (7d hold + release)
- `src/kafka/` — publishes `ORDER_PAID` to order-service
- `test/*.spec.ts`

**Endpoints:** `POST /api/v1/payments/create`, `GET /api/v1/payments/:id`, `POST /api/v1/payments/:id/refund`, `POST /api/v1/webhooks/vnpay`, `POST /api/v1/webhooks/momo`, `POST /api/v1/webhooks/zalopay`

**External deps:** VNPay sandbox, MoMo sandbox (mock if no creds; structured for swap-in)

### Stream C — `backend/notification-service` (port 3006) — **NEW**
**Files to create:**
- `backend/notification-service/package.json` + configs + `Dockerfile`
- `src/main.ts`, `src/app.module.ts`
- `src/notifications/` — `notifications.controller.ts`, `notifications.service.ts`, `notifications.repository.ts`
- `src/channels/` — `email.channel.ts` (mock SES), `sms.channel.ts` (mock ESMS), `push.channel.ts` (mock FCM), `zalo.channel.ts` (mock ZNS)
- `src/templates/` — Vietnamese templates for `order.confirmed`, `order.shipped`, `alert.sos`, `kyc.approved`, etc.
- `src/kafka/` — consumes `NOTIFICATION_SEND`, `ORDER_CREATED`, `ORDER_SHIPPED`, `ALERT_TRIGGERED`
- `test/*.spec.ts`

**Endpoints:** `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`, `POST /api/v1/notifications/test` (admin)

### Stream D — `backend/alert-service` (port 3007) — **NEW**
**Files to create:**
- `backend/alert-service/package.json` + configs + `Dockerfile`
- `src/main.ts`, `src/app.module.ts`
- `src/alerts/` — `alerts.controller.ts`, `alerts.service.ts`, `alerts.repository.ts`
- `src/rules/` — vital threshold rules (BP high/low, HR high/low, SpO2 low, temp high/low, geofence exit, fall, SOS, low battery)
- `src/realtime/` — `websocket.gateway.ts` (Socket.IO push <5s)
- `src/kafka/` — consumes `IOT_VITALS_RECEIVED`, `IOT_LOCATION_RECEIVED`, `IOT_SOS_RECEIVED`, `IOT_FALL_RECEIVED`
- `test/*.spec.ts`

**Endpoints:** `GET /api/v1/alerts`, `POST /api/v1/alerts/:id/ack`, `POST /api/v1/alerts/:id/resolve`, `WS /alerts` (subject + caregivers subscribe)

### Stream E — `auth-service` enhancements (existing)
**Files to modify:**
- `src/auth/auth.service.ts` — add MFA TOTP enable/verify (FR-1.4)
- `src/auth/auth.controller.ts` — `POST /mfa/enable`, `POST /mfa/verify`
- `src/auth/guards/roles.guard.ts` — add permission-based 3-level RBAC (FR-1.6)
- `src/auth/decorators/` — add `@RequirePermissions()`
- `src/audit/` — NEW module, intercepts auth events → AuditLog (FR-1.7)
- `test/mfa.spec.ts`, `test/audit.spec.ts`

### Stream F — `catalog-service` KYC module (existing)
**Files to create/modify:**
- `src/sellers/` — NEW module: `sellers.controller.ts`, `sellers.service.ts`, `sellers.repository.ts`, `sellers.module.ts`, `dto/*`
- `src/kyc/` — NEW module: `kyc.controller.ts`, `kyc.service.ts`, `kyc.repository.ts`, `kyc.module.ts`
- `src/products/` — add `status: 'PENDING_REVIEW'` flow + admin review endpoint
- `test/sellers.spec.ts`, `test/kyc.spec.ts`

**Endpoints:** `POST /api/v1/sellers/register`, `GET /api/v1/sellers/me`, `POST /api/v1/kyc/upload`, `GET /api/v1/kyc/queue` (admin), `POST /api/v1/kyc/:id/approve|reject`

### Stream G — `device-service` geofence (existing)
**Files to modify:**
- `src/devices/devices.service.ts` — add `geofences` CRUD
- `src/telemetry/telemetry.service.ts` — add geofence check on each location event
- `src/geofences/` — NEW module if scope grows
- `test/geofence.spec.ts`

### Stream H — Cross-cutting
- `docker-compose.dev.yml` — add order-service, payment-service, notification-service, alert-service
- `backend/README.md` — update service matrix + ports
- `docs/development-roadmap.md` — update Phase 1 % + status
- `docs/project-changelog.md` — add Phase 1 entries

---

## Out of scope (external blockers)

- Real VNPay/MoMo merchant keys (use sandbox mocks; production swap-in via env)
- Real GHN API integration (planned Phase 2)
- Real BYT medical product registry API (planned Phase 3)
- OpenTelemetry collector + Grafana/Prometheus + Sentry (planned infra sprint)
- e2e test suite (planned as separate workstream — will add 1 happy-path e2e per new service for smoke coverage)
- Mobile app (Phase 4)
- Web-seller, web-admin portals (Phase 2)

---

## Implementation order (parallel, ~6 sequential waves)

1. **Wave 1** (now): Plan + fix build blockers ✅ done
2. **Wave 2** (parallel): Scaffold 4 new services with empty modules + boot check
3. **Wave 3** (parallel): Implement core features in each new service
4. **Wave 4** (parallel): Kafka wiring between services
5. **Wave 5** (parallel): Enhancements to auth-service + catalog-service
6. **Wave 6**: Tests + verification + docs

---

## Success Criteria

- [ ] `pnpm turbo run build type-check test` → 0 errors, 0 failures across 11+ projects
- [ ] All 8 services respond to `/health` (or have a documented `start` script)
- [ ] Kafka topology documented in `docs/kafka-topics.md`
- [ ] docker-compose.dev.yml spins up all 8 services + DB + Redis + Kafka + MeiliSearch
- [ ] Each new service has ≥3 meaningful unit tests
- [ ] `docs/development-roadmap.md` shows Phase 1 = 100%
- [ ] `docs/project-changelog.md` has Phase 1 entries
- [ ] No secrets in tracked files
- [ ] No mocks/cheats to pass CI — real implementations

---

## Risks

- **R1**: Scope is large. May need to defer geofence (Stream G) to Phase 1.5 if running out of context. Mitigation: prioritize Streams A–D first, then E–G.
- **R2**: Real payment gateways unavailable in dev. Mitigation: structured adapter pattern with deterministic mocks; integration test against sandbox when keys are added.
- **R3**: Kafka topics not yet running. Mitigation: services tolerate absence (try/catch with warn, like device-service already does).
- **R4**: e2e tests deferred. Mitigation: each service has unit tests + a documented manual smoke-test path.

---

*Plan version 1.0 — 2026-10-15*
