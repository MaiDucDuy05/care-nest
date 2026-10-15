# Phase 02 — S10: web-buyer Health Dashboard, Activation Wizard, Subscription, Geofence, i18n

> **Wave**: 1 (chạy sau khi G0 pass)
> **Output**: 9 trang mới trong `web-buyer`, real-time dashboard, 3-step activation wizard, subscription mgmt, geofence CRUD, i18n vi/en
> **Gate**: G1 — S10 review (verify real-time data flow + API wiring + i18n coverage ≥ 80%)

## Context Links

- Phase 0 (foundation): `phase-01-shared-types-and-design-tokens.md`
- Plan: `plan.md`
- Existing dashboard: `frontend/web-buyer/src/app/(health)/dashboard/page.tsx` (mock — sẽ refactor)
- Existing api-client: `frontend/web-buyer/src/lib/api-client.ts` (3 service — sẽ extend)
- Backend controllers: `backend/alert-service/src/alerts/`, `backend/device-service/src/geofence/`, `backend/subscription-service/src/{activation,plans,subscriptions}/`, `backend/notification-service/src/notifications/`

## Overview

- **Priority**: P1 (Sprint 10)
- **Status**: Not started
- **Brief**: Hoàn thiện trang dashboard thật (real-time vitals + alerts qua Socket.IO), xây 3-step activation wizard cho buyer sau khi nhận hàng, trang subscription mgmt với proration preview, notification preferences (toggle 4 channel), geofence CRUD trên Leaflet map, và refactor i18n với `next-intl`.

## Key Insights

- Dashboard hiện hard-code số liệu — cần parse sang data thật từ `GET /api/v1/devices/:id/telemetry/latest` + `GET /api/v1/alerts?subjectId=...`
- WebSocket: backend `alert-service` đã có `WS /alerts` (Socket.IO). Cần client `socket.io-client` package.
- Activation flow: 3 step (token input → IMEI scan/confirm → success) gọi `POST /api/v1/activation/codes` (peek) → `POST /api/v1/activation/redeem`. Step 1 buyer paste token (8-char short token, không phải UUID), step 2 buyer verify IMEI list đã ship trong order, step 3 confirm.
- Subscription mgmt: `GET /api/v1/subscriptions/me` (current), `POST /api/v1/subscriptions/preview-proration` (preview trước khi switch), `POST /api/v1/subscriptions/switch` (apply), `GET /api/v1/subscriptions/me/payments` (history).
- Notification preferences: cần backend endpoint mới `GET/PATCH /api/v1/notifications/preferences` (Phase 0 plan sẽ thêm — nếu chưa có thì thêm trong wave 1).
- Geofence: backend đã có `/api/v1/geofences` (CRUD). Frontend dùng `react-leaflet` + OpenStreetMap tiles (miễn phí, không cần API key) hoặc `MapLibre GL`. **Chọn Leaflet** vì đơn giản, bundle nhỏ hơn.
- i18n: `next-intl` với locale routing `/vi/...` (default) + `/en/...`. Messages tổ chức theo namespace: `common`, `health`, `subscription`, `geofence`, `activation`, `notif`.

## Requirements

### Functional
- FR-2.1: Dashboard real-time vitals (HR, BP, SpO2, temp) — refresh mỗi 5s qua Socket.IO
- FR-2.2: Geofence status hiển thị "in/out" badge
- FR-2.3: Recent alerts list (last 24h, auto-update qua WebSocket)
- FR-2.4: Caregiver management (invite by email, remove) — gọi `POST /api/v1/caregivers` (cần backend stub — sẽ thêm trong phase 02 nếu chưa có)
- FR-2.5: Activation Wizard 3-step flow
- FR-2.6: Subscription page — current plan + upgrade/downgrade với proration preview
- FR-2.7: Notification preferences — 4 channel toggle
- FR-2.8: Geofence CRUD trên bản đồ
- FR-2.9: i18n vi (default) + en, route prefix `/[locale]`

