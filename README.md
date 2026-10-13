# CareNest — Hệ Sinh Thái TMĐT Y Tế & Giám Sát Sức Khỏe IoT

Chào mừng bạn đến với kho lưu trữ tổng thể của dự án **CareNest** (Medical E-Commerce + Wonlex IoT Telehealth Platform).

---

## 🧭 Cấu Trúc Toàn Bộ Không Gian Làm Việc (Workspace Layout)

Không gian làm việc bao gồm 3 phân hệ chính:

```
tmdt/
├── care-nest/              # 🏥 Core Monorepo: Frontend Next.js + Backend Microservices + Packages
├── device_simulator/       # ⌚ Flutter Desktop App: Giả lập đồng hồ thông minh Wonlex V3.2
├── docs/                   # 📚 Tài liệu kiến trúc, FSD, báo cáo BMC và đề xuất dự án
└── plans/                  # 📋 Kế hoạch triển khai kỹ thuật theo từng Phase
```

---

## 🚀 Lối Tắt Đến Các Dự Án

### 1. Nền Tảng Chính CareNest (`care-nest/`)
Xem chi tiết kiến trúc, công nghệ và hướng dẫn cài đặt chạy monorepo tại:  
👉 **[Xem tài liệu CareNest Monorepo](./care-nest/README.md)**

- **Frontend**: Next.js 14 App Router (`web-buyer`, `web-seller`, `web-admin`)
- **Backend Microservices**: NestJS 10 (`auth-service`, `catalog-service`, `device-service`, `iot-gateway`, v.v.)
- **Cơ sở dữ liệu**: PostgreSQL 16 + TimescaleDB + Prisma ORM
- **Hàng đợi & Cache**: Apache Kafka 3.7+ & Redis 7

```bash
# Di chuyển vào monorepo
cd care-nest
pnpm install
docker compose -f docker-compose.dev.yml up -d
pnpm dev
```

---

### 2. Bộ Giả Lập Thiết Bị Wonlex (`device_simulator/`)
Ứng dụng Flutter Desktop giả lập đồng hồ định vị GPS Wonlex KT24S / Wonlex V3.2:
- Kết nối trực tiếp qua TCP Socket tới `iot-gateway` (cổng `18800`).
- Giả lập gửi tọa độ GPS, nhịp tim, huyết áp, SpO2, thân nhiệt định kỳ.
- Nút bấm mô phỏng sự cố té ngã (Fall detection) và kích hoạt cuộc gọi khẩn cấp SOS.

👉 **[Xem tài liệu Device Simulator](./device_simulator/README.md)**

```bash
# Di chuyển vào device_simulator
cd device_simulator
flutter run -d windows
```

---

### 3. Tài Liệu Dự Án (`docs/`)
- [Đề Xuất Dự Án CareNest](./docs/carenest-de-xuat.md)
- [Báo Cáo Mô Hình Kinh Doanh (BMC Report)](./docs/carenest-bmc-report.md)
- [Kiến Trúc Hệ Thống (System Architecture)](./docs/system-architecture.md)
- [Quy Chuẩn Code & Lộ Trình Phát Triển](./docs/development-roadmap.md)
