# Phase 2.2 / Sprint 16 — IoT device onboarding (BE+GW)

**Goal:** Close the loop from "seller scans IMEI" → "buyer redeems activation code" → "device hits gateway, validates code, gets bound to a user, and starts streaming vitals". Today the schema and codec exist, but there's no end-to-end wiring.

**Status:** Approved via ExitPlanMode. Implementation starting.

---

## Context

The pieces we have today:
- `Device` model with `status: INACTIVE|ACTIVE|MAINTENANCE|LOST|DECOMMISSIONED` and a 10–15 digit `deviceId` (IMEI).
- `DeviceActivationCode` model: UUID v7 + HMAC-SHA256, 30-day TTL, single-use, with `orderId` / `userId` / `imeiList` / `expiresAt` / `usedAt` / `deviceId`.
- `@carenest/iot-codec` decodes `login`, `heartbeat (LK)`, `location (UD)`, vitals (BP/HR, SpO2, temp), SOS, fall.
- `iot-gateway` accepts TCP and publishes to Kafka. `device-service` consumes Kafka and persists to TimescaleDB.
- `web-buyer/activation/page.tsx` calls `activationService.peekCode / redeemCode` against `SUBSCRIPTION_API` — currently a stub.

What's missing:
1. **device-service** has no `POST /api/v1/devices` (admin) or `POST /api/v1/devices/:id/activate` (generate activation code) endpoint.
2. **device-service** has no `POST /api/v1/activation/codes/:token/redeem` — the actual code-redeem call from the buyer UI.
3. **iot-gateway** doesn't validate activation codes on `login` packets. It just acks. So a device could stream vitals without ever being bound to a user.
4. **Subscription** isn't auto-created when a device is bound. Buyer must purchase subscription separately.
5. No tests around the activation flow.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Backend: device-service provisioning + activation endpoints | complete |
| 02 | Backend: iot-gateway validates activation code on login | complete |
| 03 | Backend: device-service.consumes IOT_HEARTBEAT_RECEIVED to mark device ACTIVE | complete (existing updateHeartbeat already flips INACTIVE→ACTIVE) |
| 04 | Tests: provisioning + redeem + gateway validation | complete |
| 05 | Docs + commit | complete |

## Key files

**Modified (backend):**
- `backend/device-service/src/devices/devices.service.ts` — `provision()` (admin), `createActivationCode(orderId, userId, imeiList)` (seller)
- `backend/device-service/src/devices/devices.controller.ts` — add `POST /api/v1/devices`, `POST /api/v1/devices/:id/activate`
- `backend/device-service/src/devices/devices.repository.ts` — `findByOrderId` helper
- `backend/device-service/src/activation/activation.service.ts` (NEW) — `peekCode`, `redeemCode` (validates + sets `usedAt`, binds to `userId`)
- `backend/device-service/src/activation/activation.controller.ts` (NEW) — public `GET /api/v1/activation/codes/:token` (no PII), `POST /api/v1/activation/redeem` (auth)
- `backend/device-service/src/activation/activation.module.ts` (NEW) — wires service + controller
- `backend/device-service/src/app.module.ts` — register ActivationModule
- `backend/iot-gateway/src/handlers/packet-dispatcher.ts` — on `login`, call `device-service` `POST /internal/devices/validate-code`; reject if invalid
- `backend/iot-gateway/src/handlers/packet-dispatcher.ts` — on `login`, set `sessions.setDeviceUser(deviceId, userId)` so subsequent telemetry is correctly attributed
- `backend/device-service/src/telemetry/telemetry.consumer.ts` — on first heartbeat after redeem, mark `Device.status = ACTIVE` and stamp `lastSeenAt`

**Modified (frontend):**
- `frontend/web-buyer/src/lib/api-client.ts` — `ACTIVATION_API = DEVICE_API (3003)` so `activationService` hits the real endpoint
- `frontend/web-buyer/src/services/activation.service.ts` — point to `ACTIVATION_API` instead of `SUBSCRIPTION_API`

## Conventions

- YAGNI / KISS / DRY
- kebab-case, < 200 lines
- HMAC stays in the existing schema (`DeviceActivationCode.hmac`); we just don't recompute it on redeem (we trust the unique `token` index + `expiresAt` + `usedAt IS NULL`)
- Activation codes are public-by-token: anyone with the token can peek (we only return device count, not IMEIs) — PII is gated behind `redeemCode` which requires auth + a token-bound userId
- First heartbeat after redeem flips `INACTIVE → ACTIVE`. Until then, telemetry is accepted (so SOS still works) but device stays INACTIVE in admin views
- Conventional commit; no AI references
- TypeScript strict

## Definition of done

- `POST /api/v1/devices` creates a device row (admin only)
- `POST /api/v1/devices/:id/activate` issues a DeviceActivationCode with 30-day TTL
- `GET /api/v1/activation/codes/:token` returns `{valid, devices, expiresAt}` without exposing IMEI
- `POST /api/v1/activation/redeem` (auth) flips `usedAt`, binds `deviceId`, and returns the device list
- iot-gateway calls validate-code on every `login` packet; rejects (no telemetry ack) if invalid
- First heartbeat after redeem flips `Device.status` to ACTIVE
- 22 packages type-check, lint, build clean
- All existing tests still pass + at least 6 new tests
- Single commit: `feat(iot+devices): S16 device onboarding + activation redemption`