### Non-functional
- Initial dashboard load < 2s (LCP) — dùng SSR + skeleton
- WebSocket reconnect với exponential backoff (1s → 30s)
- Bundle size: dashboard < 300KB gzipped (Leaflet dynamic import OK)
- Mọi page có `<title>` + `<meta description>` unique
- Lighthouse SEO ≥ 95

## Architecture

```
frontend/web-buyer/
├── messages/                           # NEW
│   ├── vi.json                         # Vietnamese (default)
│   └── en.json                         # English
├── src/
│   ├── i18n/                           # NEW
│   │   ├── request.ts                  # next-intl config
│   │   └── routing.ts                  # locale list + prefix
│   ├── app/
│   │   ├── layout.tsx                  # MODIFY: add NextIntlClientProvider
│   │   ├── [locale]/                   # NEW: locale prefix
│   │   │   ├── layout.tsx              # NEW: locale layout
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx      # MOVE từ root
│   │   │   │   └── register/page.tsx   # MOVE
│   │   │   ├── (shop)/
│   │   │   │   ├── products/page.tsx   # MOVE
│   │   │   │   └── cart/page.tsx       # MOVE
│   │   │   ├── (health)/
│   │   │   │   ├── dashboard/page.tsx  # REFACTOR: real-time
│   │   │   │   ├── geofence/page.tsx   # NEW: CRUD map
│   │   │   │   └── caregivers/page.tsx # NEW: invite/remove
│   │   │   ├── (subscription)/
│   │   │   │   ├── page.tsx            # NEW: current plan
│   │   │   │   ├── upgrade/page.tsx    # NEW: plan picker
│   │   │   │   └── payments/page.tsx   # NEW: history
│   │   │   ├── (activation)/
│   │   │   │   ├── page.tsx            # NEW: step 1
│   │   │   │   ├── imei/page.tsx       # NEW: step 2
│   │   │   │   └── confirm/page.tsx    # NEW: step 3
│   │   │   ├── (settings)/
│   │   │   │   └── notifications/page.tsx  # NEW: channel toggle
│   │   │   ├── page.tsx                # MOVE homepage
│   │   │   └── not-found.tsx           # NEW
│   ├── components/
│   │   ├── health/
│   │   │   ├── vitals-card.tsx         # NEW (~80 LOC)
│   │   │   ├── vitals-grid.tsx         # NEW (~60 LOC)
│   │   │   ├── alerts-feed.tsx         # NEW (~100 LOC)
│   │   │   ├── device-status-bar.tsx   # NEW (~70 LOC)
│   │   │   └── geofence-status.tsx     # NEW (~50 LOC)
│   │   ├── activation/
│   │   │   ├── step-token-input.tsx    # NEW
│   │   │   ├── step-imei-verify.tsx    # NEW
│   │   │   ├── step-confirm.tsx        # NEW
│   │   │   └── stepper-progress.tsx    # NEW
│   │   ├── subscription/
│   │   │   ├── current-plan-card.tsx   # NEW
│   │   │   ├── plan-picker.tsx         # NEW (reused by upgrade)
│   │   │   ├── proration-preview.tsx   # NEW
│   │   │   └── payment-history-list.tsx # NEW
│   │   ├── geofence/
│   │   │   ├── geofence-map.tsx        # NEW (dynamic import Leaflet)
│   │   │   ├── geofence-form.tsx       # NEW
│   │   │   └── geofence-list.tsx       # NEW
│   │   ├── notification/
│   │   │   └── channel-toggle-grid.tsx # NEW
│   │   └── ui/
│   │       ├── locale-switcher.tsx     # NEW
│   │       ├── stepper.tsx             # NEW
│   │       └── empty-state.tsx         # NEW
│   ├── lib/
│   │   ├── api-client.ts               # MODIFY: split per service
│   │   ├── services/                   # NEW
│   │   │   ├── auth.ts
│   │   │   ├── catalog.ts
│   │   │   ├── devices.ts              # EXTEND: telemetry, geofence
│   │   │   ├── alerts.ts               # NEW
│   │   │   ├── subscriptions.ts        # NEW
│   │   │   ├── notifications.ts        # NEW: preferences
│   │   │   ├── shipments.ts            # NEW
│   │   │   └── caregivers.ts           # NEW
│   │   ├── socket.ts                   # NEW: Socket.IO singleton
│   │   └── proration.ts                # NEW: client-side proration preview helper
│   └── hooks/
│       ├── use-socket.ts               # NEW
│       ├── use-vitals.ts               # NEW
│       ├── use-alerts.ts               # NEW
│       └── use-locale.ts               # NEW
├── next.config.mjs                     # MODIFY: next-intl plugin
├── middleware.ts                       # NEW: locale redirect
└── package.json                        # MODIFY: add deps
```

