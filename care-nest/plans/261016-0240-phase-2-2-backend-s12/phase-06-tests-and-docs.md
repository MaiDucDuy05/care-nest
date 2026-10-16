# Phase 06 — Tests + docs (changelog, FSD, use cases)

**Priority:** P1
**Status:** pending
**Effort:** ~1 hour

## Context

The plan phases 01-05 ship the code. Phase 06 documents the changes and
runs the full pipeline + reviewer.

## Test runs

Each touched service's test suite:

- `pnpm --filter @carenest/catalog-service test`
- `pnpm --filter @carenest/order-service test`
- `pnpm --filter @carenest/payment-service test`
- `pnpm --filter @carenest/notification-service test` (no code change but sanity)

Then full monorepo:

- `pnpm turbo run type-check lint test` — must show 100% pass

## Documentation

### `docs/project-changelog.md` — add v0.2.3

```
## [0.2.3] — 2025-10-16 — Phase 2.2 Sprint 12 (S12): IMEI lifecycle + seller payouts

### Added
- Prisma models: ImeiRecord, SellerWallet, WalletEntry, Payout
- Enums: ImeiStatus, PayoutStatus, WalletEntryKind
- catalog-service: /api/v1/seller/imeis (bulk import, allocate, release, ship) + Luhn validation
- catalog-service: /api/v1/seller/analytics (revenue + top products)
- payment-service: payouts module + escrow-release worker (cron 5 min)
- Kafka topics: IMEI_ALLOCATED, IMEI_SHIPPED, IMEI_ACTIVATED, IMEI_RETURNED, PAYOUT_REQUESTED, PAYOUT_PAID, PAYOUT_FAILED
- Product.requiresImei flag (DB + product CRUD DTOs)

### Changed
- Order SHIPPED transition now requires IMEI allocation for IMEI-required products
- OrderShippedEvent payload now includes `imeis` array
- web-seller: services point at real backend (mock remains opt-in via NEXT_PUBLIC_USE_MOCK_AUTH=true)
- web-seller: products new/edit form gets "requires IMEI" checkbox
```

### `docs/project-fsd.md` — add § 6.3 IMEI + § 6.4 Payouts

Add a new section covering:
- IMEI lifecycle diagram (states + transitions)
- Wallet accounting rules (ORDER_CREDIT + COMMISSION_DEBIT + PAYOUT_DEBIT)
- Commission rate storage and override rules
- Payout schedule and retry policy

### `docs/usecases/seller/` — add UC-SEL-005 through UC-SEL-008

- UC-SEL-005: Bulk import IMEI
- UC-SEL-006: Allocate IMEI to order
- UC-SEL-007: View wallet balance + payout history
- UC-SEL-008: SHIPPED transition blocked by missing IMEI

### `docs/system-architecture.md` — update diagram

Annotate the catalog-service, payment-service, order-service boxes to
show the new IMEI module + payout module. Add arrows for the new Kafka
topics.

## Pipeline check

- `pnpm turbo run type-check` — pass
- `pnpm turbo run lint` — pass (warnings ok)
- `pnpm turbo run test` — pass
- `pnpm turbo run build` — pass (catch backend-side TS issues)
- `pnpm --filter @carenest/web-seller build` — pass (web-seller still builds)

## Commit + push

After pipeline green, single commit with conventional format:

```
feat(backend): S12 IMEI lifecycle + seller payouts
```

Push to `main`. No AI references in commit body.

## Risk

- **Long-running pipeline**: full `turbo run` may take >2 min. Use
  `--concurrency=1` to avoid resource contention.
- **Doc drift**: if pipeline green but doc out of date, the changelog
  still claims completion. Mitigation: write docs first, code second.
