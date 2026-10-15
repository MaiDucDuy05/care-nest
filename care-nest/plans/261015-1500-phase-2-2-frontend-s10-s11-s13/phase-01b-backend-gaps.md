# Phase 01b — Backend Gaps for Phase 2.2 Frontend

> **Wave**: 0b (chạy song song với Phase 01 — Foundation)
> **Output**: 3 endpoint mới (notification preferences, push subscription, caregiver invite) + 1 Prisma model mới (`NotificationPreference` + `PushSubscription`) + JWT guards
> **Gate**: G0b — Backend review (cùng G0 của Phase 01)

## Context Links

- Phase 01 (foundation): `phase-01-shared-types-and-design-tokens.md`
- Plan: `plan.md`
- Existing notification controller: `backend/notification-service/src/notifications/notifications.controller.ts`
- Existing Caregiver model: `packages/database/prisma/schema.prisma` (line ~XX)
- Existing auth pattern: `backend/auth-service/src/auth/`
- Project rules: `.claude/rules/development-rules.md`

## Overview

- **Priority**: P0 (blocker cho Wave 1 S10)
- **Status**: Not started
- **Brief**: Thêm 3 endpoint mới mà frontend S10 cần nhưng backend chưa có. Thêm 2 Prisma model (`NotificationPreference`, `PushSubscription`) + run migration. Tất cả endpoint đều JWT-protected, RBAC theo role `USER` mặc định.

## Key Insights

- **Caregiver model đã có** — chỉ thiếu controller expose `POST /api/v1/caregivers` (invite), `GET /api/v1/caregivers/me` (list), `DELETE /api/v1/caregivers/:id` (revoke). User đã có relation `User → caregiverLinks Caregiver[]` (reverse).
- **Notification preferences** — cần model mới vì 1 user có 1 row preferences (4 channel toggle). Channel set: `EMAIL | PUSH | SMS | ZNS`. Mỗi channel có 4 loại event category: `ORDER | ALERT | SUBSCRIPTION | KYC`.
- **Push subscription** — cần model mới lưu VAPID subscription JSON từ browser. Endpoint nhận `endpoint`, `keys.p256dh`, `keys.auth` → store + associate với userId.
- **Authorization**: tất cả endpoint yêu cầu JWT, lấy userId từ token. Caregiver invite chỉ cho `USER` role; admin có thể override.
- **Idempotency**: `PushSubscription` có UNIQUE constraint trên `endpoint` — nếu user subscribe lại với cùng endpoint, update thay vì tạo mới.

## Requirements

### Functional
- FR-2.0.B1: `GET /api/v1/notifications/preferences` — trả về preferences hiện tại (default: tất cả ON nếu user chưa có row)
- FR-2.0.B2: `PATCH /api/v1/notifications/preferences` — update 1 hoặc nhiều channel toggle
- FR-2.0.B3: `POST /api/v1/push/subscriptions` — lưu VAPID subscription, dedupe theo endpoint
- FR-2.0.B4: `DELETE /api/v1/push/subscriptions` — xoá subscription theo endpoint (khi user unsubscribe)
- FR-2.0.B5: `POST /api/v1/caregivers` — invite caretaker bằng email + relationship + permissions JSON
- FR-2.0.B6: `GET /api/v1/caregivers/me` — list caregivers (accepted + pending)
- FR-2.0.B7: `DELETE /api/v1/caregivers/:id` — revoke (soft delete qua `revokedAt`)

### Non-functional
- Tất cả endpoint phản hồi trong < 200ms (P95)
- Tất cả endpoint có `JwtAuthGuard`
- Validation bằng Zod schemas
- Error format: `{ message: string, code: string, details?: any }`
- File size < 200 LOC mỗi file

## Architecture

### New Prisma models (thêm vào `schema.prisma`)

```prisma
model NotificationPreference {
  id        String   @id @default(dbgenerated("uuidv7()")) @db.Uuid
  userId    String   @unique @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // 4 channel x 4 category = 16 booleans. Lưu dạng JSON cho linh hoạt:
  // { order: { email: true, push: true, sms: false, zns: true }, alert: {...} }
  channels  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("notification_preferences")
}

model PushSubscription {
  id        String   @id @default(dbgenerated("uuidv7()")) @db.Uuid
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?  // optional, để debug
  createdAt DateTime @default(now())
  lastUsedAt DateTime @default(now())
  @@index([userId])
  @@map("push_subscriptions")
}
```

### User reverse relations (thêm vào User model)

```prisma
notificationPreference NotificationPreference?
pushSubscriptions      PushSubscription[]
```

### New service module (notification-service)

