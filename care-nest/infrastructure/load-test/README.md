# 🚀 CareNest - Bộ Kiểm Thử Tải & Hiệu Năng Hệ Thống (k6 Load Testing Suite)

Bộ kịch bản kiểm thử tải toàn diện cho hệ sinh thái CareNest theo đặc tả kỹ thuật **Giai đoạn 3 (Phase 3: Thử nghiệm và Thẩm định)**:
- **FR-3.2 & NFR-3.1**: Buyer Journey Baseline (Hành trình người mua hoàn chỉnh).
- **FR-3.3**: Sustained Stress Test tại **1,000 req/s** liên tục trong 5 phút.
- **FR-3.4**: WebSocket / Realtime Chat Concurrency & Message Latency.
- **FR-3.5**: IoT Telemetry & Device Query Capacity.
- **FR-3.10**: Soak / Endurance Test (Kiểm tra rò rỉ bộ nhớ, cạn kiệt connection pool).
- **FR-3.11**: Flash Sale / Spike Test (Đột biến tải gấp 5-10 lần trong 60 giây).
- **FR-3.13**: Concurrent Payment Callbacks & Idempotency (200 webhook đồng thời, chống trùng đơn).

---

## 📊 Tiêu Chuẩn Cam Kết Hiệu Năng (SLA & Thresholds)

| Chỉ số (Metric) | Baseline (Chuẩn) | Stress (1,000 req/s) | Spike (Flash Sale) | Webhook / Payment |
| :--- | :--- | :--- | :--- | :--- |
| **P95 Latency** | `< 300ms` (NFR-3.1) | `< 500ms` | `< 1200ms` | `< 400ms` |
| **P99 Latency** | `< 1000ms` (NFR-3.2) | `< 1500ms` | `< 3000ms` | `< 1200ms` |
| **Tỷ lệ lỗi (Error Rate)** | `< 0.1%` (99.9% OK) | `< 1%` | `< 5%` (Rate limited) | `< 0.05%` |
| **WebSocket P95 Latency** | `< 1000ms` (Handshake) | - | - | `< 2000ms` (Chat Ack) |

---

## 📁 Cấu Trúc Thư Mục

```
care-nest/infrastructure/load-test/
├── config/
│   ├── env.js                # Cấu hình BASE_URL, WS_URL, tài khoản test
│   └── thresholds.js         # Khai báo ngưỡng SLA (P95, P99, error rate)
├── helpers/
│   ├── auth.js               # Đăng nhập lấy JWT và cache token cho VUs
│   └── data-generators.js    # Sinh dữ liệu ngẫu nhiên (địa chỉ VN, payload checkout, vitals)
├── scripts/
│   ├── api-baseline.js       # FR-3.2: Hành trình người mua (PLP -> Search -> PDP -> Cart -> Checkout)
│   ├── api-stress.js         # FR-3.3: Duy trì 1,000 req/s trong 5 phút
│   ├── spike-test.js         # FR-3.11: Đột biến Flash sale (200 -> 2,000 req/s trong 60s)
│   ├── soak-test.js          # FR-3.10: Kiểm thử ngâm (15m - 2h) phát hiện leak bộ nhớ
│   ├── payment-load.js       # FR-3.13: 200 webhook thanh toán đồng thời & deduping idempotency
│   ├── websocket-load.js     # FR-3.4: Tải kết nối Socket.IO chat và đo độ trễ tin nhắn
│   └── iot-telemetry-load.js # FR-3.5: Truy vấn dữ liệu chỉ số sức khỏe IoT thời gian thực
├── docker-compose.load-test.yml # Docker Compose tích hợp k6 + InfluxDB + Grafana
└── package.json              # Lệnh npm chạy nhanh
```

---

## ⚡ Hướng Dẫn Chạy Kiểm Thử

### Cách 1: Chạy bằng Docker (Khuyến nghị - Không cần cài đặt k6 trên máy)

Image `grafana/k6:latest` đã sẵn sàng trên máy của bạn. Chạy trực tiếp từ thư mục `care-nest/infrastructure/load-test`:

#### 1. Hành trình người mua (Baseline):
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run scripts/api-baseline.js
```
*(Trên Linux / macOS hoặc Git Bash, thay `"%cd%"` bằng `"$PWD"`)*

#### 2. Kiểm thử áp lực cao (Stress Test 1,000 req/s):
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run scripts/api-stress.js
```

#### 3. Kiểm thử đột biến Flash Sale (Spike Test):
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run scripts/spike-test.js
```

#### 4. Kiểm thử ngâm chịu tải bền bỉ (Soak Test):
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run -e SOAK_DURATION=15m scripts/soak-test.js
```

#### 5. Kiểm thử đối soát Webhook thanh toán đồng thời (Payment Concurrency):
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run scripts/payment-load.js
```

#### 6. Kiểm thử Chat thời gian thực WebSocket:
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run scripts/websocket-load.js
```

