# Phase 2.2 / Sprint 14 — Public marketplace + SEO

**Goal:** Make the marketplace discoverable. Public-facing product pages, public seller profiles, server-rendered SEO metadata, JSON-LD structured data, and a sitemap that lets Google index the catalog.

**Status:** Approved via ExitPlanMode. Implementation starting.

---

## Context

S11 (web-seller) + S12 (IMEI + payouts backend) + S13 (live wire-up) closed the seller loop. The buyer side (`frontend/web-buyer`) still has hardcoded data in `/shop/products` and no public product detail pages. The catalog-service has the data — it just needs a public read path with proper SEO.

S14 makes the marketplace crawlable. After this, a Googlebot can land on any product page and see:
- HTML with proper title/description/OG tags
- JSON-LD `Product` structured data (price, availability, seller)
- `hreflang` for vi/en
- A `sitemap.xml` listing every product + seller

## Key files

- `frontend/web-buyer/src/app/[locale]/shop/products/page.tsx` (rewrite — currently hardcoded)
- `frontend/web-buyer/src/app/[locale]/shop/products/[id]/page.tsx` (new)
- `frontend/web-buyer/src/app/[locale]/shop/sellers/[slug]/page.tsx` (new)
- `frontend/web-buyer/src/app/sitemap.ts` (new — Next.js sitemap convention)
- `frontend/web-buyer/src/app/robots.ts` (new — Next.js robots convention)
- `frontend/web-buyer/src/lib/seo.ts` (new — metadata helpers)
- `frontend/web-buyer/src/lib/services/public-catalog.service.ts` (new)
- `backend/catalog-service/src/public/public.controller.ts` (new)
- `backend/catalog-service/src/public/public.service.ts` (new)
- `backend/catalog-service/src/app.module.ts` (wire new module)
- `docs/project-changelog.md` (v0.2.5)

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Backend: public catalog endpoints (sellers + storefront) | pending |
| 02 | Frontend: real products list + product detail page + JSON-LD | pending |
| 03 | Frontend: public seller profile page | pending |
| 04 | Frontend: sitemap + robots + SEO metadata helpers | pending |
| 05 | Tests + docs + commit | pending |

## Conventions preserved

- YAGNI / KISS / DRY
- kebab-case, < 200 lines per file
- Conventional commit; no AI references
- No new enhanced files; update existing
- Public endpoints are **unauthenticated** and **read-only**; no PII exposure
- next-intl for all user-visible strings
- TypeScript strict

## Definition of done

- `/shop/products` shows real products from catalog-service (search + filter)
- `/shop/products/[id]` renders server-side with title/description/OG + JSON-LD
- `/shop/sellers/[slug]` renders a public storefront with the seller's products
- `/sitemap.xml` lists every product + seller + static route, with hreflang
- `/robots.txt` allows public routes, disallows `/auth/`, `/health/`, `/settings/`
- 22 packages type-check, lint, build clean
- 78+ existing tests still pass
- Single commit: `feat(web-buyer): S14 public marketplace + SEO`
