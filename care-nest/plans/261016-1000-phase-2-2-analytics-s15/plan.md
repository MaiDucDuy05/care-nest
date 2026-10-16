# Phase 2.2 / Sprint 15 — analytics + reviews aggregation

**Goal:** Wire the seller analytics dashboard to real data, add a review model + write flow, and surface aggregated ratings + recent reviews on the public seller profile.

**Status:** Approved via ExitPlanMode. Implementation starting.

---

## Context

The web-seller analytics page (`/analytics`) calls `analyticsService.summary(days)` which hits a phantom `/api/v1/seller/analytics` endpoint. S15:
1. Builds that endpoint (in order-service, since it's order-derived)
2. Adds a Review model + write path so buyers can rate DELIVERED orders
3. Aggregates individual reviews into `Seller.ratingAvg` + `Seller.ratingCount`
4. Surfaces reviews on the public seller profile (web-buyer)
5. Replaces mock in `analyticsService` with the real call

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Backend: order-service analytics endpoint | complete |
| 02 | Backend: Review model + migration + write endpoint | complete |
| 03 | Backend: rating aggregation (trigger on review insert) | complete |
| 04 | Frontend: web-seller analytics service (real) | complete |
| 05 | Frontend: web-buyer review form (on DELIVERED orders) | complete |
| 06 | Frontend: web-buyer seller page shows recent reviews | complete |
| 07 | Tests + docs + commit | complete |

## Key files

**New (backend):**
- `backend/order-service/src/analytics/analytics.controller.ts`
- `backend/order-service/src/analytics/analytics.service.ts`
- `backend/order-service/src/analytics/analytics.module.ts`
- `backend/order-service/src/reviews/reviews.controller.ts` (write: auth required; read: public)
- `backend/order-service/src/reviews/reviews.service.ts`
- `backend/order-service/src/reviews/reviews.module.ts`
- `packages/database/prisma/migrations/20260103000000_s15_reviews/migration.sql`

**Modified (backend):**
- `backend/order-service/src/app.module.ts` — wire AnalyticsModule + ReviewsModule
- `packages/database/prisma/schema.prisma` — Review model + relation

**New (frontend web-buyer):**
- `frontend/web-buyer/src/lib/services/reviews.service.ts`
- `frontend/web-buyer/src/app/[locale]/orders/[id]/review/page.tsx` (or inline on detail)

**Modified (frontend web-seller):**
- `frontend/web-seller/src/lib/services/analytics.service.ts` — point to `ORDER_API` instead of `CATALOG_API`

**Modified (frontend web-buyer):**
- `frontend/web-buyer/src/app/[locale]/shop/sellers/[slug]/page.tsx` — add recent reviews section

## Conventions

- YAGNI / KISS / DRY
- kebab-case, < 200 lines
- No PII in Review records (just rating + comment + orderId + sellerId)
- Reviews are immutable after write (no edit/delete in this sprint)
- One review per order (unique constraint on orderId)
- Aggregation in $transaction: insert review + update seller.ratingAvg/ratingCount
- Conventional commit; no AI references
- TypeScript strict

## Definition of done

- `GET /api/v1/orders/analytics?days=7&sellerId=...` returns real aggregated data
- Buyer can submit a 1-5 star review on a DELIVERED order
- Submitting a review updates `Seller.ratingAvg` and `Seller.ratingCount` atomically
- Seller's public profile shows recent reviews (latest 10)
- 22 packages type-check, lint, build clean
- All existing tests still pass + at least 4 new tests
- Single commit: `feat(orders+buyer): S15 seller analytics + reviews`
