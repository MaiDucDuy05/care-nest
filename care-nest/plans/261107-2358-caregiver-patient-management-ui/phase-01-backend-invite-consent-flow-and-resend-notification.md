# Phase 01 — Backend: Consent Invite Flow + Resend Notification

## Context Links
- [plan.md](plan.md)
- `backend/device-service/src/caregivers/caregivers.{controller,service,repository}.ts`, `dto/caregiver.dto.ts`
- `backend/notification-service/src/kafka/{notification.consumer.ts,notification-event.publisher.ts}` (contract `NotificationRequestEvent`)
- `backend/notification-service/src/templates/templates.ts`
- `packages/shared-config/src/constants.ts` (`KAFKA_TOPICS.NOTIFICATION_REQUESTS = 'notification.requests'`)

## Overview
- Priority: P1 | Status: pending | Effort: 4.5h
- Remove auto-accept; add real accept/decline by the invited caretaker; make resend actually notify.

## Key Insights
- `caregivers.repository.ts` `create()` sets `acceptedAt: new Date()` (lines ~34, ~42) — comment says "sandbox/demo". This is the root of vestigial PENDING UI.
- notification-service already consumes `notification.requests` with idempotency dedupe, dispatcher picks channel (push/email/ZNS/SMS). device-service already depends on `@carenest/shared-kafka`. So resend = publish one event. No email code in device-service.
- Unique [userId, caretakerId]: re-invite after revoke must reset `revokedAt=null, acceptedAt=null, invitedAt=now` (upsert), not create.

## Requirements
Functional
- POST /caregivers: creates link with `acceptedAt=null`; publishes `caregiver.invite` notification to caretaker (if caretaker user exists; if email has no account -> 404/422 as today, keep current behavior).
- GET /caregivers/invitations: pending invites addressed to me (`caretakerId=me, acceptedAt=null, revokedAt=null`), include inviter name/email, relationship, permissions.
- POST /caregivers/:id/accept: only caller == caretakerId; sets `acceptedAt`. Idempotent.
- POST /caregivers/:id/decline: only caretaker; sets `revokedAt` (reuse revoke column, no schema change).
- DELETE /caregivers/:id: patient (userId) or caretaker may revoke.
- PATCH /caregivers/:id/permissions: patient (userId) only, link must be accepted and not revoked; body `{ permissions: { viewHealth, receiveAlerts, manageDevices } }` (zod, all 3 required booleans — no partial merge, avoids ambiguous "unset" semantics); overwrites `permissions` JSON in place, no new invite/accept cycle. (Decision: patients can edit an existing caregiver's permissions directly, not just revoke+re-invite.)
- POST /caregivers/:id/resend: only patient (userId), only if pending; rate-limit 1 per 5 min via `invitedAt` timestamp check; republish event with idempotencyKey `caregiver-invite:{id}:{invitedAt}`.
- GET /caregivers/patients: return accepted+not-revoked only.
- Plan `caregiverLimit` counts pending + accepted (prevents invite spam bypassing quota).
Non-functional: no Prisma schema migration; Kafka publish failure must not fail invite (log + return `notificationQueued:false`).

## Architecture
```
Patient UI -> POST /caregivers -> repo.upsert(pending) -> CaregiverInvitePublisher -> Kafka notification.requests
                                                                         -> notification-service -> dispatcher -> push/email
Caretaker UI -> GET /caregivers/invitations -> POST /:id/accept | /:id/decline
```

## Related Code Files
Modify
- `backend/device-service/src/caregivers/caregivers.repository.ts` (remove auto-accept, upsert re-invite, `findPendingForCaretaker`, `decline`)
- `backend/device-service/src/caregivers/caregivers.service.ts` (ownership checks, resend logic, limit counting)
- `backend/device-service/src/caregivers/caregivers.controller.ts` (`GET invitations`, `POST :id/decline`, `PATCH :id/permissions`; route order: `invitations`/`patients`/`me` before `:id`)
- `backend/device-service/src/caregivers/caregivers.module.ts` (provide publisher)
- `backend/notification-service/src/templates/templates.ts` (add `caregiver.invite` vi template: "{{inviterName}} moi ban lam nguoi cham soc ({{relationship}})" + link `/health/patients`)
Create
- `backend/device-service/src/caregivers/caregiver-invite-notification.publisher.ts` (TypedProducer wrapper, mirrors `notification-event.publisher.ts` pattern, best-effort when `KAFKA_BROKERS` unset)

## Implementation Steps
1. Repository: drop `acceptedAt: new Date()` in create; implement upsert on [userId, caretakerId] resetting `revokedAt/acceptedAt`, `invitedAt=now`.
2. Add `findPendingForCaretaker(caretakerId)` incl. `user {id, fullName, email}`.
3. `findPatientsForCaretaker`: add `acceptedAt: { not: null }, revokedAt: null`.
4. Service `accept/decline`: load link; 404 if missing; 403 if `caretakerId !== caller`; 409 if revoked.
5. Service `revoke`: allow caller ∈ {userId, caretakerId}.
5b. Service `updatePermissions`: 403 unless caller==userId; 404 if missing; 409 if not accepted or revoked; validate all 3 keys present (zod) then overwrite `permissions`.
6. Service `resend`: 403 unless caller==userId; 409 if accepted/revoked; 429 if `now - invitedAt < 5min`; update `invitedAt`; publish.
7. Create publisher; call after create + resend; wrap in try/catch.
8. Add template `caregiver.invite` to templates map + type union.
9. Compile: `pnpm --filter device-service build`, `pnpm --filter notification-service build`.

## Todo List
- [ ] Remove auto-accept + upsert re-invite
- [ ] invitations endpoint
- [ ] accept/decline ownership checks
- [ ] revoke by either party
- [ ] PATCH :id/permissions (patient-only edit of existing caregiver's permissions)
- [ ] resend with throttle + Kafka publish
- [ ] `caregiver.invite` template
- [ ] limit counts pending
- [ ] builds pass

## Success Criteria
- New invite returns `acceptedAt:null`; invitee sees it in `/invitations`; patient not visible in `/patients` until accept.
- Resend produces a message on `notification.requests` (verify via kafka console consumer / notification-service log).
- Non-invitee accepting -> 403.

## Risk Assessment
- Existing demo seeds rely on auto-accept -> update `packages/database/src/seed.ts` to set `acceptedAt` explicitly for seeded links.
- Notification template rendering for unknown channel prefs — dispatcher falls back; verify a user with no push sub still gets email.

## Security Considerations
- Invite response must not leak whether arbitrary email exists beyond current behavior.
- Idempotency key prevents duplicate sends on Kafka replay; throttle prevents spam.

## Next Steps
- Phase 02 uses accepted-only semantics in `assertCareAccess`.
