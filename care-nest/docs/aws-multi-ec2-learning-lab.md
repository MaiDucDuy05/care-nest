# AWS multi-EC2 learning lab cho CareNest

> Mục tiêu: triển khai CareNest theo topology phân tán để học vận hành. Mỗi frontend, backend service và data component chạy trên một EC2 riêng. Đây là lab dùng AWS Free Tier/credit, không phải production và tuyệt đối không dùng dữ liệu sức khỏe hay dữ liệu khách hàng thật.

## 1. Cảnh báo chi phí và guardrails

Topology đầy đủ bên dưới có 21 EC2. Nó cố ý không tối ưu chi phí để học networking, security group, service discovery, Kafka và failure isolation.

- 21 máy chạy 24/7 dùng 504 instance-hours/ngày. Nếu ưu đãi có giới hạn 750 instance-hours/tháng, phần đó hết sau khoảng 1,5 ngày.
- Tài khoản AWS mới có credit/Free Tier khác nhau theo ngày tạo tài khoản. Luôn xem **Billing > Free Tier** để biết credit còn lại và ngày hết hạn. Xem [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html) và [theo dõi EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html).
- Budget chỉ gửi cảnh báo, không tự tắt EC2. Chỉ tạo lab khi có thời gian thao tác và đặt ngày xóa tài nguyên.

Thực hiện trước khi tạo hạ tầng:

1. Bật MFA cho root account; tạo IAM administrator riêng, không dùng root hàng ngày.
2. Trong Billing preferences, bật Free Tier usage alerts và CloudWatch billing alerts.
3. Tạo Budget gửi email ở $25, $75, $125, $175; tạo thêm zero-spend budget. Hướng dẫn AWS: [Tracking Free Tier usage](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html).
4. Chỉ dùng một region, khuyến nghị **ap-southeast-1 (Singapore)**.
5. Tag mọi resource: `Project=CareNest`, `Environment=aws-lab`, `Owner=<ten-ban>`, `DeleteAfter=YYYY-MM-DD`.
6. Không tạo NAT Gateway, ALB, RDS, ElastiCache, MSK, Elastic IP hoặc tài nguyên ở region thứ hai cho lab này.

## 2. Sơ đồ và inventory

Dùng Amazon Linux 2023 x86_64. Chọn t3.micro cho HTTP service/front-end; dùng tối thiểu t3.small cho PostgreSQL và Kafka nếu credit cho phép. Không để Kafka hay TimescaleDB chạy lâu trên t3.micro.

| EC2 | Private IP ví dụ | Một workload trên máy | Port |
|---|---:|---|---:|
| cn-edge-01 | 10.42.0.10 | Caddy reverse proxy | 80, 443 |
| cn-web-buyer-01 | 10.42.0.11 | web-buyer | 3000 |
| cn-web-seller-01 | 10.42.0.12 | web-seller | 3020 |
| cn-web-admin-01 | 10.42.0.13 | web-admin | 3030 |
| cn-api-gateway-01 | 10.42.0.20 | api-gateway | 8080 |
| cn-auth-01 | 10.42.0.21 | auth-service | 3001 |
| cn-catalog-01 | 10.42.0.22 | catalog-service | 3002 |
| cn-device-01 | 10.42.0.23 | device-service | 3003 |
| cn-order-01 | 10.42.0.24 | order-service | 3004 |
| cn-payment-01 | 10.42.0.25 | payment-service | 3005 |
| cn-notification-01 | 10.42.0.26 | notification-service | 3006 |
| cn-alert-01 | 10.42.0.27 | alert-service | 3007 |
| cn-subscription-01 | 10.42.0.28 | subscription-service | 3008 |
| cn-shipping-01 | 10.42.0.29 | shipping-service | 3009 |
| cn-chat-01 | 10.42.0.30 | chat-service | 3010 |
| cn-iot-gateway-01 | 10.42.0.31 | iot-gateway | 18800/TCP |
| cn-postgres-01 | 10.42.0.40 | PostgreSQL + TimescaleDB | 5432 |
| cn-redis-01 | 10.42.0.41 | Redis | 6379 |
| cn-kafka-01 | 10.42.0.42 | Kafka KRaft | 9092 |
| cn-meili-01 | 10.42.0.43 | MeiliSearch | 7700 |
| cn-observability-01 | 10.42.0.44 | Prometheus + Grafana, tùy chọn | 9090, 3000 |