## Related Code Files

### Modify
- `frontend/web-buyer/src/lib/api-client.ts` — split thành `lib/services/<name>.ts`, re-export từ api-client.ts cho backward compat
- `frontend/web-buyer/src/app/layout.tsx` — wrap với `NextIntlClientProvider`
- `frontend/web-buyer/src/app/globals.css` — KHÔNG đổi (giữ design tokens cho S11 reuse)
- `frontend/web-buyer/src/app/(health)/dashboard/page.tsx` — refactor dùng real data
- `frontend/web-buyer/src/components/layout/header.tsx` — thêm `LocaleSwitcher`, link `/subscription`, `/settings/notifications`
- `frontend/web-buyer/next.config.mjs` — thêm `createNextIntlPlugin`
- `frontend/web-buyer/package.json` — thêm `next-intl`, `socket.io-client`, `react-leaflet`, `leaflet`, `qrcode`
- `frontend/web-buyer/tsconfig.json` — thêm path `@i18n/*` nếu cần

### Create
- `frontend/web-buyer/messages/vi.json` + `en.json` — i18n messages (~400 keys total)
- `frontend/web-buyer/src/i18n/{request,routing}.ts` — next-intl config
- `frontend/web-buyer/middleware.ts` — locale detection
- `frontend/web-buyer/src/app/[locale]/layout.tsx` — locale layout (~60 LOC)
- `frontend/web-buyer/src/app/[locale]/not-found.tsx`
- **9 pages** trong `[locale]/`: 1 dashboard (refactor), 1 geofence, 1 caregivers, 1 subscription, 1 upgrade, 1 payments, 1 activation (root), 1 imei, 1 confirm, 1 notifications
- **22 components** (xem Architecture tree — mỗi file < 200 LOC)
- `frontend/web-buyer/src/lib/services/{auth,catalog,devices,alerts,subscriptions,notifications,shipments,caregivers}.ts` — 8 service files
- `frontend/web-buyer/src/lib/socket.ts` — Socket.IO client singleton
- `frontend/web-buyer/src/lib/proration.ts` — client-side proration helper
- `frontend/web-buyer/src/hooks/{use-socket,use-vitals,use-alerts,use-locale}.ts` — 4 hooks

### Delete
- `frontend/web-buyer/src/app/(auth)/` (move to `[locale]/(auth)/`)
- `frontend/web-buyer/src/app/(health)/` (move to `[locale]/(health)/`)
- `frontend/web-buyer/src/app/(shop)/` (move to `[locale]/(shop)/`)

## Implementation Steps

1. **Cài deps**: `next-intl`, `socket.io-client`, `react-leaflet`, `leaflet`, `@types/leaflet`, `qrcode`, `qrcode.react`
2. **i18n scaffold**: tạo `messages/vi.json` (default), `messages/en.json`, `src/i18n/routing.ts`, `src/i18n/request.ts`, `middleware.ts`, modify `next.config.mjs`
3. **Refactor `app/layout.tsx`**: bọc `NextIntlClientProvider` + locale routing
4. **Move pages** vào `[locale]/` (giữ nguyên nội dung phase 1, chỉ thay text bằng `useTranslations`)
5. **API client refactor**: tách thành 8 service files trong `lib/services/`, mỗi service export typed methods
6. **Socket.IO client** (`lib/socket.ts`): singleton kết nối `ws://localhost:3007/alerts` với auth token
7. **Dashboard page refactor**: 
   - SSR fetch initial vitals + alerts
   - Client subscribe Socket.IO
   - 4 vitals cards render từ `useVitals(deviceId)` hook
   - Alerts feed render từ `useAlerts(subjectId)` hook với optimistic update
