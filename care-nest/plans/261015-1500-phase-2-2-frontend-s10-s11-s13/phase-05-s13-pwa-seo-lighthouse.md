# Phase 05 — S13: PWA + SEO + Lighthouse CI (cross-cutting trên 3 apps)

> **Wave**: 3 (chạy sau khi cả 3 app tồn tại: web-buyer từ wave 1, web-seller + web-admin từ wave 2)
> **Output**: PWA infrastructure (manifest, service worker, offline page, install prompt, push subscription), SEO assets (meta, JSON-LD, sitemap, robots, hreflang), Lighthouse CI workflow
> **Gate**: G3 — S13 review (Lighthouse scores pass + PWA installable + SEO validated)

## Context Links

- Plan: `plan.md`
- Phase 1: `phase-02-s10-web-buyer-pages.md` (locale routing + dashboard)
- Phase 2: `phase-03-s11-web-seller.md` + `phase-04-s11-web-admin.md` (2 app mới)
- All 3 apps: `frontend/{web-buyer,web-seller,web-admin}/`

## Overview

- **Priority**: P1 (Sprint 13, cross-cutting)
- **Status**: Not started
- **Brief**: Thêm PWA capabilities (manifest, service worker, offline UX, install prompt, push subscription), SEO infrastructure (Open Graph, Twitter Card, JSON-LD schemas, sitemap.xml, robots.txt, canonical URLs, hreflang vi/en), Lighthouse CI workflow với score gates (Perf ≥ 80, A11y ≥ 90, BP ≥ 90, SEO ≥ 95). Áp dụng cho cả 3 app.

## Key Insights

- **PWA**: dùng `@ducanh2912/next-pwa` (zero-config wrapper cho next-pwa với Next 14 App Router support). KHÔNG tự viết service worker (YAGNI).
- **Service worker strategy**:
  - `AppCache`: cache-first cho static assets (_next/static, images)
  - `PagesCache`: stale-while-revalidate cho pages
  - `API`: network-only cho API (không cache data thay đổi)
  - `Offline fallback`: `/offline` page khi navigation fail
- **SEO meta**: dùng Next.js Metadata API (App Router) với `generateMetadata` per page. KHÔNG dùng `next-seo` package.
- **JSON-LD**: 3 loại schema cho web-buyer (Organization, Product, BreadcrumbList). Seller/admin không cần JSON-LD sản phẩm (YAGNI).
- **Sitemap**: dùng `next-sitemap` package, generate sau `next build`. Multi-locale sitemap với hreflang.
- **Lighthouse CI**: chạy trên GitHub Actions khi PR mở. Dùng `treosh/lighthouse-ci-action`. Local dev: `lhci autorun` với `lighthouserc.json`.
- **Push notification**: chỉ web-buyer. Subscribe qua `serviceWorker.pushManager.subscribe`, gửi subscription lên backend `notification-service` (cần endpoint mới — sẽ thêm sub-task).
- **Vietnamese hreflang**: mỗi page có 2 URL `/vi/...` và `/en/...`, link chéo với `<link rel="alternate" hreflang="vi" />` và `hreflang="en"`.
- **LocalBusiness schema**: cho VN market, embed trong web-buyer homepage.

## Requirements

### Functional
- FR-4.1: PWA manifest.json cho cả 3 app (name, short_name, icons 192/512, theme_color, lang)
- FR-4.2: Service worker auto-registered, offline fallback page
- FR-4.3: Install prompt (Add to Home Screen) hoạt động
- FR-4.4: Push notification subscription (chỉ web-buyer)
- FR-4.5: Open Graph meta tags (title, description, image, url, type)
- FR-4.6: Twitter Card meta tags
- FR-4.7: JSON-LD Organization schema (web-buyer homepage)
- FR-4.8: JSON-LD Product schema (web-buyer product detail)
- FR-4.9: JSON-LD BreadcrumbList (web-buyer category pages)
- FR-4.10: JSON-LD LocalBusiness schema (web-buyer footer, VN market)
- FR-4.11: sitemap.xml với hreflang (multi-locale)
- FR-4.12: robots.txt (allow all + sitemap reference)
- FR-4.13: Canonical URLs (mỗi page có 1 canonical)
- FR-4.14: hreflang vi/en (mỗi page có 2 alternate links)
- FR-4.15: Lighthouse CI workflow trên GitHub Actions
- FR-4.16: Lighthouse score gates: Perf ≥ 80, A11y ≥ 90, BP ≥ 90, SEO ≥ 95