```text
Internet
  ├── HTTPS → cn-edge-01 → buyer / seller / admin / API / chat / alert
  └── TCP 18800 → cn-iot-gateway-01 → Kafka

API gateway → các backend service
Backend / IoT → PostgreSQL, Redis, Kafka
catalog-service → MeiliSearch (khi bật search integration)
```

Không tạo cn-observability-01 ở lần đầu. Hoàn tất 20 máy còn lại và luồng nghiệp vụ trước.

## 3. Network design rẻ cho lab

Tạo VPC `10.42.0.0/16`, một public subnet `10.42.0.0/24`, Internet Gateway và route `0.0.0.0/0 → IGW`. Không dùng NAT Gateway vì NAT có phí theo giờ và theo GB.

Tất cả EC2 nằm trong subnet này để pull Docker image, cập nhật hệ điều hành và kết nối SSM. Do không có NAT Gateway, **gán public IPv4 tự động cho toàn bộ instance trong lab**, nhưng không dùng Elastic IP. Điều này không làm service public: security group vẫn chặn mọi inbound ngoại trừ 80/443 ở edge, 18800 ở IoT và SSH giới hạn IP quản trị. Mọi service-to-service traffic vẫn luôn dùng private IP. Production phải dùng private subnet, multi-AZ và NAT/VPC endpoints phù hợp.

Khi launch, đặt private IP đúng bảng inventory để biến môi trường, Caddy và tài liệu không bị đổi sau khi restart.

### Security group matrix

| Security group | Inbound | Source |
|---|---|---|
| cn-sg-edge | TCP 80, 443 | 0.0.0.0/0 |
| cn-sg-iot | TCP 18800 | 0.0.0.0/0 hoặc dải IP SIM/device |
| cn-sg-web | 3000, 3020, 3030 | cn-sg-edge |
| cn-sg-gateway | 8080 | cn-sg-edge |
| cn-sg-backend | 3001–3010 | cn-sg-gateway; thêm cn-sg-edge cho 3007 và 3010 |
| cn-sg-postgres | 5432 | cn-sg-backend |
| cn-sg-redis | 6379 | cn-sg-backend |
| cn-sg-kafka | 9092 | cn-sg-backend và cn-sg-iot |
| cn-sg-meili | 7700 | cn-sg-backend |
| cn-sg-ops | 22 | chỉ public IP của bạn; ưu tiên SSM Session Manager |

Gắn cn-sg-ops vào mọi máy. Dùng **security group làm source**, không dùng 0.0.0.0/0 cho database, broker, cache hoặc service ports.

## 4. Tạo AWS resources

1. Vào VPC > Create VPC, tạo CIDR/subnet/Internet Gateway ở trên; chọn zero NAT gateways.
2. Tạo security groups theo bảng.
3. Tạo EC2 theo inventory: Amazon Linux 2023 x86_64; EBS gp3 16–20 GB cho app, 30 GB cho PostgreSQL và Kafka.
4. Gắn instance profile tối thiểu `AmazonSSMManagedInstanceCore` để vào bằng Systems Manager > Session Manager.
5. Gán public IPv4 tự động cho mọi instance của lab để chúng có outbound internet mà không phải trả NAT Gateway; không gán Elastic IP. Chỉ cn-edge-01 mở web public và cn-iot-gateway-01 mở TCP public bằng security group.
6. Ghi lại private/public IP vào một password manager hoặc file inventory không commit Git.

Nếu thiếu credit/quota, triển khai theo lớp: data → backend → gateway/realtime → frontend. Không thay đổi Security Group thành mở toàn bộ để “test nhanh”.

### Bootstrap tất cả EC2

Chạy qua SSM, không paste secret vào User Data hay shell history:

```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
sudo mkdir -p /opt/carenest/{app,env,data}
sudo chown -R ec2-user:ec2-user /opt/carenest
```

