# Phase 01 — Foundation: Shared Types & Design Tokens

> **Wave**: 0 (Foundation — chạy trước tất cả)
> **Output**: 6 entity mới trong `@carenest/shared-types`, i18n messages scaffold (vi/en), design tokens snapshot, base api-client refactor
> **Gate**: G0 — Foundation review (lead phải duyệt trước khi wave 1 bắt đầu)

## Context Links

- `packages/shared-types/src/ids.ts` — branded ID convention
- `packages/shared-types/src/common.ts` — enums + pagination + audit timestamps
- `frontend/web-buyer/src/lib/api-client.ts` — existing thin fetch wrapper (sẽ refactor thành module per service)
- `frontend/web-buyer/src/app/globals.css` — design tokens (Teal/Indigo/Amber palette)
- Plan gốc: `plans/261015-1500-phase-2-2-frontend-s10-s11-s13/plan.md`

## Overview

- **Priority**: P0 (blocker cho toàn bộ wave 1+2+3)
- **Status**: Not started
- **Brief**: Thêm 6 entity Zod schemas + types + branded IDs mới vào shared-types (Plan, SubscriptionReminder, DeviceActivationCode, Shipment, Geofence, KycDocument, AuditEvent). Extract i18n messages vi/en vào `@carenest/shared-i18n` package mới (hoặc trong shared-types nếu muốn gọn). Snapshot design tokens để S11 reuse mà không duplicate CSS.

## Key Insights

- 4/7 entity mới đã có DTO tương ứng ở backend (Plan, ActivationCode, KycDocument, Shipment) — chỉ cần re-export schema từ backend hoặc duplicate (DRY nhưng tránh tight coupling → duplicate với comment "keep in sync").
- 3 entity còn lại (SubscriptionReminder, Geofence, AuditEvent) backend chưa có schema tương ứng — define spec trước, backend sẽ implement ở Phase 3 nếu cần.
- Branded IDs mới: `PlanId`, `SubscriptionId`, `ShipmentId`, `GeofenceId`, `CaregiverId`. KHÔNG dùng `string` thường.
- i18n: dùng `next-intl` (đã chuẩn Next 14 App Router). Route `[locale]/...`, default `vi`. KHÔNG dùng `next-i18next` (deprecated cho App Router).
- Design tokens: snapshot lại CSS variables vào JSON trong `shared-types` để S11 có thể generate Tailwind config / CSS variables. KHÔNG migrate sang Tailwind (YAGNI).

## Requirements

### Functional
- FR-2.0.1: 6 entity schemas với typecheck pass
- FR-2.0.2: Branded IDs mới có `as<Name>Id()` helper
- FR-2.0.3: i18n messages cho vi (default) + en, key theo module (`health.*`, `subscription.*`, `seller.*`, `admin.*`)
- FR-2.0.4: Design tokens JSON snapshot

### Non-functional
- File size < 200 LOC (project rule)
- Zero runtime cost: tất cả schemas tree-shakeable
- TypeScript strict mode pass
- Build output < 50KB (shared-types dist)

## Architecture

```
packages/shared-types/
├── src/
│   ├── ids.ts                          # MODIFY: thêm 5 branded IDs
│   ├── common.ts                       # unchanged
│   ├── enums/                          # NEW dir
│   │   ├── index.ts
│   │   ├── subscription.ts             # PlanInterval, SubStatus, ProrationMode
│   │   ├── shipping.ts                 # ShipmentStatus, CarrierCode
│   │   ├── notification.ts             # NotificationChannel (đã có), ReminderKind
│   │   └── geofence.ts                 # GeofenceShape, GeofenceEvent
│   ├── entities/                       # NEW (rỗng ở phase 0)
│   │   ├── index.ts
│   │   ├── plan.entity.ts              # NEW
│   │   ├── subscription.entity.ts      # NEW
│   │   ├── device-activation.entity.ts # NEW
│   │   ├── shipment.entity.ts          # NEW
│   │   ├── geofence.entity.ts          # NEW
│   │   ├── kyc-document.entity.ts      # NEW
│   │   └── audit-event.entity.ts       # NEW
│   ├── design-tokens/                  # NEW
│   │   ├── index.ts
│   │   └── tokens.ts                   # mirror of web-buyer globals.css
│   └── index.ts                        # MODIFY: export tất cả
└── test/
    ├── ids.spec.ts                     # MODIFY: thêm 5 ID test
    ├── plan.entity.spec.ts             # NEW
    ├── subscription.entity.spec.ts     # NEW
    ├── geofence.entity.spec.ts         # NEW
    └── design-tokens.spec.ts           # NEW (snapshot)
```

## Related Code Files

