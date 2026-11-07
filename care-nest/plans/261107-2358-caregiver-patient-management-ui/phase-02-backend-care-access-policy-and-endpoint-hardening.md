# Phase 02 — Backend: Shared Care-Access Policy + Endpoint Hardening

## Context Links
- [plan.md](plan.md), [phase-01](phase-01-backend-invite-consent-flow-and-resend-notification.md)
- `packages/database/src/index.ts`
- `backend/device-service/src/devices/devices.controller.ts` (lines ~31-57: `GET /`, `:id/telemetry/latest`, `:id/telemetry`, `:id` — no guard)
- `backend/device-service/src/assignments/*` (DeviceAssignment = owner link)
- `backend/alert-service/src/alerts/alerts.controller.ts` (`GET /alerts?subjectId` unchecked, `GET /alerts/admin` no role check)
- `backend/alert-service/src/realtime/realtime.gateway.ts` (`broadcastToSubject` emits only to `user:{subjectId}`)

## Overview
- Priority: P1 (security) | Status: pending | Effort: 5h
- Single reusable policy: "caller is subject, OR accepted caregiver of subject with permission X". Apply to devices, telemetry, alerts, realtime.

## Key Insights
- device-service + alert-service both depend on `@carenest/database` (shared Prisma DB) -> put helper there, DRY, no HTTP hop.
- Permissions JSON `{viewHealth, receiveAlerts, manageDevices}` stored, never read. Map: telemetry/vitals/device detail -> `viewHealth`; alerts list/ack + realtime alerts -> `receiveAlerts`; device config/assign/geofence writes -> `manageDevices`.
- Realtime alerts currently never reach caregivers (only `user:{subjectId}` room). Fan-out needed or caregiver UI shows stale alert counts.
- Device -> subject resolution: active `DeviceAssignment` for deviceId.
- **Vitals realtime socket audited — confirmed dead code, not a live vulnerability.** `use-realtime-vitals.ts` connects to the SAME socket as alerts (`alert-service` `RealtimeGateway`, path `/alerts`) and emits `socket.emit('join', { room: 'subject:'+userId })`, but `realtime.gateway.ts` has **no `'join'` event handler at all** — the join is a no-op. No backend code anywhere ever emits `vitals:update` (grepped the whole repo). So there is currently no live vitals-room-join authorization gap to patch, because the feature itself doesn't broadcast anything; the dashboard's vitals display works purely via the REST poll (`GET /devices/:id/telemetry/latest`), which step 4 already guards. **Decision: do not build a working vitals-room broadcast in this phase** (out of scope — it's a separate, larger feature: implementing real vitals push). Just leave a one-line TODO comment in `realtime.gateway.ts` noting the dead `join` path for whoever picks that up later.

## Requirements
Functional
- `assertCareAccess(prisma, callerId, subjectId, perm)` -> resolves if caller===subject, or accepted non-revoked link with `permissions[perm] !== false`; else throws `CareAccessDeniedError` (mapped to 403). ADMIN role bypass handled by callers.
- `resolveDeviceSubject(prisma, deviceId)` -> userId of active assignment (or null).
- `listCaregiverIdsFor(prisma, subjectId, perm)` -> caretaker ids (for realtime fan-out).
- device-service: `JwtAuthGuard` + viewHealth check on `GET devices/:id`, `/telemetry`, `/telemetry/latest`. `GET /devices` (list all) -> ADMIN only.
- alert-service: `GET /alerts?subjectId` -> receiveAlerts check; status update endpoints (ack/resolve) -> check on alert.subjectId; `GET /alerts/admin` -> ADMIN only.
- Realtime: `broadcastToSubject` also emits to `user:{caretakerId}` for each caregiver with receiveAlerts.
Non-functional: helper pure functions (no Nest dependency), < 80 lines; one indexed query per check.

## Architecture
```
packages/database/src/care-access.ts  (assertCareAccess, resolveDeviceSubject, listCaregiverIdsFor)
     ^                                   ^
device-service CareAccessService      alert-service AlertsService / RealtimeGateway
 (thin Nest wrapper -> ForbiddenException)
```

## Related Code Files
Create
- `packages/database/src/care-access.ts`
- `backend/device-service/src/caregivers/care-access.service.ts` (Nest wrapper, exported from CaregiversModule)
Modify
- `packages/database/src/index.ts` (export)
- `backend/device-service/src/devices/devices.controller.ts`, `devices.module.ts`
- `backend/device-service/src/geofence/geofence.controller.ts` (only if phase 08 read path is done; else untouched)
- `backend/alert-service/src/alerts/alerts.controller.ts`, `alerts.service.ts`
- `backend/alert-service/src/realtime/realtime.gateway.ts`

## Implementation Steps
1. Write `care-access.ts`; parse permissions defensively (`typeof p === 'object' ? p : {}`). **Decision (confirmed): missing/empty permissions = full access** — `perm in p ? p[perm] === true : true`. Rationale: every pre-existing `Caregiver` row was created under the old auto-accept flow which always set all three permissions true; treating an empty/legacy object as "allow" preserves existing caregivers' access instead of silently revoking it. Document this rule in a code comment on the function.
2. Rebuild `@carenest/database` (`pnpm --filter @carenest/database build`).
3. device-service: `CareAccessService.assertDeviceAccess(user, deviceId, 'viewHealth')` -> resolve subject, 404 if none and caller not admin, then assert.
4. Apply guard + check to the 3 device read routes; restrict `GET /devices` to ADMIN.
5. alert-service controller: when `subjectId` given & != user.id & not ADMIN -> assert receiveAlerts. Same for status-update routes using alert.subjectId.
6. `broadcastToSubject`: fetch caregiver ids (cache 60s in-memory Map to avoid DB per alert), emit to each room.
7. Grep internal callers: `grep -rn "telemetry/latest\|/devices/" backend frontend` — ensure each sends JWT (api-gateway forwards Authorization; iot-gateway uses Kafka, not REST — confirm).
8. Add a short `// TODO(vitals-realtime):` comment above the unused `'join'`-less connection handler in `realtime.gateway.ts` noting that `vitals:update` is never emitted and the client's `join {room}` event has no handler — out of scope here, flagged for a future realtime-vitals phase.
9. Compile both services.

## Todo List
- [ ] care-access helper + export + build
- [ ] device-service wrapper service
- [ ] guard device detail/telemetry; admin-only device list
- [ ] alerts subjectId + status update checks; admin route role check
- [ ] realtime alert fan-out to caregivers
- [ ] TODO comment on dead vitals `join` handler (confirmed no live gap; documented for later)
- [ ] internal caller audit

## Success Criteria
- Unauthenticated `GET /devices/:id/telemetry/latest` -> 401; stranger JWT -> 403; owner + accepted caregiver (viewHealth) -> 200; caregiver with viewHealth=false -> 403.
- `GET /alerts?subjectId=X` by non-caregiver -> 403.
- SOS alert for patient X pushes socket `alert` event to caregiver's browser.

## Risk Assessment
- Breaking hidden consumers (web-admin, seller app) of now-guarded routes -> step 7 audit; admin bypass.
- Cache staleness after revoke (<=60s alert leakage) -> invalidate on revoke not possible cross-service; **accepted tradeoff (confirmed)** — 60s TTL is fine, document in code comment.

## Security Considerations
- 403 vs 404: return 404 for unknown device, 403 for known-but-forbidden (acceptable; IDs are UUIDs).
- Never trust `subjectId` from client without assert. ADMIN check uses JWT role claim only.

## Next Steps
- Phase 03 reuses helper for summary; frontend phases rely on 403 handling.