Mở SSM session mới để Docker group có hiệu lực. Kiểm tra `docker compose version`; nếu Docker Engine của AMI chưa có Compose v2, cài Compose plugin theo [Docker Compose for Linux](https://docs.docker.com/compose/install/linux/) trước khi tiếp tục. Sau đó:

```bash
docker run --rm hello-world
git clone <URL_REPOSITORY_CUA_BAN> /opt/carenest/app
cd /opt/carenest/app
git checkout <COMMIT_SHA_DA_TEST>
```

Ở lab đầu tiên, build image ngay trên mỗi VM để dễ debug. ECR/CI/CD là bài học kế tiếp sau khi topology hoạt động.

## 5. Data layer: triển khai trước

Tạo mật khẩu mạnh bằng `openssl rand -base64 32`. Lưu từng secret tại `/opt/carenest/env/*.env`, chạy `chmod 600`. Không dùng secret `carenest_dev` của local environment trên AWS.

### 5.1 PostgreSQL + TimescaleDB trên cn-postgres-01

Tạo `/opt/carenest/data/compose.yml`:

```yaml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    restart: unless-stopped
    env_file: /opt/carenest/env/postgres.env
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U carenest -d carenest"]
      interval: 10s
      timeout: 5s
      retries: 10
volumes:
  postgres_data:
```

`postgres.env`:

```dotenv
POSTGRES_USER=carenest
POSTGRES_DB=carenest
POSTGRES_PASSWORD=<DB_PASSWORD>
```

Chạy `cd /opt/carenest/data && docker compose up -d`. Migration chỉ được chạy một lần từ một VM ở mục 7.

### 5.2 Redis trên cn-redis-01

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["sh", "-c", "redis-server --appendonly yes --requirepass $${REDIS_PASSWORD}"]
    env_file: /opt/carenest/env/redis.env
    ports: ["6379:6379"]
    volumes: ["redis_data:/data"]
volumes:
  redis_data:
```

`redis.env` chứa `REDIS_PASSWORD=<REDIS_PASSWORD>`. Service dùng URL `redis://:<REDIS_PASSWORD>@10.42.0.41:6379`.

### 5.3 Kafka KRaft trên cn-kafka-01

Kafka phải advertise private IP, không phải localhost:

```yaml
services:
  kafka:
    image: apache/kafka:3.9.0
    restart: unless-stopped
    ports: ["9092:9092"]
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://10.42.0.42:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
    volumes: ["kafka_data:/var/lib/kafka/data"]
volumes:
  kafka_data:
```

Sau khi healthy, từ repo trên máy Kafka chạy:

```bash
cd /opt/carenest/data
docker compose exec -T kafka bash < /opt/carenest/app/infrastructure/init-topics.sh
```

### 5.4 MeiliSearch trên cn-meili-01

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.10
    restart: unless-stopped
    env_file: /opt/carenest/env/meili.env
    ports: ["7700:7700"]
    volumes: ["meili_data:/meili_data"]
volumes:
  meili_data:
```

`meili.env` có `MEILI_MASTER_KEY=<MEILI_MASTER_KEY>` và `MEILI_ENV=production`. Component này tách riêng để học vận hành; flow chính hiện chưa bắt buộc phải có nó.

## 6. Deploy backend: một container trên một EC2

Trên VM của mỗi backend tạo `/opt/carenest/compose.yml`:

```yaml
services:
  app:
    build:
      context: /opt/carenest/app
      dockerfile: infrastructure/docker/Dockerfile.service
      args:
        SERVICE: <SERVICE_NAME>
    restart: unless-stopped
    env_file: /opt/carenest/env/service.env
    ports:
      - "<PORT>:<PORT>"
```

Với iot-gateway, đổi `dockerfile` thành `infrastructure/docker/iot-gateway.Dockerfile` và bỏ `args`. Khởi động:

```bash
cd /opt/carenest
docker compose build --pull
docker compose up -d
docker compose logs -f --tail=100
```

Không dùng `docker-compose.dev.yml` trên các VM: file đó dành cho local và sẽ tạo bản sao sai vị trí của database/Kafka/Redis.

### Service environment matrix

Mọi `service.env` có `NODE_ENV=production`, `PORT=<port>`, `API_PREFIX=api/v1`. Thêm database, Redis và Kafka tùy service:

| VM / service / port | Biến cần có |
|---|---|
| cn-auth-01 / auth-service / 3001 | DATABASE_URL, JWT_SECRET |
| cn-catalog-01 / catalog-service / 3002 | DATABASE_URL, REDIS_URL, MEILISEARCH_URL, MEILISEARCH_MASTER_KEY |
| cn-device-01 / device-service / 3003 | DATABASE_URL, REDIS_URL, KAFKA_BROKERS |
| cn-order-01 / order-service / 3004 | DATABASE_URL, REDIS_URL, KAFKA_BROKERS |
| cn-payment-01 / payment-service / 3005 | DATABASE_URL, REDIS_URL, KAFKA_BROKERS, chỉ payment sandbox keys |
| cn-notification-01 / notification-service / 3006 | DATABASE_URL, KAFKA_BROKERS, chỉ sandbox email/SMS |
| cn-alert-01 / alert-service / 3007 | DATABASE_URL, REDIS_URL, KAFKA_BROKERS |
| cn-subscription-01 / subscription-service / 3008 | DATABASE_URL, REDIS_URL, KAFKA_BROKERS, ACTIVATION_SECRET |
| cn-shipping-01 / shipping-service / 3009 | DATABASE_URL, REDIS_URL, KAFKA_BROKERS, sandbox shipping keys |
| cn-chat-01 / chat-service / 3010 | DATABASE_URL, KAFKA_BROKERS, JWT_SECRET giống auth |
| cn-iot-gateway-01 / iot-gateway / 18800 | IOT_GATEWAY_PORT=18800, KAFKA_BROKERS, DEVICE_SERVICE_URL |

Mẫu kết nối dùng chung:

```dotenv
DATABASE_URL=postgresql://carenest:<DB_PASSWORD>@10.42.0.40:5432/carenest?schema=public
REDIS_URL=redis://:<REDIS_PASSWORD>@10.42.0.41:6379
KAFKA_BROKERS=10.42.0.42:9092
```

### API Gateway trên cn-api-gateway-01

Đặt `SERVICE=api-gateway`, `PORT=8080`. `service.env`:

```dotenv
NODE_ENV=production
PORT=8080
API_PREFIX=api/v1
CORS_ORIGINS=https://buyer.<domain>,https://seller.<domain>,https://admin.<domain>
AUTH_SERVICE_URL=http://10.42.0.21:3001
CATALOG_SERVICE_URL=http://10.42.0.22:3002
DEVICE_SERVICE_URL=http://10.42.0.23:3003
ORDER_SERVICE_URL=http://10.42.0.24:3004
PAYMENT_SERVICE_URL=http://10.42.0.25:3005
NOTIFICATION_SERVICE_URL=http://10.42.0.26:3006
ALERT_SERVICE_URL=http://10.42.0.27:3007
SUBSCRIPTION_SERVICE_URL=http://10.42.0.28:3008
SHIPPING_SERVICE_URL=http://10.42.0.29:3009
CHAT_SERVICE_URL=http://10.42.0.30:3010
```

Backend không được public: gateway là đường HTTP nội bộ duy nhất, ngoài chat và alert được Caddy proxy WebSocket.

## 7. Migration và seed

Chỉ từ cn-auth-01 (hoặc một admin runner), sau khi PostgreSQL healthy:

```bash
cd /opt/carenest/app
corepack enable
corepack prepare pnpm@12.11.2 --activate
pnpm install --frozen-lockfile
export DATABASE_URL='postgresql://carenest:<DB_PASSWORD>@10.42.0.40:5432/carenest?schema=public'
pnpm --filter @carenest/database db:generate
pnpm --filter @carenest/database db:migrate
pnpm db:seed
```

Không chạy migration đồng thời ở nhiều VM. Seed là test data và có credential mẫu: đổi/xóa trước khi có người ngoài truy cập.

## 8. Deploy frontend trên từng EC2

Repository hiện có Dockerfile dùng chung cho backend, chưa có Dockerfile production riêng cho frontend. Để lab chạy ngay, dùng Next.js + systemd. Sau khi lab thông, có thể bổ sung Dockerfile frontend và ECR như bài học tiếp theo.

Trên mỗi frontend EC2:

```bash
sudo dnf install -y nodejs
corepack enable
corepack prepare pnpm@12.11.2 --activate
cd /opt/carenest/app
pnpm install --frozen-lockfile
```

Mẫu `/opt/carenest/env/web-buyer.env`:

```dotenv
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://buyer.<domain>
NEXT_PUBLIC_API_GATEWAY_URL=https://api.<domain>
NEXT_PUBLIC_API_URL=https://api.<domain>
NEXT_PUBLIC_CHAT_WS_URL=https://chat.<domain>
NEXT_PUBLIC_ALERT_WS_URL=https://alert.<domain>
NEXT_PUBLIC_ALERT_API_URL=https://alert.<domain>
```

Build:

```bash
set -a
source /opt/carenest/env/web-buyer.env
set +a
pnpm --filter @carenest/web-buyer build
```

Tạo `/etc/systemd/system/carenest-web-buyer.service`:

```ini
[Unit]
Description=CareNest web-buyer
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/carenest/app
EnvironmentFile=/opt/carenest/env/web-buyer.env
ExecStart=/usr/bin/bash -lc 'pnpm --filter @carenest/web-buyer start'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Khởi động:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now carenest-web-buyer
sudo systemctl status carenest-web-buyer
```

Lặp với web-seller và web-admin, thay package/env/service name. Cả ba build cần dùng `NEXT_PUBLIC_API_GATEWAY_URL=https://api.<domain>`; seller dùng `NEXT_PUBLIC_CHAT_WS_URL=https://chat.<domain>`; buyer/admin dùng alert URL nếu có alert realtime. Mỗi thay đổi `NEXT_PUBLIC_*` bắt buộc build lại Next.js, restart đơn thuần không thay bundle cho browser.

## 9. Edge, DNS, TLS, WebSocket và IoT TCP

Tạo DNS A records: `buyer`, `seller`, `admin`, `api`, `chat`, `alert` trỏ vào public IP cn-edge-01. Khi dùng Cloudflare, để DNS-only trong lần đầu cấp certificate.

Trên cn-edge-01, tạo `/opt/carenest/edge/Caddyfile`:

```caddyfile
buyer.<domain> { reverse_proxy 10.42.0.11:3000 }
seller.<domain> { reverse_proxy 10.42.0.12:3020 }
admin.<domain> { reverse_proxy 10.42.0.13:3030 }
api.<domain> { reverse_proxy 10.42.0.20:8080 }
chat.<domain> { reverse_proxy 10.42.0.30:3010 }
alert.<domain> { reverse_proxy 10.42.0.27:3007 }
```

Tạo `/opt/carenest/edge/compose.yml` và khởi động Caddy bằng Docker:

```yaml
services:
  caddy:
    image: caddy:2.8
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
volumes:
  caddy_data:
  caddy_config:
```

```bash
cd /opt/carenest/edge
docker compose up -d
docker compose logs -f --tail=100
```

Caddy tự proxy WebSocket. Chỉ dùng HTTPS/WSS URL ở browser để tránh mixed content. Wonlex/device simulator không đi qua Caddy: kết nối thẳng `<public-ip-cua-cn-iot-gateway-01>:18800`.

## 10. Test runbook

1. Trên data VM: `docker compose ps` phải cho PostgreSQL, Redis, Kafka, MeiliSearch trạng thái Up.
2. Trên Kafka: `docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` phải thấy topic CareNest.
3. Từ cn-api-gateway-01: `curl http://10.42.0.21:3001/health/livez`, sau đó kiểm tra từng service.
4. Mở `https://api.<domain>/metrics`, rồi kiểm tra buyer/seller/admin không bị CORS.
5. Dùng seed account để tạo product/order; theo dõi Kafka event và notification consumer.
6. Kiểm tra chat + alert WebSocket từ browser; chạy device simulator và gửi telemetry/SOS đến TCP public port.
7. Chủ động restart Kafka, một backend và edge để học failure mode.

Lệnh chẩn đoán:

```bash
docker compose ps
docker compose logs --tail=200 app
docker stats --no-stream
free -h
df -h
sudo journalctl -u carenest-web-buyer -n 200 --no-pager
```

Kafka connection failure gần như luôn do một trong ba điều: advertised listener không phải `10.42.0.42:9092`, rule SG 9092 sai, hoặc `KAFKA_BROKERS` consumer sai. CORS failure: kiểm tra `CORS_ORIGINS` chứa đủ ba origin HTTPS, không có slash cuối.

## 11. Dọn lab để bảo toàn credit

1. Nếu cần giữ test data, export: `docker compose exec -T postgres pg_dump -U carenest carenest > /opt/carenest/carenest-lab.sql`.
2. Stop/xóa tất cả 20–21 EC2 và EBS volume không cần giữ; xóa snapshots, ECR images, public IPv4, CloudWatch log groups do lab tạo.
3. Kiểm tra Billing > Bills sau 24 giờ, xác nhận không còn tài nguyên tính phí.
4. Ghi lại private IP, SG rule, lỗi Kafka/CORS và dependency chain. Bước tiếp theo là chuyển topology này sang Terraform/Ansible/ECS.

## 12. Không dùng cho production

Lab này thiếu HA, backup automation, secret rotation, vulnerability scanning, autoscaling, encryption policy và network segmentation chuẩn. Production cần private subnets đa AZ, backup/restore đã kiểm thử, object storage cho upload, secret management, CI/CD và observability. Không công bố dữ liệu sức khỏe trên topology này.

