# @carenest/shared-types

Cross-cutting TypeScript types and Zod schemas used by every service in the
CareNest monorepo.

## What lives here

- Branded ID types (`UserId`, `OrderId`, …) and their Zod schemas
- Common DTOs (pagination, audit timestamps, payment/order/alert enums)
- Vietnam-specific input validation (VN phone numbers)

## What does NOT live here

- Domain entities that are owned by one service — those live in that service's
  Prisma schema and re-exported as a DTO only when crossing a service boundary.
- Vendor-specific types (Wonlex packets → `@carenest/iot-codec`).
