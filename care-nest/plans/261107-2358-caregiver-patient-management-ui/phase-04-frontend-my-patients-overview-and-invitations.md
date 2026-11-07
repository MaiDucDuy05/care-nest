# Phase 04 — Frontend: "My Patients" Overview + Invitations Inbox

## Context Links
- [plan.md](plan.md), [phase-03](phase-03-backend-patients-summary-payload.md)
- `frontend/web-buyer/src/services/caregivers.service.ts` (`getPatients`, `accept`)
- `frontend/web-buyer/src/components/layout/health-header.tsx` (nav items, line ~34-60)
- `frontend/web-buyer/src/components/health/{vital-card.tsx,device-status-bar.tsx}` (reuse styling)
- `frontend/web-buyer/messages/{vi,en}.json`

## Overview
- Priority: P1 (core of request) | Status: pending | Effort: 5h
- New route `/[locale]/health/patients`: pending invitations to accept/decline + grid of all linked patients with status snapshot and drill-down.

## Key Insights
- No caregiver role in auth — any user can be caretaker. So page is always reachable; empty state explains how to get invited. Nav item shown always ("Benh Nhan Cua Toi"), badge with pending invite count.
- Drill-down reuses dashboard via `/health/dashboard?patientId={id}&deviceId={id}` (phase 05) — no duplicate dashboard.
- Polling every 30s + subscribe to alert socket `alert` event (phase 02 fan-out) to bump counts; KISS, no global store.

## Requirements
Functional
- Section A "Loi moi cho xac nhan": list from `GET /caregivers/invitations` — inviter name, relationship, permission chips, Accept / Decline buttons; on accept -> refetch both lists, toast.
- Section B "Benh nhan cua toi": card per patient: avatar/initials, name, relationship badge, per-device online dot + "last seen x min" + battery, latest HR/SpO2/BP/temp mini row (or "Khong co quyen xem" when masked / "Chua co du lieu"), open-alert count badge (red if >0), permission chips, buttons "Xem chi tiet" (dashboard deep-link) and "Ngung theo doi" (revoke with confirm).
- Sort: patients with open alerts first, then offline, then name.
- Skeleton loading, empty state, error state with retry; 403/401 handling -> login redirect consistent with existing pages.
Non-functional: each file < 200 lines; vi + en i18n keys; responsive (1 col mobile, 2-3 desktop); stable `id` attrs for e2e (`patient-card-{id}`).

## Architecture
```
app/[locale]/health/patients/page.tsx   (client page: fetch, poll, compose)
 ├─ components/patients/pending-invitations-panel.tsx
 ├─ components/patients/patient-summary-card.tsx
 │    └─ components/patients/patient-vitals-snapshot.tsx
 └─ components/patients/use-caregiver-patients.ts  (hook: fetch+poll+socket bump)
services/caregivers.service.ts  (+getInvitations, +decline, summary types)
```

## Related Code Files
Create
- `frontend/web-buyer/src/app/[locale]/health/patients/page.tsx`
- `frontend/web-buyer/src/components/patients/pending-invitations-panel.tsx`
- `frontend/web-buyer/src/components/patients/patient-summary-card.tsx`
- `frontend/web-buyer/src/components/patients/patient-vitals-snapshot.tsx`
- `frontend/web-buyer/src/components/patients/use-caregiver-patients.ts`
Modify
- `frontend/web-buyer/src/services/caregivers.service.ts` (sole owner in this plan; add types from phase 03, `getInvitations`, `decline`)
- `frontend/web-buyer/src/components/layout/health-header.tsx` (nav item + badge)
- `frontend/web-buyer/messages/vi.json`, `en.json` (`patients.*` namespace)

## Implementation Steps
1. Extend service types + methods (match existing fetch/credential/error pattern in file).
2. Hook: load invitations + patients in parallel, 30s interval, reuse existing alert socket client (find in dashboard page / `notif` components) to refetch on `alert`.
3. Build snapshot + card components (reuse `vital-card` tokens/colors, online/offline logic same as `device-status-bar`).
4. Invitations panel with optimistic disable on click.
5. Page composing sections, skeleton, empty, error.
6. Nav item in health-header, i18n keys.
7. `pnpm --filter web-buyer build` / `tsc --noEmit`.

## Todo List
- [ ] service methods + types
- [ ] data hook (poll + socket)
- [ ] vitals snapshot component
- [ ] patient summary card
- [ ] pending invitations panel
- [ ] page + states
- [ ] nav + i18n
- [ ] build passes

## Success Criteria
- Caregiver with 2+ patients sees all at a glance; alert count updates within 30s (instant with socket).
- Accept invite moves item from Section A to Section B without reload.
- "Xem chi tiet" opens dashboard focused on that patient.

## Risk Assessment
- Socket client duplication -> extract only if dashboard already has a reusable hook; else poll only (YAGNI).
- Many patients (>20) -> grid fine; no pagination now.

## Security Considerations
- Never render data not returned by server; masked fields come from backend.
- Revoke requires confirm dialog.

## Next Steps
- Phase 05 implements `?patientId` deep-link target.
