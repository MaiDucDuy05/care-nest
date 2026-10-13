# `@carenest/device-service`

Dịch vụ Quản lý Vòng đời & Gán Thiết bị IoT (Wonlex V3.2 GPS Watches) trên nền tảng CareNest.

## Trách nhiệm chính
- Đăng ký và quản lý danh sách thiết bị (IMEI 10-15 chữ số, model, firmware, battery, lastSeen).
- Gán/hủy gán thiết bị cho người cao tuổi / bệnh nhân (`DeviceAssignment`).
- Lắng nghe Kafka events (`iot.heartbeat.received`, `iot.location.received`, `iot.vitals.received`) để cập nhật trạng thái sống (heartbeat), pin và vị trí gần nhất vào cơ sở dữ liệu.
- Cung cấp API quản lý thiết bị cho Mobile / Web app của gia đình và Caregiver.

## Cấu trúc thư mục
```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap HTTP server (Port: 3003)
├── devices/
│   ├── devices.module.ts
│   ├── devices.controller.ts  # /api/v1/devices
│   ├── devices.service.ts     # Business logic
│   ├── devices.repository.ts  # Prisma queries
│   └── dto/                   # Register, update, response DTOs
├── assignments/
│   ├── assignments.module.ts
│   ├── assignments.controller.ts # /api/v1/assignments
│   ├── assignments.service.ts
│   └── dto/
└── telemetry/
    ├── telemetry.module.ts
    ├── telemetry.consumer.ts  # Kafka consumer lắng nghe telemetry events
    └── telemetry.service.ts
```

## Chạy cục bộ
```bash
pnpm --filter @carenest/device-service dev
```