### Non-functional
- PWA installable (Lighthouse PWA audit pass)
- Service worker không phá hydration (Next 14 SW issue known — dùng `next-pwa` đã fix)
- Sitemap regenerate mỗi build
- Lighthouse CI fail PR nếu score < threshold

## Architecture

### Per-app structure (apply cho cả 3 apps)

```
frontend/<app>/
├── public/
│   ├── manifest.json                    # NEW
│   ├── icons/
│   │   ├── icon-192.png                 # NEW
│   │   ├── icon-512.png                 # NEW
│   │   ├── icon-maskable-192.png        # NEW
│   │   └── icon-maskable-512.png        # NEW
│   ├── og-image.png                     # NEW (1200x630)
│   ├── robots.txt                       # NEW
│   └── offline.html                     # NEW
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # MODIFY: thêm metadata API
│   │   ├── [locale]/
│   │   │   ├── layout.tsx               # MODIFY: thêm generateMetadata
│   │   │   ├── page.tsx                 # MODIFY: thêm JSON-LD Organization
│   │   │   ├── (shop)/products/
│   │   │   │   ├── page.tsx             # MODIFY: BreadcrumbList JSON-LD
│   │   │   │   └── [id]/page.tsx        # MODIFY: Product JSON-LD
│   │   │   ├── (health)/dashboard/page.tsx  # MODIFY: thêm generateMetadata
│   │   │   ├── ... (mỗi page generateMetadata)
│   │   │   └── offline/page.tsx         # NEW: offline fallback
│   ├── components/
│   │   ├── seo/
│   │   │   ├── json-ld.tsx              # NEW: <script type="application/ld+json">
│   │   │   ├── breadcrumb.tsx           # NEW
│   │   │   └── canonical-link.tsx       # NEW
│   │   ├── pwa/
│   │   │   ├── install-prompt.tsx       # NEW: beforeinstallprompt
│   │   │   ├── push-subscribe-button.tsx  # NEW (chỉ web-buyer)
│   │   │   └── offline-banner.tsx       # NEW
│   │   └── ui/
│   │       └── ... (existing)
│   └── lib/
│       ├── metadata.ts                  # NEW: buildMetadata helper
│       ├── locale-routes.ts             # NEW: alternate URLs cho hreflang
│       └── push.ts                      # NEW (chỉ web-buyer)
├── next.config.mjs                      # MODIFY: thêm withPwa wrapper
└── next-sitemap.config.js               # NEW
```

### Root-level (Lighthouse CI)

```
care-nest/                              # repo root
├── lighthouserc.json                    # NEW
├── lighthouserc.buyer.json              # NEW (web-buyer specific)
├── lighthouserc.seller.json             # NEW
├── lighthouserc.admin.json              # NEW
├── .github/workflows/
│   ├── ci.yml                           # MODIFY: thêm lighthouse job
│   └── lighthouse.yml                   # NEW: dedicated PR workflow
└── scripts/
    ├── lighthouse-ci.sh                 # NEW
    └── build-report-summary.mjs         # NEW
```

## Related Code Files

### Modify (per app — 3 apps)
- `frontend/<app>/src/app/layout.tsx` — thêm viewport, themeColor, metadataBase
- `frontend/<app>/src/app/[locale]/layout.tsx` — `generateMetadata` cho locale layout
- `frontend/<app>/next.config.mjs` — wrap với `withPwa`
- `frontend/<app>/package.json` — thêm `@ducanh2912/next-pwa`, `next-sitemap`

### Modify (web-buyer only)
- `frontend/web-buyer/src/app/[locale]/(shop)/products/page.tsx` — BreadcrumbList JSON-LD
- `frontend/web-buyer/src/app/[locale]/(shop)/products/[id]/page.tsx` — Product JSON-LD
- `frontend/web-buyer/src/app/[locale]/page.tsx` — Organization + LocalBusiness JSON-LD
- `frontend/web-buyer/src/app/[locale]/(health)/dashboard/page.tsx` — generateMetadata
- `frontend/web-buyer/src/app/[locale]/offline/page.tsx` — NEW (offline fallback)
- `frontend/web-buyer/src/lib/push.ts` — NEW (push subscription)

