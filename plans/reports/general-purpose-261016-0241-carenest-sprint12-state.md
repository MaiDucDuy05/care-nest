# CareNest Backend — Sprint 12 (S12) State-of-Code Report

> Read-only reconnaissance of the CareNest NestJS microservices monorepo to
> inform planning of (a) IMEI lifecycle for products and (b) seller
> wallet/payouts. No edits made.
>
> Working dir: `D:\project\tmdt\care-nest\`
> Generated: 2026-10-16 02:41
>
> Cross-references: S12 plan lives at
> `care-nest/plans/261016-0240-phase-2-2-backend-s12/plan.md`; phase 1
> detail (proposed DB schema for IMEI/Payout) at
> `…/phase-01-db-schema.md`.

---

## 1. Service inventory

All services live in `care-nest/backend/`. Ports below are the
`PORT` env / `main.ts` default (each service reads `process.env.PORT`).

| Service | Port | Framework | Prisma? | Modules in `app.module.ts` | Tests | Domain |
|---|---|---|---|---|---|---|
| `auth-service` | 3001 | NestJS 10 + Passport JWT | via `@carenest/database` (shared client) | `AuthModule`, `UsersModule`, `MfaModule`, `AuditModule` | 2 specs (`auth.service.spec.ts`, `mfa-totp.spec.ts`) | identity, MFA TOTP, audit, KYC read |
| `catalog-service` | 3002 | NestJS 10 | via `@carenest/database` | `ProductsModule`, `CategoriesModule`, `KycModule` | 2 specs (`products.service.spec.ts`, `kyc.dto.spec.ts`) | products, categories, seller KYC submit/review |
| `device-service` | 3003 | NestJS 10 | via `@carenest/database` | `DevicesModule`, `AssignmentsModule`, `TelemetryModule`, `GeofenceModule`, `CaregiversModule` | 3 specs (`devices.service.spec.ts`, `geofence.dto.spec.ts`, `caregivers.spec.ts`) | IoT device registration, assignments, geofence, caregiver |
| `iot-gateway` | 18800 (TCP) | Node raw `net` + tsup | n/a | n/a (single main) | 1 spec (`tcp-server.spec.ts`) | Wonlex V3.2 TCP → Kafka |
| `order-service` | 3004 | NestJS 10 | via `@carenest/database` | `CartModule`, `OrdersModule`, `InventoryModule` | 3 specs (`order-state.spec.ts`, `cart.service.spec.ts`, `orders.dto.spec.ts`) | cart, multi-vendor orders, inventory hold |
| `payment-service` | 3005 | NestJS 10 | via `@carenest/database` | `GatewaysModule`, `PaymentsModule`, `WebhooksModule`, `EscrowModule`, `KafkaModule` | 5 specs (`payment.dto.spec.ts`, `gateways.spec.ts`, `vnpay.gateway.spec.ts`, `momo.cod.gateway.spec.ts`) | VNPay/MoMo/COD, escrow, ORDER_PAID |
| `notification-service` | 3006 | NestJS 10 | via `@carenest/database` | `NotificationsModule`, `KafkaModule`, `PreferencesModule`, `PushSubscriptionsModule` | 5 specs (`notification.dto.spec.ts`, `templates.spec.ts`, `dispatcher.spec.ts`, `preferences.spec.ts`, `push-subscriptions.spec.ts`) | email/SMS/push/ZNS, ORDER_/ALERT_ consumer |
| `alert-service` | 3007 | NestJS 10 + Socket.IO | via `@carenest/database` | `AlertsModule`, `KafkaModule`, `RealtimeModule` | 2 specs (`vitals-rules.spec.ts`, `alert.dto.spec.ts`) | vitals/SOS/fall, geofence push, ALERT_TRIGGERED publisher |
| `subscription-service` | 3008 | NestJS 10 + `@nestjs/schedule` | via `@carenest/database` | `PlansModule`, `SubscriptionsModule`, `ProrationModule`, `ActivationModule`, `CronModule`, `KafkaModule` | 5 specs (`plans.dto.spec.ts`, `subscriptions.dto.spec.ts`, `proration.spec.ts`, `activation.dto.spec.ts`) | plan catalog, subs, proration, **device-activation codes**, cron |
| `shipping-service` | 3009 | NestJS 10 | via `@carenest/database` | `ProvidersModule`, `ShipmentsModule`, `WebhooksModule`, `KafkaModule` | 3 specs (`webhook-signature.spec.ts`, `shipments.dto.spec.ts`, `providers.spec.ts`) | GHN + GHTK carriers, webhooks, SHIPMENT_ events |

**No service has its own `prisma/schema.prisma`.** All services import
`getPrismaClient()` from `@carenest/database`, which re-exports the single
shared `PrismaClient` + all enums/models from
`packages/database/prisma/schema.prisma` (817 lines, 19 models, 16 enums).

**No service has a `test/` directory beside its own `src/`**, but every
service has a top-level `test/` directory next to `src/` (not the
Jest-default `*.spec.ts` co-located). Tests are pure unit tests; no
integration test harness.

---

## 2. catalog-service (port 3002)

Files of interest:

- `package.json`
- `src/main.ts` — port 3002
- `src/app.module.ts` — imports `ProductsModule`, `CategoriesModule`, `KycModule`
- `src/products/{products.controller.ts, products.service.ts, products.repository.ts, products.module.ts}`
- `src/products/dto/{create-product.dto.ts, update-product.dto.ts, product-query.dto.ts}`
- `src/categories/{categories.controller.ts, categories.service.ts, categories.module.ts}`
- `src/categories/dto/category.dto.ts`
- `src/kyc/{kyc.controller.ts, kyc.service.ts, kyc.module.ts, kyc.dto.ts}`
- `src/auth/{jwt-auth.guard.ts, current-user.decorator.ts}`

### IMEI in this service

**There is no `imei` module/controller/service** in `catalog-service` (or
anywhere in `backend/`). The S12 plan at
`plans/261016-0240-phase-2-2-backend-s12/phase-02-imei-service.md` says the
IMEI module will live at `backend/catalog-service/src/imei/` — confirmed
greenfield.

### Seller concept

Yes, but only as a **KYC/onboarding endpoint**, not a seller management
module:

- `KycController` (`POST /api/v1/kyc/submit`, `GET /api/v1/kyc/me`,
  `GET /api/v1/kyc/pending`, `POST /api/v1/kyc/:sellerId/review`) —
  all `UseGuards(JwtAuthGuard)`; KYC service creates a `Seller` row in
  DRAFT/PENDING_REVIEW on first submit.
- No `/api/v1/sellers/*` or `/api/v1/seller/*` namespace exists in
  `catalog-service`.
- `Seller` model is owned by `@carenest/database` and accessed directly
  via Prisma (see Section 6).

### Product modeling

`Product` (in `packages/database/prisma/schema.prisma`):

- Fields: `id, sellerId, categoryId, name, slug, description, brand,
  sku @unique, basePrice (Decimal 12,0 VND), status (string default
  "DRAFT"), isMedical, requiresRx, isIotDevice, iotDeviceModel,
  compareAtPrice, createdAt, updatedAt, deletedAt`
- **No `requiresImei` field today.** S12 plan proposes adding
  `requiresImei Boolean @default(true)`.
- No IMEI / serial field on Product.
- Unique: `(sellerId, slug)`, plus `sku @unique`.

Inventory is quantity-based only: `Inventory { id, productId, sellerId,
warehouseCode default "HCM-01", quantity, reserved, reorderThreshold }`
with `@@unique([productId, warehouseCode])`. The order-service `hold/
release/commit` manipulates `quantity` and `reserved`.

### DTOs

| DTO | Schema | Notable fields |
|---|---|---|
| `CreateProductSchema` (`products/dto/create-product.dto.ts`) | zod | `sellerId`, `categoryId`, `name (≥3 chars)`, `slug?`, `description?`, `price > 0`, `compareAtPrice?`, `sku?`, `stock default 0`, `images: url[] default []`, `isIotDevice default false`, `iotDeviceModel?`, `isMedical default false`, `requiresRx default false` |
| `UpdateProductSchema` | `CreateProductSchema.partial().omit({ sellerId: true })` | (everything from create, no seller change) |
| `ProductQuerySchema` | `PaginationInputSchema.extend({ categoryId?, sellerId?, search?, minPrice?, maxPrice?, isIotDevice? })` | |
| `CreateCategorySchema` | zod | `name`, `slug?`, `parentId? (uuid)` |
| `SubmitKycSchema` | zod | `storeName 3–120`, `storeSlug 3–120 (a-z0-9-)`, `taxId 8–20?`, `documents: { type: 'TAX_ID'|'BUSINESS_LICENSE'|'BANK_ACCOUNT'|'ID_CARD', fileUrl: url, expiresAt? }[] min 1` |
| `ReviewKycSchema` | zod | `decision: 'APPROVED'|'REJECTED'`, `rejectionReason? ≤500` |

### Routes (controller @-decorators)

- `ProductsController` (`/api/v1/products`): `GET` list,
  `GET :id`, `POST`, `PUT :id`, `DELETE :id` — **no auth guard** on the
  controller.
- `CategoriesController` (`/api/v1/categories`): `GET` list, `GET :id`,
  `POST` — no auth guard.
- `KycController` (`/api/v1/kyc`, `@UseGuards(JwtAuthGuard)`):
  `POST submit`, `GET me`, `GET pending`, `POST :sellerId/review`.
  No `@Roles()` / `RolesGuard` — comment in code says admin auth is
  "added when admin auth is wired up in Phase 2".

### Kafka producers/consumers

**None** in `catalog-service`. (S12 plan calls for web-seller → backend
wiring; this will be new.)

---

## 3. order-service (port 3004 — note: user said 3005 but actual is 3004)

> The user prompt referenced "port 3005" but that is the payment-service
> port. Order-service is on **3004** per `src/main.ts`.

Files of interest:

- `src/main.ts` — port 3004
- `src/app.module.ts` — `CartModule`, `OrdersModule`, `InventoryModule`
- `src/state-machine/order-state.ts` — pure transition table
- `src/orders/{orders.controller.ts, orders.service.ts, orders.repository.ts, orders.module.ts}`
- `src/orders/dto/order.dto.ts`
- `src/cart/{cart.controller.ts, cart.service.ts, cart.repository.ts, cart.module.ts}`
- `src/cart/dto/cart-item.dto.ts`
- `src/inventory/{inventory.service.ts, inventory.repository.ts, inventory.module.ts}`
- `src/kafka/{kafka.module.ts, order-event.publisher.ts}`

### OrderStatus state machine

Enum (from `packages/database/prisma/schema.prisma`):

```prisma
enum OrderStatus {
  CREATED
  CONFIRMED
  PACKING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}
```

Transitions (from `src/state-machine/order-state.ts`):

| From | Allowed `to` |
|---|---|
| `CREATED` | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | `PACKING`, `CANCELLED` |
| `PACKING` | `SHIPPED`, `CANCELLED` |
| `SHIPPED` | `DELIVERED`, `RETURNED` |
| `DELIVERED` | `RETURNED` |
| `CANCELLED` | (terminal) |
| `RETURNED` | (terminal) |

`isTerminal()` returns true for `CANCELLED` and `RETURNED` only.
`assertTransition(from, to)` throws `InvalidStateTransitionError`.
`ORDER_TRANSITIONS = ALLOWED` is exported.

> Note: a header comment in the file mentions a `COMPLETED` terminal
> state — it is not present in the Prisma enum, the code, or any test.

### PACKING → SHIPPED transition

- Allowed in the state-machine table (no guard currently).
- `OrdersService.updateStatus` (line 105) wraps it with:
  - `assertTransition(order.status, dto.status)` (pure state machine)
  - On `CANCELLED`: `inventoryService.release(...)` for each item.
  - On `SHIPPED`: `inventoryService.commit(...)` for each item +
    publishes `OrderShippedEvent` to `KAFKA_TOPICS.ORDER_SHIPPED`
    (`{ orderId, orderNumber, buyerId }`).
- **No guard today requires IMEI allocation.** S12 plan
  (`phase-03-order-state-machine.md`) says to add one that checks
  `ImeiRecord.status === SHIPPED` per `OrderItem` where the linked
  `Product.requiresImei` is true.
- Authorization in controller: if user is not `ADMIN`/`SUPPORT`, the
  service checks `order.sellerId === user.id`. **Note this is buggy as
  written** — the service compares `order.sellerId` to `user.id`, but
  `sellerId` references the `Seller` row, not the `User` row. (Not
  flagged by the user; just observed.)

### Order/OrderItem — seller & payout fields

- `Order.sellerId` (uuid, FK to `Seller`, **not** `User`).
- `OrderItem` has no `sellerId`, no `imei`, no `payoutAmount` field.
- `Order` has `subtotal, shippingFee, discount, total` (all Decimal
  VND) and `shippingAddress Json`.

### IMEI on OrderItem

**None today.** S12 phase 03 will join via
`ImeiRecord.orderItemId`.

### Controllers & routes

- `OrdersController` (`/api/v1/orders`, `@UseGuards(JwtAuthGuard)`):
  - `POST /checkout`
  - `GET /` — paginated, switches by `?sellerId=…`
  - `GET /:id`
  - `POST /:id/status` — body `UpdateOrderStatusSchema`
- `CartController` (`/api/v1/cart`, `@UseGuards(JwtAuthGuard)`):
  - `GET /`
  - `POST /items`
  - `PUT /items/:productId`
  - `DELETE /items/:productId`
  - `DELETE /` (clear)

### Kafka

- Producer only (`OrderEventPublisher` in `src/kafka/`):
  - `ORDER_CREATED` — payload `{ orderId, orderNumber, buyerId, sellerId, total, paymentMethod }`
  - `ORDER_SHIPPED` — payload `{ orderId, orderNumber, buyerId }`
- **No consumer** in this service. `OrdersService.confirmPaid(orderId)`
  exists and is meant to be called by an `ORDER_PAID` consumer, but the
  consumer is **not wired up**. The payment-service publishes
  `ORDER_PAID`, the notification-service consumes it, but
  order-service has no listener.

---

## 4. shipping-service (port 3009)

Files of interest:

- `src/main.ts` — port 3009
- `src/app.module.ts` — `ProvidersModule`, `ShipmentsModule`,
  `WebhooksModule`, `KafkaModule`
- `src/shipments/{shipments.controller.ts, shipments.service.ts, shipments.repository.ts, shipments.module.ts}`
- `src/shipments/dto/shipments.dto.ts`
- `src/providers/{shipping-provider.factory.ts, shipping-provider.interface.ts, ghn.provider.ts, ghtk.provider.ts, providers.module.ts, webhook-signature.ts}`
- `src/webhooks/{webhooks.controller.ts, webhooks.module.ts}`
- `src/kafka/{kafka.module.ts, shipping-event.publisher.ts}`

### What it owns

- `Shipment` model: `id, orderId @unique, sellerId, carrier, trackingCode
  @unique?, status (ShipmentStatus), shippingFee, weight, estimatedAt,
  pickedUpAt, deliveredAt, failedReason, metadata Json, createdAt,
  updatedAt` — **one Shipment per Order** (UNIQUE on `orderId`).
- `ShipmentStatus` enum: `PENDING_PICKUP, PICKED_UP, IN_TRANSIT,
  OUT_FOR_DELIVERY, DELIVERED, FAILED_ATTEMPT, RETURNED, CANCELLED`.

### Models, controllers, routes

`ShipmentsController` (`/api/v1/shipments`, `@UseGuards(JwtAuthGuard)`):

- `POST /quote` — single-carrier quote
- `POST /quote/cheapest` — both GHN + GHTK, return cheaper
- `POST /` — create shipment (idempotent on `orderId`)
- `GET /:id`
- `GET /track/:trackingCode`
- `POST /track/:trackingCode/refresh` — force-poll the carrier
- `GET /` — list for current seller (uses JWT subject as sellerId —
  see "Gotchas")

`WebhooksController` (`/api/v1/webhooks/shipping`, **no auth — HMAC
verified per provider**):

- `POST /ghn` — header `x-ghn-signature`
- `POST /ghtk` — header `x-ghtk-signature`

`ShippingProviderFactory` injects `GHN` + `GHTK` via
`SHIPPING_PROVIDERS` token. Each provider implements
`IShippingProvider { carrierCode, calculateFee, createShipment,
getTrackingStatus, verifyWebhookSignature }`. `GhnProvider.mapStatus`
and `GhtkProvider.mapStatus` are exported statics; both providers
return sandboxed responses when env tokens are missing
(`logger.warn` then `sandboxFee/Create/Track`).

### Reference to Order / OrderItem

- Only by `orderId` uuid on the Shipment row and the
  `CreateShipmentDto { orderId uuid, orderNumber, sellerId uuid, … }`.
- No direct cross-service call to order-service. No Prisma `include`
  for Order/OrderItem.
- `CreateShipmentService` does not verify that `orderId` exists or
  matches an Order in order-service.

### Kafka

- Producer (`ShippingEventPublisher` in `src/kafka/`):
  - `SHIPMENT_CREATED` — `{ shipmentId, orderId, trackingCode, carrier, estimatedAt? }`
  - `SHIPMENT_STATUS_CHANGED` — `{ shipmentId, orderId, trackingCode, status, carrier, description?, location? }`
  - `ORDER_DELIVERED` — `{ orderId, shipmentId, deliveredAt, trackingCode, carrier }`
  - `SHIPMENT_FAILED` — `{ shipmentId, orderId, reason }` (on
    `RETURNED` or `CANCELLED`)
- **No consumer** — but S12 phase 3 says SHIPPED → escrow will be
  driven by `ORDER_SHIPPED` (which order-service publishes); the
  cross-service wiring is the new bit.

---

## 5. payment-service (port 3006)

> Note: user said 3006, matches `src/main.ts`.

Files of interest:

- `src/main.ts` — port 3005 (actually) — see note below

Wait — `src/main.ts` line 9: `const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;`
So payment-service is on **port 3005**, not 3006 (3006 is
notification-service). The user prompt said "payment-service (port
3006)" but actual port is **3005**.

(Continuing with the report — flagging as unresolved.)

- `src/main.ts` — port 3005
- `src/app.module.ts` — `GatewaysModule`, `PaymentsModule`,
  `WebhooksModule`, `EscrowModule`, `KafkaModule`
- `src/payments/{payments.controller.ts, payments.service.ts, payments.repository.ts, payments.module.ts}`
- `src/payments/dto/payment.dto.ts`
- `src/gateways/{payment-gateway.ts, vnpay.gateway.ts, momo.gateway.ts, cod.gateway.ts, gateways.module.ts}`
- `src/escrow/{escrow.service.ts, escrow.module.ts}`
- `src/webhooks/{webhooks.controller.ts, webhooks.module.ts}`
- `src/kafka/{kafka.module.ts, order-event.publisher.ts}`

### How payments are recorded

`Payment` model (in shared schema):

- `id, orderId @unique, userId, method (PaymentMethod), status
  (PaymentStatus default PENDING), amount (Decimal 14,0 VND),
  transactionRef @unique? (gateway-side id), gatewayResponse Json?,
  paidAt?, expiredAt?, createdAt, updatedAt`

`PaymentMethod`: `VNPAY, MOMO, ZALOPAY, COD, BANK_TRANSFER`.
`PaymentStatus`: `PENDING, PAID, FAILED, REFUNDED, EXPIRED`.

`PaymentsService.createPayment` is idempotent: dedupes by
`idempotencyKey` (stored in `transactionRef`); also throws if the
order already has a payment (`findByOrderId` check).

`markPaidFromWebhook(transactionRef, gatewayResponse)`:
- Finds payment, idempotent on already-PAID.
- `markPaid` → `status = PAID, paidAt = now()`.
- Calls `EscrowService.hold(orderId, amount)`.
- Publishes `OrderPaidEvent` to `KAFKA_TOPICS.ORDER_PAID`.

### Refunds

- `POST /api/v1/payments/:id/refund` —
  `RefundPaymentSchema { amount?: positive, reason: 1-500 }`.
- `PaymentsService.refund` finds by `transactionRef`, requires
  `status === PAID`, calls `markRefunded` (only sets
  `status = REFUNDED`; **does not** write a `refundedAt` or `refundAmount`
  column — the schema has neither).

### Payout / seller wallet / transfer

**No payout, seller wallet, or transfer concept exists anywhere in
the payment-service or the database.** Grep for `payout|Payout|wallet|
Wallet` across the repo returns:

- The S12 plan document
  (`plans/261016-0240-phase-2-2-backend-s12/plan.md`,
  `…/phase-01-db-schema.md`) — proposes new models
- A passing mention in `payment-service/src/escrow/escrow.service.ts`:
  "Once the hold window elapses without a refund claim, the funds are
  released to the seller's pending payout." (intentional design intent
  comment, no model.)

`Payment.gatewayResponse` is a freeform `Json?` — gateways do not
return a per-seller split.

### Escrow

`EscrowService` (`payment-service/src/escrow/escrow.service.ts`):
- `hold(orderId, amount)` — Redis `SET` with `EX 7 days`, JSON payload
  `{ amount, status: 'HELD', heldAt }`. Wrapped in
  `withLock('escrow:'+orderId, …)`.
- `release(orderId)` — updates Redis payload to `status: 'RELEASED'`,
  no TTL.
- `refund(orderId)` — updates to `status: 'REFUNDED'`.
- No expiration watcher / no publisher for "released" — the Redis
  TTL just lets the record age out. The S12 plan phase 04 ("Escrow +
  Payout release worker — Redis-stream consumer") is greenfield.

### Controllers & routes

`PaymentsController` (`/api/v1/payments`):
- `POST /` — `@UseGuards(JwtAuthGuard)` — `CreatePaymentSchema`
- `GET /:id` — `@UseGuards(JwtAuthGuard)` — **body is
  `this.paymentsService` itself, not a method call** (placeholder bug;
  line 25 in `payments.controller.ts`)
- `POST /:id/refund` — `@UseGuards(JwtAuthGuard)`

`WebhooksController` (`/api/v1/webhooks`, **no auth**):
- `POST /vnpay` (and `GET /vnpay` for return URL)
- `POST /momo`
- `POST /cod/confirm` — accepts `{ orderId }`, treats as paid

### Kafka

Producer only (`OrderEventPublisher` in `src/kafka/`):
- `ORDER_PAID` — `{ orderId, paymentId, amount, method }`

---

## 6. Database schema

Single Prisma schema at
`packages/database/prisma/schema.prisma` (817 lines). One migration:
`packages/database/prisma/migrations/20260101000000_init/manual.sql`
(70 lines — sets up extensions `pgcrypto`, `pg_uuidv7`, `timescaledb`,
declares enum types, calls `create_hypertable` on
`health_records`/`alerts`/`audit_logs`, enables RLS on `users`,
`orders`, `payments`, `health_records`, `alerts`, `audit_logs`).

> Mismatch: the `NotificationChannel` enum in the SQL migration
> lists only `'IN_APP','PUSH','SMS','EMAIL'` but the Prisma model
> adds `'ZNS'`. The init migration is therefore out of sync with
> the Prisma file. (Noted under "Gotchas".)

### Enums (verbatim, 16 total)

| Enum | Values |
|---|---|
| `UserRole` | `BUYER, SELLER, ADMIN, SUPPORT, CAREGIVER` |
| `UserStatus` | `ACTIVE, SUSPENDED, PENDING_VERIFICATION, DEACTIVATED` |
| `SellerStatus` | `DRAFT, PENDING_REVIEW, ACTIVE, SUSPENDED, REJECTED` |
| `KycStatus` | `NOT_STARTED, IN_REVIEW, APPROVED, REJECTED, EXPIRED` |
| **`OrderStatus`** | `CREATED, CONFIRMED, PACKING, SHIPPED, DELIVERED, CANCELLED, RETURNED` |
| `PaymentMethod` | `VNPAY, MOMO, ZALOPAY, COD, BANK_TRANSFER` |
| `PaymentStatus` | `PENDING, PAID, FAILED, REFUNDED, EXPIRED` |
| `ShipmentStatus` | `PENDING_PICKUP, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED_ATTEMPT, RETURNED, CANCELLED` |
| `SubscriptionPlan` | `FREE, BASIC, PRO, ENTERPRISE` |
| `SubscriptionStatus` | `ACTIVE, TRIALING, PAST_DUE, CANCELLED, EXPIRED` |
| `NotificationChannel` | `IN_APP, PUSH, SMS, EMAIL, ZNS` |
| `NotificationStatus` | `QUEUED, SENT, DELIVERED, FAILED, READ` |
| `DeviceStatus` | `INACTIVE, ACTIVE, MAINTENANCE, LOST, DECOMMISSIONED` |
| `AlertType` | `SOS, FALL, VITALS_BP_HIGH, VITALS_BP_LOW, VITALS_HR_HIGH, VITALS_HR_LOW, VITALS_OXYGEN_LOW, VITALS_TEMP_HIGH, VITALS_TEMP_LOW, GEOFENCE_EXIT, LOW_BATTERY` |
| `AlertSeverity` | `LOW, MEDIUM, HIGH, CRITICAL` |
| `AlertStatus` | `OPEN, ACKNOWLEDGED, RESOLVED, CLOSED_FALSE` |
| `AuditAction` | `CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, OTHER` |
| `AuditActorType` | `USER, SELLER, ADMIN, SUPPORT, SYSTEM, ANONYMOUS` |

### Models (19 total, source of truth = `packages/database/prisma/schema.prisma`)

| # | Model | Key fields | Relations |
|---|---|---|---|
| 1 | `User` | `email @unique, phone? @unique, passwordHash, fullName, role (UserRole), status, pdpaConsent, mfaEnabled, mfaSecret?` | hasOne `Seller`, hasMany `Order`s, `DeviceAssignment`s, `HealthRecord`s, `Alert`s (subject + assignee), `Subscription`s, `Notification`s, `Caregiver`s (user + caretaker), `Payment`s, `AuditLog`s, `Geofence`s, `DeviceActivationCode`s, `NotificationPreference`, `PushSubscription`s |
| 2 | `Seller` | `userId @unique, storeName, storeSlug @unique, taxId? @unique, status (SellerStatus), kycStatus (KycStatus), ratingAvg, ratingCount, commissionRate (Decimal 4,3 default 0.10)` | hasMany `Product`s, `Order`s, `Inventory`s, `SellerKycDocument`s, `Shipment`s, `Subscription`s |
| 3 | `SellerKycDocument` | `sellerId, type (string e.g. 'TAX_ID'), fileUrl, status (KycStatus), reviewedBy?, reviewedAt?, rejectionReason?, expiresAt?` | belongs to `Seller` |
| 4 | `Category` | `name, slug @unique, parentId? (self-FK)` | hasMany `Product`s, self-FK tree |
| 5 | `Product` | `sellerId, categoryId?, name, slug, description, brand?, sku? @unique, basePrice (Decimal 12,0 VND), status (string default "DRAFT"), isMedical, requiresRx, isIotDevice, iotDeviceModel?` | `@@unique([sellerId, slug])`, hasMany `Inventory`, `OrderItem`, `ProductImage` |
| 6 | `ProductImage` | `productId, url, altText?, position` | belongs to `Product` |
| 7 | `Inventory` | `productId, sellerId, warehouseCode default "HCM-01", quantity (Int), reserved (Int), reorderThreshold (Int default 10)` | `@@unique([productId, warehouseCode])`, belongs to `Product`, `Seller` |
| 8 | `Order` | `orderNumber @unique, buyerId, sellerId, status (OrderStatus), subtotal, shippingFee, discount, total, shippingAddress (Json), note?` | hasMany `OrderItem`, hasOne `Payment`, hasOne `Shipment`, hasMany `DeviceActivationCode`s |
| 9 | `OrderItem` | `orderId, productId, productName (snapshot), unitPrice, quantity, lineTotal` | belongs to `Order`, `Product` — **no `imei`, no `sellerId`, no `payoutAmount`** |
| 10 | `Payment` | `orderId @unique, userId, method (PaymentMethod), status (PaymentStatus), amount (Decimal 14,0), transactionRef? @unique, gatewayResponse (Json?), paidAt?, expiredAt?` | belongs to `Order`, `User` |
| 11 | `Shipment` | `orderId @unique, sellerId, carrier (string), trackingCode? @unique, status (ShipmentStatus), shippingFee, weight?, estimatedAt?, pickedUpAt?, deliveredAt?, failedReason?, metadata?` | belongs to `Order`, `Seller` |
| 12 | `Subscription` | `userId?, sellerId?, plan (SubscriptionPlan), status (SubscriptionStatus), startedAt, currentPeriodEnd, cancelledAt?, externalId? @unique, metadata?, planId? (FK to `Plan`)` | belongs to `User?`, `Seller?`, hasMany `SubscriptionReminder`s, belongs to `Plan?` |
| 13 | `Caregiver` | `userId, caretakerId, relationship (string), permissions (Json), invitedAt, acceptedAt?, revokedAt?` | `@@unique([userId, caretakerId])`, two FKs to `User` |
| 14 | `Notification` | `userId, channel (NotificationChannel), status (NotificationStatus), templateKey, payload (Json), subject?, body, sentAt?, deliveredAt?, readAt?, failureCode?, attempts (Int default 0)` | belongs to `User` |
| 15 | `Device` | `deviceId @unique (10-15 digit IMEI), model default 'care-nest-V3.2', firmware?, status (DeviceStatus), lastSeenAt?, lastBattery?, registeredAt, decommissionedAt?` | hasMany `DeviceAssignment`, `HealthRecord`, `Alert` |
| 16 | `DeviceAssignment` | `deviceId, userId, assignedAt, unassignedAt?, notes?` | `@@unique([deviceId, userId, assignedAt])`, belongs to `Device`, `User` |
| 17 | `HealthRecord` | `deviceId, userId, recordType (string e.g. 'LOCATION'\|'HEARTBEAT'\|'VITALS_BP_HR'\|...), measuredAt, receivedAt, data (Json), battery?, gsmSignal?` | Hypertable on `measuredAt` |
| 18 | `Alert` | `deviceId, subjectId, assigneeId?, type (AlertType), severity (AlertSeverity), status (AlertStatus default OPEN), occurredAt, receivedAt, acknowledgedAt?, resolvedAt?, payload (Json), notes?` | Hypertable on `receivedAt`, belongs to `Device`, `User` (subject + assignee) |
| 19 | `AuditLog` | `actorId?, actorType (AuditActorType), action (AuditAction), entityType, entityId?, before (Json?), after (Json?), ip?, userAgent?, requestId?, occurredAt` | Hypertable on `occurredAt` (7-year retention) |
| 20 | `Plan` | `code @unique, name, description?, priceMonthly (Decimal 12,0 VND), deviceLimit (Int default 1), caregiverLimit (Int default 1), retentionMonths (Int default 6), features (Json), active (Bool default true)` | hasMany `Subscription` |
| 21 | `SubscriptionReminder` | `subscriptionId, reminderType (string e.g. 'D-30'), daysBefore (Int), scheduledFor, sentAt?, channel?` | `@@unique([subscriptionId, reminderType])` |
| 22 | `DeviceActivationCode` | `token @unique (uuid), hmac, orderId, userId, imeiList (Json — string[] from seller scan), expiresAt, usedAt?, deviceId?` | belongs to `Order`, `User` |
| 23 | `Geofence` | `userId, name, centerLat (Decimal 10,7), centerLon (Decimal 10,7), radiusMeters (Int default 150), active (Bool default true)` | belongs to `User` |
| 24 | `NotificationPreference` | `userId @unique, channels (Json — 4×4 channel×category bool grid)` | belongs to `User` |
| 25 | `PushSubscription` | `userId, endpoint @unique, p256dh, auth, userAgent?, lastUsedAt` | belongs to `User` |

(Counted: 25 models, 18 enums — the user-facing README says 19 models,
but the actual schema has 25. Schema header comment says "19 entities"
which is stale.)

### Specifically flagged for S12

- **`OrderStatus`** — values above; the existing state machine lives in
  `order-service/src/state-machine/order-state.ts`. **No S12 changes
  needed** (the S12 plan adds *runtime* guards, not new enum values).
- **`ImeiRecord` / `IMEI` / `DeviceImei`** — **does not exist**. The
  only `imei`-shaped field today is `Device.deviceId @unique` (10-15
  digit IMEI for the IoT watch) and the JSON column
  `DeviceActivationCode.imeiList: string[]`. There is no per-product,
  per-seller, per-orderItem IMEI tracking.
- **`Seller`** — present, fields above, with `commissionRate Decimal(4,3)
  default 0.10`.
- **`Payout` / `PayoutLedger` / `Wallet`** — **does not exist**. S12
  plan proposes:
  - `SellerWallet { sellerId @unique, balanceVnd, pendingVnd, lifetimeVnd, currency }`
  - `WalletEntry { walletId, kind (WalletEntryKind: ORDER_CREDIT |
    COMMISSION_DEBIT | REFUND_DEBIT | PAYOUT_DEBIT | ADJUSTMENT),
    amountVnd, balanceAfterVnd, referenceType?, referenceId?,
    description? }`
  - `Payout { sellerId, walletId, amountVnd, status (PayoutStatus:
    PENDING|PROCESSING|PAID|FAILED|REVERSED), bankName, bankAccount,
    bankAccountName, transferRef?, failureReason?, requestedAt,
    processedAt?, paidAt? }`
- **`Transaction` / `Payment`** — `Payment` exists; no separate
  `Transaction` model. Refund fields are not modeled (`refundAmount`,
  `refundedAt`).
- **`OrderItem`** — no `sellerId`, no `imei`, no `payoutAmount`.
  `productId` is the only product reference.

### Migrations

- One migration: `packages/database/prisma/migrations/20260101000000_init/manual.sql`
  (hand-rolled — Prisma `migrate dev` was not run; the SQL itself has
  only the enum/extension/hypertable/RLS prelude; the table DDL is
  generated by Prisma from the schema and pasted in).
- No `prisma/migrations/migration_lock.toml` was found in the glob.
- No generated `prisma/migrations/<timestamp>_*/migration.sql` other
  than the init directory.

### Shared Prisma client

`packages/database/src/index.ts` exports:

```ts
export { PrismaClient, Prisma };
export * from '@prisma/client';        // all enums + model types
export function getPrismaClient(): PrismaClient;  // singleton
export async function disconnectPrisma(): Promise<void>;
```

Every service's repository class calls `getPrismaClient()` in its
constructor and uses the returned `PrismaClient` for all queries.

---

## 7. Kafka topics

Source: `packages/shared-config/src/constants.ts` lines 24-65.
`packages/shared-kafka/src/topics.ts` re-exports `KAFKA_TOPICS` from
`shared-config` for convenience.

### Topic constants (verbatim)

```ts
export const KAFKA_TOPICS = {
  // Inbound (device → server)
  IOT_LOCATION_RECEIVED:    'iot.location.received',
  IOT_VITALS_RECEIVED:      'iot.vitals.received',
  IOT_SOS_RECEIVED:         'iot.sos.received',
  IOT_FALL_RECEIVED:        'iot.fall.received',
  IOT_DEVICE_REGISTERED:    'iot.device.registered',
  IOT_HEARTBEAT_RECEIVED:   'iot.heartbeat.received',

  // Internal — order lifecycle
  ORDER_CREATED:            'order.created',
  ORDER_PAID:               'order.paid',
  ORDER_READY_TO_SHIP:      'order.ready_to_ship',
  ORDER_SHIPPED:            'order.shipped',
  ORDER_DELIVERED:          'order.delivered',
  INVENTORY_RESERVED:       'inventory.reserved',
  INVENTORY_RELEASED:       'inventory.released',
  ALERT_TRIGGERED:          'alert.triggered',
  NOTIFICATION_SEND:        'notification.send',
  NOTIFICATION_REQUESTS:    'notification.requests',
  NOTIFICATION_SENT:        'notification.sent',
  NOTIFICATION_FAILED:      'notification.failed',

  // Subscription lifecycle
  SUBSCRIPTION_CREATED:     'subscription.created',
  SUBSCRIPTION_RENEWED:     'subscription.renewed',
  SUBSCRIPTION_CANCELLED:   'subscription.cancelled',
  SUBSCRIPTION_EXPIRED:     'subscription.expired',

  // Device activation bridge
  ACTIVATION_CODE_CREATED:  'activation.code.created',
  DEVICE_ACTIVATION_REQUESTED: 'device.activation.requested',
  DEVICE_ACTIVATED:         'device.activated',

  // Shipping
  SHIPMENT_CREATED:         'shipment.created',
  SHIPMENT_STATUS_CHANGED:  'shipment.status_changed',
  SHIPMENT_FAILED:          'shipment.failed',

  // Outbound (server → device)
  IOT_DEVICE_COMMAND:       'iot.device.command',
} as const;
```

### Producers / consumers map (only what is wired today)

| Service | Producer topics | Consumer topics |
|---|---|---|
| `iot-gateway` | `IOT_LOCATION_RECEIVED`, `IOT_VITALS_RECEIVED`, `IOT_SOS_RECEIVED`, `IOT_FALL_RECEIVED`, `IOT_HEARTBEAT_RECEIVED` (via `TelemetryPublisher`) | none |
| `order-service` | `ORDER_CREATED`, `ORDER_SHIPPED` | **none** (despite `OrdersService.confirmPaid` being written for `ORDER_PAID`) |
| `payment-service` | `ORDER_PAID` | none |
| `shipping-service` | `SHIPMENT_CREATED`, `SHIPMENT_STATUS_CHANGED`, `ORDER_DELIVERED`, `SHIPMENT_FAILED` | none |
| `subscription-service` | `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_EXPIRED`, `DEVICE_ACTIVATION_REQUESTED` | none |
| `notification-service` | none | `ORDER_CREATED`, `ORDER_SHIPPED`, `ALERT_TRIGGERED`, `NOTIFICATION_REQUESTS` |
| `alert-service` | `ALERT_TRIGGERED` | `IOT_VITALS_RECEIVED`, `IOT_LOCATION_RECEIVED`, `IOT_SOS_RECEIVED`, `IOT_FALL_RECEIVED`, `IOT_HEARTBEAT_RECEIVED` |
| `device-service` | none | `IOT_HEARTBEAT_RECEIVED`, `IOT_LOCATION_RECEIVED`, `IOT_VITALS_RECEIVED` |
| `auth-service` | none | none |
| `catalog-service` | none | none |

### Shared types/interfaces per service (informal; not enforced)

- `iot-gateway/src/handlers/packet-dispatcher.ts` — packet types
- `order-service/src/kafka/order-event.publisher.ts` —
  `OrderCreatedEvent`, `OrderShippedEvent`
- `payment-service/src/kafka/order-event.publisher.ts` —
  `OrderPaidEvent`
- `shipping-service/src/kafka/shipping-event.publisher.ts` —
  `ShipmentCreatedEvent`, `ShipmentStatusChangedEvent`,
  `OrderDeliveredEvent`, `ShipmentFailedEvent`
- `subscription-service/src/kafka/subscription-event.publisher.ts` —
  `SubscriptionCreatedEvent`, `SubscriptionCancelledEvent`,
  `SubscriptionRenewedEvent`, `SubscriptionExpiredEvent`,
  `DeviceActivationRequestedEvent`
- `alert-service/src/kafka/order-event.publisher.ts` —
  `AlertTriggeredEvent`
- `notification-service/src/kafka/notification.consumer.ts` —
  in-file interfaces `OrderCreatedEvent`, `OrderShippedEvent`,
  `AlertTriggeredEvent`, `NotificationRequestEvent`
  (informally typed — no shared `.d.ts`)

---

## 8. Test patterns

- **Framework:** `vitest` (`vitest@^2.1.0`) in every backend service
  `devDependencies`. No Jest anywhere.
- **Location:** every service has a top-level `test/` directory
  (`backend/<svc>/test/*.spec.ts`); no co-located `*.spec.ts` in
  `src/`. Glob: 29 spec files across 9 services.
- **What they cover:** state machines, DTO Zod parsing, gateway crypto
  (HMAC), pure business logic (cart grouping, proration, TOTP, vitals
  rules, webhook signature). Almost no DB-touching test — the existing
  specs use a hand-rolled `fakeRepo` or `mockRepo = {} as any`.
- **Examples (quoted below):**
  - `backend/catalog-service/test/products.service.spec.ts` (8 lines)
    — bare "should be defined" smoke test.
  - `backend/order-service/test/order-state.spec.ts` — full state
    machine coverage.
  - `backend/order-service/test/cart.service.spec.ts` — uses an
    in-memory `fakeRepo()` to test `CartService.groupBySeller`.
  - `backend/payment-service/test/gateways.spec.ts` — `hmacSha256` +
    `sha256Hex` vector tests.
  - `backend/catalog-service/test/kyc.dto.spec.ts` — `SubmitKycSchema`
    + `ReviewKycSchema` Zod parsing.
  - `backend/subscription-service/test/activation.dto.spec.ts` —
    `CreateActivationCodeSchema` IMEI regex (14-16 digits, no
    letters), UUID checks, max 10 IMEIs.

Pattern is the same in every spec:

```ts
import { describe, it, expect } from 'vitest';
import { SomeSchema } from '../src/.../...dto.js';

describe('SomeSchema', () => {
  it('accepts a valid …', () => { … });
  it('rejects …', () => { … });
});
```

No test in the repo exercises an HTTP endpoint via `supertest`, no
test runs a Prisma query against a real DB, no test depends on a
running Redis or Kafka. (Mocking is *not* present either — specs
just call pure logic with synthetic input.)

---

## 9. Shared types package

`packages/shared-types/` — Zod schemas + TypeScript types shared
between backend and frontend.

| File | Exports |
|---|---|
| `src/index.ts` | re-exports `ids`, `common`, `enums`, `entities`, `design-tokens` |
| `src/common.ts` | `PaginationInputSchema`, `PaginatedResult<T>`, `PaymentMethodSchema`, `PaymentStatusSchema`, **`OrderStatusSchema` (CREATED/CONFIRMED/PACKING/SHIPPED/DELIVERED/CANCELLED/RETURNED)**, `AlertSeveritySchema`, `AuditTimestampsSchema` |
| `src/ids.ts` | Branded `UserId, SellerId, OrderId, ProductId, DeviceAssignmentId, PlanId, SubscriptionId, ShipmentId, GeofenceId, CaregiverId`; helpers `asUserId / asSellerId / asOrderId / asProductId / …`; `idSchema` (matches CUID or UUID); `isoDateSchema`, `nonEmptyStringSchema`, `vnPhoneSchema`, `emailSchema` |
| `src/enums/{subscription,shipping,notification,geofence}.ts` | `PlanIntervalSchema`, `SubStatusSchema`, `ProrationModeSchema`, `ShipmentStatusSchema` (note: this one lists `PENDING` and `RETURN_REQUESTED` and `FAILED` — **not** the Prisma `ShipmentStatus`), `CarrierCodeSchema` (`GHN, GHTK, VIETTEL_POST, GHN_SLOW, GHTK_SLOW`), `ReminderKindSchema`, `GeofenceShapeSchema`, `GeofenceEventSchema` |
| `src/entities/{plan,subscription,device-activation,shipment,geofence,kyc-document,audit-event}.entity.ts` | Zod schemas for each entity shape |
| `src/design-tokens/` | (frontend) CSS design tokens |

### Specifically asked

- **`OrderStatus` re-export:** yes, `OrderStatusSchema` in
  `common.ts` exports the same 7 values as Prisma's `OrderStatus`
  enum. `asOrderId(orderId: string): OrderId` exists.
- **IMEI type:** **no.** `device-activation.entity.ts` mentions
  IMEI only inside the activation DTO context, but no `Imei` /
  `ImeiRecord` / `DeviceImei` type is exported. The `OrderItem` shape
  has no IMEI.
- **Payout / Seller wallet / Wallet entry type:** **no.** None of
  these entities are in shared-types.
- **Seller type:** `SellerId` brand exists (`ids.ts`); no full
  `Seller` Zod schema.
- **Event payload types (e.g. `OrderCreatedEvent`):** **no** in
  `shared-types`. Event payload interfaces are defined in each
  service's `kafka/*event.publisher.ts` or `kafka/*.consumer.ts`.
  This means cross-service typing is informal — consumers re-declare
  the event shape (see `notification-service/src/kafka/notification.consumer.ts`
  which inlines `OrderCreatedEvent { orderId; buyerId; orderNumber }`
  — a partial shape that misses `sellerId, total, paymentMethod`).

### How are they consumed?

- Backend: most DTOs import primitives from `@carenest/shared-types`
  (`nonEmptyStringSchema`, `PaginationInputSchema`, `idSchema`,
  `vnPhoneSchema`, `emailSchema`).
- Frontend (not read here, but mentioned in shared-types README):
  consumes branded IDs, enums, entity shapes for HTTP contract
  validation.
- `package.json` of `shared-types` does not exist in the
  glob — file path is `packages/shared-types/`. Used by
  `care-nest/backend/catalog-service/package.json` etc. as
  `@carenest/shared-types` workspace dependency.

---

## 10. Auth service / roles

Files in `auth-service/src/`:

- `auth/auth.controller.ts` — `POST /api/v1/auth/register`, `POST /login`,
  `POST /refresh`, `GET /me` (`@UseGuards(JwtAuthGuard)`)
- `auth/auth.service.ts` — bcrypt + JWT issue/verify; payload
  `{ sub, email, role }`
- `auth/strategies/jwt.strategy.ts` — passport-jwt, extracts
  `{ userId: payload.sub, email, role }`
- `auth/guards/jwt-auth.guard.ts` — `@nestjs/passport` `AuthGuard('jwt')`
- `auth/guards/roles.guard.ts` — checks `@Roles(...)` metadata, reads
  `req.user.role`, throws `ForbiddenException` on mismatch
- `auth/decorators/roles.decorator.ts` — `ROLES_KEY = 'roles'`,
  `Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)`
- `auth/decorators/current-user.decorator.ts` — supports
  `@CurrentUser('role')` to pluck a field
- `mfa/{mfa.controller.ts, mfa.service.ts, mfa.module.ts}` — RFC 6238
  TOTP, in-house implementation (no `otplib`)
- `users/{users.service.ts, users.repository.ts, users.module.ts}`
- `audit/{audit.controller.ts, audit.service.ts, audit.module.ts}` —
  `GET /api/v1/audit/:entityType/:entityId` (admin/support only, uses
  `@Roles('ADMIN', 'SUPPORT')`)

### SELLER role

- `UserRole` enum: `BUYER, SELLER, ADMIN, SUPPORT, CAREGIVER`.
- `RegisterSchema.role` is `z.enum(['BUYER', 'SELLER', 'CAREGIVER']).default('BUYER')`
  — sellers can self-register (no admin gate).
- A user with `role = SELLER` has a corresponding `Seller` row created
  on first KYC submit (via `catalog-service/src/kyc/kyc.service.ts`,
  not auth-service).
- JWT payload includes `role: User.role`. Other services check
  `user.role` manually in their controllers — see
  `OrdersController.updateStatus` (line 53-59, `if (user.role !==
  'ADMIN' && user.role !== 'SUPPORT')`).
- Only `auth-service` and `AuditController` use the
  `@Roles()` + `RolesGuard` combo today. Other services
  (`orders`, `payments`, `kyc`) hard-code `user.role === 'ADMIN'`
  in handlers.

### How JWT user/role is extracted in other services

- `catalog-service/src/auth/jwt-auth.guard.ts` (line 17) calls
  `jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET ||
  'care-nest-jwt-secret-dev-2026' })` and assigns
  `(request as any).user = payload`. (The full payload, not the
  passport `validate()` shape.)
- `CurrentUser` decorator returns the whole `request.user`.
- Other services use the same pattern (each re-implements
  `JwtAuthGuard` instead of importing from `auth-service`):
  - `catalog-service/src/auth/jwt-auth.guard.ts`
  - `order-service/src/cart/guards/jwt-auth.guard.ts`
  - `shipping-service/src/auth/jwt-auth.guard.ts`
  - `payment-service/src/auth/jwt-auth.guard.ts`
  - `subscription-service/src/auth/jwt-auth.guard.ts`
  - `device-service/src/auth/jwt-auth.guard.ts`
- **Shared secret** `process.env.JWT_SECRET || 'care-nest-jwt-secret-dev-2026'`
  hard-coded in every service. Refresh secret
  `'care-nest-refresh-secret-dev-2026'` only in auth-service.

### `/me` and `/users`

- `auth-service` exposes `GET /api/v1/auth/me` (returns
  `{ user }` — the JWT payload only; no DB lookup).
- No `GET /users` or user lookup endpoint in auth-service. The
  `UsersService.findById` method exists but no controller routes
  call it. (The `me` endpoint just returns the JWT payload; the
  frontend must trust the JWT and call a downstream service for
  profile data if needed.)

---

## 11. Infra notes

### Root workspace

- `care-nest/package.json` — name `carenest`, version `0.1.0`,
  `packageManager: pnpm@12.11.2`, `engines.node >=20`.
- `care-nest/pnpm-workspace.yaml` — workspaces:
  `frontend/*`, `backend/*`, `packages/*`. Allow-list for native
  builds: `@nestjs/core, @prisma/client, @prisma/engines, bcrypt,
  esbuild, prisma, unrs-resolver`.
- `care-nest/turbo.json` — `build / dev / lint / type-check / test /
  test:watch / clean` tasks. `dev` is `cache: false, persistent:
  true`. No `agentGuidance` key (the default block from the `turbo`
  CLI is appended to AGENTS.md by the CLI itself, not by the repo).

### Build / dev toolchain

- NestJS 10 services build with `nest build` (tsc under the hood).
- `iot-gateway` builds with `tsup`.
- Shared packages (`shared-types`, `shared-config`, `shared-utils`,
  `shared-kafka`, `shared-redis`, `database`, `prisma-client`,
  `nestjs-common`, `common-dto`, `iot-codec`) all build with `tsup`,
  output CJS + ESM + DTS to `dist/`.

### Docker stack (`care-nest/docker-compose.dev.yml`)

Base services (always on):

| Container | Image | Port | Notes |
|---|---|---|---|
| `carenest-postgres` | `timescale/timescaledb:latest-pg16` | 5432 | user `carenest`, pass `carenest_dev`, db `carenest` |
| `carenest-redis` | `redis:7-alpine` (AOF on) | 6379 | |
| `carenest-kafka` | `bitnami/kafka:3.7` (KRaft) | 9092 internal, 9094 external | `auto.create.topics.enable=true` |
| `carenest-meilisearch` | `getmeili/meilisearch:v1.10` | 7700 | master key `carenest_dev_master_key` |

Profile `full` (only with `--profile full`): `iot-gateway`,
`auth-service` (3001), `catalog-service` (3002), `device-service`
(3003), `order-service` (3004), `payment-service` (3005),
`notification-service` (3006), `alert-service` (3007),
`subscription-service` (3008), `shipping-service` (3009).

> `docker-compose.dev.yml` itself lists port 3006 for
> notification-service — matches the service's own `main.ts`
> default. **So payment-service is 3005, not 3006 as the user
> prompt said.** This is the same mismatch as Section 5.

### Config / env files

- `care-nest/.env.example` — exists, not opened here.
- `care-nest/Makefile` — exists, not opened here.
- Each service has no `.env` (env is loaded at runtime from the OS /
  container env / `loadBaseEnv` zod schema).
- JWT secret is **hard-coded as a fallback** to
  `'care-nest-jwt-secret-dev-2026'` in every JwtAuthGuard. Production
  deploy must override `JWT_SECRET` env.

### Docs

- `D:\project\tmdt\docs\` (project root, not in monorepo):
  - `development-roadmap.md` — 5-phase 30-week plan, current state
    "Phase 1 ✅ (W03–W10) Build pipeline hardening, 22 packages
    green, 426 tests passing" (as of 2025-10-16).
  - `project-changelog.md` — exists, not read here.
  - `carenest-bmc-report.md`, `carenest-de-xuat.md` — marketing/biz
    docs.
- `D:\project\tmdt\care-nest\docs\` — does **not** exist. (No
  architecture docs inside the monorepo.)
- `D:\project\tmdt\care-nest\backend\README.md` — Vietnamese
  microservices overview with port table (3001-3012), per-service
  responsibilities, `docker-compose --profile full` instructions.
- `D:\project\tmdt\care-nest\README.md` — full Vietnamese
  project README; tech stack, repo structure, getting started,
  port table. (Re-confirms 3001-3012 mapping; the README
  also has **stale** port numbers for `order-service` ("3004"),
  `payment-service` ("3005"), `notification-service` ("3006"),
  `alert-service` ("3007"), `subscription-service` ("3008"),
  `shipping-service` ("3009"). Actually these match the services
  — the README is *inconsistent* with itself because it lists
  `inventory-service` (3006), `health-service` (3007), `alert-engine`
  (3008), `notification-service` (3009) — i.e. the README predates
  the actual services that were scaffolded.)

### Plans in `D:\project\tmdt\care-nest\plans\`

- `261012-0900-carenest-implementation-plan/` — high-level 4-phase
  plan (Vietnamese, with `plan.md` + `phase-00..04`).
- `261015-1030-phase-1-completion/` — Phase 1 build pipeline
  hardening.
- `261015-1500-phase-2-2-frontend-s10-s11-s13/` — frontend S10/S11/S13.
- `261016-0240-phase-2-2-backend-s12/` — **the S12 plan** with
  `plan.md` + `phase-01-db-schema.md` + `phase-02-imei-service.md` +
  `phase-03-order-state-machine.md`. All phases marked **pending**.
- `reports/` — `code-reviewer-261012-phase-00.md`,
  `code-reviewer-261013-phase-00.md`,
  `phase1-261016-0204-completion.md`.

---

## 12. What is already done for S12

Cross-referenced against `plans/261016-0240-phase-2-2-backend-s12/plan.md`
and `…/phase-01..03-*.md`. All S12 phases are marked **pending** in the
plan; nothing has been merged yet. However, several building blocks
already exist in the current code:

- **Seller onboarding (KYC submit + admin review):** fully working in
  `catalog-service/src/kyc/`. Creates a `Seller` row in
  `PENDING_REVIEW` → `ACTIVE` on approval. Sets `commissionRate` from
  the schema default (0.10). Importer of the `Seller` model for
  payout's `sellerId` FK.
- **`Order.sellerId` already populated** at checkout time via
  `OrdersService.checkout` → `OrdersRepository.createOrder` (one
  Order per seller, from `groupBySeller`). No schema change needed.
- **Escrow 7-day hold in Redis** is live
  (`payment-service/src/escrow/escrow.service.ts`).
- **`ORDER_PAID` Kafka topic is published** by payment-service
  (`OrderEventPublisher.publishOrderPaid`).
- **`ORDER_SHIPPED` topic is published** by order-service
  (`OrderEventPublisher.publishOrderShipped`).
- **`DEVICE_ACTIVATION_REQUESTED` topic is published** by
  subscription-service (`SubscriptionEventPublisher.publishDeviceActivationRequested`).
- **Device activation codes already carry `imeiList: string[]`** via
  `DeviceActivationCode.imeiList Json` + Zod regex
  `/^\d{14,16}$/` (see `subscription-service/src/activation/dto/activation.dto.ts`).
- **JWT roles are present** — `UserRole.SELLER` exists, JWT payload
  includes `role`, `RolesGuard` + `@Roles()` decorator exist in
  `auth-service/src/auth/`. (`auth-service` has 1 use of
  `@Roles('ADMIN', 'SUPPORT')` on `AuditController`.)
- **State machine** is complete with all 7 enum values and full
  happy-path coverage (`order-service/test/order-state.spec.ts`).
- **`OrderEventPublisher.confirmPaid`** method exists in
  `order-service` — designed to be called by an `ORDER_PAID`
  consumer, but the consumer is not wired.

---

## 13. What is clearly missing for S12

Concrete gaps based on the S12 plan:

1. **No `ImeiRecord` / `ImeiStatus` / `WalletEntry` / `WalletEntryKind`
   / `Payout` / `PayoutStatus` models** in
   `packages/database/prisma/schema.prisma`. S12 phase 01 is
   entirely greenfield schema.
2. **No IMEI module/controller/service in any backend service.**
   `backend/catalog-service/src/imei/` does not exist; web-seller
   currently mocks it.
3. **No `requiresImei` field on `Product`.** S12 phase 01 proposes
   `requiresImei Boolean @default(true)`.
4. **No `ORDER_PAID` consumer in `order-service`.** Despite
   `OrdersService.confirmPaid` and a `confirmPaid` doc comment,
   no `TypedConsumer` is registered. `order-service/src/kafka/`
   only contains `order-event.publisher.ts` and
   `kafka.module.ts` (which only exports the publisher).
5. **No `ORDER_SHIPPED` consumer anywhere.** Phase 03/04 want
   shipping-service or payment-service to react to SHIPPED; today
   no one does.
6. **No payout / wallet / ledger / transfer service.** No `payouts`
   table, no `seller_wallets` table, no `wallet_entries` table.
7. **No payout endpoints** (request, list, mark-paid,
   bank-account update).
8. **No seller-role guard wired outside `auth-service`.** No
   other service has a `RolesGuard` registered; the `@Roles()`
   decorator only fires in `auth-service`. (Catalog, order,
   payment, shipping, subscription do `if (user.role !==
   'ADMIN' && user.role !== 'SELLER') { ... }` in handlers, or
   skip the check entirely.)
9. **No commission / split math anywhere.** `OrderItem` has no
   `payoutAmount`, no `commissionAmount`, no `sellerNet`.
   `Order.total` is the gross the buyer pays; nothing breaks it
   down by seller share.
10. **No escrow release → payout worker.** The Redis TTL is set
    to 7 days, but no scheduler reads expired escrow keys and
    credits the seller wallet.
11. **No bank-account field on `Seller`.** Sellers do not store
    their bank account number; `SellerKycDocument.type =
    'BANK_ACCOUNT'` exists as a KYC document, but there is no
    canonical `bankName / bankAccount / bankAccountName` row.
12. **No Luhn / IMEI-15 validator** anywhere in the backend.
    `Device.deviceId` regex is `^\d{10,15}$` — no checksum.
    Activation IMEI list regex is `^\d{14,16}$` — no checksum.
13. **No shared `Imei` Zod schema** in `packages/shared-types/`.
14. **No event payload types for `ORDER_READY_TO_SHIP`,
    `INVENTORY_RESERVED`, `INVENTORY_RELEASED`** — the topic
    constants exist but no service publishes them yet.
15. **No `notifications-service` IMEI notification templates**
    (e.g. `imei.allocated`, `imei.shipped`,
    `payout.released`, `payout.paid`).
16. **Schema migration drift:** the `NotificationChannel` enum in
    the init SQL migration lacks the `ZNS` value, so a fresh
    `prisma migrate deploy` will fail to match the Prisma file.
17. **README ports table is out of sync with the actual services.**
    The README's port table mentions `inventory-service` (3006),
    `health-service` (3007), `alert-engine` (3008),
    `notification-service` (3009) — none of those exist; the
    actual services are on different ports (see Section 11).
18. **Shipment ↔ IMEI ↔ OrderItem link** — `Shipment` has
    `orderId` but not a list of `ImeiRecord`s; `ImeiRecord` would
    need a `shipmentId` for traceability (not in the S12 plan
    phase 01, but relevant for any "this is the IMEI in the box"
    query).

---

## 14. Gotchas

- **Hard-coded JWT secret fallback.** Every service's
  `JwtAuthGuard` falls back to `'care-nest-jwt-secret-dev-2026'`
  if `JWT_SECRET` is unset. A misconfigured prod env would still
  authenticate, making a real env-var leak invisible. The single
  auth-service has the same fallback for `JWT_REFRESH_SECRET`.
- **JWT payload is trusted verbatim.** Other services'
  `JwtAuthGuard` does `(request as any).user = payload` and stop
  there — no DB lookup, no role re-validation. A stale
  `BUYER→SELLER` role promotion takes effect on next token issue
  only.
- **`OrdersController.updateStatus` authorization bug.** The
  check `if (order.sellerId !== user.id)` compares `Seller.id`
  to `User.id`. JWT subject is `User.id`; the only way this
  works is if the `Seller` row happens to share the UUID of its
  `User` (it does not — `Seller.id` is its own `uuidv7`).
  Sellers can therefore never pass the check; only `ADMIN` /
  `SUPPORT` can transition orders via the API today.
- **Each service reimplements `JwtAuthGuard` + `CurrentUser`**
  (5+ copies). There is no shared `@carenest/nestjs-common`
  guard in use; even though `packages/nestjs-common` package
  exists and exports a `JwtAuthGuard`, none of the backend
  services import from it. (Confirmed by grep — no
  `@carenest/nestjs-common` import in any `backend/<svc>/src/`
  file.)
- **Order `KAFKA_TOPICS.ORDER_PAID` is published but never
  consumed.** Notification-service consumes `ORDER_CREATED`
  and `ORDER_SHIPPED` (not `ORDER_PAID`). The only effect of
  `OrderEventPublisher.publishOrderPaid` is "a message lands on
  the topic" — the `OrdersService.confirmPaid` method is
  dead code in the order-service today.
- **Order service state machine has a comment referencing a
  non-existent `COMPLETED` state.** Header in
  `src/state-machine/order-state.ts` (line 5) says
  `DELIVERED → (COMPLETED)`; no such enum value, no
  transition. Tests also do not assert it.
- **`OrderEventPublisher` class name is reused** in
  `order-service`, `payment-service`, and `alert-service` —
  each defines its own local `src/kafka/order-event.publisher.ts`
  with the same class name but different publish methods.
  No shared abstract base.
- **Event payload types are inlined per service.** No
  `OrderCreatedEvent` lives in `shared-types`. Consumers
  (`notification-service/src/kafka/notification.consumer.ts`)
  re-declare partial interfaces that omit fields the
  producer actually sends (e.g. `sellerId, total,
  paymentMethod` are dropped silently).
- **Schema migration directory has only one migration** and
  the SQL itself is mostly a preamble — table DDL is implied
  to be pasted in from Prisma's auto-generated output, but
  no such file is in the repo. The `init` directory contains
  only `manual.sql`. There is no `migration_lock.toml` either.
- **`NotificationChannel` enum drift between Prisma (5 values
  including `ZNS`) and the `20260101000000_init/manual.sql`
  migration (4 values, no `ZNS`).** A `prisma migrate dev`
  would detect this drift; a `prisma migrate deploy` on the
  current state would fail.
- **Shipment idempotency is by `orderId` UNIQUE.** A
  `POST /api/v1/shipments` for the same `orderId` with a
  different carrier throws `ConflictException` (not
  idempotent return). The "same carrier → idempotent return"
  branch only fires when the new request has no `carrier` field
  and matches the existing carrier.
- **`PaymentsController.getOne` is a placeholder bug** —
  `return this.paymentsService;` (returns the service itself,
  not a payment). Line 25 of `payments.controller.ts`.
- **Mocked gateway implementations always return
  `logger.warn('…real API call not implemented — returning
  sandbox …')`.** GHN and GHTK `calculateFee` /
  `createShipment` / `getTrackingStatus` are stubbed. Real
  network code is `// Phase 3 will wire it up` per the
  comments.
- **No timeouts / health checks / readiness probes** in any
  service. No `app.enableShutdownHooks()`, no `@nestjs/terminus`
  usage (the `nestjs-common` package depends on it but nothing
  in `backend/` does).
- **Turborepo `AGENTS.md` managed block:** the root
  `AGENTS.md` was prepended with the standard Turborepo
  "this is NOT the Turborepo you know" block. The block is
  added by the `turbo` CLI on first agent invocation. The
  block itself warns the AGENTS.md content can be inaccurate
  — for this repo specifically the actual monorepo commands
  (`pnpm`, `turbo run <task>`) match the docs.
- **Port mismatch between README / backend/README.md and
  actual services.** `care-nest/README.md` table is mostly
  correct, but its first column implies `inventory-service`,
  `health-service`, `alert-engine`, `notification-service`
  ports (3006–3009) that don't match the actual scaffolded
  services. The repo's actual port allocation is
  3001-auth / 3002-catalog / 3003-device / 3004-order /
  3005-payment / 3006-notification / 3007-alert /
  3008-subscription / 3009-shipping. `iot-gateway` is TCP
  18800.
- **README claims `inventory-service` on 3010 as a future
  service**, but the actual inventory logic is *inside*
  `order-service` (`order-service/src/inventory/`). Inventory
  is a module, not a service.

---

## 15. Unresolved questions

1. **Port 3005 vs 3006 for payment-service.** The user prompt
   said payment-service is on 3006; `src/main.ts` and
   `docker-compose.dev.yml` both say 3005. The user may have
   meant a different service or is working from an older
   plan.
2. **Order-service port 3004 vs user-prompt "3005".** Same
   discrepancy as above.
3. **Real carrier credentials.** No `GHN_TOKEN`,
   `GHN_SHOP_ID`, `GHTK_TOKEN` are required to start the
   service in dev (sandbox is auto-fallback), but the S12
   phase 04 escrow-release worker might depend on
   webhook-driven order completion that the sandbox doesn't
   emit. Plan does not say.
4. **Bank partner for payouts.** S12 plan says "actual bank
   push is a follow-up integration with a partner bank" —
   no bank is named; no API is sketched; no env var is
   reserved. The S12 plan only models the Payout *record*,
   not the transfer *execution*.
5. **Will `ORDER_READY_TO_SHIP`, `INVENTORY_RESERVED`,
   `INVENTORY_RELEASED` topics be used by S12?** They exist
   in `KAFKA_TOPICS` but no service publishes them; no
   spec says which S12 phase will start using them.
6. **Multi-warehouse IMEI routing.** S12 plan says "S12
   assumes one warehouse per seller". But `Inventory` has
   `warehouseCode default "HCM-01"` and is `@@unique
   ([productId, warehouseCode])`. A future change to
   multi-warehouse would need a new `imei_records.
   warehouseCode` field. Plan does not name the column
   defaults for IMEI rows.
7. **Device activation flow ownership for IMEIs.** Today,
   `subscription-service` owns `DeviceActivationCode` +
   `DEVICE_ACTIVATION_REQUESTED` publishing. S12 plan phase
   02 places the *new* IMEI module in
   `catalog-service/src/imei/`. Two services will both
   handle IMEI-shaped data; the boundaries (does
   catalog-service's IMEI module write to
   `DeviceActivationCode.imeiList`? Does it own
   `Device.deviceId` lookups?) are not specified.
8. **Whether to do cross-service direct DB read (Phase 03
   "Option A")** for the SHIPPED IMEI guard. The plan
   recommends direct DB read from `order-service` into
   `imei_records`. This is a service-boundary decision the
   team should ratify.
9. **IMEI re-use on refund / return.** No model
   documents what happens to an `ImeiRecord` with status
   `SHIPPED` if the order is later `RETURNED`. Plan
   mentions `ImeiStatus.RETURNED` but no flow describes
   the transition.
10. **Notification envelope for IMEI / payout events.**
    `notification-service` has 11 Vietnamese templates
    today; no `imei.*` or `payout.*` template keys exist.
    Plan does not specify whether S12 adds templates or
    the order/shipping service publishes ad-hoc.
11. **PII of IMEI strings.** `device.ts` in
    `packages/common-dto/src/device/` already treats IMEI
    as 15-digit numeric, but no PII-masking helper exists
    for IMEI in `packages/shared-utils/src/pii.ts`. Worth
    confirming during phase 02.
12. **Where the "release to seller wallet" worker runs.**
    Plan phase 04 says "Redis-stream consumer" — which
    service hosts it? `payment-service` (own the money)?
    New `payout-service`? `subscription-service` (already
    has cron)?
13. **`SELLER` role gating on `KycModule` submit.**
    The kyc controller allows any authenticated user to
    call `POST /api/v1/kyc/submit` and creates a Seller
    row. There is no role check that the user actually has
    `role === 'SELLER'`. A BUYER can therefore become a
    seller implicitly by submitting KYC. Out of scope for
    S12, but worth flagging.

---

*End of report. ~3,800 words. File:
`D:\project\tmdt\plans\reports\general-purpose-261016-0241-carenest-sprint12-state.md`.*
