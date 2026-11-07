---
title: "Caregiver patient-management UI"
description: "Dedicated 'My Patients' screen for caregivers + consent-based invites, permission enforcement and scoped alerts."
status: pending
priority: P1
effort: 27h
branch: main
tags: [caregiver, health, web-buyer, device-service, alert-service, security]
created: 2026-11-07
updated: 2026-11-08
---

# Caregiver Patient-Management UI

Caregivers (nguoi cham soc) today only get a device dropdown bolted onto the shared Health Dashboard. No multi-patient overview, alerts panel ignores selected patient, invites auto-accept, `Caregiver.permissions` never enforced, device telemetry endpoints unauthenticated. This plan builds the caregiver UI on top of a secured, consent-based backend.

## Decisions
- **Real pending -> accept flow** (drop auto-accept). Caregiver must consent; access only when `acceptedAt != null && revokedAt == null`.
- **One shared access helper** `assertCareAccess()` in `packages/database` used by device-service + alert-service (both already share Prisma DB) for access *checks* only. No new service.
- **Patients can edit an existing caregiver's permissions directly** (`PATCH /caregivers/:id/permissions`), not just revoke+re-invite.
- **Legacy/empty `permissions` JSON defaults to full access** (pre-existing rows were all created all-true under the old auto-accept flow).
- **Up to 60s alert-fan-out staleness after revoke is an accepted tradeoff** (no cross-service cache invalidation on revoke).
- **Vitals realtime socket audited — confirmed non-functional/dead code** (client emits a `join` the gateway never handles; no `vitals:update` is ever broadcast anywhere). Not a live security gap; left as a documented TODO, out of scope for this plan.
- **Open alert counts for the overview go through alert-service via HTTP** (`GET /alerts/counts`, forwarding the caller's JWT), not a direct cross-service read of the `Alert` table from device-service — keeps alert-service as the sole owner/gatekeeper of alert data and its own access rules.
- **Resend/invite notification** via existing Kafka topic `notification.requests` -> notification-service (template `caregiver.invite`). No direct email code in device-service.
- **Overview data** = extend existing `GET /caregivers/patients` with summary fields (no new aggregate service, avoids N+1 from browser).
- **Chart library for phase 08 = `recharts`** (web-buyer has no chart lib today; added as a new dependency only if/when phase 08 starts).
- Stay inside `frontend/web-buyer` (no new app). Vitals chart + caregiver geofence = optional phase 08.

## Phases
| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Backend: consent invite flow + resend notification](phase-01-backend-invite-consent-flow-and-resend-notification.md) | 4.5h | pending |
| 02 | [Backend: shared care-access policy + endpoint hardening](phase-02-backend-care-access-policy-and-endpoint-hardening.md) | 5h | pending |
| 03 | [Backend: patients summary payload](phase-03-backend-patients-summary-payload.md) | 2.5h | pending |
| 04 | [Frontend: My Patients overview + invitations inbox](phase-04-frontend-my-patients-overview-and-invitations.md) | 5h | pending |
| 05 | [Frontend: dashboard patient context + alerts scoping fix](phase-05-frontend-dashboard-patient-context-and-alerts-fix.md) | 4h | pending |
| 06 | [Frontend: permission toggles + caregiver list pending UX](phase-06-frontend-invite-permission-toggles-and-pending-ux.md) | 2.5h | pending |
| 07 | [Tests + verification](phase-07-tests-and-verification.md) | 4h | pending |
| 08 | [Optional: vitals history chart + caregiver geofence view](phase-08-optional-vitals-history-chart-and-geofence-view.md) | (6h, not counted) | deferred |

## Dependencies
- 01 -> 02 (access helper relies on accepted semantics) -> 03.
- 04/05/06 depend on 01-03 API contracts; 04, 05, 06 can run in parallel (disjoint files, except `caregivers.service.ts` owned by 04).
- 07 after 01-06.

## Key Files
- Backend: `backend/device-service/src/{caregivers,devices,geofence}/*`, `backend/alert-service/src/{alerts,realtime}/*`, `backend/notification-service/src/templates/templates.ts`, `packages/database/src/`.
- Frontend: `frontend/web-buyer/src/app/[locale]/health/{patients,dashboard,caregivers}/`, `src/components/{caregivers,health,patients}/`, `src/services/{caregivers,alerts,devices}.service.ts`, `src/components/layout/health-header.tsx`, `messages/{vi,en}.json`.

## Breaking Changes
- Existing auto-accepted links stay accepted (no migration). New invites start PENDING.
- `GET /devices/:id`, `/telemetry*`, `GET /alerts?subjectId=` now require JWT + access; unauthorized -> 403. Any internal caller of these must send JWT (verify in phase 02).
