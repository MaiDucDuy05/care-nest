# @carenest/nestjs-common

Shared NestJS building blocks used by every back-end service.

## Modules
- `AppConfigModule.forRoot()` — env validation via `@carenest/shared-config`
- `PrismaModule` — singleton `PrismaService`
- `KafkaModule` — singleton `TypedProducer` + `disconnectKafka()` on shutdown
- `RedisModule` — singleton `getRedis()` + `disconnectRedis()` on shutdown
- `HealthModule` — `/healthz` (DB+Redis) and `/livez`

## Decorators
- `@Public()` — skip auth
- `@Roles('ADMIN', 'PLATFORM_ADMIN')` — role-restricted
- `@CurrentUser()` — inject `JwtUser`
- `@Idempotent({ ttlSeconds, scope })` — Stripe-style idempotency
- `@TenantId()` — param/body/header/JWT → `string`

## Guards
- `JwtAuthGuard` — Passport JWT
- `RolesGuard` — `@Roles()` enforcement
- `IdempotencyKeyGuard` — `Idempotency-Key` header

## Interceptors
- `TenantContextInterceptor` — wraps request in `withTenantContext()`
- `LoggingInterceptor` — per-request structured log

## Filters
- `HttpExceptionFilter` — uniform `{ error: { code, message, ... } }` envelope

## Middleware
- `CorrelationIdMiddleware` — `X-Request-Id` propagation

## Pipes
- `ZodValidationPipe(schema)` — body validation

## Bootstrap
- `bootstrapHttp(rootModule, { serviceName, swagger?, featureModules? })` —
  90 lines of `main.ts` in one function.
