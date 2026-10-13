# `packages/` — Thư viện Dùng Chung (Shared Packages)

Toàn bộ các thư viện tái sử dụng trong CareNest Monorepo được phân chia theo 3 nhóm phạm vi (Scope) rõ ràng:

---

## Phân cấp Phạm vi (Scope Matrix)

| Package | Tên Workspace | Phạm Vi (Scope) | Mục Đích Sử Dụng |
|---|---|---|---|
| **`shared-types`** | `@carenest/shared-types` | 🟢 **Toàn Hệ Thống** (Frontend + Backend + IoT) | Branded IDs (UserId, OrderId), DTO schemas, Zod validation |
| **`shared-config`** | `@carenest/shared-config` | 🟢 **Toàn Hệ Thống** (Frontend + Backend) | Zod Environment loaders, Tên hằng số service, Kafka topics |
| **`shared-utils`** | `@carenest/shared-utils` | 🟢 **Toàn Hệ Thống** (Frontend + Backend) | Logger cấu trúc, retry helpers, timeout utilities |
| **`iot-codec`** | `@carenest/iot-codec` | 🟡 **Backend + IoT Gateway** | Wonlex V3.2 protocol codec, buffer parser, decoders |
| **`database`** | `@carenest/database` | 🔴 **Backend Only** | Prisma Client singleton, 19 DB models, TimescaleDB migrations |
| **`shared-kafka`** | `@carenest/shared-kafka` | 🔴 **Backend Only** | Typed Kafka Producer & Consumer với retry + DLQ |
| **`shared-redis`** | `@carenest/shared-redis` | 🔴 **Backend Only** | Singleton Redis client, cacheGet/cacheSet, Distributed lock |

---

## Hướng Dẫn Sử Dụng Theo Tầng

### 1. Dành cho Frontend Apps (`frontend/*`)
Frontend **CHỈ ĐƯỢC PHÉP** phụ thuộc vào các gói có scope 🟢:
```json
{
  "dependencies": {
    "@carenest/shared-types": "workspace:*"
  }
}
```
> ⚠️ **LƯU Ý:** Không import `@carenest/database`, `@carenest/shared-kafka`, hoặc `@carenest/shared-redis` vào ứng dụng Client/Next.js bundle.

### 2. Dành cho Backend Microservices (`backend/*`)
Backend services có thể phụ thuộc vào cả 3 nhóm tùy theo nghiệp vụ:
- **HTTP REST Services** (`auth-service`, `catalog-service`, `order-service`): Phụ thuộc vào `database`, `shared-types`, `shared-config`, `shared-redis`.
- **Event-Driven Services** (`device-service`, `health-service`): Phụ thuộc thêm vào `shared-kafka`.
- **Raw TCP Gateway** (`iot-gateway`): Phụ thuộc vào `iot-codec`, `shared-kafka`, `shared-config`.

---

## Build & Test
```bash
# Build toàn bộ packages
pnpm --filter "@carenest/*" build

# Chạy unit tests cho toàn bộ packages
pnpm --filter "@carenest/*" test
```