### Create (per app)
- `frontend/<app>/public/manifest.json`
- `frontend/<app>/public/robots.txt`
- `frontend/<app>/public/icons/icon-{192,512}.png` + `icon-maskable-{192,512}.png`
- `frontend/<app>/public/og-image.png`
- `frontend/<app>/next-sitemap.config.js`
- `frontend/<app>/src/lib/metadata.ts` — `buildMetadata()` helper
- `frontend/<app>/src/lib/locale-routes.ts` — `alternatesLanguages` helper
- `frontend/<app>/src/components/seo/json-ld.tsx`
- `frontend/<app>/src/components/pwa/install-prompt.tsx`
- `frontend/<app>/src/components/pwa/offline-banner.tsx`

### Create (root — shared)
- `lighthouserc.json` — base config
- `lighthouserc.buyer.json`, `lighthouserc.seller.json`, `lighthouserc.admin.json` — per-app overrides
- `.github/workflows/lighthouse.yml` — PR trigger
- `scripts/lighthouse-ci.sh` — local dev helper

### Modify (root)
- `.github/workflows/ci.yml` — thêm `lighthouse` job (optional, chỉ chạy trên PR)

### Delete
- None

## Implementation Steps

### Step 1: PWA foundation (per app)
1. Generate 4 icon sizes (192, 512, maskable variants) từ logo CareNest — dùng `imagemagick` script
2. Tạo `public/manifest.json` với app name, short_name, icons, theme_color `#0d9488`
3. Tạo `public/og-image.png` 1200x630 (chỉ web-buyer)
4. Tạo `public/robots.txt` (allow all, reference sitemap)
5. Tạo `public/offline.html` (static fallback)
6. Cài `@ducanh2912/next-pwa` + `next-sitemap`
7. Wrap `next.config.mjs` với `withPwa({ dest: 'public' })`
8. Verify `manifest.json` + service worker accessible tại `/_next/static/.../sw.js`

### Step 2: Metadata API (per app)
1. Tạo `src/lib/metadata.ts` với `buildMetadata({ title, description, path, image, locale })` helper
2. Tạo `src/lib/locale-routes.ts` với `alternatesLanguages({ path })` → trả về `{ canonical, languages: { vi, en } }`
3. Modify `[locale]/layout.tsx`: `generateMetadata` trả về base metadata cho app
4. Modify mỗi page: `generateMetadata` trả về page-specific title/description/og/twitter
5. Verify HTML head có đủ tags (dùng `view-source:`)

### Step 3: JSON-LD (web-buyer only)
1. Tạo `src/components/seo/json-ld.tsx` — render `<script type="application/ld+json">`
2. Tạo `src/components/seo/breadcrumb.tsx` — render BreadcrumbList từ category tree
3. Modify homepage: thêm Organization + LocalBusiness JSON-LD
4. Modify product list page: thêm BreadcrumbList JSON-LD
5. Modify product detail page: thêm Product JSON-LD (include price, availability, brand)
6. Validate với Google Rich Results Test

### Step 4: Sitemap + robots
1. Tạo `next-sitemap.config.js` với `siteUrl: 'https://carenest.vn'`, `i18n: { defaultLocale: 'vi', locales: ['vi', 'en'] }`
2. Modify `package.json` scripts: thêm `"postbuild": "next-sitemap"`
3. Build → verify `public/sitemap.xml` + `public/sitemap-0.xml` có hreflang
4. Verify `public/robots.txt` có `Sitemap: https://carenest.vn/sitemap.xml`

### Step 5: PWA UX components (per app)
1. Tạo `InstallPrompt` component — listen `beforeinstallprompt`, hiển thị banner "Cài đặt CareNest"
2. Tạo `OfflineBanner` — listen `online`/`offline` events, hiển thị khi mất mạng
3. (web-buyer only) Tạo `PushSubscribeButton` — opt-in cho push notification, gửi subscription lên backend
4. Modify root layout: include 2 components
5. Tạo `app/[locale]/offline/page.tsx` — friendly offline page với link về home

### Step 6: Lighthouse CI
1. Tạo `lighthouserc.json`:
   ```json
   {
     "ci": {
       "collect": {
         "url": ["http://localhost:3000/vi", "http://localhost:3000/vi/products", ...],
         "numberOfRuns": 3,
         "settings": { "preset": "desktop" }
       },
       "assert": {
         "assertions": {
           "categories:performance": ["error", { "minScore": 0.80 }],
           "categories:accessibility": ["error", { "minScore": 0.90 }],
           "categories:best-practices": ["error", { "minScore": 0.90 }],
           "categories:seo": ["error", { "minScore": 0.95 }]
         }
       }
     }
   }
   ```