```
backend/notification-service/src/
├── preferences/
│   ├── preferences.controller.ts    # NEW (< 100 LOC)
│   ├── preferences.service.ts       # NEW (< 150 LOC)
│   ├── preferences.repository.ts    # NEW (< 100 LOC)
│   ├── preferences.module.ts        # NEW (< 30 LOC)
│   └── dto/preference.dto.ts        # NEW (< 80 LOC)
├── push-subscriptions/
│   ├── push-subscriptions.controller.ts  # NEW (< 100 LOC)
│   ├── push-subscriptions.service.ts     # NEW (< 120 LOC)
│   ├── push-subscriptions.repository.ts  # NEW (< 100 LOC)
│   ├── push-subscriptions.module.ts      # NEW (< 30 LOC)
│   └── dto/push-subscription.dto.ts      # NEW (< 80 LOC)
```

### New service module (device-service)

```
backend/device-service/src/
├── caregivers/
│   ├── caregivers.controller.ts     # NEW (< 120 LOC)
│   ├── caregivers.service.ts        # NEW (< 150 LOC)
│   ├── caregivers.repository.ts     # NEW (< 100 LOC)
│   ├── caregivers.module.ts         # NEW (< 30 LOC)
│   └── dto/caregiver.dto.ts         # NEW (< 80 LOC)
```

## Related Code Files

### Modify
- `packages/database/prisma/schema.prisma` — thêm 2 model + 2 User relation
- `backend/notification-service/src/app.module.ts` — import 2 module mới
- `backend/device-service/src/app.module.ts` — import CaregiversModule
- `backend/device-service/src/auth/current-user.decorator.ts` — kiểm tra pattern hiện tại (nếu chưa có thì tạo)

### Create
- `packages/database/prisma/migrations/20261015120000_add_notification_pref_and_push_sub/migration.sql` — auto-generated
- `backend/notification-service/src/preferences/` (5 files)
- `backend/notification-service/src/push-subscriptions/` (5 files)
- `backend/device-service/src/caregivers/` (5 files)
- `backend/notification-service/test/preferences.spec.ts` — 8 tests
- `backend/notification-service/test/push-subscriptions.spec.ts` — 6 tests
- `backend/device-service/test/caregivers.spec.ts` — 8 tests

### Delete
- None

## Implementation Steps

1. **Update Prisma schema** — thêm 2 model + User reverse relations
2. **Run migration** — `pnpm --filter @carenest/database prisma migrate dev --name add_notification_pref_and_push_sub`
3. **Rebuild database package** — `pnpm --filter @carenest/database build`
4. **Create preferences module** — controller + service + repository + DTO + module
5. **Create push-subscriptions module** — same structure
6. **Create caregivers module** in device-service
7. **Wire vào app.module** (2 service)
8. **Write tests** — 22 tests total (preferences 8 + push 6 + caregivers 8)
9. **Build + test** — `pnpm turbo run build type-check test --filter=@carenest/notification-service --filter=@carenest/device-service`
10. **Commit** — 2 commit tách biệt: schema migration + feature code

## Todo List

- [ ] Update Prisma schema (2 model + User relations)
- [ ] Run + verify migration
- [ ] Create notification-service preferences module (5 files)
- [ ] Create notification-service push-subscriptions module (5 files)
- [ ] Create device-service caregivers module (5 files)
- [ ] Wire modules vào app.module (2 files)
- [ ] Write 3 spec files (22 tests)
- [ ] Build + type-check + test pass
- [ ] Commit `feat(notification): add preferences + push subscription endpoints`
- [ ] Commit `feat(device): add caregivers invite/list/revoke endpoints`

## Success Criteria

- `pnpm turbo run build type-check test --filter=@carenest/notification-service --filter=@carenest/device-service` → 0 errors, 0 failures
- 22 new tests pass
- 7 endpoint mới tất cả phản hồi đúng format
- Migration apply được trên clean database
- `prisma migrate diff` không còn drift
- No secrets in tracked files

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration conflict với branch khác | Low | High | Commit riêng schema + feature để rollback dễ |
| Caregiver model đã có quan hệ ngược với User | Medium | Low | Verify User model có `careLinks Caregiver[]`; nếu thiếu thì thêm |
| Push subscription dedupe sai | Medium | Medium | UNIQUE constraint trên `endpoint`; `upsert` thay vì `create` |
| VAPID auth secret lộ | Low | High | Endpoint + keys lưu DB không cần encrypt (public), chỉ VAPID private key mới secret |

## Security Considerations

- Tất cả endpoint require `JwtAuthGuard` — không có anonymous access
- `POST /api/v1/caregivers` rate-limit 10 req/hour/user (TODO: thêm `@nestjs/throttler` nếu chưa có)
- `p256dh` + `auth` keys lưu plain text trong DB (chúng là public keys, encrypt vô nghĩa)
- Email invitation: chỉ store, KHÔNG gửi email thật (Phase 3 sẽ wire SMTP)
- Soft delete qua `revokedAt` cho Caregiver — không xoá cứng
- `NotificationPreference.channels` là JSON — validate schema strict qua Zod (không cho phép extra keys)

## Next Steps

- Sau khi G0b pass → Wave 0a (Phase 01 shared-types) đã xong → Wave 1 (S10) bắt đầu
- Phase 3 có thể thêm: throttler, email SMTP, FCM migration (nếu Android native shell cần)
