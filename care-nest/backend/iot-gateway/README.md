# `@carenest/iot-gateway`

TCP Server hiệu năng cao xử lý giao thức Wonlex V3.2 từ đồng hồ thông minh GPS người cao tuổi.

## Trách nhiệm chính
- Lắng nghe raw TCP sockets trên cổng `18800`.
- Phân tích và giải mã packet Wonlex V3.2 (`[3G*IMEI*LEN*CMD...]`) qua `@carenest/iot-codec`.
- Xử lý các gói tin nghiệp vụ:
  - `login` — Xác thực IMEI thiết bị và duy trì session socket.
  - `LK` (heartbeat) — Cập nhật bước đi, mức pin, trạng thái hoạt động.
  - `UD` (location) — Tọa độ GPS/LBS/WiFi.
  - `bphrt` / `oxygen` / `btemp2` — Huyết áp, nhịp tim, SpO2, thân nhiệt.
  - `SOS` / `fall` — Cảnh báo khẩn cấp tức thời (P0 alert).
- Xuất bản các sự kiện đã được chuẩn hóa vào Apache Kafka (`@carenest/shared-kafka`).

## Cấu trúc thư mục
```
src/
├── main.ts                    # Entry point khởi động TCP Server
├── server/
│   ├── tcp-server.ts          # net.Server lifecycle & quản lý port 18800
│   └── connection-handler.ts  # Buffer chunking, timeout & error handling
├── sessions/
│   └── session-manager.ts     # Registry lưu giữ active TCP sockets theo IMEI
├── handlers/
│   └── packet-dispatcher.ts   # Định tuyến gói tin theo loại lệnh
└── kafka/
    └── telemetry-publisher.ts # Xuất bản messages lên Kafka topics
```

## Chạy cục bộ
```bash
pnpm --filter @carenest/iot-gateway dev
```
Hoặc qua Docker:
```bash
docker compose --profile full up -d iot-gateway
```
