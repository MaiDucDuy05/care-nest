# Phase 3 / Sprint 19 (S19): Unified API Gateway + Cross-Service Auth Unification + OpenTelemetry W3C Tracing

**Status:** ✅ Complete.
**Branch:** `main`
**Deliverables:**
1. Cross-service auth unification into `@carenest/nestjs-common` (Guards, Decorators, Normalized user payload).
2. Unified HTTP API Gateway (`@carenest/api-gateway`, Port: `8080`):
   - Reverse proxy routing for all 9 microservices.
   - W3C OpenTelemetry tracecontext propagation (`traceparent` header).
   - `X-Request-Id` / `X-Correlation-Id` forwarding.
   - Prometheus metrics on `/metrics` (via `MetricsModule` + `RequestMetricsMiddleware`).
   - Liveness / Readiness probes on `/healthz`.
   - Centralized CORS configuration.
3. Frontends updated:
   - Fixed `ORDER_API` port bug in `web-buyer` and `web-seller` (was pointing to 3003 instead of 3004).
   - Added `NEXT_PUBLIC_API_GATEWAY_URL` support to `web-buyer`, `web-seller`, and `web-admin`.
4. Infrastructure:
   - Added `api-gateway` (port 8080) to `docker-compose.dev.yml` under profile `full`.
   - Added `api-gateway:8080` scrape target to `infrastructure/monitoring/prometheus.yml`.

---

## Architecture

```
Frontends (web-buyer:3000, web-admin:3015, web-seller:3016)
        │
        ▼ (Single Endpoint: http://localhost:8080)
┌────────────────────────────────────────────────────────┐
│               CareNest API Gateway (8080)             │
│  - Central CORS & Error Sanitization (502 Gateway)     │
│  - W3C OTel Traceparent Injection (00-traceId-spanId)   │
│  - CorrelationId & Request Metrics Middleware          │
│  - Prometheus /metrics & /healthz                      │
└───────┬────────────┬────────────┬────────────┬─────────┘
        │            │            │            │
 ┌──────▼─────┐┌─────▼──────┐┌────▼──────┐┌────▼─────────┐
 │auth-service││catalog-svc ││order-svc  ││payment-svc   │
 │ (port 3001)││(port 3002) ││(port 3004)││ (port 3005)  │
 └────────────┘└────────────┘└───────────┘└──────────────┘
        │            │            │            │
 ┌──────▼─────┐┌─────▼──────┐┌────▼──────┐┌────▼─────────┐
 │notif-svc   ││device-svc  ││alert-svc  ││shipping-svc  │
 │ (port 3006)││(port 3003) ││(port 3007)││ (port 3009)  │
 └────────────┘└────────────┘└───────────┘└──────────────┘
                             ┌───────────┐
                             │sub-svc    │
                             │(port 3008)│
                             └───────────┘
```

## Route Map

| Path Prefix | Target Service | Default URL |
| :--- | :--- | :--- |
| `/api/v1/auth`, `/api/v1/mfa`, `/api/v1/audit` | `auth-service` | `http://localhost:3001` |
| `/api/v1/products`, `/api/v1/categories`, `/api/v1/kyc`, `/api/v1/imei` | `catalog-service` | `http://localhost:3002` |
| `/api/v1/devices`, `/api/v1/geofences`, `/api/v1/caregivers` | `device-service` | `http://localhost:3003` |
| `/api/v1/orders`, `/api/v1/cart`, `/api/v1/reviews`, `/api/v1/analytics` | `order-service` | `http://localhost:3004` |
| `/api/v1/payments`, `/api/v1/payouts`, `/api/v1/webhooks` | `payment-service` | `http://localhost:3005` |
| `/api/v1/notifications`, `/api/v1/preferences`, `/api/v1/push-subscriptions` | `notification-service` | `http://localhost:3006` |
| `/api/v1/alerts` | `alert-service` | `http://localhost:3007` |
| `/api/v1/subscriptions`, `/api/v1/plans` | `subscription-service` | `http://localhost:3008` |
| `/api/v1/shipments` | `shipping-service` | `http://localhost:3009` |

## Test Verification
- All 30 Turbo tasks passing (100% green).
- Tests added:
  - `@carenest/nestjs-common`: 10 auth guards & decorator unit tests.
  - `@carenest/api-gateway`: 8 route registry, OTel traceparent, and proxy controller tests.
