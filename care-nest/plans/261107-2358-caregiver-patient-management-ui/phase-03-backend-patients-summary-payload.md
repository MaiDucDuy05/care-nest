# Phase 03 — Backend: Patients Summary Payload

## Context Links
- [plan.md](plan.md), [phase-02](phase-02-backend-care-access-policy-and-endpoint-hardening.md)
- `backend/device-service/src/caregivers/caregivers.repository.ts` (`findPatientsForCaretaker`)
- Prisma: `Device.status/lastSeenAt/lastBattery`, `HealthRecord` (hypertable, `measuredAt`)
- `backend/alert-service/src/alerts/alerts.controller.ts` (new internal counts endpoint lives here — open alert counts come from **alert-service over HTTP**, not a direct cross-service Prisma read; see Decision below)
- `backend/api-gateway/src/proxy/gateway-routes.ts` (`ALERT_SERVICE_URL` env var pattern to reuse for the internal call)

## Overview
- Priority: P1 | Status: pending | Effort: 2.5h
- Extend `GET /caregivers/patients` with per-patient snapshot so overview page needs 1 request, not N*3.

## Key Insights
- Device already has `status`, `lastSeenAt`, `lastBattery` — online state derivable without telemetry query (online = `lastSeenAt` within 5 min).
- Latest vitals: one `DISTINCT ON (deviceId, type)` raw query over HealthRecord for the caregiver's patient device ids, limited to last 24h (hypertable chunk pruning keeps it cheap). Vitals stay a direct Prisma read in device-service (HealthRecord is device-service's own domain data, same as today's telemetry endpoints).
- **Open alerts — decision (confirmed): go through alert-service via HTTP, not a direct cross-service Alert-table read.** Even though device-service shares the same Prisma client/DB package, `Alert` is alert-service's owned domain model; reading it directly from device-service would couple the two services' schemas and bypass alert-service's own access/business rules. Add `GET /api/v1/alerts/counts?subjectIds=a,b,c` to `alerts.controller.ts` (guarded by `JwtAuthGuard`; internally reuses phase 02's `assertCareAccess`/`receiveAlerts` check per subject, skipping ids the caller has no access to rather than 403-ing the whole batch). device-service calls it over plain HTTP using the `ALERT_SERVICE_URL` env var (same pattern api-gateway already uses), forwarding the caller's own `Authorization` header — no service-to-service secret needed since the original JWT already proves the caller's identity. Skip the call entirely (and return `openAlertCount: null`) when none of the caregiver's links have `receiveAlerts`. Skip vitals when lacks `viewHealth`.

## Requirements
Response (additive, back-compatible):
```ts
PatientWithDevices & {
  permissions: { viewHealth: boolean; receiveAlerts: boolean; manageDevices: boolean };
  openAlertCount: number | null;           // null = no receiveAlerts perm
  devices: Array<Device & {
    online: boolean; lastSeenAt: string | null; lastBattery: number | null;
    latestVitals: { heartRate?: number; spo2?: number; bpSys?: number; bpDia?: number; temp?: number; measuredAt: string } | null; // null = no viewHealth or no data
  }>;
}
```
Non-functional: <= 2 DB queries in device-service + 1 HTTP call to alert-service, regardless of patient count; p95 < 300ms for 20 patients (HTTP call budgeted ~50ms intra-cluster).

## Architecture
```
CaregiversService.getPatients(caller)
  -> repo.findPatientsForCaretaker -> collect deviceIds/subjectIds
  -> PatientSummaryRepository.latestVitals(deviceIds)                [Prisma, device-service]
  -> AlertCountsClient.getOpenCounts(subjectIds, authHeader)          [HTTP GET alert-service /alerts/counts]
  -> merge, apply permission masking
```

## Related Code Files
Create
- `backend/device-service/src/caregivers/patient-summary.repository.ts` (vitals query + normalizer)
- `backend/device-service/src/caregivers/alert-counts.client.ts` (HTTP client: `GET ${ALERT_SERVICE_URL}/api/v1/alerts/counts?subjectIds=...`, forwards `Authorization`, timeout + fail-open to `null` on error so one flaky call doesn't break the whole overview)
- `backend/alert-service/src/alerts/alerts.controller.ts` — add `GET /alerts/counts` handler (new route, before `:id` routes)
- `backend/alert-service/src/alerts/alerts.service.ts` — add `getOpenCountsForSubjects(caller, subjectIds)` using phase 02's `assertCareAccess` per subject (silently drop ids the caller can't access instead of 403, since this is a best-effort batch for an overview page)
Modify
- `backend/device-service/src/caregivers/caregivers.service.ts` (merge)
- `backend/device-service/src/caregivers/caregivers.module.ts` (provide `AlertCountsClient`, inject `ALERT_SERVICE_URL`)
- `frontend/web-buyer/src/services/caregivers.service.ts` types only (owned by phase 04 — coordinate)

## Implementation Steps
1. Inspect `HealthRecord.data` shape per type (grep `VITALS_BP_HR` in device-service telemetry/consumer) and write `normalizeVitals(records)`.
2. Implement raw SQL `DISTINCT ON ("deviceId", type) ... WHERE measuredAt > now() - interval '24 hours' ORDER BY "deviceId", type, "measuredAt" DESC` via `prisma.$queryRaw` with `Prisma.join(ids)`.
3. Add `GET /alerts/counts` on alert-service: validate `subjectIds` query param (comma-separated UUIDs, zod), per-id access check via `assertCareAccess(..., 'receiveAlerts')`, then `alert.groupBy` scoped to the allowed subset only; return `{ [subjectId]: count }`.
4. Implement `AlertCountsClient` in device-service: plain `fetch`, 2s timeout, forward caller's `Authorization` header, catch/log and return `{}` on any failure (fail-open to `null` counts, never throws into the overview response).
5. Merge with permission masking; compute `online`.
6. Build device-service and alert-service.

## Todo List
- [ ] vitals normalizer
- [ ] latest-vitals query (device-service, direct Prisma)
- [ ] `GET /alerts/counts` endpoint on alert-service (access-checked per subject)
- [ ] `AlertCountsClient` HTTP call in device-service (fail-open)
- [ ] permission masking + merge
- [ ] build passes (both services)

## Success Criteria
- Caregiver with 3 patients gets full snapshot in one call; masked fields null when permission false.
- Query count verified via Prisma query log.

## Risk Assessment
- Column naming in raw SQL (quoted camelCase) — verify against migration SQL.
- Devices never reporting -> latestVitals null; UI handles.
- alert-service down/slow -> `AlertCountsClient` fail-open means overview still loads, just with `openAlertCount: null` for every patient; acceptable degradation, must not block the page.

## Security Considerations
- Only accepted links (phase 01) feed this; permission masking server-side, never rely on UI hiding.
- `GET /alerts/counts` re-checks `receiveAlerts` access per subjectId server-side inside alert-service — device-service cannot bypass alert-service's own authorization just because it's calling internally; the forwarded JWT is the only credential, no shared secret/service-token.

## Next Steps
- Phase 04 consumes payload.
