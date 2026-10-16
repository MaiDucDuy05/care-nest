# Phase 04 — Escrow release + Payout worker

**Priority:** P1
**Status:** pending
**Effort:** ~2 hours

## Context

The payment-service has an EscrowService that holds funds in Redis with
a 7-day TTL (`backend/payment-service/src/escrow/escrow.service.ts`).
After the TTL elapses, the comment says "A background cron (Phase 2)
will move released funds to the seller ledger."

S12 implements that background worker. It runs every 5 minutes, scans
for expired escrow holds, and:

1. Computes the seller's share (gross − platform commission).
2. Credits the seller's `SellerWallet` (creates a `WalletEntry` of
   `ORDER_CREDIT`, plus a `COMMISSION_DEBIT` for the platform cut).
3. Creates a `Payout` record (PENDING) for the seller's net amount.
4. Marks the IMEIs as `SHIPPED` if not already (defensive — order-service
   should have done it).

## Worker design

A new module inside payment-service:

```
backend/payment-service/src/payouts/
├── payouts.module.ts
├── payouts.service.ts
├── payouts.repository.ts
├── escrow-release.worker.ts    # @Cron('*/5 * * * *')
├── payout-executor.service.ts  # moves PENDING → PROCESSING → PAID
└── test/
    ├── payouts.service.spec.ts
    └── escrow-release.worker.spec.ts
```

Uses `@nestjs/schedule` (already a transitive of `@nestjs/common`'s
ecosystem, may need explicit install).

## State transitions

| State | Trigger | Action |
|-------|---------|--------|
| `PENDING` | Worker creates it | net amount ready for transfer |
| `PROCESSING` | `payout-executor.service` picks it up | bank API call in flight |
| `PAID` | Bank confirms | `WalletEntry` PAYOUT_DEBIT, `WalletEntry` balance snapshot |
| `FAILED` | Bank rejects | retry up to 3x then mark FAILED, keep available in wallet |
| `REVERSED` | Manual admin action | refund to buyer (links to a refund Payment) |

## Wallet operations (pseudocode)

```ts
async function creditOrderToWallet(order: Order, seller: Seller) {
  const gross = order.totalVnd;
  const commission = Math.round(gross * Number(seller.commissionRate));
  const net = gross - commission;

  return prisma.$transaction(async (tx) => {
    // 1. Lock the wallet row
    const wallet = await tx.sellerWallet.findUnique({ where: { sellerId: seller.id } });
    if (!wallet) throw new Error('wallet missing');

    // 2. Credit gross
    const afterCredit = Number(wallet.pendingVnd) + gross;
    await tx.sellerWallet.update({
      where: { id: wallet.id },
      data: { pendingVnd: afterCredit },
    });
    await tx.walletEntry.create({
      data: {
        walletId: wallet.id,
        kind: 'ORDER_CREDIT',
        amountVnd: gross,
        balanceAfterVnd: afterCredit,
        referenceType: 'order',
        referenceId: order.id,
        description: `Order ${order.orderNumber}`,
      },
    });

    // 3. Debit commission
    const afterCommission = afterCredit - commission;
    await tx.sellerWallet.update({
      where: { id: wallet.id },
      data: { pendingVnd: afterCommission },
    });
    await tx.walletEntry.create({
      data: {
        walletId: wallet.id,
        kind: 'COMMISSION_DEBIT',
        amountVnd: -commission,
        balanceAfterVnd: afterCommission,
        referenceType: 'order',
        referenceId: order.id,
        description: `Commission @ ${seller.commissionRate} for ${order.orderNumber}`,
      },
    });

    // 4. Move pending → balance (the escrow has just released)
    await tx.sellerWallet.update({
      where: { id: wallet.id },
      data: {
        balanceVnd: { increment: net },
        pendingVnd: { decrement: net },
        lifetimeVnd: { increment: gross },
      },
    });

    // 5. Create payout
    return tx.payout.create({
      data: {
        sellerId: seller.id,
        walletId: wallet.id,
        amountVnd: net,
        status: 'PENDING',
        bankName: seller.bankName,
        bankAccount: seller.bankAccount,
        bankAccountName: seller.bankAccountName,
      },
    });
  });
}
```

## Idempotency

The worker uses a Redis lock per orderId so concurrent runs cannot
double-credit. The lock key: `wallet-credit:order:${orderId}`. Lock TTL:
60 seconds.

## Files

- **Create:** all files in `backend/payment-service/src/payouts/`
- **Modify:** `backend/payment-service/src/app.module.ts` (import PayoutsModule)
- **Modify:** `backend/payment-service/package.json` (add `@nestjs/schedule`)
- **Modify:** `backend/payment-service/src/escrow/escrow.service.ts` (add `findExpiredHolds()` to support worker scan)

## Tests

- `payouts.service.spec.ts`:
  - credit creates correct entries and updates balance correctly
  - concurrent credit attempts → second one skipped via lock
  - zero-commission seller (commissionRate=0) creates 0 commission entry (or skips it)
  - commission > gross → throws (defensive)
- `escrow-release.worker.spec.ts`:
  - worker skips already-credited orders
  - worker handles DB error gracefully (logs, continues)

## Success criteria

- A test can simulate "escrow expired" and assert the seller's wallet
  balance increases correctly with proper WalletEntry rows
- Worker runs without throwing on a fresh DB (no expired escrows → no-op)
- `pnpm --filter @carenest/payment-service test` passes
