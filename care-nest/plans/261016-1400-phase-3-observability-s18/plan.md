# Phase 3 / Sprint 18 (S18): Observability + Redis rate limit

**Goal:** Make the platform operationally observable. Three concrete deliverables: (1) move the webhook rate limiter from in-process `Map` to Redis (atomic, survives restarts, works across replicas); (2) ship a `/metrics` Prometheus endpoint on every NestJS service via shared `prom-client` setup; (3) ship a starter Prometheus + Grafana stack in `docker-compose.dev.yml` with a payment-service dashboard JSON.

**Status:** ✅ Complete. All deliverables shipped; 294 backend tests green; 24 packages build clean.

## Completion notes
- `@carenest/nestjs-common` gained `MetricsModule` + `MetricsService` (prom-client), `RequestMetricsMiddleware`, `RedisThrottlerGuard`; `HealthModule` fixed to import `PrismaModule`.
- `src/index.ts` now re-exports the full public surface (previously only exported `bootstrapHttp` + a few modules — the subdir barrels were dead code).
- Payment-service: webhook guard now extends `RedisThrottlerGuard`; `payments.service` increments `payments_total` + `refunds_total`; `webhook-event.service` increments `webhook_events_total{gateway,signature_valid,outcome}`.
- All 9 NestJS services wired with `MetricsModule` + `RequestMetricsMiddleware`; the 6 request-serving ones also got `HealthModule`.
- Docker compose: `prometheus` (9090) + `grafana` (host 3100 → container 3000) under `full` + `monitoring` profiles. Grafana auto-provisions the Prometheus datasource + the payment-service dashboard.
- Tests: +5 `RedisThrottlerGuard`, +5 `MetricsService` in nestjs-common; refund orchestration test asserts metric increments. Chose service-level metric assertions over a heavyweight Nest boot/supertest integration test (KISS — the boot test would need live Prisma/Kafka/Redis).
- **Deferred as planned:** OTel tracing (S19 w/ API gateway), Alertmanager rules, custom per-seller business metrics.
- **Known pre-existing** (NOT S18): `type-check` task flags strict errors in device/catalog/order/notification **test files** from earlier sprints (e.g. `'r' is of type 'unknown'`, `DevicesService` 1-vs-2 args). Build + vitest pass; left untouched to keep S18 scoped.

---

## Context

What we have today:
- 10 NestJS services + 1 iot-gateway, all up; the largest gaps are: no metrics endpoint anywhere, no central place to see "is the webhook firing?", "what's the refund rate?", "is Kafka consumer healthy?".
- `WebhookRateLimitGuard` (S17) uses a per-process `Map<key, Bucket>` — fine for one instance, but the moment we run 2 replicas (which we will for HA) each one has its own bucket and a flooder can do 200 req/min instead of 100.
- `HealthModule` exists in `@carenest/nestjs-common` but is not imported into any service — k8s probes are missing too.
- `docker-compose.dev.yml` has Postgres+Redis+Kafka+MeiliSearch but no Prometheus/Grafana.

What S18 adds:
1. **Redis-backed token bucket** for the webhook guard (atomic `INCR` + `EXPIRE`; falls back to local Map when Redis is down so dev still works).
2. **Prometheus metrics** via `prom-client` — `/metrics` endpoint on every HTTP service; default Node.js metrics + a request-duration histogram + per-route counter.
3. **Starter Grafana dashboard** for payment-service (request rate, p95 latency, refund count, webhook event counts by gateway, rate-limit 429 count).
4. **Docker compose** adds `prometheus` + `grafana` services.
5. **Health module** actually wired into all 6 services that depend on DB+Redis (was built in S0 but never imported).

## Out of scope (deferred to S19+)
- Distributed tracing (OTel). Heavy lift; pairs better with API gateway work in S19.
- Alertmanager rules. Once we have the data, we add alerts in a follow-up.
- Custom business metrics (per-seller revenue, etc.). Grafana queries the existing `payment_webhook_events` table directly.

---

## Plan

### 1. Shared package — `@carenest/nestjs-common` observability module

