# Phase 2.2 / Sprint 13 — web-seller live wire-up

**Goal:** Close the loop between S11 (web-seller UI scaffold) and S12 (IMEI + payouts backend). Make the seller portal hit the real services end-to-end, with the IMEI + payout features actually visible to the seller.

**Status:** Approved via ExitPlanMode. Implementation starting.

---

## Context

S11 shipped the `frontend/web-seller` Next.js 14 app — login, KYC, dashboard, products, orders, IMEI, inventory, analytics, settings. But the service layer was wrapped in `USE_MOCK` short-circuits: by default the app used an in-memory store and never talked to a real backend. The S12 backend changes (IMEI lifecycle, payouts) are not exposed in the UI at all.

S13 removes the mock default, fixes the URL paths that don't match the real controllers, exposes the new IMEI + payout endpoints, and adds a Payouts page so the seller can see their wallet.

## Key files

- `frontend/web-seller/src/lib/api-client.ts` — base URLs (`AUTH_API`, `CATALOG_API`, `SHIPPING_API`)
- `frontend/web-seller/src/lib/services/{products,orders,inventory,analytics,kyc,auth}.service.ts` — service layer
- `frontend/web-seller/src/lib/types.ts` — local types (Product, Order, IMEIRecord, …)
- `frontend/web-seller/src/app/[locale]/(authenticated)/{products,orders,imei}/page.tsx` — pages that consume services
- `frontend/web-seller/messages/{vi,en}.json` — i18n

## Backend services (already in place from S12)

- `catalog-service` — `GET/POST/PUT/DELETE /api/v1/products` (public), `POST /api/v1/seller/imeis/bulk`, `GET /api/v1/seller/imeis`, `POST /api/v1/seller/imeis/allocate`, `POST /api/v1/seller/imeis/release`, `POST /api/v1/seller/imeis/:orderId/ship`
- `order-service` — `GET /api/v1/orders?sellerId=...`, `GET /api/v1/orders/:id`, `POST /api/v1/orders/:id/status` (with IMEI guard on SHIPPED)
- `payment-service` — `GET /api/v1/seller/payouts`, `GET /api/v1/seller/payouts/wallet`

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Fix service URLs + flip mock default | pending |
| 02 | Wire products page to real backend + requires-IMEI | pending |
| 03 | Replace inventory.service with imei.service + bulk import UI | pending |
| 04 | Wire orders page to real backend (order-service not shipping) | pending |
| 05 | New Payouts page (wallet + history) | pending |
| 06 | Tests + docs + commit | pending |

## Conventions preserved

- YAGNI / KISS / DRY
- kebab-case file names, < 200 lines per file
- Conventional commit message; no AI references
- No new enhanced files — update existing
- TypeScript strict, no `any` in new code
- Lint with 0 errors
- All 22 packages type-check green
- Luhn-15 client-side validation (re-validated server-side)

## Definition of done

- `NEXT_PUBLIC_USE_MOCK_AUTH` defaults to `false` (escapable for dev)
- Products page calls real `catalog-service`
- Products create/edit form has a `requiresImei` checkbox
- IMEI page uses new `imei.service.ts` with bulk import + Luhn check
- Orders page calls real `order-service` (not shipping)
- New Payouts page shows wallet + history
- 22 packages type-check, lint, build clean
- All existing tests still pass + any new unit tests
- Single commit: `feat(web-seller): S13 live wire-up + payouts page`
