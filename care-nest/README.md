# CareNest — Nền Tảng TMĐT Y Tế & Giám Sát Sức Khỏe IoT

> **"Buy right. Care always."**  
> Hệ sinh thái Thương mại điện tử Y tế đa người bán (B2B2C) tích hợp Nền tảng Giám sát Sinh tồn & Định vị Người cao tuổi thời gian thực (IoT Telehealth SaaS).

---

## 📌 Giới Thiệu Dự Án

**CareNest** là giải pháp toàn diện kết hợp giữa thương mại điện tử chuyên biệt ngành y tế và hệ thống chăm sóc sức khỏe chủ động từ xa:
1. **Sàn TMĐT Y Tế (Medical E-Commerce)**: Cung cấp thiết bị y tế gia đình, máy đo sinh hiệu, thực phẩm chức năng và vật tư chăm sóc người cao tuổi chính hãng, đạt kiểm định chất lượng và hỗ trợ bác sĩ tư vấn.
2. **Giám Sát Sinh Tồn 24/7 (IoT Telehealth Monitoring)**: Kết nối trực tiếp với đồng hồ định vị GPS người cao tuổi (giao thức **Wonlex V3.2**), tự động thu thập nhịp tim, huyết áp, nồng độ oxy trong máu (SpO2), thân nhiệt.
3. **Cảnh Báo Khẩn Cấp Tức Thì (P0 Emergency)**: Phát hiện té ngã qua cảm biến gia tốc, cảnh báo nút bấm SOS khẩn cấp, cảnh báo ra khỏi vùng an toàn (Geofence) và gửi thông báo đa kênh tới người thân trong vòng < 2 giây.

---

## 🛠️ Công Nghệ Sử Dụng (Technology Stack)

Hệ thống được thiết kế theo kiến trúc **Microservices phân tán** trên nền tảng **Monorepo**:

