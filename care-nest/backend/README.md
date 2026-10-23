# `backend/` — Microservices Nền Tảng CareNest

Kiến trúc Backend phân tán theo hướng **Event-driven Microservices**, sử dụng **NestJS** (Clean & Hexagonal Architecture) cho các dịch vụ HTTP/Event-driven và **Node.js Raw TCP Socket** cho IoT Gateway (Wonlex Protocol V3.2).

---

## 📋 Danh Mục Toàn Bộ Dịch Vụ (Service Catalog)

Hệ thống backend CareNest bao gồm **11 dịch vụ độc lập** (10 HTTP/WebSocket/Kafka services và 1 TCP IoT Gateway):

| Service | Port | Giao Thức | Trách Nhiệm & Chức Năng Chính | Endpoint Kiểm Tra | Grafana Dashboard |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **`api-gateway`** | `8080` | HTTP Proxy | Unified API Gateway: routing, W3C tracecontext, metrics & CORS | [`:8080/metrics`](http://localhost:8080/metrics) | [Dashboard](http://localhost:3100/d/carenest-api-gateway) |
| **`auth-service`** | `3001` | HTTP / REST | Đăng ký, đăng nhập, JWT tokens, RBAC, MFA TOTP, audit log, KYC | [`:3001/health/livez`](http://localhost:3001/health/livez) | [Dashboard](http://localhost:3100/d/carenest-auth-service) |
| **`catalog-service`** | `3002` | HTTP / REST | Quản lý sản phẩm, danh mục y tế, KYC seller onboarding, Redis Caching | [`:3002/health/livez`](http://localhost:3002/health/livez) | [Dashboard](http://localhost:3100/d/carenest-catalog-service) |
| **`device-service`** | `3003` | HTTP + Kafka | Đăng ký IMEI Wonlex, gán thiết bị, geofence, theo dõi telemetry | [`:3003/health/livez`](http://localhost:3003/health/livez) | [Dashboard](http://localhost:3100/d/carenest-device-service) |
| **`order-service`** | `3004` | HTTP + Kafka | Multi-vendor cart, state machine đơn hàng, inventory hold | [`:3004/health/livez`](http://localhost:3004/health/livez) | [Dashboard](http://localhost:3100/d/carenest-order-service) |
| **`payment-service`** | `3005` | HTTP + Webhooks | VNPay (HMAC-SHA512), MoMo (HMAC-SHA256), COD; escrow 7 ngày | [`:3005/health/livez`](http://localhost:3005/health/livez) | [Dashboard](http://localhost:3100/d/carenest-payment-service) |
| **`notification-service`** | `3006` | HTTP + Kafka | Email (SES), SMS (ESMS), Push (VAPID), ZNS (Zalo); Handlebars | [`:3006/health/livez`](http://localhost:3006/health/livez) | [Dashboard](http://localhost:3100/d/carenest-notification-service) |
| **`alert-service`** | `3007` | HTTP + Kafka + WS | Ngưỡng sinh tồn, cảnh báo SOS, ngã té, pin yếu, Socket.IO push <5s | [`:3007/metrics`](http://localhost:3007/metrics) | [Dashboard](http://localhost:3100/d/carenest-alert-service) |
| **`subscription-service`** | `3008` | HTTP + Kafka + Cron | Gói dịch vụ định kỳ, tính cước proration, cron gia hạn & hủy | [`:3008/health/livez`](http://localhost:3008/health/livez) | [Dashboard](http://localhost:3100/d/carenest-subscription-service) |
| **`shipping-service`** | `3009` | HTTP + Webhooks | Tích hợp GHN + GHTK (Sandbox), verify webhook HMAC | [`:3009/health/livez`](http://localhost:3009/health/livez) | [Dashboard](http://localhost:3100/d/carenest-shipping-service) |
| **`iot-gateway`** | `18800` | TCP Raw Socket | Xử lý gói tin Wonlex V3.2 (`[3G*...]`), giải mã sinh tồn, publish Kafka | `TCP :18800` | — |

---

## 🛠️ Yêu Cầu Tiên Quyết (Prerequisites)

Trước khi chạy bất kỳ microservice nào, bạn cần chuẩn bị môi trường:
1. **Node.js**: Phiên bản `>= 20.0.0` (Khuyên dùng `22.x` hoặc `24.x`).
2. **Package Manager**: `pnpm >= 9.0.0` (Workspace monorepo).
3. **Docker & Docker Compose**: Để chạy toàn bộ hạ tầng cơ sở dữ liệu, message queue và monitoring stack.

---

## 🚀 Hướng Dẫn Khởi Chạy Từng Bước (Step-by-Step)

### Bước 1: Khởi động Hạ tầng Docker (Database, Kafka, Redis, Monitoring)

Tại thư mục gốc dự án (`care-nest/`):
```bash
# Khởi động toàn bộ container hạ tầng (Postgres, Redis, Kafka, Meilisearch, Prometheus, Grafana)
docker compose -f docker-compose.dev.yml --profile full up -d
```

> **Kiểm tra trạng thái các container:**
> ```bash
> docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
> ```
> Cần đảm bảo `carenest-postgres`, `carenest-redis`, `carenest-kafka`, `carenest-prometheus`, `carenest-grafana` đang ở trạng thái `Up`.

---

### Bước 2: Khởi tạo các Kafka Topics

Kafka broker KRaft cần được khởi tạo trước 25 topics nghiệp vụ để tránh lỗi `This server does not host this topic-partition`:
```bash
# Trên Windows PowerShell / Command Prompt:
docker exec -i carenest-kafka bash < infrastructure/init-topics.sh

# Hoặc trên Linux / macOS / Git Bash:
bash infrastructure/init-topics.sh
```

---

### Bước 3: Đồng bộ Database (Prisma Client & Migration)

Sinh mã Prisma Client và cập nhật schema lên PostgreSQL:
```bash
# 1. Sinh Prisma Client
pnpm --filter @carenest/database db:generate

# 2. Đẩy schema vào PostgreSQL (Dev mode)
pnpm --filter @carenest/database db:push

# (Tùy chọn) Mở giao diện trực quan Prisma Studio
pnpm --filter @carenest/database db:studio
```

---

### Bước 4: Build các Shared Libraries

Đảm bảo các package dùng chung được build đầy đủ types và modules:
```bash
pnpm --filter @carenest/nestjs-common build
```

---

### Bước 5: Chạy các Microservices

Bạn có thể chạy từng service trong từng tab Terminal riêng (khuyên dùng trong lúc debug), hoặc chạy đồng loạt.

#### Cách 1: Chạy TỪNG service cụ thể (Mở Terminal riêng cho mỗi service)

```bash
# 1. API Gateway (Port 8080)
pnpm --filter @carenest/api-gateway dev

# 2. Auth Service (Port 3001)
pnpm --filter @carenest/auth-service dev

# 3. Catalog Service (Port 3002)
pnpm --filter @carenest/catalog-service dev

# 4. Device Service (Port 3003)
pnpm --filter @carenest/device-service dev

# 5. Order Service (Port 3004)
pnpm --filter @carenest/order-service dev

# 6. Payment Service (Port 3005)
pnpm --filter @carenest/payment-service dev

# 7. Notification Service (Port 3006)
pnpm --filter @carenest/notification-service dev

# 8. Alert Service (Port 3007)
pnpm --filter @carenest/alert-service dev

# 9. Subscription Service (Port 3008)
pnpm --filter @carenest/subscription-service dev

# 10. Shipping Service (Port 3009)
pnpm --filter @carenest/shipping-service dev

# 11. IoT Gateway (TCP Port 18800)
pnpm --filter @carenest/iot-gateway dev
```

#### Cách 2: Chạy TẤT CẢ các service Backend cùng một lúc

Từ thư mục gốc dự án:
```bash
# Chạy đồng thời tất cả các service trong thư mục backend/
pnpm --filter "./backend/*" dev
```

---

## 📊 Giám Sát Hệ Thống & Metrics (Prometheus + Grafana)

Tất cả các dịch vụ backend đều được tích hợp sẵn `MetricsModule` xuất dữ liệu chuẩn Prometheus tại `GET /metrics`.

- **Grafana URL:** [http://localhost:3100](http://localhost:3100) (Tài khoản: `admin` / `admin`)
- **Prometheus URL:** [http://localhost:9090](http://localhost:9090)

### Danh Sách Grafana Dashboards Được Cấu Hình Sẵn:

| Dashboard | URL Trực Tiếp | Mô Tả |
| :--- | :--- | :--- |
| **All Microservices Overview** | [Xem ngay](http://localhost:3100/d/carenest-microservices-overview) | Tổng quan toàn bộ hệ thống, Health grid UP/DOWN, RPS, tổng lỗi 4xx/5xx, RAM heap |
| **Service Deep-Dive** | [Xem ngay](http://localhost:3100/d/carenest-service-deep-dive) | Soi chiếu chi tiết từng service bằng dropdown filter |
| **API Gateway** | [Xem ngay](http://localhost:3100/d/carenest-api-gateway) | Giám sát throughput proxy, tracecontext, CORS |
| **Auth Service** | [Xem ngay](http://localhost:3100/d/carenest-auth-service) | Lượng đăng nhập/đăng ký, token verification, MFA |
| **Catalog Service** | [Xem ngay](http://localhost:3100/d/carenest-catalog-service) | Truy vấn sản phẩm, hit-rate cache Redis, KYC |
| **Device Service** | [Xem ngay](http://localhost:3100/d/carenest-device-service) | Kích hoạt IMEI, kết nối telemetry, geofence |
| **Order Service** | [Xem ngay](http://localhost:3100/d/carenest-order-service) | Đơn hàng tạo mới, giỏ hàng, hold kho |
| **Payment Service** | [Xem ngay](http://localhost:3100/d/carenest-payment-service) | Giao dịch VNPay/MoMo/COD, hoàn tiền, webhooks |
| **Notification Service** | [Xem ngay](http://localhost:3100/d/carenest-notification-service) | Dispatcher email, SMS, push notifications |
| **Alert Service** | [Xem ngay](http://localhost:3100/d/carenest-alert-service) | Cảnh báo SOS, vi phạm ngưỡng vitals, Socket.IO push |
| **Subscription Service** | [Xem ngay](http://localhost:3100/d/carenest-subscription-service) | Trạng thái gói định kỳ, cron renewals |
| **Shipping Service** | [Xem ngay](http://localhost:3100/d/carenest-shipping-service) | Tương tác GHN/GHTK, webhook giao vận |

---

## 🏗️ Chuẩn Kiến Trúc & Cấu Trúc Mã Nguồn

Mỗi service HTTP tuân thủ mô hình phân tầng **Clean / Hexagonal Architecture**:
```
<service-name>/
├── src/
│   ├── <domain>/
│   │   ├── <domain>.controller.ts  # Tầng giao tiếp HTTP / REST (validate DTO)
│   │   ├── <domain>.service.ts     # Tầng nghiệp vụ xử lý logic chính (Use cases)
│   │   ├── <domain>.repository.ts  # Tầng tương tác DB (Prisma Client)
│   │   └── dto/                    # Zod validation schemas & Data Transfer Objects
│   ├── app.module.ts               # Khai báo Modules, imports & global middlewares
│   └── main.ts                     # Bootstrap NestJS application, port & CORS
├── test/                           # Unit tests & Integration tests (Vitest)
├── tsconfig.json
└── package.json
```

### Các Middleware & Interceptor dùng chung (từ `@carenest/nestjs-common`):
- `CorrelationIdMiddleware`: Gán và chuyển tiếp header `x-request-id` qua toàn bộ microservices.
- `RequestMetricsMiddleware`: Đo lường thời gian xử lý và ghi nhận metric `http_request_duration_seconds`.
- `LoggingInterceptor`: Xuất log có cấu trúc (NDJSON / Pino) kèm thông tin người dùng, latency, request URL.
- `HttpExceptionFilter`: Chuẩn hóa định dạng lỗi trả về `{"statusCode", "message", "error", "timestamp"}`.

---

## ❓ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Lỗi `EADDRINUSE: address already in use :::300x`
- **Nguyên nhân:** Service trước đó chưa tắt hẳn và vẫn đang chiếm port.
- **Khắc phục (Windows PowerShell):**
  ```powershell
  # Tìm PID đang giữ port (ví dụ port 3001)
  netstat -ano | findstr :3001
  # Tắt tiến trình
  Stop-Process -Id <PID> -Force
  ```

### 2. Lỗi Kafka `This server does not host this topic-partition`
- **Nguyên nhân:** Broker Kafka KRaft chưa có sẵn topic mà consumer đăng ký subscribe.
- **Khắc phục:** Chạy lại script khởi tạo topic:
  ```bash
  docker exec -i carenest-kafka bash < infrastructure/init-topics.sh
  ```

### 3. Lỗi `Cannot find module '@carenest/nestjs-common'` hoặc thiếu types
- **Khắc phục:** Chạy build lại thư viện dùng chung:
  ```bash
  pnpm --filter @carenest/nestjs-common build
  ```

### 4. Lỗi kết nối PostgreSQL `Connection refused` hoặc sai mật khẩu
- **Kiểm tra thông số kết nối mặc định:**
  - **Host:** `localhost`
  - **Port:** `5432`
  - **Database:** `carenest`
  - **User:** `carenest`
  - **Password:** `carenest_dev`
  - **Connection URL:** `postgresql://carenest:carenest_dev@localhost:5432/carenest?schema=public`

### 5. Khởi tạo dữ liệu mẫu (Database Seed Data)
Để nạp đầy đủ dữ liệu mẫu (người dùng, cửa hàng, sản phẩm, thiết bị IoT, gói dịch vụ, đơn hàng, dữ liệu nhịp tim/huyết áp, cảnh báo SOS/té ngã):
```bash
pnpm db:seed
```

**Danh sách tài khoản kiểm thử mặc định:**
| Vai trò | Email | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@carenest.vn` | `Admin@123456` | Quản trị viên hệ thống CareNest |
| **Support** | `support@carenest.vn` | `Support@123456` | Nhân viên CSKH 24/7 |
| **Seller** | `seller.wonlex@carenest.vn` | `Seller@123456` | Wonlex Vietnam Official Store |
| **Seller** | `seller.medtech@carenest.vn` | `Seller@123456` | MedTech Healthcare Vietnam |
| **Buyer** | `buyer@carenest.vn` | `Buyer@123456` | Người mua & quản lý người thân |
| **Caregiver** | `bs.minh@carenest.vn` | `123456` | Bác sĩ Lão khoa chuyên môn |

