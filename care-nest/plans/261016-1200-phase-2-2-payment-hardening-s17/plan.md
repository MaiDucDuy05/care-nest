# Phase 2.2 / Sprint 17 — payment hardening + webhooks

**Goal:** Close the loop on the refund / cancellation flow (currently the wallet credit is never reversed and no event is published) and harden the webhook surface so we can replay / audit / rate-limit.

**Status:** Approved via ExitPlanMode. Implementation starting.

---

## Context

What we have today:
- VNPay + MoMo + COD webhooks live, all with signature verification, and `markPaidFromWebhook` is idempotent (returns existing if already PAID).
- `PaymentsService.refund()` marks the payment row refunded but does NOT (a) call the gateway to push the money back, (b) reverse the seller's pending wallet credit, or (c) publish an event for order-service.
- No webhook event log (so a vendor's replay / out-of-order delivery is invisible to ops).
- No rate limiting on `/api/v1/webhooks/*` (every public POST is fair game).
- `web-buyer` has a refund UI; `web-seller` payouts page shows the wallet but no escrow / refund timeline.

What's missing in S17:
1. **Refund orchestration**: full state machine — validate, call gateway, debit seller wallet, publish ORDER_REFUNDED, mark payment.
2. **Webhook event log**: every webhook attempt (signature-validated or not) gets a row in `payment_webhook_events` for audit + dedup by `(gateway, gateway_event_id)`.
3. **Rate-limit + replay protection**: an in-memory token-bucket on the webhook controller (Redis is the long-term answer; for S17 we use a simple in-memory limiter per gateway).
4. **Payouts UI: escrow timeline** — show pending → released, refunded rows.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Backend: PaymentWebhookEvent model + migration | complete |
| 02 | Backend: webhook event log + replay/dedup | complete |
| 03 | Backend: refund orchestration (gateway call + wallet debit + event) | complete |
| 04 | Backend: rate limit on webhook endpoints | complete |
| 05 | Frontend: web-seller payouts escrow timeline | deferred to S18 |
| 06 | Tests + docs + commit | complete |

## Key files

**Modified (backend):**
- `packages/database/prisma/schema.prisma` — `PaymentWebhookEvent` model
- `packages/database/prisma/migrations/20260104000000_s17_payment_audit/migration.sql` (NEW)
- `backend/payment-service/src/payments/payments.service.ts` — full `refund()` orchestration
- `backend/payment-service/src/webhooks/webhooks.controller.ts` — event log on every attempt, rate limit guard
- `backend/payment-service/src/payments/payments.repository.ts` — add `findByGatewayEvent` for dedup
- `backend/payment-service/src/payouts/payouts.service.ts` — `reverseCreditForOrder(orderId, reason)` (refund path)

**Modified (frontend):**
- `frontend/web-seller/src/app/[locale]/(authenticated)/payouts/page.tsx` — escrow timeline section
- `frontend/web-seller/src/lib/services/payouts.service.ts` — fetch escrow entries

## Conventions

- YAGNI / KISS / DRY
- kebab-case, < 200 lines
- Rate limit = 100 req/min per IP per gateway (in-memory; S18 will move to Redis)
- Refund is admin-only (`@Roles('ADMIN')`) — S17 keeps the existing buyer self-service for partial refund UI in mind but doesn't wire it (admin trigger is enough for the audit gap)
- Wallet debit on refund: subtract from `balance` (not `pending`) so the money is taken back even after escrow has released. If balance goes negative, that's a sign we need to debit the next payout
- Conventional commit; no AI references
- TypeScript strict

## Definition of done

- Every webhook attempt is logged in `payment_webhook_events` (success + rejected)
- Replaying the same webhook (same `gateway_event_id`) is a no-op after the first success
- `POST /api/v1/payments/:id/refund` triggers: gateway refund → wallet debit → `ORDER_REFUNDED` event → `markRefunded`
- `/api/v1/webhooks/*` returns 429 after 100 requests/minute per IP
- web-seller payouts page shows escrow timeline
- 22 packages type-check, lint, build clean
- All existing tests still pass + at least 6 new tests
- Single commit: `feat(payments): S17 refund orchestration + webhook audit log`