8. **Activation wizard**: 3 step pages với state trong URL params (`?token=...&imei=...`)
9. **Subscription page**: SSR fetch current plan + plans list, modal proration preview
10. **Geofence page**: dynamic import `GeofenceMap` (Leaflet), form với circle/polygon picker
11. **Notification preferences page**: 4 channel toggle với optimistic update
12. **Caregivers page**: invite form + list với remove action
13. **Verify**: chạy `pnpm --filter @carenest/web-buyer type-check build`

## Todo List

- [x] Install next-intl + socket.io-client + react-leaflet + qrcode
- [x] i18n scaffold (vi/en messages + middleware)
- [x] Move 5 existing pages to [locale]/
- [x] Split api-client into 8 service files
- [x] Socket.IO client + 3 hooks
- [x] Refactor dashboard to real-time (basic structure done; hardcoded device/user still TODO)
- [x] Build geofence page + map component
- [x] Build caregivers page (data fetch + list rendering done)
- [x] Build subscription mgmt 3 pages (current + upgrade + payments all real)
- [x] Build activation wizard 3 steps
- [x] Build notification preferences page
- [x] Add LocaleSwitcher to header
- [x] Update header links (now i18n-aware, locale-prefixed paths)
- [x] Type-check + build pass
- [ ] Commit `feat(web-buyer): S10 health dashboard + activation + subscription + geofence + i18n` (split into multiple commits for clarity; S10 final commit = c4d0221)
- [ ] **PENDING**: replace hardcoded `device-001`/`user-001` in dashboard with auth-context-driven data (requires AuthProvider hook)
- [ ] **PENDING**: IMEI QR scanner (requires camera permission flow)
- [ ] **PENDING**: CaregiverList empty-state when fetching returns 0 (currently shows 'noCaregivers' which is fine, but consider skeleton-on-initial-load)

## Success Criteria

- Dashboard load < 2s LCP, vitals update real-time
- 3-step activation wizard hoàn chỉnh (token → IMEI → confirm)
- Subscription upgrade/downgrade với proration preview chính xác
- Geofence CRUD với map render OK
- Notification preferences save thành công
- i18n switch vi ↔ en không flash, mọi text đã được translate
- Build pass, type-check pass, lint không có error mới
- 0 secrets trong tracked files

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Socket.IO reconnect storm khi backend restart | Medium | Medium | Exponential backoff 1s → 30s, max 5 retries, hiển thị "Mất kết nối" badge |
| Leaflet bundle lớn (50KB) | Low | Low | Dynamic import, chỉ load trên geofence page |
| next-intl + route group migration phá existing links | High | High | Redirect middleware cho URLs cũ (`/login` → `/vi/login`) |
| IMEI scanner dùng camera cần HTTPS | Low | Medium | Fallback manual input nếu camera fail |
| Proration preview mismatch giữa client & server | Medium | High | Server là source of truth, client chỉ hiển thị ước tính với disclaimer |
| Notification preferences endpoint chưa có ở backend | Medium | Medium | Stub backend endpoint trong phase 02 nếu thiếu (sub-task "thêm preferences controller") |

## Security Considerations

- Auth token lưu ở `httpOnly` cookie (KHÔNG localStorage) — implement với `js-cookie` server-side
- Socket.IO auth: gửi token qua `auth` payload, backend verify
- i18n messages: KHÔNG inject HTML từ translations (escape mặc định OK)
- Geofence coordinates: validate lat ∈ [-90, 90], lng ∈ [-180, 180] client-side trước khi POST
- IMEI: validate 14-16 digits trước khi submit
- Caregiver invite: rate-limit client-side (1 invite / 30s)

## Next Steps

- Sau khi G1 pass → wave 2 (S11 web-seller + web-admin) chạy song song
- Backend sub-task "notification preferences controller" nếu thiếu sẽ block phase 06
- S13 (PWA/SEO/Lighthouse) sẽ modify `layout.tsx` thêm metadata API + service worker — phải merge với locale layout
