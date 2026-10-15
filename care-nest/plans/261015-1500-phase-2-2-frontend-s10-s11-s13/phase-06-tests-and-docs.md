# Phase 06 — Tests + Docs (final wave)

> **Wave**: 4 (chạy sau khi G3 pass)
> **Output**: Playwright smoke tests, Vitest unit tests cho i18n + proration, docs sync (roadmap, changelog, architecture, code-standards)
> **Gate**: Final — all tests green, docs updated, no failed CI

## Context Links

- Plan: `plan.md`
- Phase 0-5: 5 phase files đã có
- Docs cần update: `docs/development-roadmap.md`, `docs/project-changelog.md`, `docs/system-architecture.md`, `docs/code-standards.md`
- Project rules: `.claude/rules/development-rules.md` + `documentation-management.md`

## Overview

- **Priority**: P0 (final gate trước khi release Phase 2.2)
- **Status**: Not started
- **Brief**: Viết Playwright E2E smoke tests cho critical user paths, Vitest unit tests cho pure logic (i18n, proration), sync tất cả docs theo project rules. KHÔNG viết test cho mọi component — chỉ critical paths.

## Key Insights

- Playwright config ở root, chạy cả 3 app song song với 3 baseURL.
- Unit tests cho shared logic (i18n messages validity, proration preview) — KHÔNG test React components với Vitest (YAGNI, dùng Playwright).
- Docs update theo template đã có ở `docs/` — KHÔNG tạo format mới.
- Test phải chạy được trên CI (GitHub Actions) — dùng `pnpm turbo run test` thông qua `turbo.json`.
- Mỗi test file < 200 LOC.

## Requirements

### Functional
- FR-T.1: Playwright config cho 3 app
- FR-T.2: 5 smoke tests cho web-buyer (login, products, dashboard render, activation wizard step 1, subscription page)
- FR-T.3: 3 smoke tests cho web-seller (login, KYC form, product list)
- FR-T.4: 2 smoke tests cho web-admin (login, KYC review queue)
- FR-T.5: Unit test cho proration preview (5 cases: upgrade, downgrade, same plan, expired, refund)
- FR-T.6: Unit test cho i18n messages (vi/en key parity, no empty values)
- FR-T.7: Unit test cho shared-types entities (đã có trong phase 0)
- FR-T.8: Update `docs/development-roadmap.md` (Phase 2.2 = Complete)
- FR-T.9: Update `docs/project-changelog.md` (4 entries: foundation, S10, S11, S13)
- FR-T.10: Update `docs/system-architecture.md` (thêm 2 Next.js app + Lighthouse CI)
- FR-T.11: Update `docs/code-standards.md` (i18n convention, shared-types convention)

### Non-functional
- Total test time < 5 phút (parallel)
- 0 flaky tests
- CI fail nếu smoke test fail

## Architecture

### Tests

```
care-nest/
├── e2e/                                # NEW (root level — chạy cả 3 app)
│   ├── playwright.config.ts            # NEW
│   ├── fixtures/
│   │   ├── auth.ts                     # NEW: login helper
│   │   └── test-data.ts                # NEW
│   ├── web-buyer/
│   │   ├── homepage.spec.ts            # NEW
│   │   ├── login.spec.ts               # NEW
│   │   ├── products.spec.ts            # NEW
│   │   ├── dashboard.spec.ts           # NEW
│   │   ├── activation-wizard.spec.ts   # NEW
│   │   └── subscription.spec.ts        # NEW
│   ├── web-seller/
│   │   ├── login.spec.ts               # NEW
│   │   ├── kyc-form.spec.ts            # NEW
│   │   └── product-list.spec.ts        # NEW
│   ├── web-admin/
│   │   ├── login.spec.ts               # NEW
│   │   └── kyc-review.spec.ts          # NEW
│   └── README.md                       # NEW
├── frontend/web-buyer/
│   ├── test/                           # NEW (Vitest unit tests)
│   │   ├── proration.spec.ts           # NEW
│   │   └── i18n-messages.spec.ts       # NEW
│   └── vitest.config.ts                # NEW
├── frontend/web-seller/
│   └── test/
│       └── i18n-messages.spec.ts       # NEW
├── frontend/web-admin/
│   └── test/
│       └── i18n-messages.spec.ts       # NEW
├── packages/shared-types/
│   └── test/                           # đã có (phase 0 thêm 4 file)
└── scripts/
    └── lighthouse-ci.sh                # đã có (phase 5)
```