#### 7. Kiểm thử truy vấn IoT Telemetry:
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run scripts/iot-telemetry-load.js
```

---

### Cách 2: Chạy trực tiếp qua k6 CLI (Nếu đã cài k6 trên máy)

Nếu bạn đã có `k6` trong PATH:
```bash
cd care-nest/infrastructure/load-test

# Sử dụng npm scripts
npm run test:baseline
npm run test:stress
npm run test:spike
npm run test:payment
npm run test:ws
npm run test:iot
```

---

### Cách 3: Trực Quan Hóa Kết Quả Theo Thời Gian Thực Trên Grafana

Hệ thống hỗ trợ 2 góc nhìn giám sát trực tiếp qua Grafana:

#### 🔹 Góc nhìn 1: Dashboard k6 Load Testing (Client-Side - Độ trễ, VUs, RPS thực tế)
Tự động cấu hình sẵn DataSource InfluxDB và Dashboard k6 (không cần setup tay):
1. **Khởi động InfluxDB và Grafana tải**:
   ```bash
   npm run dashboard:up
   # hoặc: docker-compose -f docker-compose.load-test.yml up -d influxdb grafana
   ```
2. **Truy cập Dashboard**: Mở trình duyệt tại **`http://localhost:3000`** -> Vào mục Dashboards -> Chọn **`CareNest - k6 Load Testing Dashboard`** (Đã mở sẵn quyền Admin ẩn danh).
3. **Bắn tải có đẩy dữ liệu về Grafana**:
   ```bash
   # Chạy kịch bản Stress test bắn metrics về InfluxDB
   docker-compose -f docker-compose.load-test.yml run --rm k6 run scripts/api-stress.js

   # Hoặc chạy Baseline test
   docker-compose -f docker-compose.load-test.yml run --rm k6 run scripts/api-baseline.js
   ```
4. **Dừng dashboard sau khi test xong**:
   ```bash
   npm run dashboard:down
   ```

#### 🔹 Góc nhìn 2: Dashboard Giám Sát Toàn Hệ Thống (Server-Side - CPU, RAM, DB Pool, Microservices)
Nếu bạn đang chạy cụm microservices của CareNest qua Docker:
1. **Khởi động cụm Observability có sẵn trong dự án**:
   ```bash
   docker compose -f docker-compose.dev.yml --profile monitoring up -d
   ```
2. **Truy cập Grafana hệ thống**: Mở **`http://localhost:3100`** (Tài khoản: `admin` / `admin`).
3. **Các Dashboard có sẵn**:
   - `CareNest - System Overview`: Tổng quan RPS, P95/P99 latency toàn bộ 10 microservices.
   - `CareNest - API Gateway`: Phân bổ tải các route qua Gateway.
   - `CareNest - Order / Payment / Catalog Service`: Mức độ tiêu thụ CPU, RAM, Postgres connection pool, Redis cache hit rate.

---

## ⚙️ Tùy Biến Tham Số Môi Trường

Bạn có thể truyền các biến môi trường qua cờ `-e` của k6:

| Biến (Variable) | Mặc định | Ý nghĩa |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:8080` | URL của CareNest API Gateway hoặc môi trường Staging |
| `WS_URL` | `http://localhost:3010` | Endpoint WebSocket Chat Service |
| `SOAK_DURATION` | `15m` | Thời gian chạy của bài kiểm thử ngâm (ví dụ: `2h`, `4h`) |
| `BUYER_EMAIL` | `buyer@carenest.vn` | Email tài khoản buyer thử nghiệm |
| `BUYER_PASSWORD` | `Buyer@123456` | Mật khẩu tài khoản buyer |

Ví dụ bắn test vào môi trường Staging:
```bash
docker run --rm -i -v "%cd%:/load-test" -w /load-test grafana/k6 run \
  -e BASE_URL=https://staging.carenest.vn \
  -e WS_URL=https://staging.carenest.vn \
  scripts/api-baseline.js
```

---

## 📈 Cách Đọc Báo Cáo Kết Quả k6

Khi bài test kết thúc, k6 sẽ in ra bảng tổng kết:
- **`http_req_duration`**: Thời gian phản hồi request (kiểm tra `p(95)` và `p(99)` có đạt dấu tích xanh `✓` so với SLA không).
- **`http_req_failed`**: Tỷ lệ request bị lỗi (mã `4xx`/`5xx`). Yêu cầu đạt tỷ lệ thất bại `< 0.1%`.
- **`http_reqs`**: Tổng số lượng request đã xử lý và tốc độ trung bình (req/s).
- **`checks`**: Tỷ lệ các điều kiện kiểm tra nghiệp vụ (status 200, format JSON, id đơn hàng) thành công.