2. Tạo `.github/workflows/lighthouse.yml`:
   - Trigger: `pull_request` opened/synchronize
   - Steps: setup pnpm, build apps, start servers, run `lhci autorun`
   - Upload report as artifact
3. Test local với `pnpm dlx @lhci/cli@0.13.x autorun`

### Step 7: Verify
1. Chạy Lighthouse local cho cả 3 apps — đảm bảo scores pass
2. Validate PWA installable với Chrome DevTools
3. Validate JSON-LD với Google Rich Results Test
4. Validate sitemap với `https://www.xml-sitemaps.com/validate-xml-sitemap.html`
5. Verify offline page render khi mất mạng

## Todo List

- [ ] Generate PWA icons cho cả 3 apps
- [ ] Tạo manifest.json + og-image cho cả 3 apps
- [ ] Cài @ducanh2912/next-pwa + next-sitemap cho cả 3 apps
- [ ] Wrap next.config.mjs với withPwa
- [ ] Tạo metadata.ts + locale-routes.ts helpers
- [ ] Modify layouts để dùng generateMetadata
- [ ] Tạo JSON-LD components (web-buyer only)
- [ ] Thêm Organization + LocalBusiness + Product + BreadcrumbList JSON-LD
- [ ] Tạo next-sitemap.config.js
- [ ] Tạo robots.txt
- [ ] Tạo InstallPrompt + OfflineBanner components
- [ ] Tạo PushSubscribeButton (web-buyer only)
- [ ] Tạo offline page
- [ ] Tạo lighthouserc.json cho cả 3 apps
- [ ] Tạo .github/workflows/lighthouse.yml
- [ ] Local Lighthouse test pass
- [ ] Commit `feat(seo+pwa): S13 PWA + SEO + Lighthouse CI for all 3 apps`

## Success Criteria

- Cả 3 apps installable như PWA
- Service worker registered, offline page render khi mất mạng
- Lighthouse CI scores: Perf ≥ 80, A11y ≥ 90, BP ≥ 90, SEO ≥ 95 (cho web-buyer homepage + product detail)
- sitemap.xml có hreflang vi/en
- JSON-LD validate OK với Google Rich Results Test
- GitHub Action fail PR nếu scores dưới threshold
- Build + type-check + lint pass cho cả 3 apps
- 0 secrets trong repo

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| next-pwa conflict với Next 14 App Router | Medium | High | Dùng `@ducanh2912/next-pwa` (đã fix App Router), test kỹ trước khi merge |
| Service worker cache stale data sau deploy | Medium | Medium | Dùng `cache-busting` qua version trong tên file + skipWaiting + clientsClaim |
| Push notification cần VAPID keys | Medium | Medium | Generate VAPID keys ở dev, lưu env var, document cho prod |
| Lighthouse CI flakiness (scores dao động) | High | Medium | Chạy 3 lần (`numberOfRuns: 3`) lấy median; dùng desktop preset (ổn định hơn mobile) |
| OG image 1200x630 phải design | Low | Low | Tạo template đơn giản với logo + tagline, dùng `imagemagick` |
| Sitemap generation chậm với nhiều products | Low | Low | next-sitemap dùng ISR, không ảnh hưởng build time |
| Service worker không register được trên Safari | Low | Medium | Progressive enhancement — fallback không có SW vẫn hoạt động |

## Security Considerations

- Service worker chỉ cache first-party assets (không cache API responses có sensitive data)
- Push notification subscription lưu backend với userId, dùng để gửi theo user
- VAPID keys là public (client) + private (server) — chỉ public key ở frontend
- robots.txt: KHÔNG block `/admin` routes — phải dùng auth + role guard
- Canonical URL: prevent duplicate content penalty
- hreflang: tránh sai ISO code (dùng `vi-VN` hoặc `vi`? — chọn `vi` cho simplicity)
- JSON-LD KHÔNG chứa sensitive data (giá + brand là OK)
- OG image KHÔNG chứa PII

## Next Steps

- Sau khi G3 pass → wave 4 (tests + docs) chạy final
- Phase 3 có thể thêm: VAPID key rotation, Lighthouse mobile preset, AMP pages (YAGNI hiện tại)
- Web-push Phase 3: gửi notification khi alert CRITICAL, order shipped, KYC approved
- Image optimization: convert PNG sang WebP/AVIF với `next/image` (đã có sẵn, chỉ cần config)