### Docs updates (modify existing)

```
docs/
├── development-roadmap.md              # MODIFY: Phase 2.2 = Complete
├── project-changelog.md                # MODIFY: append 4 entries
├── system-architecture.md              # MODIFY: thêm 2 Next.js app + Lighthouse
└── code-standards.md                   # MODIFY: thêm i18n + shared-types section
```

## Related Code Files

### Create
- `e2e/playwright.config.ts` — 3 projects (buyer, seller, admin)
- `e2e/fixtures/auth.ts` — login helper
- `e2e/fixtures/test-data.ts` — mock IMEI, test users
- 11 spec files trong `e2e/<app>/`
- `e2e/README.md`
- `frontend/web-buyer/test/{proration,i18n-messages}.spec.ts` — 2 files
- `frontend/web-buyer/vitest.config.ts` — config Vitest cho web-buyer
- `frontend/web-seller/test/i18n-messages.spec.ts`
- `frontend/web-admin/test/i18n-messages.spec.ts`
- `frontend/web-buyer/package.json` — thêm devDeps `@playwright/test`, `vitest`, `@vitest/coverage-v8`

### Modify
- `package.json` (root) — thêm scripts: `test:e2e`, `test:e2e:ui`, `test:unit`
- `turbo.json` — thêm `test:e2e` task
- `.github/workflows/ci.yml` — thêm `e2e` job (optional, chỉ chạy khi frontend changes)
- `docs/development-roadmap.md`
- `docs/project-changelog.md`
- `docs/system-architecture.md`
- `docs/code-standards.md`

### Delete
- None

## Implementation Steps

### Step 1: Playwright setup
1. Cài `@playwright/test` ở root devDependencies
2. Tạo `e2e/playwright.config.ts` với 3 projects (buyer: 3000, seller: 3004, admin: 3005)
3. Tạo `e2e/fixtures/auth.ts` — helper login với test user (env var `TEST_BUYER_EMAIL`, etc.)
4. Cài browsers: `pnpm exec playwright install --with-deps chromium`

### Step 2: Write smoke tests
1. **web-buyer** (6 tests):
   - homepage renders + has hero CTA
   - login form submit success redirect
   - products list render ≥ 1 card
   - dashboard page render + has vitals cards
   - activation wizard step 1: invalid token shows error
   - subscription page: shows current plan or empty state
2. **web-seller** (3 tests):
   - login form submit
   - KYC form: step 1 validation
   - product list page render (sau khi KYC approved)
3. **web-admin** (2 tests):
   - login form submit
   - KYC review queue page render (cần test data KYC pending)

### Step 3: Unit tests
1. `frontend/web-buyer/test/proration.spec.ts`:
   - upgrade basic → family: charge 50% diff
   - downgrade family → basic: refund 50% diff
   - same plan: no charge
   - expired plan: full charge new plan
   - partial month: prorate to days
2. `frontend/web-buyer/test/i18n-messages.spec.ts`:
   - vi/en có cùng key set
   - không có empty string
   - placeholder format đúng (e.g. `{name}` thay vì `%s`)
3. `frontend/web-seller/test/i18n-messages.spec.ts` — same pattern
4. `frontend/web-admin/test/i18n-messages.spec.ts` — same pattern

### Step 4: Run tests locally
1. `pnpm turbo run test` (Vitest unit) — expect all green
2. `pnpm test:e2e` (Playwright) — expect 11/11 pass
3. Verify no console errors in Playwright

### Step 5: Docs update
1. `docs/development-roadmap.md`:
   - Phase 2.2 status → ✅ Complete
   - Add section "Phase 2.2 — S10 + S11 + S13 (Frontend Sprints)"
