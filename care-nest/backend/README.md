# `backend/` — Microservices Nền Tảng CareNest

Kiến trúc Backend phân tán theo hướng Microservices, sử dụng **NestJS** (Clean/Hexagonal Architecture) cho các dịch vụ HTTP/Event-driven và **Node.js Raw Socket** cho TCP IoT Gateway.

## Trạng Thái Các Dịch Vụ

| Service | Port | Giao Thức | Trách Nhiệm | Trạng Thái |
|---|---|---|---|---|
| **`auth-service/`** | `3001` | HTTP / REST | Đăng ký, đăng nhập, JWT tokens, RBAC, MFA TOTP, audit log, KYC verification | ✅ **Scaffolded** (Phase 1) |
| **`catalog-service/`** | `3002` | HTTP / REST | Quản lý sản phẩm, danh mục y tế, KYC seller onboarding, Redis Caching | ✅ **Scaffolded** (Phase 1) |
| **`device-service/`** | `3003` | HTTP + Kafka | Đăng ký IMEI Wonlex, gán thiết bị, geofence, theo dõi telemetry | ✅ **Scaffolded** (Phase 1) |
| **`iot-gateway/`** | `18800` | TCP Raw Socket | Xử lý gói tin Wonlex V3.2, giải mã sinh tồn, publish Kafka | ✅ **Scaffolded** (Phase 1) |
| **`order-service/`** | `3004` | HTTP + Kafka | Multi-vendor cart, state machine đơn hàng, inventory hold, ORDER_CREATED/SHIPPED | ✅ **Scaffolded** (Phase 1) |
| **`payment-service/`** | `3005` | HTTP + Webhooks | Tích hợp VNPay (HMAC-SHA512), MoMo (HMAC-SHA256), COD; escrow 7 ngày; idempotency | ✅ **Scaffolded** (Phase 1) |
| **`notification-service/`** | `3006` | HTTP + Kafka | Email/SMS/Push (mock), 11 template tiếng Việt, consumer ORDER_/ALERT_ topics | ✅ **Scaffolded** (Phase 1) |
| **`alert-service/`** | `3007` | HTTP + Kafka + WS | Vitals thresholds, SOS, fall, geofence, low-battery, Socket.IO push <5s | ✅ **Scaffolded** (Phase 1) |
| `inventory-service/` | `3010` | HTTP / Kafka | Quản lý kho đa điểm, giữ hàng tồn | ⏳ Kế hoạch Phase 2 |
| `health-service/` | `3008` | HTTP + TSDB | Lưu trữ time-series vitals vào TimescaleDB | ⏳ Kế hoạch Phase 2 |
| `analytics-service/` | `3010` | HTTP / Olap | Phân tích doanh số người bán, xu hướng sức khỏe | ⏳ Kế hoạch Phase 3 |

---

## Chuẩn Kiến Trúc Trong Từng Service
Mỗi service HTTP tuân thủ cấu trúc phân tầng rõ ràng:
```
<service>/
├── src/
│   ├── <domain>/
│   │   ├── <domain>.controller.ts # Lớp giao tiếp HTTP (chỉ validate input DTO)
│   │   ├── <domain>.service.ts    # Lớp nghiệp vụ chuyên biệt
│   │   ├── <domain>.repository.ts # Lớp tương tác DB qua @carenest/database
│   │   └── dto/                   # Zod schemas & DTO types
│   ├── app.module.ts
│   └── main.ts
```

## Chạy Thử
```bash
# Chạy một service cụ thể
pnpm --filter @carenest/auth-service dev
pnpm --filter @carenest/catalog-service dev
pnpm --filter @carenest/device-service dev
pnpm --filter @carenest/iot-gateway dev
pnpm --filter @carenest/order-service dev
pnpm --filter @carenest/payment-service dev
pnpm --filter @carenest/notification-service dev
pnpm --filter @carenest/alert-service dev
```
