# Phase 07 — Tests + Verification

## Context Links
- [plan.md](plan.md), phases 01-06
- Existing test patterns: `backend/*/test/*.spec.ts` (e.g. `backend/payment-service/test/vnpay.gateway.spec.ts`), `packages/shared-config/test/`

## Overview
- Priority: P1 | Status: pending | Effort: 4h
- Unit + integration tests for access policy and invite flow; manual/e2e verification of UI. Delegate run to `tester`, review to `code-reviewer`.

## Key Insights
- Access policy is the security core — highest test value. Test against real Postgres (docker-compose.dev.yml) not mocks, per dev rules.

## Requirements
Backend
- `care-access` helper: self, accepted caregiver allowed, pending denied, revoked denied, perm=false denied, legacy empty permissions allowed, unknown device.
- caregivers service: invite pending, re-invite after revoke resets, accept by non-invitee 403, decline, resend throttle 429, resend on accepted 409, limit counts pending.
- devices controller: 401/403/200 matrix on telemetry endpoints.
- alerts controller: subjectId check; admin route role check.
- patients summary: masking + query count.
Frontend (manual checklist, or Playwright if already configured in web-buyer — check before adding)
- Invite (patient A) -> caregiver B sees invitation -> accept -> appears in My Patients with vitals -> trigger SOS for A -> B's badge updates -> drill-down shows A's alerts only -> A revokes -> B loses access (403 notice).

## Related Code Files
Create
- `backend/device-service/test/care-access.spec.ts`
- `backend/device-service/test/caregivers-invite-flow.spec.ts`
- `backend/device-service/test/devices-telemetry-authorization.spec.ts`
- `backend/device-service/test/patient-summary.spec.ts`
- `backend/alert-service/test/alerts-subject-authorization.spec.ts`

## Implementation Steps
1. Confirm test runner config per service (jest/vitest) and DB fixture approach.
2. Write specs above with seeded users/devices/links.
3. Run `pnpm turbo test --filter=device-service --filter=alert-service` (check installed turbo docs per AGENTS.md before using new flags).
4. Run web-buyer build + manual checklist; record result in `reports/`.
5. code-reviewer pass; fix findings.

## Todo List
- [ ] care-access spec
- [ ] invite flow spec
- [ ] telemetry authz spec
- [ ] alerts authz spec
- [ ] summary spec
- [ ] full build + manual e2e checklist
- [ ] code review

## Success Criteria
- All new + existing tests green; no skipped tests; builds pass for device-service, alert-service, notification-service, web-buyer.

## Risk Assessment
- Timescale hypertable in test DB — use same docker image as dev.

## Security Considerations
- Tests explicitly assert denial paths, not just happy paths.

## Next Steps
- Optional phase 08; docs-manager updates `backend/README.md` caregiver API section.