2. `docs/project-changelog.md`:
   - Append 4 entries:
     - `feat(shared-types): add 6 entities + enums for Phase 2.2`
     - `feat(web-buyer): S10 health dashboard + activation + subscription + geofence + i18n`
     - `feat(web-seller,web-admin): S11 medical seller + ops portals`
     - `feat(seo+pwa): S13 PWA + SEO + Lighthouse CI for all 3 apps`
3. `docs/system-architecture.md`:
   - Update diagram: 3 Next.js apps + Lighthouse CI
   - Add section: Frontend Architecture
4. `docs/code-standards.md`:
   - Add section: i18n convention (next-intl, vi default)
   - Add section: shared-types convention (1 entity per file, branded IDs)
   - Add section: PWA + SEO convention (metadata API, JSON-LD)

### Step 6: CI integration
1. Thêm `e2e` job vào `.github/workflows/ci.yml`
2. Job: install → build apps → start servers → `pnpm test:e2e` → upload report
3. Chỉ chạy khi files trong `frontend/**` hoặc `e2e/**` thay đổi (path filter)
4. Set timeout 15 phút

## Todo List

- [ ] Cài @playwright/test ở root
- [ ] Tạo playwright.config.ts
- [ ] Tạo auth + test-data fixtures
- [ ] Cài Playwright browsers
- [ ] Write 6 web-buyer smoke tests
- [ ] Write 3 web-seller smoke tests
- [ ] Write 2 web-admin smoke tests
- [ ] Write proration.spec.ts
- [ ] Write 3 i18n-messages.spec.ts
- [ ] Chạy unit tests local (green)
- [ ] Chạy e2e tests local (green)
- [ ] Update development-roadmap.md
- [ ] Update project-changelog.md
- [ ] Update system-architecture.md
- [ ] Update code-standards.md
- [ ] Thêm e2e job vào ci.yml
- [ ] Commit `test+docs: Phase 2.2 Playwright + unit tests + docs sync`
- [ ] Tag release `v0.3.0-phase-2.2`

## Success Criteria

- `pnpm turbo run test` green (Vitest — shared-types, web-buyer, web-seller, web-admin)
- `pnpm test:e2e` green (11 Playwright tests)
- `pnpm turbo run build` green (3 apps)
- `pnpm turbo run type-check` green
- `pnpm turbo run lint` green (no new errors)
- Lighthouse CI green (Perf ≥ 80, A11y ≥ 90, BP ≥ 90, SEO ≥ 95)
- 4 docs files updated và cross-reference
- CI e2e job pass on PR

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Playwright flaky trên CI (timing) | High | Medium | Tăng timeout, dùng `waitForLoadState('networkidle')`, retry 1 lần |
| Test data conflict (cùng user login song song) | Medium | Medium | Mỗi test tạo user mới với timestamp, hoặc dùng unique email |
| Build app trước khi test chậm | Medium | Low | Cache `.next/build` giữa jobs, dùng Turbo cache |
| i18n test fail vì 1 key missing | Low | Low | Test helper so sánh key set, fail với message rõ ràng |
| Docs update bị quên | Medium | Low | CI check markdown links (markdown-link-check) |

## Security Considerations

- Test users KHÔNG dùng password thật — chỉ test fixtures
- TEST_BUYER_EMAIL, TEST_SELLER_PASSWORD env var — KHÔNG commit vào repo
- Playwright KHÔNG log sensitive data (mask ở fixtures)
- E2E job chỉ chạy khi frontend changes (path filter)
- Test database riêng (KHÔNG dùng production DB) — sẽ setup ở sub-task
- Lighthouse CI KHÔNG scan production URL (chỉ localhost)

## Next Steps

- Sau khi final pass → tag release + tạo PR để merge vào `main`
- Phase 3 (sau khi release) sẽ thêm:
  - Visual regression tests (Playwright + Percy/Chromatic)
  - Performance budgets enforcement
  - Component unit tests với React Testing Library
  - Storybook cho shared UI components
  - Database seeding scripts cho e2e tests
  - Test users tự động rotation