**New files:**
- `packages/nestjs-common/src/modules/metrics.module.ts` — exports `MetricsController` (serves `/metrics`) and `MetricsService` (singleton `prom-client` registry + default Node metrics + custom counters/histograms)
- `packages/nestjs-common/src/middleware/request-metrics.middleware.ts` — `RequestMetricsMiddleware` that records `http_request_duration_seconds` histogram on response close (method, route, status)
- `packages/nestjs-common/src/guards/redis-throttler.guard.ts` — `RedisThrottlerGuard` (atomic `INCR` + `EXPIRE` per key; max N per window; falls back to `null` allow when Redis is down, with WARN log so it shows up in observability)
- `packages/nestjs-common/src/modules/health.module.ts` — UPDATE: actually use the PrismaService injection (right now the controller injects PrismaService but the module doesn't import PrismaModule — bug, fix now)
- `packages/nestjs-common/src/middleware/index.ts` + re-export

**Modified:**
- `packages/nestjs-common/src/index.ts` — export the new modules
- `packages/nestjs-common/package.json` — add deps: `prom-client ^15.1.0`, `@carenest/shared-redis` (already a dep)

**Naming:** `MetricsService` is a thin wrapper around `prom-client` so consumers get a typed API (`metrics.inc('refunds_total', { gateway })`, `metrics.observe('http_request_duration_seconds', seconds, { method, route, status })`).

### 2. Payment-service — use the new pieces

**`backend/payment-service/src/webhooks/webhook-rate-limit.guard.ts`** — REWRITE
- Replace in-process `Map` with `RedisThrottlerGuard` (or extend it). Same config: 100 req/min per (gateway, IP). Document: "If Redis is down, we fail-open (allow) and log a WARN — this trades a brief abuse window for availability."

**`backend/payment-service/src/app.module.ts`** — ADD
- `MetricsModule`, `HealthModule`, `RequestMetricsMiddleware` (via `configure(consumer)` in `AppModule`)

**`backend/payment-service/src/main.ts`** — ADD
- Register the middleware on the app instance (NestJS `MiddlewareConsumer` API in module is the clean way, but main.ts can also do `app.use(...)` — we use the module approach for testability)

**`backend/payment-service/src/payments/payments.service.ts`** — ADD
- Increment `refunds_total` counter on successful refund
- Increment `payments_total{status="paid"}` and `{status="refunded"}` from `markPaidFromWebhook` and `refund`

**`backend/payment-service/src/webhooks/webhook-event.service.ts`** — ADD
- Increment `webhook_events_total{gateway,signature_valid}` on every `recordOnce()` outcome

### 3. Other 5 services that touch DB+Redis — same wiring

Each of these gets the same `MetricsModule + HealthModule + middleware` wired into their `app.module.ts`. No custom business metrics (keeps the diff small; S19 can add per-service metrics).

- `auth-service` (3001)
- `catalog-service` (3002)
- `order-service` (3004)
- `device-service` (3003)
- `notification-service` (3006)

(shipping + subscription + alert are worker-leaning; they still get `/metrics` but no `/healthz` deep check — same wiring, fewer providers)

### 4. Docker compose — Prometheus + Grafana

**`docker-compose.dev.yml`** — ADD 2 services in the `full` profile:

```yaml
prometheus:
  image: prom/prometheus:v2.55.0
  container_name: care-nest-prometheus
  profiles: [full]
  ports: ['9090:9090']
  volumes:
    - ./infrastructure/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
  depends_on: []  # all services are scraped dynamically

grafana:
  image: grafana/grafana:11.3.0
  container_name: care-nest-grafana
  profiles: [full]
  ports: ['3000:3000']
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - ./infrastructure/monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
    - ./infrastructure/monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
  depends_on: [prometheus]
```

**`infrastructure/monitoring/prometheus.yml`** — NEW
- 30s scrape interval
- Scrape configs for all 9 HTTP services by their compose-network name

**`infrastructure/monitoring/grafana/provisioning/datasources/datasource.yml`** — NEW
- Auto-provision Prometheus datasource

**`infrastructure/monitoring/grafana/provisioning/dashboards/dashboards.yml`** — NEW
- Auto-load dashboards from `/var/lib/grafana/dashboards`

**`infrastructure/monitoring/grafana/dashboards/payment-service.json`** — NEW
- Starter dashboard: request rate by service, p95 latency, refund count, webhook events by gateway, rate-limit 429 count

### 5. Tests

**`packages/nestjs-common/test/redis-throttler.guard.spec.ts`** — NEW (5 tests)
1. First request in window returns `true` (count=1)
2. 100th request returns `true` (count=100)
3. 101st request throws 429 (count would be 101)
4. After window expires (mock `Date.now`), counter resets
5. When `getRedis()` throws, returns `true` (fail-open) and logs a WARN

**`packages/nestjs-common/test/metrics.service.spec.ts`** — NEW (3 tests)
1. Default Node metrics registered (mem, cpu, event loop lag visible)
2. `inc('refunds_total', { gateway: 'VNPAY' })` increments the named counter
3. `/metrics` endpoint returns Prometheus text exposition format (text/plain, valid metric names)

**`backend/payment-service/test/metrics.test.ts`** — NEW (1 integration test)
- Boot the app, hit `/metrics`, assert the response includes `http_request_duration_seconds_bucket` and `payments_total`

No new tests needed for the rate-limit guard itself in payment-service (covered by nestjs-common unit tests).

---

## Files to modify

**Modified (shared):**
- `packages/nestjs-common/src/index.ts` — export new modules
- `packages/nestjs-common/package.json` — add `prom-client`
- `packages/nestjs-common/src/modules/health.module.ts` — fix PrismaModule import

**Modified (payment-service):**
- `backend/payment-service/src/webhooks/webhook-rate-limit.guard.ts` — use `RedisThrottlerGuard`
- `backend/payment-service/src/app.module.ts` — wire MetricsModule + HealthModule + middleware
- `backend/payment-service/src/payments/payments.service.ts` — increment counters
- `backend/payment-service/src/webhooks/webhook-event.service.ts` — increment webhook_events_total
- `backend/payment-service/package.json` — add `@carenest/nestjs-common` to deps (probably already there via tree)

**Modified (other services — minimal):**
- `backend/{auth,catalog,order,device,notification}-service/src/app.module.ts` — wire MetricsModule + HealthModule + middleware
- `backend/{shipping,subscription,alert}-service/src/app.module.ts` — wire MetricsModule + middleware (no deep health)

**Created (shared):**
- `packages/nestjs-common/src/modules/metrics.module.ts`
- `packages/nestjs-common/src/middleware/request-metrics.middleware.ts`
- `packages/nestjs-common/src/guards/redis-throttler.guard.ts`
- `packages/nestjs-common/test/redis-throttler.guard.spec.ts`
- `packages/nestjs-common/test/metrics.service.spec.ts`

**Created (payment-service):**
- `backend/payment-service/test/metrics.test.ts`

**Created (infra):**
- `infrastructure/monitoring/prometheus.yml`
- `infrastructure/monitoring/grafana/provisioning/datasources/datasource.yml`
- `infrastructure/monitoring/grafana/provisioning/dashboards/dashboards.yml`
- `infrastructure/monitoring/grafana/dashboards/payment-service.json`

**Created (this plan):**
- `care-nest/plans/261016-1400-phase-3-observability-s18/plan.md`

---

## Verification

1. `pnpm -r type-check` — all packages clean
2. `pnpm --filter @carenest/payment-service test` — passes (existing 36 + 1 integration = 37)
3. `pnpm --filter @carenest/nestjs-common test` — passes (existing 2 + 5 + 3 = 10)
4. `pnpm -r --filter "!*frontend*" test` — full backend green
5. `pnpm -r build` — all packages build
6. Manual: start payment-service, `curl http://localhost:3005/metrics` returns Prometheus text
7. Manual: 101 webhook requests in 60s → 101st returns 429
8. Manual: `docker compose --profile full up prometheus grafana`; open `http://localhost:3000` (admin/admin), confirm payment-service dashboard renders with data

---

## Conventions

- YAGNI / KISS / DRY
- kebab-case, < 200 lines per file
- All metrics follow Prometheus naming: `_total` suffix for counters, `_seconds` for time
- Histogram buckets: default `prom-client` exponential (0.005s → 10s) — covers 99% of API calls
- Custom counter names: `payments_total`, `refunds_total`, `webhook_events_total` (no `app_` prefix — those are per-service now)
- Fail-open on Redis errors: log WARN, allow the request. Production: rotate the redis instance and check the WARN spike; don't crash the service.
- Conventional commit: `feat(observability): S18 Redis rate limit + Prometheus metrics + Grafana starter`

---

## Risk

- **`prom-client` adds a dep** — small (~50KB), no native modules, fine for Node 22
- **Metrics endpoint leak**: not gated by auth. Web-internal services don't expose this publicly; if they do, behind a reverse proxy / firewall. Document in README.
- **Redis fail-open**: an attacker could exploit a Redis outage to bypass rate limit. Acceptable for S18 because the alternative (fail-closed → 503 for legitimate traffic during a Redis blip) is worse. Mitigation: alert on the WARN log volume.
- **/metrics volume**: per-process, with a 15s default scrape interval. With 9 services and ~10 metrics each, ~3 MB/day of metric data — fine.
