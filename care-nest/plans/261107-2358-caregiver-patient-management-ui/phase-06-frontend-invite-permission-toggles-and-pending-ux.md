# Phase 06 — Frontend: Invite Permission Toggles + Caregiver List Pending UX

## Context Links
- [plan.md](plan.md), [phase-01](phase-01-backend-invite-consent-flow-and-resend-notification.md)
- `frontend/web-buyer/src/components/caregivers/{invite-form.tsx,caregiver-list.tsx}`
- `frontend/web-buyer/src/app/[locale]/health/caregivers/page.tsx`
- `backend/device-service/src/caregivers/dto/caregiver.dto.ts` (permissions schema)
- `plans/261015-1500-phase-2-2-frontend-s10-s11-s13/phase-02-s10-web-buyer-pages.md` (pending skeleton/empty polish item — fold in here)

## Overview
- Priority: P2 | Status: pending | Effort: 2.5h
- Patient side: choose granular permissions on invite; caregiver list shows real PENDING state with working resend + throttle feedback.

## Key Insights
- invite-form hardcodes all permissions true though DTO supports each flag.
- After phase 01, invites are genuinely pending -> list needs "Cho xac nhan" badge, Resend (429 -> "Vui long thu lai sau 5 phut"), Cancel (= revoke).
- **Decision (confirmed, reverses earlier YAGNI call): patients CAN edit an existing caregiver's permissions in place**, not just revoke+re-invite. Phase 01 adds `PATCH /caregivers/:id/permissions` for this; here we add the UI for it on an ACTIVE row.

## Requirements
- 3 checkboxes (default: viewHealth on, receiveAlerts on, manageDevices off — least privilege), with short vi helper text each.
- caregiver-list: status badge PENDING/ACTIVE; PENDING actions: Resend, Cancel; ACTIVE: permission chips (click-to-edit, see below) + Revoke. Toast on `notificationQueued:false` ("Da luu loi moi, thong bao se gui sau").
- ACTIVE row permission editing: clicking the chips (or an "Edit" affordance next to them) opens the same 3-checkbox control inline/in a small popover, pre-filled with current values; Save calls `caregiversService.updatePermissions(id, perms)` (new method, phase 01's PATCH endpoint) and optimistically updates the chip row; 403/404/409 map to a toast ("Khong the cap nhat quyen luc nay").
- Skeleton + empty state (carry-over polish item).
- Remove dead caregiver-side "accept" button from this patient-view list if present (accept lives in `/health/patients`).

## Architecture
Component-only change; uses `caregiversService` methods (owned by phase 04 — only call existing `invite/resendInvite/revoke`).

## Related Code Files
Modify
- `frontend/web-buyer/src/components/caregivers/invite-form.tsx`
- `frontend/web-buyer/src/components/caregivers/caregiver-list.tsx`
- `frontend/web-buyer/src/services/caregivers.service.ts` (add `updatePermissions(id, permissions)` calling `PATCH /caregivers/:id/permissions`)
- `frontend/web-buyer/messages/vi.json`, `en.json` (`caregivers.permissions.*` — coordinate key namespace with phase 04)
Create (only if list exceeds 200 lines)
- `frontend/web-buyer/src/components/caregivers/caregiver-permission-chips.tsx` (shared with phase 04 card — DRY; if created, phase 04 imports it; owns both display chips AND the edit popover so phase 04's read-only patient card and this editable row share the visual language)

## Implementation Steps
1. Add permission state + checkboxes to invite-form; send in payload.
2. Create `caregiver-permission-chips.tsx` (used by list and patient card); add an `editable`/`onSave` prop variant for this phase's ACTIVE-row use.
3. Add `updatePermissions` to `caregivers.service.ts`; wire edit popover save action.
4. Update list badges/actions; map 403/404/409/429 errors to messages.
5. Skeleton/empty states.
6. Build web-buyer.

## Todo List
- [ ] permission checkboxes (invite)
- [ ] permission chips component (+ editable variant)
- [ ] `updatePermissions` service call + edit popover on ACTIVE rows
- [ ] pending/active actions + error mapping
- [ ] skeleton/empty
- [ ] build passes

## Success Criteria
- Invite with manageDevices off -> backend row stores `manageDevices:false`; caregiver dashboard respects it.
- Resend twice quickly -> second shows throttle message.
- Editing an ACTIVE caregiver's permissions (e.g. toggling `manageDevices` on) persists via PATCH and takes effect immediately for that caregiver (no re-invite needed).

## Risk Assessment
- i18n key collisions with phase 04 -> separate namespaces (`caregivers.*` vs `patients.*`).

## Security Considerations
- Least-privilege defaults.

## Next Steps
- Phase 07 e2e covers invite->accept->monitor.
