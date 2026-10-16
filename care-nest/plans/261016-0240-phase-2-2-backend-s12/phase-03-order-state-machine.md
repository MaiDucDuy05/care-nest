# Phase 03 — Order state machine: PACKING/SHIPPED with IMEI requirement

**Priority:** P0
**Status:** pending
**Effort:** ~1.5 hours

## Context

The order-service already has a complete state machine at
`backend/order-service/src/state-machine/order-state.ts`:

```
CREATED → CONFIRMED → PACKING → SHIPPED → DELIVERED → RETURNED
   ↓          ↓         ↓
CANCELLED  CANCELLED  CANCELLED
```

CONFIRMED → PACKING is already allowed. S12 adds two new guards:

1. **PACKING → SHIPPED** requires that every OrderItem that has a
   `requiresImei` flag has an `ImeiRecord` with `status=SHIPPED`
   referencing it.
2. **PACKING** transition triggers an `ImeiRecord.ship()` call internally
   (not a separate endpoint).

## Required changes

### Product flag

Add a `requiresImei Boolean @default(true)` to the `Product` model in
Prisma schema. The web-seller product-create form gets a checkbox.

### Order-service guards

In `backend/order-service/src/orders/orders.service.ts`, wrap
`updateStatus` to:

```ts
async updateStatus(userId: string, orderId: string, next: OrderStatus, reason?: string) {
  const order = await this.ordersRepository.findById(orderId);
  if (!order) throw new NotFoundException();
  assertTransition(order.status, next);

  if (next === OrderStatus.SHIPPED) {
    // Guard: every IMEI-required item must have SHIPPED IMEIs.
    const imeisByItem = await this.imeiRepository.listByOrder(orderId);
    const missing: string[] = [];
    for (const item of order.items) {
      if (item.product.requiresImei) {
        const count = imeisByItem.filter(
          (i) => i.orderItemId === item.id && i.status === ImeiStatus.SHIPPED
        ).length;
        if (count < item.quantity) {
          missing.push(`${item.product.name}: ${count}/${item.quantity} IMEI`);
        }
      }
    }
    if (missing.length > 0) {
      throw new BadRequestException(
        `Không thể SHIPPED: thiếu IMEI — ${missing.join('; ')}`
      );
    }
  }
  // ...
}
```

### Cross-service call

The order-service needs to read `ImeiRecord` rows. Two options:

**Option A** — direct DB access. The order-service's Prisma client can
read the `imei_records` table because both services share the same DB.
Pros: no network hop, no extra latency. Cons: bypasses service boundary.

**Option B** — call catalog-service's `/api/v1/seller/imeis?orderId=...`
endpoint via HTTP. Pros: respects the service boundary. Cons: network hop,
auth token propagation.

**S12 picks A** for performance. Service-boundary concerns are noted in
the FSD as "to be revisited in Phase 3 (BFF / gRPC)".

### Kafka event

When the order transitions to SHIPPED, the existing
`OrderEventPublisher.publish(ORDER_SHIPPED, ...)` already fires. S12
augments the payload:

```ts
interface OrderShippedEvent {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  imeis: { imei: string; productId: string; orderItemId: string }[];
}
```

The notification-service consumer (already wired to ORDER_SHIPPED) can
then send the IMEIs to the buyer in the shipping confirmation.

## Files

- **Modify:** `packages/database/prisma/schema.prisma` (add `Product.requiresImei`)
- **Modify:** `packages/database/prisma/migrations/20260102000000_s12_imei_payout/migration.sql` (ALTER TABLE products ADD COLUMN requires_imei BOOLEAN NOT NULL DEFAULT TRUE)
- **Modify:** `backend/order-service/src/orders/orders.service.ts` (add IMEI guard, augment event)
- **Modify:** `backend/order-service/src/kafka/order-event.publisher.ts` (extend event interface)
- **Modify:** `backend/catalog-service/src/products/dto/product.dto.ts` (add `requiresImei` to Zod schema)
- **Modify:** `web-seller/src/lib/services/products.service.ts` (send new field)
- **Modify:** `web-seller/src/app/[locale]/(authenticated)/products/new/page.tsx` (add checkbox)
- **Modify:** `web-seller/src/app/[locale]/(authenticated)/products/[id]/edit/page.tsx` (same)

## Tests

- `orders.service.spec.ts` new test cases:
  - SHIPPED blocked when IMEI required but missing
  - SHIPPED blocked when IMEI count < quantity
  - SHIPPED succeeds when all IMEIs allocated and reserved
  - PACKING still works (no IMEI requirement at this transition)
- `order-state.spec.ts` — unchanged (transitions themselves don't change)

## Success criteria

- `pnpm --filter @carenest/order-service test` passes
- A SHIPPED attempt with missing IMEIs returns 400 with a useful message
- The augmented `ORDER_SHIPPED` event payload is documented in FSD
