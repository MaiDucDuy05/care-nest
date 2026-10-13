# CareNest

> **"Buy right. Care always."**
> Multi-vendor medical e-commerce (B2B2C) + IoT health monitoring SaaS

## Tech Stack

- **Monorepo**: Turborepo + pnpm 12 (workspaces)
- **Backend**: NestJS 10 (microservices, TypeScript)
- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL 16 + TimescaleDB + `pg_uuidv7`
- **ORM**: Prisma 5
- **Message Broker**: Apache Kafka 3.7+ (KRaft mode)
- **Cache / Lock**: Redis 7
- **Search**: MeiliSearch
- **IoT Gateway**: Node.js 22 (TCP server, `node:net`)
- **Realtime**: Socket.IO
- **Container**: Docker + Kubernetes (Helm)
- **CI/CD**: GitHub Actions
- **Testing**: Vitest + @vitest/coverage-v8
- **Linting**: ESLint 8.57 (pinned — v9 needs flat config)

## Repository Layout

```
care-nest/
├── frontend/                         # Next.js front-ends
│   ├── web-buyer/                    # customer portal       (Phase 1)
│   ├── web-seller/                   # seller portal         (Phase 2)
│   └── web-admin/                    # admin portal          (Phase 3)
├── backend/                          # NestJS back-end microservices
│   ├── auth-service/                 #                       (Phase 1)
│   ├── catalog-service/              #                       (Phase 1)
│   ├── device-service/               #                       (Phase 1)
│   ├── iot-gateway/                  #                       (Phase 1)
│   ├── order-service/                #                       (Phase 2)
│   ├── payment-service/              #                       (Phase 2)
│   ├── inventory-service/            #                       (Phase 2)
│   ├── alert-engine/                 #                       (Phase 3)
│   ├── health-service/               #                       (Phase 3)
│   ├── notification-service/         #                       (Phase 3)
│   └── analytics-service/            #                       (Phase 4)
├── packages/                         # shared libraries (consumed by both sides)
│   ├── shared-config/                # Zod env loaders, constants, KAFKA_TOPICS
│   ├── shared-utils/                 # logger, retry, withTimeout, PII mask
│   ├── shared-kafka/                 # KafkaJS producer/consumer wrapper
│   ├── shared-redis/                 # ioredis wrapper (cache + lock)
│   ├── database/                     # Prisma schema, migrations, Timescale init
│   ├── iot-codec/                    # Wonlex V3.2 protocol codec + mock server
│   └── ui/                           # (Phase 1) shared React components
├── infrastructure/
│   ├── docker/                       # local-dev Dockerfiles + compose
│   └── k8s/                          # per-service Helm charts
├── .github/                          # CI/CD workflows + CODEOWNERS
├── docs/                             # roadmap, changelog, architecture, FSD
├── plans/                            # implementation plans and reports
├── AGENTS.md
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Quick Start

```bash
# 1. Install deps (pnpm 12.11.2 — pinned in packageManager)
pnpm install

# 2. Bring up local infra (Postgres+Timescale, Redis, Kafka, MeiliSearch)
docker compose -f docker-compose.dev.yml up -d

# 3. Run the full pipeline (build + type-check + test + lint)
pnpm turbo run build type-check test lint
```

> The repo currently ships Phase 0 only — the monorepo skeleton, the
> IoT codec, the database package, and shared packages. See
> `docs/development-roadmap.md` for the rollout plan.

## Useful commands

```bash
pnpm turbo run build           # build all packages
pnpm turbo run type-check      # tsc --noEmit per package
pnpm turbo run test            # vitest run per package
pnpm turbo run lint            # eslint per package
pnpm --filter @carenest/database db:format   # format Prisma schema
pnpm --filter @carenest/database db:generate  # regenerate Prisma client
```

## Documentation

- Project docs: `../docs/carenest-de-xuat.md`, `../docs/carenest-bmc-report.md`
- Roadmap: `../docs/development-roadmap.md`
- Changelog: `../docs/project-changelog.md`
- Architecture: `../docs/system-architecture.md`
- Code standards: `../docs/code-standards.md`
- Implementation plan: `../plans/`
- Device simulator (reference): `../device_simulator/`

## License

Proprietary — All rights reserved.
