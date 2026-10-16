# Phase 2.2 / Sprint 17 — Escrow Timeline UI (S17 closure)

**Goal:** Surface the new S17 wallet ledger (ORDER_CREDIT, COMMISSION_DEBIT, REFUND_DEBIT, PAYOUT_DEBIT) on the existing web-seller payouts page so a seller can audit their escrow timeline, not just the Payout history. Also pull the matching Payout rows that were REVERSED into the same timeline so a refunded order shows up next to the original credit + the cancellation.

**Status:** Approved via ExitPlanMode. Implementation starting.

---

## Context

S17 (`50f187b`) wired the backend refund orchestration + audit log, but the web-seller payouts page (`/payouts`) still only shows:
- 3-card wallet summary (balance / pending / lifetime)
- A Payout history table (PENDING / PROCESSING / PAID / FAILED / REVERSED rows)

What's missing: a chronological ledger of `WalletEntry` rows for the seller. Without it, a seller cannot see:
- Which order credit + commission debit went together
- When an order was refunded (REFUND_DEBIT row exists in DB but not in the UI)
- Why their balance dropped (refund vs payout)

The data already exists in `wallet_entries` — we just need an endpoint + a UI surface.

## Plan

### Backend — 1 new endpoint

`backend/payment-service/src/payouts/payouts.controller.ts`
- Add `GET /api/v1/seller/payouts/entries?page=&pageSize=&kind=` that:
  - Resolves `user.id` → `seller.id` (same pattern as existing `list`)
  - Returns paginated `wallet_entries` for that seller, ordered by `createdAt DESC`
  - Optional `kind` filter (one of `ORDER_CREDIT | COMMISSION_DEBIT | REFUND_DEBIT | PAYOUT_DEBIT | ADJUSTMENT`)
  - Default pageSize 50, max 100 (matches existing list endpoint)
- Response shape: `{ items, total, page, pageSize, hasMore }` (mirrors existing `list`)

No schema changes — `WalletEntry` table already exists with `@@index([walletId, createdAt(sort: Desc)])` which is the perfect index for this query.

### Frontend — payouts service + page

**`frontend/web-seller/src/lib/services/payouts.service.ts`**
- Add `listEntries(params?: { kind?, page?, pageSize? })` method (mirrors `list()`)
- Add `MOCK_ENTRIES: WalletEntry[]` for `USE_MOCK_AUTH=true` dev mode (a few representative rows so the UI renders)
- Add `WalletEntry` + `WalletEntryKind` types (or extend `types.ts`)

**`frontend/web-seller/src/lib/types.ts`**
- Add `WalletEntryKind = 'ORDER_CREDIT' | 'COMMISSION_DEBIT' | 'REFUND_DEBIT' | 'PAYOUT_DEBIT' | 'ADJUSTMENT'`
- Add `WalletEntry` interface: `{ id, kind, amountVnd, balanceAfterVnd, referenceType, referenceId, description, createdAt }`

**`frontend/web-seller/src/app/[locale]/(authenticated)/payouts/page.tsx`**
- Add a new `<section>` "Escrow timeline" between the 3-card wallet and the existing Payout history
- Fetch entries in the same `useEffect` (parallel `Promise.all([wallet, payouts, entries])`)
- Table with columns: time · kind badge · description · amount (signed) · balance after
- KIND_BADGE colors:
  - `ORDER_CREDIT` → green (+)
  - `COMMISSION_DEBIT` → slate (-)
  - `REFUND_DEBIT` → red (-)
  - `PAYOUT_DEBIT` → blue (-)
  - `ADJUSTMENT` → amber
- Amount column renders signed (parens around negatives, plus prefix on credits)
- Empty state: "Chưa có giao dịch nào" / "No transactions yet"
- Show last 50 by default (matches backend pageSize)

### i18n keys (`vi.json` + `en.json` under `payouts` namespace)

```json
"timeline": "Lịch sử ví",                  // en: "Wallet ledger"
"timelineSubtitle": "Mọi giao dịch vào/ra ví theo thời gian", // en: "All wallet in/out by time"
"time": "Thời gian",                        // en: "Time"
"kind": "Loại",                             // en: "Type"
"balance": "Số dư sau",                     // en: "Balance after"
"emptyLedger": "Chưa có giao dịch nào",     // en: "No transactions yet"
"kindLabels": {
  "ORDER_CREDIT": "Cộng đơn hàng",          // en: "Order credit"
  "COMMISSION_DEBIT": "Trừ hoa hồng",       // en: "Commission"
  "REFUND_DEBIT": "Hoàn tiền",              // en: "Refund"
  "PAYOUT_DEBIT": "Rút về NH",              // en: "Bank payout"
  "ADJUSTMENT": "Điều chỉnh"               // en: "Adjustment"
}
```

### Tests

**`backend/payment-service/test/payouts-entries.controller.spec.ts` — NEW**
- 3 tests:
  1. Returns empty when seller has no wallet
  2. Returns paginated entries for the seller (newest first)
  3. Filters by `kind=REFUND_DEBIT` correctly
- Mock the Prisma calls in a similar style to `payouts.service.spec.ts`

No new frontend tests (web-seller has no test infrastructure; covered in S18).

## Files to modify

**Modified (backend):**
- `backend/payment-service/src/payouts/payouts.controller.ts` — add `GET entries` handler

**Modified (frontend):**
- `frontend/web-seller/src/lib/services/payouts.service.ts` — add `listEntries` + MOCK_ENTRIES
- `frontend/web-seller/src/lib/types.ts` — add `WalletEntry`, `WalletEntryKind`
- `frontend/web-seller/src/app/[locale]/(authenticated)/payouts/page.tsx` — add timeline section
- `frontend/web-seller/messages/vi.json` — add i18n keys
- `frontend/web-seller/messages/en.json` — add i18n keys

**Created:**
- `backend/payment-service/test/payouts-entries.controller.spec.ts` — 3 controller tests

**Created (this plan):**
- `care-nest/plans/261016-1300-phase-2-2-payouts-escrow-timeline-s17/plan.md`

## Verification

1. `pnpm --filter @carenest/payment-service test` — should pass (existing 30 + 3 new = 33)
2. `pnpm --filter @carenest/web-seller build` — page compiles, no TS errors
3. Manual: `GET /api/v1/seller/payouts/entries` with a JWT → returns paginated rows
4. Visual: open `/payouts` with mock data → "Escrow timeline" section shows below the 3 wallet cards, above Payout history
5. Filter by `kind=REFUND_DEBIT` (via URL query or future filter dropdown) shows only refunds

## Conventions

- YAGNI / KISS / DRY
- kebab-case, < 200 lines per file
- Use existing `formatVnd()` helper from the page (no new utility)
- Reuse existing badge classes (`badge-green` / `badge-red` / `badge-slate` / `badge-amber`); add `badge-blue` only if not present (check `globals.css` first — if missing, add with a sensible `--info` color)
- Conventional commit: `feat(web-seller): S17 escrow timeline on payouts page`

## Out of scope (deferred)

- Date range filter on the timeline (S18 with proper filter UI)
- Export to CSV (S18)
- Refund trigger UI (admin-only; S18 web-admin work)
- Real-time balance update via WebSocket (S18 observability)
