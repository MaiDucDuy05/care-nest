# CareNest — Lộ trình phát triển (Development Roadmap)

> **Cập nhật liên tục** bởi `project-manager` agent. Mỗi phase có status, milestones, và % hoàn thành.

**Cập nhật gần nhất:** 2026-10-13 (kết thúc Phase 0, bao gồm 8 critical fix từ code-review)

---

## Tổng quan 5 giai đoạn (30 tuần)

| Phase | Tên | Thời gian | Tuần | Status | % |
|-------|-----|-----------|------|--------|---|
| 0 | Khởi động & R&D (Monorepo + Wonlex codec) | 2 tuần | W01–W02 | ✅ **Hoàn thành** | 100% |
| 1 | Xây dựng Core Platform | 8 tuần | W03–W10 | ⏳ Chưa bắt đầu | 0% |
| 2 | Tích hợp & Hoàn thiện | 8 tuần | W11–W18 | ⏳ Chưa bắt đầu | 0% |
| 3 | Thử nghiệm & Thẩm định | 6 tuần | W19–W24 | ⏳ Chưa bắt đầu | 0% |
| 4 | Ra mắt & Tăng tốc | 6 tuần | W25–W30 | ⏳ Chưa bắt đầu | 0% |

**Tổng tiến độ dự án: 6.7% (2/30 tuần)**

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
- Phase 1: Scaffold NestJS services (auth, catalog, order, payment, iot-gateway, device)
- Wire `shared-kafka` / `shared-redis` into services
- Apply initial migration to staging database