### 1. Kiến Trúc Monorepo & Công Cụ
- **Monorepo Manager**: [Turborepo](https://turbo.build/) — Tối ưu hóa build pipeline, caching thông minh song song.
- **Package Manager**: [pnpm 12.11.2](https://pnpm.io/) (Workspaces) — Quản lý dependencies hiệu năng cao, chống trùng lặp.
- **Ngôn ngữ chuẩn**: **TypeScript 5.6** xuyên suốt từ Frontend, Backend tới thư viện dùng chung.

### 2. Frontend Applications (`frontend/`)
- **Framework**: **Next.js 14** (App Router, Server & Client Components, React 18).
- **Styling**: **Custom CSS Design Tokens** (Vanilla CSS) với hệ thống màu y tế chuyên biệt, micro-animations, glassmorphism, tương thích thiết bị di động.
- **Icons**: Lucide React.
- **Validation**: Zod schema validation.

### 3. Backend Microservices (`backend/`)
- **Framework**: **NestJS 10** (Clean Architecture / Hexagonal Pattern) cho các dịch vụ REST API & Event-driven.
- **TCP Gateway**: **Node.js 22** Raw Sockets (`node:net`) — Xử lý hàng nghìn kết nối socket đồng thời từ đồng hồ Wonlex với độ trễ thấp.
- **Authentication**: JWT (Access Token + Refresh Token), Passport.js, RBAC (Role-Based Access Control), bcrypt.

### 4. Cơ Sở Dữ Liệu & Lưu Trữ
- **RDBMS & Time-Series**: **PostgreSQL 16** mở rộng với **TimescaleDB** (quản lý hypertables cho hàng triệu điểm đo nhịp tim, huyết áp, vị trí GPS theo thời gian).
- **ID Strategy**: UUID v7 (sắp xếp tự nhiên theo thời gian qua extension `pg_uuidv7`).
- **ORM**: **Prisma 5.20** — Quản lý schema 19 thực thể, migrations tự động và type-safe client.

### 5. Message Broker, Caching & Tìm Kiếm
- **Message Broker**: **Apache Kafka 3.7+** (KRaft mode không cần Zookeeper) — Phân luồng sự kiện telemetry, đơn hàng và cảnh báo SOS thời gian thực.
- **In-Memory Cache & Lock**: **Redis 7** — Caching danh mục sản phẩm, phiên kết nối IoT và Khóa phân tán (Distributed Locks).
- **Search Engine**: **MeiliSearch v1.10** — Tìm kiếm sản phẩm y tế tốc độ mili-giây, hỗ trợ tìm kiếm mờ tiếng Việt.

### 6. Hạ Tầng & DevOps
- **Containerization**: Docker multi-stage builds & Docker Compose.
- **Orchestration**: Kubernetes (Helm charts cho từng service).
- **Testing**: Vitest & @vitest/coverage-v8.
- **Code Quality**: ESLint 8.57, Prettier, Commitlint (Conventional Commits).

---

## 📂 Cấu Trúc Dự Án (Repository Structure)

```
care-nest/
├── backend/                              # Các Microservices backend
│   ├── auth-service/                     # [Port 3001] Xác thực, JWT, RBAC, KYC
│   ├── catalog-service/                  # [Port 3002] Sản phẩm, danh mục, Redis cache
│   ├── device-service/                   # [Port 3003] Quản lý IMEI Wonlex, gán người dùng, telemetry
│   ├── iot-gateway/                      # [Port 18800] TCP Socket Server Wonlex V3.2 → Kafka
│   ├── order-service/                    # [Port 3004] Quản lý đơn hàng (Phase 2)
│   ├── payment-service/                  # [Port 3005] Cổng VNPay, MoMo, ZaloPay (Phase 2)
│   ├── inventory-service/                # [Port 3006] Quản lý kho hàng (Phase 2)
│   ├── health-service/                   # [Port 3007] TimescaleDB Health Records (Phase 3)
│   ├── alert-engine/                     # [Port 3008] Động cơ đánh giá cảnh báo SOS (Phase 3)
│   ├── notification-service/             # [Port 3009] Push Notification, SMS, Zalo (Phase 3)
│   └── analytics-service/                # [Port 3010] Phân tích dữ liệu & BI (Phase 4)
│
├── frontend/                             # Các ứng dụng giao diện Next.js
│   ├── web-buyer/                        # [Port 3000] Cổng mua sắm & Giám sát sinh tồn gia đình
│   ├── web-seller/                       # Cổng quản lý nhà bán hàng (Phase 2)
│   └── web-admin/                        # Cổng quản trị sàn & bác sĩ hỗ trợ (Phase 3)
│
├── packages/                             # Các thư viện dùng chung (Shared Packages)
│   ├── shared-types/                     # 🟢 Branded IDs, Enums, Zod DTO schemas (FE + BE)
│   ├── shared-config/                    # 🟢 Zod Env loaders, hằng số service, Kafka topics (FE + BE)
│   ├── shared-utils/                     # 🟢 Structured logger, retry, timeout helpers (FE + BE)
│   ├── iot-codec/                        # 🟡 Bộ giải mã gói tin Wonlex V3.2 (BE + IoT)
│   ├── database/                         # 🔴 Prisma client, 19 schema models, Timescale (BE only)
│   ├── shared-kafka/                     # 🔴 Typed Kafka Producer & Consumer retry+DLQ (BE only)
│   └── shared-redis/                     # 🔴 Redis singleton, cache helpers, distributed lock (BE only)
│
├── infrastructure/                       # Hạ tầng & Triển khai
│   ├── docker/                           # Multi-stage Dockerfiles cho từng service
│   └── k8s/                              # Helm charts triển khai Kubernetes
│
├── docker-compose.dev.yml                # Docker stack môi trường phát triển cục bộ
├── turbo.json                            # Cấu hình Turborepo task pipeline
├── pnpm-workspace.yaml                   # Cấu hình không gian làm việc pnpm
└── package.json                          # Package root & scripts toàn dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án (Getting Started)

### 1. Yêu Cầu Môi Trường (Prerequisites)
- **Node.js**: Phiên bản `>= 20.0.0` (Khuyên dùng Node 22 LTS).
- **pnpm**: Phiên bản `>= 9.0.0` (Được pin tại `12.11.2`).
  ```bash
  corepack enable
  corepack prepare pnpm@12.11.2 --activate
  ```
- **Docker & Docker Compose**: Để chạy Postgres/TimescaleDB, Kafka, Redis, MeiliSearch.

---

### 2. Cài Đặt Thư Viện (Install Dependencies)
Từ thư mục gốc `care-nest`:
```bash
pnpm install
```

---

### 3. Khởi Động Hạ Tầng Cục Bộ (Infrastructure)
Khởi động cụm dịch vụ cơ sở dữ liệu và hàng đợi qua Docker Compose:
```bash
docker compose -f docker-compose.dev.yml up -d
```
Cụm hạ tầng bao gồm:
- **PostgreSQL 16 + TimescaleDB**: `localhost:5432` (User: `carenest`, Password: `carenest_dev`, DB: `carenest`)
- **Redis 7**: `localhost:6379`
- **Apache Kafka (KRaft)**: `localhost:9094` (External listener cho máy host)
- **MeiliSearch**: `localhost:7700` (Master key: `carenest_dev_master_key`)

---

### 4. Khởi Tạo Cơ Sở Dữ Liệu (Database Setup)
Tạo Prisma Client và áp dụng cấu trúc 19 bảng vào PostgreSQL:
```bash
# Định dạng và kiểm tra schema
pnpm --filter @carenest/database db:format

# Sinh Prisma Client
pnpm --filter @carenest/database db:generate

# Chạy migration tạo bảng
pnpm --filter @carenest/database db:migrate
```

---

### 5. Khởi Động Chế Độ Phát Triển (Development Mode)

#### Chạy toàn bộ hệ thống đồng thời:
```bash
pnpm dev
```
Lệnh trên sử dụng Turborepo để khởi chạy song song tất cả các service và ứng dụng frontend.

#### Hoặc chạy riêng lẻ từng dịch vụ:
```bash
# Frontend Web Buyer (Cổng khách hàng & Gia đình)
pnpm --filter @carenest/web-buyer dev       # http://localhost:3000

# Backend Auth Service (Xác thực JWT & Phân quyền)
pnpm --filter @carenest/auth-service dev     # http://localhost:3001

# Backend Catalog Service (Danh mục & Sản phẩm y tế)
pnpm --filter @carenest/catalog-service dev  # http://localhost:3002

# Backend Device Service (Quản lý thiết bị & Telemetry)
pnpm --filter @carenest/device-service dev   # http://localhost:3003

# Backend IoT Gateway (TCP Server tiếp nhận Wonlex socket)
pnpm --filter @carenest/iot-gateway dev      # tcp://localhost:18800
```

---

### 6. Build Toàn Bộ Dự Án (Production Build)
```bash
# Build tất cả packages, microservices và frontend apps
pnpm build

# Kiểm tra kiểu dữ liệu TypeScript (Type check)
pnpm type-check

# Chạy toàn bộ Unit Tests
pnpm test

# Chạy Linting kiểm tra chuẩn mã nguồn
pnpm lint
```

---

### 7. Chạy Bằng Docker Đầy Đủ (Full Stack via Docker)
Nếu muốn chạy toàn bộ backend services cùng với cơ sở dữ liệu trên Docker:
```bash
docker compose -f docker-compose.dev.yml --profile full up -d --build
```

---

## 📡 Danh Sách Cổng Mặc Định (Port Mapping)

| Dịch vụ / Ứng dụng | Cổng (Port) | Giao thức | Mô tả |
|---|---|---|---|
| **`web-buyer`** | `3000` | HTTP | Ứng dụng Portal Khách hàng & Giám sát sinh tồn |
| **`auth-service`** | `3001` | HTTP | REST API Xác thực & Người dùng |
| **`catalog-service`** | `3002` | HTTP | REST API Sản phẩm & Danh mục |
| **`device-service`** | `3003` | HTTP | REST API Thiết bị & Lượt gán |
| **`iot-gateway`** | `18800` | TCP Socket | Cổng tiếp nhận gói tin thô Wonlex V3.2 |
| **PostgreSQL** | `5432` | TCP | Cơ sở dữ liệu chính + TimescaleDB |
| **Redis** | `6379` | TCP | Bộ nhớ đệm Cache & Distributed Lock |
| **Kafka Broker** | `9092 / 9094` | TCP | Hàng đợi tin nhắn sự kiện |
| **MeiliSearch** | `7700` | HTTP | Máy chủ tìm kiếm sản phẩm nhanh |

---

## 📖 Tài Liệu Tham Khảo Thêm
- [Tài liệu Kiến trúc Hệ thống](../docs/system-architecture.md)
- [Báo cáo Mô hình Kinh doanh CareNest BMC](../docs/carenest-bmc-report.md)
- [Quy chuẩn Mã nguồn (Coding Standards)](../docs/code-standards.md)
- [Bộ giả lập thiết bị đồng hồ Wonlex (Flutter Simulator)](../device_simulator/)
- [Tài liệu phân loại phạm vi Packages](./packages/README.md)
- [Tài liệu Backend Services](./backend/README.md)
- [Tài liệu Frontend](./frontend/README.md)

---

## 📄 Bản Quyền & Giấy Phép
Dự án thuộc sở hữu của đội ngũ phát triển **CareNest** — All rights reserved © 2026.
