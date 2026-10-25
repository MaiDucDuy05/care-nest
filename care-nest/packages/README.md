# `packages/` — Thư Viện Dùng Chung (Shared Packages)

Toàn bộ các thư viện tái sử dụng trong CareNest Monorepo được phân chia theo 3 nhóm phạm vi (Scope) rõ ràng:

---

## Phân Cấp Phạm Vi (Scope Matrix)

| Package | Tên Workspace | Phạm Vi (Scope) | Mục Đích Sử Dụng |
| :--- | :--- | :---: | :--- |
| **`shared-types`** | `@carenest/shared-types` | 🟢 **Toàn Hệ Thống** (Frontend + Backend + IoT) | Branded IDs (UserId, OrderId), DTO schemas, Zod validation |
| **`shared-config`** | `@carenest/shared-config` | 🟢 **Toàn Hệ Thống** (Frontend + Backend) | Zod Environment loaders, hằng số service, Kafka topics |
| **`shared-utils`** | `@carenest/shared-utils` | 🟢 **Toàn Hệ Thống** (Frontend + Backend) | Logger cấu trúc, retry helpers, timeout utilities |
| **`common-dto`** | `@carenest/common-dto` | 🟢 **Toàn Hệ Thống** (Frontend + Backend) | DTO schemas trao đổi dữ liệu liên phân hệ |
| **`iot-codec`** | `@carenest/iot-codec` | 🟡 **Backend + IoT Gateway** | Wonlex V3.2 protocol codec, buffer parser, decoders |
| **`database`** | `@carenest/database` | 🔴 **Backend Only** | Prisma Client singleton, 23 DB models, TimescaleDB migrations |
| **`prisma-client`** | `@carenest/prisma-client` | 🔴 **Backend Only** | Standalone Prisma Client wrapper, tenant middleware & context |
| **`nestjs-common`** | `@carenest/nestjs-common` | 🔴 **Backend Only** | Module NestJS chung: PrismaModule, RedisModule, KafkaModule, Metrics |
| **`shared-kafka`** | `@carenest/shared-kafka` | 🔴 **Backend Only** | Typed Kafka Producer & Consumer với retry + DLQ |
| **`shared-redis`** | `@carenest/shared-redis` | 🔴 **Backend Only** | Singleton Redis client, cacheGet/cacheSet, Distributed lock |

---

## Hướng Dẫn Sử Dụng Theo Tầng

### 1. Dành cho Frontend Apps (`frontend/*`)
Frontend **CHỈ ĐƯỢC PHÉP** phụ thuộc vào các gói có scope 🟢:
```json
{
  "dependencies": {
    "@carenest/shared-types": "workspace:*",
    "@carenest/shared-config": "workspace:*"
  }
}
```
> ⚠️ **LƯU Ý:** Không import `@carenest/database`, `@carenest/shared-kafka`, hoặc `@carenest/shared-redis` vào ứng dụng Client/Next.js bundle.

### 2. Dành cho Backend Microservices (`backend/*`)
Backend services có thể phụ thuộc vào cả 3 nhóm tùy theo nghiệp vụ:
- **HTTP REST & WebSocket Services** (`auth-service`, `catalog-service`, `order-service`, `chat-service`): Phụ thuộc vào `database`, `nestjs-common`, `shared-types`, `shared-config`, `shared-redis`.
- **Event-Driven Services** (`device-service`, `alert-service`, `notification-service`): Phụ thuộc thêm vào `shared-kafka`.
- **Raw TCP Gateway** (`iot-gateway`): Phụ thuộc vào `iot-codec`, `shared-kafka`, `shared-config`.

---

## Build & Test
```bash
# Build toàn bộ packages
pnpm --filter "@carenest/*" build

# Chạy unit tests cho toàn bộ packages
pnpm --filter "@carenest/*" test
```
