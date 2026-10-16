# Phase 05 — Kafka topics + web-seller → backend wiring

**Priority:** P0
**Status:** pending
**Effort:** ~1 hour

## Context

This phase is glue: define the new Kafka topics, point the web-seller
mock services at the real backend, and add a couple of cross-service
consumers that react to IMEI/payout events.

## New Kafka topics

Add to `packages/shared-config/src/constants.ts`:

```ts
// IMEI lifecycle
IMEI_ALLOCATED: 'imei.allocated',
IMEI_SHIPPED: 'imei.shipped',
IMEI_ACTIVATED: 'imei.activated',
IMEI_RETURNED: 'imei.returned',

// Seller payouts
PAYOUT_REQUESTED: 'payout.requested',
PAYOUT_PAID: 'payout.paid',
PAYOUT_FAILED: 'payout.failed',
```

## Publishers

| Service | Topic | Trigger |
|---------|-------|---------|
| catalog-service (imei) | `IMEI_ALLOCATED` | after `imeiService.allocate()` |
| catalog-service (imei) | `IMEI_SHIPPED` | after `imeiService.ship()` |
| payment-service (payouts) | `PAYOUT_REQUESTED` | after `payoutsService.requestPayout()` |
| payment-service (payouts) | `PAYOUT_PAID` | after bank transfer confirms |
| device-service (activation) | `IMEI_ACTIVATED` | existing activation flow already records activation; S12 also publishes IMEI_ACTIVATED for analytics |

## Consumers

| Service | Topic | Handler |
|---------|-------|---------|
| order-service | `IMEI_ALLOCATED` | Verify that the order's PACKING transition is valid; if not, log warning (defensive) |
| notification-service | `IMEI_SHIPPED` | Send buyer a "Your order has shipped" push/email with the IMEIs for IoT device registration |
| notification-service | `PAYOUT_PAID` | Send seller a "Payout of X VND has been transferred" notification |
| analytics-service (if exists; otherwise web-seller direct query) | `IMEI_SHIPPED` | Increment daily IMEI-shipped counter |

## Frontend wiring

The web-seller's services currently run in mock mode when
`NEXT_PUBLIC_USE_MOCK_AUTH=true`. S12 changes them to point at the real
backend by default, with mock as opt-in fallback.

Update these files:
- `web-seller/src/lib/services/inventory.service.ts` → calls `CATALOG_API/api/v1/seller/imeis/...`
- `web-seller/src/lib/services/orders.service.ts` → calls `SHIPPING_API/api/v1/seller/orders/...` for list/detail, and `CATALOG_API/api/v1/seller/imeis/allocate` for packing
- `web-seller/src/lib/services/products.service.ts` → already points at catalog, verify URL
- `web-seller/src/lib/services/kyc.service.ts` → already points at catalog, verify URL
- `web-seller/src/lib/services/analytics.service.ts` → new `ANALYTICS_API` (or extend catalog with seller analytics endpoint)

### New endpoint needed

`GET /api/v1/seller/analytics?days=7` — returns AnalyticsSummary. Add
this to catalog-service under `src/seller-analytics/`. Aggregate from
`Order` + `OrderItem` tables.

## Files

- **Modify:** `packages/shared-config/src/constants.ts`
- **Modify:** `backend/catalog-service/src/imei/imei.service.ts` (publish IMEI_ALLOCATED + IMEI_SHIPPED)
- **Modify:** `backend/payment-service/src/payouts/payouts.service.ts` (publish PAYOUT_REQUESTED + PAYOUT_PAID)
- **Modify:** `backend/order-service/src/kafka/order-event.consumer.ts` (consume IMEI_ALLOCATED)
- **Modify:** `backend/notification-service/src/kafka/notification.consumer.ts` (consume IMEI_SHIPPED + PAYOUT_PAID)
- **Create:** `backend/catalog-service/src/seller-analytics/seller-analytics.controller.ts` + service
- **Modify:** `web-seller/src/lib/services/*.ts` (point to real backend)
- **Modify:** `web-seller/.env.example` (add `NEXT_PUBLIC_USE_MOCK_AUTH=false` default)

## Tests

- `kafka publisher` smoke test: produce a synthetic event, verify
  consumer receives it (use a `MockKafkaProducer` injected in tests)
- Web-seller service tests stay unchanged (they're unit tests that mock
  the API client)

## Success criteria

- New topics are listed in `KAFKA_TOPICS` and used by at least one
  publisher
- The catalog `/api/v1/seller/analytics` endpoint returns 200 with valid
  sample data
- Web-seller `pnpm --filter @carenest/web-seller type-check lint build` all pass
