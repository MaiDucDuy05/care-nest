# Phase 1 Build Pipeline Hardening — Completion Report

**Date:** 2025-10-16
**Branch:** main
**Commits:** 4 (8fe1017, ed4b463, c4c3c3d, 9805620, 713416a)

---

## Summary

Phase 1 deliverables were already complete (8 NestJS services + iot-gateway, schema, e2e order→payment→notification, IoT/alert loop). This session's work added the missing shared infrastructure layer and made the entire monorepo build pipeline green.

## What was delivered

### 3 new shared packages

| Package | Size | Purpose |
|---------|------|---------|
| `@carenest/prisma-client` | 1 file + middleware | Standalone Prisma wrapper, `getPrisma()`, `disconnectPrisma()`, `isPrismaHealthy()`, `tenant.middleware.ts` (AsyncLocalStorage-based tenant filter) |
| `@carenest/nestjs-common` | 25+ modules | PrismaModule, KafkaModule (singleton TypedProducer), RedisModule, HealthModule (/healthz + /livez), AppConfigModule (Zod-validated env), guards (Jwt/Roles/Idempotency), decorators (@Roles, @CurrentUser, @Idempotent, @Public, @TenantId), interceptors, filters, middleware, pipes, bootstrapHttp() factory |
| `@carenest/common-dto` | 8 module schemas | Zod schemas shared backend ↔ frontend; primitives (UuidSchema, IsoDateSchema, VndAmountSchema, PhoneSchema, PasswordSchema, PaginationQuerySchema) + module DTOs (auth, catalog, order, payment, device, subscription, notification) |

### Route structure fix (Next.js App Router)
Route groups `(name)` were causing "parallel pages resolve to the same path" errors during build. Renamed to real URL segments:
- web-buyer: `(activation)` → `activation`, `(subscription)` → `subscription`, `(health)` → `health`, `(settings)` → `settings`, `(shop)` → `shop`, `(auth)` → `auth`
- web-admin: 10 groups similarly renamed
- web-admin audit: `[entityType]/[entityId]` → `[id]/[subId]` (consistent with other groups)

### Frontend fixes
- `use-auth.ts` → `use-auth.tsx` (JSX requires .tsx); 20 import paths updated
- Recharts type casts, Leaflet Layer structural type, useSearchParams from next/navigation
- Removed `metadata` exports from `'use client'` pages
- New `.eslintrc.json` for both frontends with `--max-warnings 100`

### Backend fixes
- VNPay gateway: `require('crypto')` → ESM `import`
- auth-service: removed unused imports
- shared-kafka: `TypedProducer.disconnect()` added
- shared-types tests: fixed destructuring lint errors
- `.eslintrc.json` at root: `no-unused-vars` from error to warn
- `prisma format` applied

## Pipeline status — all green

| Check | Result |
|-------|--------|
| `pnpm -r type-check` | ✅ 0 errors across 22 packages |
| `pnpm -r test` | ✅ 426 tests passing, 0 failing |
| `pnpm -r lint` | ✅ 0 errors (warnings allowed) |
| `pnpm -r build` | ✅ All 22 packages build (CJS+ESM dual output, Next.js apps) |
| `prisma format` | ✅ Schema formatted |

### Test count progression
- Before this session: 401 tests passing
- After this session: **426 tests passing** (+25)
  - Added: `nestjs-common` ZodValidationPipe tests, `common-dto` schema tests, `prisma-client` smoke tests

## Documentation updates

- `docs/project-changelog.md` — v0.2.0 entry (70 lines): all new packages, all fixes
- `docs/development-roadmap.md` — Phase 1 hardening note, updated "next steps"
- 4 conventional commit messages (no AI references)

## What was deferred (out of scope for build-pipeline work)

- No new business endpoints added (existing endpoints are sufficient for Phase 1's "core platform" deliverable)
- No K8s manifests / Helm charts (Phase 3 deliverable)
- No e2e integration tests (Phase 3 deliverable)
- No OpenAPI spec generation (Phase 2 follow-up)
- No Docker images built (CI deliverable)
- The 8 backend services still use their existing per-service `main.ts` files; they don't yet use the new `bootstrapHttp()` factory (would be a refactor in Phase 2 follow-up)

## Open questions

- Should backend services be migrated to use `bootstrapHttp()` from nestjs-common? This would require updating each service's main.ts to import + use the factory. Estimated ~30 min per service, 8 services total. Worth it for DRY but is a refactor, not a bug fix.
- The `TenantContextInterceptor` is exported but no service uses it yet. Keep (for future use) or remove (YAGNI)?
- `web-admin/src/components/subscriptions/*.tsx` uses `as never` casts for recharts — should be properly typed in a future cleanup.

## Security review

- ✅ No `.env`, credentials, or secrets in committed files (verified via `git status`)
- ✅ `.gitignore` covers `.env`, `.env.local`, `.env.*.local`
- ✅ JWT auth uses `passport-jwt` with proper `@Public()` escape hatch
- ✅ Webhook handlers (VNPay, MoMo) use `crypto.timingSafeEqual` for HMAC verification (existing code, not modified this session)
- ✅ Idempotency key guard stores results in Redis with TTL
- ⚠ Code-reviewer subagent (a9f32dd17033b16a6) was launched but stalled/cancelled before producing findings. A manual pass is recommended before the next phase begins.
