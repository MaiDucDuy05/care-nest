# Phase 2.2 — Frontend S10 + S11 + S13 (CareNest)

> **Bối cảnh**: Phase 0 + 1 + 2.1 đã hoàn tất. `web-buyer` đã có layout/header/footer + auth + products + cart + dashboard (mock). 2 backend service mới (subscription, shipping) + notification 4 kênh + 123 unit tests đã pass.
> **Mục tiêu**: Hoàn thiện buyer (S10) + dựng 2 app mới (S11) + PWA/SEO/Lighthouse CI (S13).
> **Phương pháp**: 4 waves với 4 review gates. Tất cả file ownership rõ ràng — song song được nhưng không trùng file.

## 4 Waves + 4 Review Gates

| Wave | Sprint | Phase file | Output | Gate |
|------|--------|-----------|--------|------|
| 0a | Foundation (frontend) | `phase-01-shared-types-and-design-tokens.md` | 6 entity mới trong `shared-types`, i18n messages (vi/en), design tokens snapshot | **G0: Foundation review** |
| 0b | Foundation (backend) | `phase-01b-backend-gaps.md` | 3 endpoint mới (notification preferences, push subscription, caregiver) + 2 Prisma model | **G0b: Backend gap review** |
| 1 | S10 | `phase-02-s10-web-buyer-pages.md` | Health Dashboard (real-time), Activation Wizard, Subscription page, Notification prefs, Geofence CRUD | **G1: S10 review** |
| 2 | S11 | `phase-03-s11-web-seller.md` + `phase-04-s11-web-admin.md` | web-seller (port 3004) + web-admin (port 3005) — chạy song song 2 agents | **G2: S11 review** |
| 3 | S13 | `phase-05-s13-pwa-seo-lighthouse.md` | PWA, SEO assets, Lighthouse CI workflow trên cả 3 app | **G3: S13 review** |
| 4 | Tests + Docs | `phase-06-tests-and-docs.md` | Playwright smoke tests, i18n unit tests, proration unit test, docs sync | Final |

## File ownership rule (NO OVERLAP)

- `web-buyer` chỉ thuộc wave 1 (S10)
- `web-seller` chỉ thuộc wave 2 seller (xài port 3004, app name riêng)
- `web-admin` chỉ thuộc wave 2 admin (xài port 3005, app name riêng)
- `packages/shared-types` chỉ thuộc wave 0 (foundation)
- S13 (PWA/SEO/Lighthouse) chạy sau khi cả 3 app tồn tại — modify theo app

## Key constraints (project rules)

- Kebab-case file names, files < 200 LOC
- Real implementations, no mocks
- No secrets in tracked files (`.env.local` gitignored)
- Tất cả app share `@carenest/shared-types` cho branded IDs + enums + entities mới
- Tái sử dụng CSS variables từ `web-buyer/globals.css` — KHÔNG tạo design system mới
- next-intl cho i18n (default `vi`, fallback `en`), route prefix `/[locale]/...`

## FR-IDs mapping

| Sprint | FR-IDs (high-level) | Touched services |
|--------|--------------------|--------------------|
| S10 | FR-2.1 → 2.18 (dashboard vitals, activation, subscription mgmt, notif prefs, geofence, i18n) | device, alert, subscription, notification, auth, catalog (orders) |
| S11 | FR-3.1 → 3.20 (seller KYC, products, orders PACKING, IMEI scan; admin KYC review, product review, audit, shipping) | auth, catalog, order, shipping, subscription |
| S13 | FR-4.1 → 4.10 (PWA, SEO, Lighthouse CI, hreflang, JSON-LD) | none (frontend-only) |

## Backend endpoints consumed (mới)

- `subscription-service` (3008): `/api/v1/plans`, `/api/v1/subscriptions/me`, `/api/v1/subscriptions/preview-proration`, `/api/v1/activation/codes/:token`, `/api/v1/activation/redeem`
- `shipping-service` (3009): `/api/v1/shipments/me`, `/api/v1/shipments/:id` (read-only trong S10/S11)
- `notification-service` (3006): `/api/v1/notifications/preferences` (PREFERENCES mới — sẽ thêm trong phase 1)
- `device-service` (3003): `/api/v1/geofences` (CRUD — đã có controller)
- `alert-service` (3007): WebSocket `/alerts`, `/api/v1/alerts` (lịch sử)

## Out of scope (Phase 3+)

- Real WebRTC video call (chỉ icon CTA)
- Real-time chat buyer ↔ seller
- Mobile native (React Native shell)
- Server Components streaming (giữ RSC nhưng không migrate sang SSR streaming)
- E2E test coverage > 50% (Phase 3 sẽ fill)

## Related docs (cần update sau)

- `docs/development-roadmap.md` — Phase 2.2 status
- `docs/project-changelog.md` — mỗi wave 1 entry
- `docs/system-architecture.md` — thêm 2 Next.js app + Lighthouse CI
- `docs/code-standards.md` — i18n conventions + shared-types convention

## Success gates

- Mỗi wave: `pnpm turbo run type-check lint test build` xanh trên CI
- Lighthouse CI: Perf ≥ 80, A11y ≥ 90, BP ≥ 90, SEO ≥ 95 trên web-buyer homepage
- Playwright smoke tests ≥ 5 critical paths pass
- Tất cả 6 shared-types entities mới có ≥ 1 unit test
