# Phase 02 — IMEI service: bulk import, allocate, Luhn validation

**Priority:** P0
**Status:** pending
**Effort:** ~2 hours

## Context

Sellers register IMEIs in bulk (the web-seller "Quét IMEI" page already
posts `inventoryService.add(imei, productId)`). The catalog-service
already owns the Product + Seller domain, so the IMEI module lives there
in a new `src/imei/` folder. The Inventory table stays quantity-based —
IMEIs are a parallel concern (one Product can have both a quantity stock
counter and a list of IMEI records).

## Module structure

```
backend/catalog-service/src/imei/
├── imei.module.ts
├── imei.controller.ts        # /api/v1/seller/imeis endpoints
├── imei.service.ts
├── imei.repository.ts
├── dto/
│   └── imei.dto.ts           # Zod schemas: BulkImportImei, AllocateImei, ReleaseImei
└── test/
    ├── luhn.spec.ts          # pure unit test for the Luhn check
    └── imei.service.spec.ts  # service tests with in-memory mock repo
```

## API surface

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/v1/seller/imeis/bulk` | SELLER | Import N IMEIs for a product. Body: `{ productId, imeis: string[] }`. Response: `{ imported, duplicates, invalid }` |
| `GET` | `/api/v1/seller/imeis` | SELLER | List (paginated, filter by status / productId) |
| `POST` | `/api/v1/seller/imeis/allocate` | SELLER | Reserve IMEIs to an order. Body: `{ orderId, orderItemId, imeis: string[] }`. Only IN_STOCK → RESERVED. |
| `POST` | `/api/v1/seller/imeis/release` | SELLER | Reverse an allocation. RESERVED → IN_STOCK. |
| `POST` | `/api/v1/seller/imeis/:id/ship` | SELLER | Mark as SHIPPED. Caller must be the seller, the IMEI must be RESERVED, and the order must be in PACKING. |

## Luhn validation

IMEI-15 uses a custom Luhn (LUHN-15 with a `0` parity bit at the end).
The check function lives in `imei.service.ts`:

```ts
function isValidImei(s: string): boolean {
  if (!/^\d{15}$/.test(s)) return false;
  // Standard Luhn over 14 digits, then compare against check digit.
  const digits = s.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = digits[i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[14];
}
```

## Concurrency

- Bulk import: use a `INSERT ... ON CONFLICT DO NOTHING` pattern via
  Prisma raw SQL for the unique-IMEI constraint. The service returns
  `{ imported, duplicates, invalid }` so the seller UI can prompt the
  user about conflicts.
- Allocate: wrap in `withLock('imei-allocate:' + orderId, ...)` to prevent
  two concurrent allocations racing for the same IMEIs.
- Ship: similar lock by orderId.

## Files

- **Create:** all files in `backend/catalog-service/src/imei/`
- **Modify:** `backend/catalog-service/src/app.module.ts` (import ImeiModule)
- **Modify:** `backend/catalog-service/src/auth/jwt-auth.guard.ts` if needed (existing guard likely supports SELLER role already)
- **Modify:** `web-seller/src/lib/services/inventory.service.ts` (point URL at real backend, not mock)
- **Modify:** `web-seller/src/lib/services/products.service.ts` if needed

## Tests

- `luhn.spec.ts` — 20+ test vectors including known-valid (`352099001761481`)
  and known-invalid IMEIs
- `imei.service.spec.ts` — covers:
  - bulk import happy path
  - bulk import with duplicates
  - bulk import with invalid Luhn
  - allocate only IN_STOCK records
  - allocate races (sequential in test)
  - release flow
  - ship flow validates order status

## Success criteria

- All endpoints respond 2xx for valid input, 4xx for invalid
- Luhn check rejects known-bad IMEIs
- Bulk import is idempotent (re-running same batch returns 0 imported, N duplicates)
- Tests pass: `pnpm --filter @carenest/catalog-service test`
- Lint + type-check pass for catalog-service