### Modify
- `packages/shared-types/src/ids.ts` — thêm `PlanId`, `SubscriptionId`, `ShipmentId`, `GeofenceId`, `CaregiverId` + schemas + helpers
- `packages/shared-types/src/index.ts` — export `./enums/index.js`, `./entities/index.js`, `./design-tokens/index.js`
- `packages/shared-types/test/ids.spec.ts` — thêm 5 test cho ID mới

### Create
- `packages/shared-types/src/enums/{subscription,shipping,notification,geofence}.ts` — 4 file, mỗi file < 50 LOC
- `packages/shared-types/src/enums/index.ts` — barrel
- `packages/shared-types/src/entities/plan.entity.ts` — `PlanSchema` + `Plan` type
- `packages/shared-types/src/entities/subscription.entity.ts` — `SubscriptionSchema`, `SubscriptionReminderSchema`, `ProrationPreviewSchema`
- `packages/shared-types/src/entities/device-activation.entity.ts` — `DeviceActivationCodeSchema`
- `packages/shared-types/src/entities/shipment.entity.ts` — `ShipmentSchema`
- `packages/shared-types/src/entities/geofence.entity.ts` — `GeofenceSchema` (polygon + circle)
- `packages/shared-types/src/entities/kyc-document.entity.ts` — `KycDocumentSchema` + `KycStatus`
- `packages/shared-types/src/entities/audit-event.entity.ts` — `AuditEventSchema` (subset of backend AuditEvent)
- `packages/shared-types/src/entities/index.ts` — barrel
- `packages/shared-types/src/design-tokens/tokens.ts` — `export const tokens = { ... }` mirror từ globals.css
- `packages/shared-types/src/design-tokens/index.ts` — barrel
- `packages/shared-types/test/plan.entity.spec.ts` — round-trip + invalid input
- `packages/shared-types/test/subscription.entity.spec.ts` — proration preview shape
- `packages/shared-types/test/geofence.entity.spec.ts` — polygon + circle validation
- `packages/shared-types/test/design-tokens.spec.ts` — JSON snapshot test

### Delete
- None

## Implementation Steps

1. **Tạo enums trước** (4 file trong `src/enums/`) — mỗi enum đều dùng `z.enum([...])`
2. **Tạo entities** (6 file trong `src/entities/`) — mỗi file 1 entity, dùng `AuditTimestampsSchema` từ `common.ts`
3. **Mở rộng `ids.ts`** — thêm 5 branded IDs + 5 schemas + 5 helpers
4. **Cập nhật `index.ts`** — export 3 module mới
5. **Design tokens** — copy CSS variable values từ `web-buyer/src/app/globals.css` vào `tokens.ts` dạng object literal (KHÔNG tự sinh)
6. **Test** — 4 file spec, mỗi file test happy-path + 1 invalid case
7. **Verify** — chạy `pnpm --filter @carenest/shared-types build type-check test` đến khi xanh

## Todo List

- [ ] Create enums files
- [ ] Create entity files
- [ ] Extend ids.ts
- [ ] Update index.ts
- [ ] Create design-tokens module
- [ ] Write 4 spec files
- [ ] Build + test pass
- [ ] Tag commit `chore(shared-types): add 6 entities + enums for phase 2.2`

## Success Criteria

- `pnpm --filter @carenest/shared-types build` exit 0
- `pnpm --filter @carenest/shared-types type-check` exit 0
- `pnpm --filter @carenest/shared-types test` ≥ 10 tests pass
- Tất cả 6 entity có thể import từ `@carenest/shared-types` mà không cần backend dependency
- 5 branded IDs mới compile-time chặn được mix (vd `asPlanId(userIdString)` = TS error)
- Design tokens JSON snapshot match với `globals.css` (test sẽ fail nếu drift)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema drift giữa frontend Zod và backend class-validator | Medium | High | Comment "keep in sync với backend/<svc>/dto/*.dto.ts" ở đầu mỗi file; CI fail nếu import thẳng từ backend (chỉ import types) |
| i18n key proliferation | Medium | Medium | Tổ chức theo module namespace: `health.dashboard.title`, `subscription.plans.basic.name` |
| Design tokens drift giữa apps | Low | Medium | Snapshot test + script copy từ web-buyer ban đầu (S11 chỉ import, không sửa) |

## Security Considerations

- Branded IDs là zero-trust compile-time guard — không bypass được
- Zod schemas default an toàn: mọi optional field phải explicit `.optional()` không dùng `any`
- `KycDocumentSchema` KHÔNG bao gồm `fileUrl` raw mà chỉ metadata (`type`, `expiresAt`) — fileUrl do backend trả về qua signed URL

## Next Steps

- Sau khi G0 pass → wave 1 (S10) bắt đầu dùng entity mới
- Backend không thay đổi trong wave này — nếu cần endpoint mới (e.g. notification preferences) sẽ là sub-task trong phase 02
