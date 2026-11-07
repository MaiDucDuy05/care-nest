# Phase 05 — Frontend: Dashboard Patient Context + Alerts Scoping Fix

## Context Links
- [plan.md](plan.md), [phase-04](phase-04-frontend-my-patients-overview-and-invitations.md)
- `frontend/web-buyer/src/app/[locale]/health/dashboard/page.tsx` (470 lines — over 200-line rule)
- `frontend/web-buyer/src/services/alerts.service.ts` (`listAlerts`)
- `frontend/web-buyer/src/components/health/alerts-list.tsx`

## Overview
- Priority: P1 (confirmed bug) | Status: pending | Effort: 4h
- Dashboard: read `?patientId&deviceId` deep-link, scope alerts to selected subject, respect permission masks, split oversized page.

## Key Insights
- Bug: Alerts panel calls `alertsService.listAlerts({ limit: 10 })` without `subjectId` -> always own alerts even in caregiver mode.
- Selected-device state already exists (merged own devices + `getPatients()` devices). Each device entry must carry `subjectId` (owner userId) + `permissions` to drive scoping/masking.
- With phase 02, caregiver lacking viewHealth gets 403 on telemetry — UI must show a "no permission" panel, not error-loop.

## Requirements
Functional
- On mount: if `?deviceId` present and in list -> select; else if `?patientId` -> first device of that patient; else current default.
- Switching device updates URL (`router.replace`, shallow) so refresh/back keep context.
- Alerts: `listAlerts({ subjectId: selected.subjectId, limit: 10 })` and refetch on switch; realtime `alert` events filtered by `subjectId === selected.subjectId`.
- Masking: viewHealth=false -> hide vitals grid/map with notice; receiveAlerts=false -> hide alerts panel with notice.
- Caregiver banner adds link "Ve danh sach benh nhan" -> `/health/patients`.
Non-functional: split page into files < 200 lines each; no behavior regression for patient's own view.

## Architecture
```
dashboard/page.tsx (layout + composition, <150 lines)
 ├─ components/health/use-dashboard-device-selection.ts  (merge own+patient devices, URL sync, selected subject/perms)
 ├─ components/health/use-device-vitals-stream.ts        (latest vitals fetch + socket, extracted as-is)
 ├─ components/health/dashboard-patient-switcher.tsx     (dropdown + caregiver banner)
 └─ components/health/alerts-list.tsx                    (accepts subjectId prop or alerts array)
```

## Related Code Files
Modify
- `frontend/web-buyer/src/app/[locale]/health/dashboard/page.tsx`
- `frontend/web-buyer/src/services/alerts.service.ts` (ensure `subjectId` param supported and serialized)
- `frontend/web-buyer/src/components/health/alerts-list.tsx` (if fetch lives there)
Create
- `frontend/web-buyer/src/components/health/use-dashboard-device-selection.ts`
- `frontend/web-buyer/src/components/health/use-device-vitals-stream.ts`
- `frontend/web-buyer/src/components/health/dashboard-patient-switcher.tsx`

## Implementation Steps
1. Read page fully; extract selection logic (lines ~60-150) into `use-dashboard-device-selection` returning `{ devices, selected, select, isCaregiverMode }` where each item `{ deviceId, subjectId, subjectName, permissions, isOwn }`.
2. Extract vitals fetch + socket into `use-device-vitals-stream(deviceId, enabled)`; handle 403 -> `forbidden` state.
3. Extract switcher + banner component.
4. Fix alerts call with `subjectId`; add dependency on selected subject; filter realtime events.
5. Add `useSearchParams` deep-link + `router.replace` sync (wrap in Suspense if Next requires).
6. Permission-masked notices.
7. `tsc --noEmit` + manual run both modes.

## Todo List
- [ ] extract device selection hook (+subjectId/perms)
- [ ] extract vitals stream hook (+403 state)
- [ ] extract switcher/banner
- [ ] alerts scoped to subject (fetch + realtime)
- [ ] URL deep-link sync
- [ ] permission masking notices
- [ ] page < 200 lines, build passes

## Success Criteria
- Switch to patient B -> alerts panel shows only B's alerts; switching back shows own.
- `/health/dashboard?patientId=B` opens directly on B.
- Own-user dashboard unchanged.

## Risk Assessment
- Refactor regression in socket lifecycle (double subscriptions) -> keep cleanup semantics identical, test switching rapidly.
- `useSearchParams` in client page under App Router requires Suspense boundary.

## Security Considerations
- subjectId sent to API comes from server-returned list, but backend (phase 02) is the real enforcement.

## Next Steps
- Phase 08 may add history chart tab inside this dashboard.
