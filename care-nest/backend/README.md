# `backend/` — Microservices Nền Tảng CareNest

Kiến trúc Backend phân tán theo hướng Microservices, sử dụng **NestJS** (Clean/Hexagonal Architecture) cho các dịch vụ HTTP/Event-driven và **Node.js Raw Socket** cho TCP IoT Gateway.

## Trạng Thái Các Dịch Vụ

| Service | Port | Giao Thức | Trách Nhiệm | Trạng Thái |
|---|---|---|---|---|
| **`auth-service/`** | `3001` | HTTP / REST | Đăng ký, đăng nhập, JWT tokens, RBAC, KYC verification | ✅ **Scaffolded** (Phase 1) |
| **`catalog-service/`** | `3002` | HTTP / REST | Quản lý sản phẩm, danh mục y tế, tích hợp Redis Caching | ✅ **Scaffolded** (Phase 1) |
| **`device-service/`** | `3003` | HTTP + Kafka | Đăng ký IMEI Wonlex, gán thiết bị, theo dõi telemetry | ✅ **Scaffolded** (Phase 1) |
| **`iot-gateway/`** | `18800` | TCP Raw Socket | Xử lý gói tin Wonlex V3.2, giải mã sinh tồn, publish Kafka | ✅ **Scaffolded** (Phase 1) |
| `order-service/` | `3004` | HTTP / REST | Tạo đơn hàng, giỏ hàng, tracking đơn | ⏳ Kế hoạch Phase 2 |
| `payment-service/` | `3005` | HTTP / REST | Tích hợp cổng VNPay, MoMo, ZaloPay, COD | ⏳ Kế hoạch Phase 2 |
| `inventory-service/` | `3006` | HTTP / Kafka | Quản lý kho đa điểm, giữ hàng tồn | ⏳ Kế hoạch Phase 2 |
| `health-service/` | `3007` | HTTP + TSDB | Lưu trữ time-series vitals vào TimescaleDB | ⏳ Kế hoạch Phase 3 |
| `alert-engine/` | `3008` | Kafka Consumer | Đánh giá ngưỡng bất thường y tế, cảnh báo người nhà | ⏳ Kế hoạch Phase 3 |
| `notification-service/` | `3009` | Kafka Consumer | Push notification, SMS, Zalo ZNS, Email | ⏳ Kế hoạch Phase 3 |
| `analytics-service/` | `3010` | HTTP / Olap | Phân tích doanh số người bán, xu hướng sức khỏe | ⏳ Kế hoạch Phase 4 |

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
```
