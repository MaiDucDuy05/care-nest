# Sprint 12 (S12) — IMEI Lifecycle + Seller Payouts Backend

> Phase 2.2 backend completion. The web-seller portal (S11) already has UI
> flows that expect a real backend. S12 makes those flows real and adds
> a seller-payout ledger on top of the existing escrow.

## Goals

1. **IMEI lifecycle** — every medical device that ships is identified by a
   unique 15-digit IMEI. Sellers bulk-import, allocate to order lines, and
   the buyer later registers the IMEI with the IoT activation flow.
2. **Order state-machine completion** — `CONFIRMED → PACKING → SHIPPED`
   transitions are now driven by IMEI allocation + shipper handoff.
3. **Seller payouts** — after escrow releases (7 days post-delivery),
   the seller's share (less platform commission) becomes a PENDING payout,
   then PAID once transferred to their bank account.

## Non-goals

- Bank transfer execution (S12 records the payout; actual bank push is a
  follow-up integration with a partner bank).
- Multi-warehouse IMEI routing (S12 assumes one warehouse per seller).
- IMEI transfer between sellers (out of scope).

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | DB schema: IMEI + Payout + SellerWallet + migrations | pending |
| 02 | IMEI service: bulk import, allocate, validate Luhn | pending |
| 03 | Order state-machine: PACKING requires IMEIs, SHIPPED triggers escrow | pending |
| 04 | Escrow + Payout release worker (Redis-stream consumer) | pending |
| 05 | Kafka topics + web-seller → backend wiring | pending |
| 06 | Tests (vitest) + docs (changelog, FSD, use cases) | pending |

See `plan.md` for the high-level overview and `phase-XX-*.md` for details.
