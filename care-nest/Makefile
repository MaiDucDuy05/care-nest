# CareNest — common dev commands
# Use `make help` to list targets.
#
# Repo layout (post Phase 0 split):
#   frontend/  — Next.js apps
#   backend/   — NestJS microservices
#   packages/  — shared libraries

.PHONY: help install build test lint type-check clean dev-stack up down

help:
	@echo "CareNest dev targets:"
	@echo "  make install       Install all workspace deps"
	@echo "  make build         Build all packages + services"
	@echo "  make test          Run all tests"
	@echo "  make lint          Lint everything"
	@echo "  make type-check    tsc --noEmit across workspace"
	@echo "  make clean         Remove dist, .turbo, coverage"
	@echo "  make dev-stack     Start Postgres/Redis/Kafka/Meili (docker compose)"
	@echo "  make dev-stack-down  Stop the dev stack"
	@echo "  make db-migrate    Run Prisma migrations"
	@echo "  make db-studio     Open Prisma Studio"
	@echo "  make db-timescale  Enable TimescaleDB hypertables"

install:
	pnpm install

build:
	pnpm turbo run build

test:
	pnpm turbo run test

lint:
	pnpm turbo run lint

type-check:
	pnpm turbo run type-check

clean:
	pnpm turbo run clean
	rm -rf node_modules .pnpm-store

dev-stack:
	docker compose -f docker-compose.dev.yml up -d

dev-stack-down:
	docker compose -f docker-compose.dev.yml down

db-migrate:
	pnpm --filter @carenest/database db:migrate

db-studio:
	pnpm --filter @carenest/database db:studio

db-timescale:
	pnpm --filter @carenest/database exec tsx scripts/enable-timescale.ts
