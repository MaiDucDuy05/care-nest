# CareNest — Nền Tảng TMĐT Y Tế & Giám Sát Sức Khỏe IoT

> **"Buy right. Care always."**  
> Hệ sinh thái Thương mại điện tử Y tế đa người bán (B2B2C) tích hợp Nền tảng Giám sát Sinh tồn & Định vị Người cao tuổi thời gian thực (IoT Telehealth SaaS).

---

## 📌 Giới Thiệu Dự Án

**CareNest** là giải pháp toàn diện kết hợp giữa thương mại điện tử chuyên biệt ngành y tế và hệ thống chăm sóc sức khỏe chủ động từ xa:
1. **Sàn TMĐT Y Tế (Medical E-Commerce)**: Cung cấp thiết bị y tế gia đình, máy đo sinh hiệu, thực phẩm chức năng và vật tư chăm sóc người cao tuổi chính hãng, đạt kiểm định chất lượng, tích hợp gian hàng CareNest Mall và tư vấn dược sĩ trực tuyến.
2. **Giám Sát Sinh Tồn 24/7 (IoT Telehealth Monitoring)**: Kết nối trực tiếp với đồng hồ định vị GPS người cao tuổi (giao thức **Wonlex V3.2**) và thiết bị đo sinh tồn Bluetooth, tự động thu thập nhịp tim, huyết áp, SpO2, thân nhiệt và bản đồ vùng an toàn Geofence.
3. **Cảnh Báo Khẩn Cấp Tức Thì (P0 Emergency)**: Phát hiện té ngã qua cảm biến gia tốc, cảnh báo nút bấm SOS khẩn cấp, cảnh báo ra khỏi vùng an toàn (Geofence) và gửi thông báo đa kênh tới người thân trong vòng < 2 giây.
4. **Chat Tư Vấn Y Tế & Hỗ Trợ Đơn Hàng (Real-Time Chat)**: Hệ thống tin nhắn thời gian thực qua Socket.IO kết nối người mua với dược sĩ/người bán, đính kèm thẻ sản phẩm và đơn hàng tương tác.

---

## 🛠️ Công Nghệ Sử Dụng (Technology Stack)

Hệ thống được thiết kế theo kiến trúc **Microservices phân tán** trên nền tảng **Monorepo**:

### 1. Kiến Trúc Monorepo & Công Cụ
- **Monorepo Manager**: [Turborepo](https://turbo.build/) — Tối ưu hóa build pipeline, caching thông minh song song.
- **Package Manager**: [pnpm 12.11.2](https://pnpm.io/) (Workspaces) — Quản lý dependencies hiệu năng cao, chống trùng lặp.
- **Ngôn ngữ chuẩn**: **TypeScript 5.6** xuyên suốt từ Frontend, Backend tới thư viện dùng chung.

### 2. Frontend Applications (`frontend/`)
- **Framework**: **Next.js 14** (App Router, Server & Client Components, React 18).
- **Styling**: **Custom CSS Design Tokens** (Vanilla CSS) với hệ thống màu y tế chuyên biệt, micro-animations, glassmorphism, responsive di động.
- **Giao tiếp Realtime**: `socket.io-client` kết nối tới `alert-service` và `chat-service`.
- **Bản đồ GIS**: Leaflet & React-Leaflet hỗ trợ giám sát GPS và thiết lập đa vùng an toàn (Geofence).
- **Icons**: Lucide React.
- **Validation**: Zod schema validation.

### 3. Backend Microservices (`backend/`)
- **Framework**: **NestJS 10** (Clean Architecture / Hexagonal Pattern) cho các dịch vụ REST API, WebSocket Gateway & Event-driven.
- **TCP Gateway**: **Node.js 22** Raw Sockets (`node:net`) — Xử lý hàng nghìn kết nối socket đồng thời từ đồng hồ Wonlex với độ trễ thấp.
- **Authentication**: JWT (Access Token + Refresh Token), Passport.js, RBAC (Role-Based Access Control), bcrypt.

### 4. Cơ Sở Dữ Liệu & Lưu Trữ
- **RDBMS & Time-Series**: **PostgreSQL 16** mở rộng với **TimescaleDB** (quản lý hypertables cho hàng triệu điểm đo nhịp tim, huyết áp, vị trí GPS theo thời gian).
- **ID Strategy**: UUID v7 (sắp xếp tự nhiên theo thời gian qua extension `pg_uuidv7`).
- **ORM**: **Prisma 5.20** — Quản lý schema 23 thực thể, migrations tự động và type-safe client.

### 5. Message Broker, Caching & Tìm Kiếm
- **Message Broker**: **Apache Kafka 3.7+** (KRaft mode không cần Zookeeper) — Phân luồng sự kiện telemetry, đơn hàng và cảnh báo SOS thời gian thực.
- **In-Memory Cache & Lock**: **Redis 7** — Caching danh mục sản phẩm, phiên kết nối IoT và Khóa phân tán (Distributed Locks).
- **Search Engine**: **MeiliSearch v1.10** — Tìm kiếm sản phẩm y tế tốc độ mili-giây, hỗ trợ tìm kiếm mờ tiếng Việt.

---

## 📂 Cấu Trúc Dự Án (Repository Structure)

```
care-nest/
├── backend/                              # Các Microservices backend (NestJS + Raw Socket)
│   ├── api-gateway/                      # [Port 8080] Unified Gateway: routing, W3C trace, CORS
│   ├── auth-service/                     # [Port 3001] Xác thực, JWT, RBAC, KYC, audit log
│   ├── catalog-service/                  # [Port 3002] Sản phẩm, danh mục y tế, KYC onboarding, Redis cache
│   ├── device-service/                   # [Port 3003] Quản lý IMEI Wonlex, gán thiết bị, geofence, telemetry
│   ├── order-service/                    # [Port 3004] Multi-vendor cart, state machine đơn hàng, review
│   ├── payment-service/                  # [Port 3005] Cổng VNPay, MoMo, VietQR, COD & Giả lập thanh toán
│   ├── notification-service/             # [Port 3006] Push Notification (VAPID), SMS, Zalo, Email
│   ├── alert-service/                    # [Port 3007] Động cơ phát hiện bất thường, Geofence & WS alerts
│   ├── subscription-service/             # [Port 3008] Gói cước SIM IoT & dịch vụ định kỳ
│   ├── shipping-service/                 # [Port 3009] Đối tác vận chuyển GHN/GHTK, webhook theo dõi
│   ├── chat-service/                     # [Port 3010] Socket.IO Realtime Chat Buyer <-> Seller & Telehealth
│   └── iot-gateway/                      # [Port 18800] TCP Socket Server Wonlex V3.2 → Kafka
│
├── frontend/                             # Các ứng dụng giao diện Next.js 14
│   ├── web-buyer/                        # [Port 3000] Sàn CareNest Mall, Geofence, Giả lập thanh toán, Live Chat
│   ├── web-seller/                       # [Port 3020] Portal Người bán, Quét IMEI, Kho, Live Chat Inbox 3 cột
│   └── web-admin/                        # [Port 3030] Quản trị sàn, duyệt KYC, trực ban SOS
│
├── packages/                             # Các thư viện dùng chung (Shared Packages)
│   ├── shared-types/                     # 🟢 Branded IDs, Enums, Zod DTO schemas (FE + BE)
│   ├── shared-config/                    # 🟢 Zod Env loaders, hằng số service, Kafka topics (FE + BE)
│   ├── shared-utils/                     # 🟢 Structured logger, retry, timeout helpers (FE + BE)
│   ├── common-dto/                       # 🟢 DTO chia sẻ giữa các tầng dịch vụ (FE + BE)
│   ├── iot-codec/                        # 🟡 Bộ giải mã gói tin Wonlex V3.2 (BE + IoT)
│   ├── database/                         # 🔴 Prisma client, 23 schema models, Timescale (BE only)
│   ├── prisma-client/                    # 🔴 Standalone Prisma client wrapper & tenant helpers (BE only)
│   ├── nestjs-common/                    # 🔴 NestJS modules dùng chung: Prisma, Redis, Kafka, Metrics (BE only)
│   ├── shared-kafka/                     # 🔴 Typed Kafka Producer & Consumer retry+DLQ (BE only)
│   └── shared-redis/                     # 🔴 Redis singleton, cache helpers, distributed lock (BE only)
│
├── infrastructure/                       # Hạ tầng & Triển khai Docker, K8s Helm
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
Tạo Prisma Client và áp dụng cấu trúc 23 bảng vào PostgreSQL:
```bash
# Định dạng schema
pnpm --filter @carenest/database db:format

# Sinh Prisma Client
pnpm --filter @carenest/database db:generate

# Biên dịch package database
pnpm --filter @carenest/database build

# Chạy migration tạo bảng
pnpm --filter @carenest/database db:migrate
```

---

### 5. Khởi Động Chế Độ Phát Triển (Development Mode)

#### Chạy toàn bộ hệ thống đồng thời:
```bash
pnpm dev
```

#### Hoặc chạy riêng lẻ từng ứng dụng / dịch vụ:
```bash
# Frontend Web Buyer (Cổng khách hàng & Gia đình)
pnpm --filter @carenest/web-buyer dev        # http://localhost:3000

# Frontend Web Seller (Cổng nhà bán hàng)
pnpm --filter @carenest/web-seller dev       # http://localhost:3020

# Backend Chat Service (Socket.IO + REST Chat Realtime)
pnpm --filter @carenest/chat-service dev      # http://localhost:3010

# Backend Alert Service (WebSocket cảnh báo khẩn cấp)
pnpm --filter @carenest/alert-service dev     # http://localhost:3007

# Backend API Gateway (Cổng hợp nhất)
pnpm --filter @carenest/api-gateway dev       # http://localhost:8080
```

---

## 📡 Danh Sách Cổng Dịch Vụ Mặc Định (Port Mapping)

| Dịch vụ / Ứng dụng | Cổng (Port) | Giao thức | Mô tả |
| :--- | :---: | :---: | :--- |
| **`web-buyer`** | `3000` | HTTP | Cổng Mua sắm CareNest Mall, Geofence, Live Chat |
| **`web-seller`** | `3020` | HTTP | Cổng Người bán: Quét IMEI, Kho, Quản lý Chat 3 cột |
| **`web-admin`** | `3030` | HTTP | Cổng Quản trị sàn, Duyệt KYC, Trực ban SOS |
| **`api-gateway`** | `8080` | HTTP | Unified API Gateway (Định tuyến toàn bộ dịch vụ) |
| **`auth-service`** | `3001` | HTTP | Xác thực, JWT, MFA, RBAC, KYC, Audit log |
| **`catalog-service`** | `3002` | HTTP | Quản lý sản phẩm, danh mục y tế, onboarding |
| **`device-service`** | `3003` | HTTP + Kafka | Đăng ký IMEI Wonlex, gán thiết bị, geofence |
| **`order-service`** | `3004` | HTTP + Kafka | Giỏ hàng, vòng đời đơn hàng, đánh giá review |
| **`payment-service`** | `3005` | HTTP + Webhooks | Thanh toán VNPay, MoMo, VietQR, Giả lập thanh toán |
| **`notification-service`**| `3006` | HTTP + Kafka | Push VAPID, SMS, Email, Zalo thông báo |
| **`alert-service`** | `3007` | HTTP + WS + Kafka | Cảnh báo sinh tồn, té ngã, SOS, Socket.IO push |
| **`subscription-service`** | `3008` | HTTP + Kafka | Gói cước SIM IoT & dịch vụ định kỳ |
| **`shipping-service`** | `3009` | HTTP + Webhooks | Vận chuyển GHN, GHTK, webhook theo dõi |
| **`chat-service`** | `3010` | HTTP + WS | Socket.IO Chat Realtime Buyer <-> Seller & Dược sĩ |
| **`iot-gateway`** | `18800` | TCP Socket | Cổng tiếp nhận gói tin thô Wonlex V3.2 |
| **PostgreSQL / Timescale** | `5432` | TCP | Cơ sở dữ liệu chính + Hypertables sinh tồn |
| **Redis** | `6379` | TCP | Bộ nhớ đệm Cache & Distributed Lock |
| **Kafka Broker** | `9092 / 9094` | TCP | Hàng đợi sự kiện KRaft |
| **MeiliSearch** | `7700` | HTTP | Máy chủ tìm kiếm sản phẩm nhanh |

---

## 📄 Bản Quyền & Giấy Phép
Dự án thuộc sở hữu của đội ngũ phát triển **CareNest** — All rights reserved © 2026.
