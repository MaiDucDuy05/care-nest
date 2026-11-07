# Phase 08 (Optional/Deferred) — Vitals History Chart + Caregiver Geofence View

## Context Links
- [plan.md](plan.md), [phase-02](phase-02-backend-care-access-policy-and-endpoint-hardening.md), [phase-05](phase-05-frontend-dashboard-patient-context-and-alerts-fix.md)
- `backend/device-service/src/devices/devices.controller.ts` (`GET :id/telemetry?from&to&limit`)
- `backend/device-service/src/geofence/geofence.controller.ts` (owner-scoped only)
- `frontend/web-buyer/src/components/geofence/geofence-map.tsx`, `components/health/live-device-map.tsx`

## Overview
- Priority: P3 | Status: deferred | Effort: ~6h (not in plan total)
- Start only after 01-07 ship and user confirms need.

## Key Insights
- Telemetry history endpoint exists (secured in phase 02) but no UI. web-buyer has no chart lib currently. **Decision (confirmed): use `recharts`.** Add as a new dependency to `frontend/web-buyer/package.json` (`pnpm --filter web-buyer add recharts`) when this phase starts.
- Geofence: no caregiver read path. Add `GET /geofences?subjectId=` with `viewHealth` check (read-only); writes require `manageDevices` — or keep writes owner-only (simpler, recommended).

## Requirements
- Dashboard "Lich su" tab: range 24h/7d, lines for HR, SpO2, BP; downsample server-side via `limit` or time_bucket (add `bucket` query param only if payload too large).
- Caregiver geofence: read-only map of patient zones in dashboard (reuse `geofence-map.tsx` in read-only mode).

## Architecture
`use-telemetry-history(deviceId, range)` -> `devicesService.getTelemetryHistory` -> `vitals-history-chart.tsx`.
`GeofenceController.list(user, subjectId?)` -> `CareAccessService.assert(subjectId,'viewHealth')`.

## Related Code Files
Create: `frontend/web-buyer/src/components/health/vitals-history-chart.tsx`, `use-telemetry-history.ts`
Modify: `frontend/web-buyer/src/services/devices.service.ts`, dashboard page, `backend/device-service/src/geofence/geofence.{controller,service}.ts`, `frontend/web-buyer/src/components/geofence/geofence-map.tsx` (readOnly prop)

## Implementation Steps
1. Add `recharts` dependency to web-buyer.
2. History hook + chart (recharts `LineChart`) + tab.
3. Geofence subjectId read path + read-only map.
4. Tests for geofence authz.

## Todo List
- [ ] `recharts` dependency added
- [ ] history chart tab
- [ ] geofence caregiver read path
- [ ] read-only map
- [ ] tests

## Success Criteria
- Caregiver sees 24h HR trend for patient; sees patient safe zones without edit controls.

## Risk Assessment
- Large telemetry payloads -> enforce max limit server-side (already parsed, cap at 1000).

## Security Considerations
- Same care-access helper; no write access for caregivers.

## Next Steps
- Revisit after user feedback on phases 04-05.
