# Phase 3: Thử nghiệm & Thẩm định (Tuần 27-30)

## Context Links
- `docs/carenest-de-xuat.md` — Section 11 (Pháp lý & tuân thủ), Section 13.2 (Lộ trình GĐ 3 trong 30 tuần), Section 13.3 (Deliverables GĐ 3), Section 14 (KPI), Section 15 (Rủi ro)
- `docs/carenest-bmc-report.md` — Section 7.4 (Tài nguyên pháp lý), Section 8.5 (Daily Operations Checklist), Section 9.1 (Critical partnerships), Section 11.1-11.3 (Unit economics + Break-even), Section 12.4 (Phase 3 Pilot & Validate), Section 13.2 (KPI tháng), Section 13.3 (Weekly Business Review), Section 14.1-14.3 (Rủi ro + Incident Response), Section 15.1 (Tech Stack)
- `device_simulator/` — simulator context (giúp giảm risk Phase 3 vì đã pilot ảo trước đó)
- `plans/261012-0900-carenest-implementation-plan/phase-00-khoi-dong-va-rd.md` — Phase 0 (R&D Wonlex codec, kiến trúc)
- `plans/261012-0900-carenest-implementation-plan/phase-01-xay-dung-core-platform.md` — Phase 1 (8 services core + IoT pipeline)
- **Phase 2 deliverables (phụ thuộc)**:
  - 3 portals Next.js: web-buyer, web-seller, web-admin (responsive, SEO-ready)
  - 3 services: Notification (email/SES, web-push/VAPID, SMS/ESMS, Zalo ZNS), Subscription (gói Care+, renewal cron), Shipping (GHN doanh nghiệp + GHTK backup)
  - Device activation flow end-to-end (QR scan → IMEI bind → tenant assign → first heartbeat)
  - Bảng giá gói thuê bao Care+/Family Care đã publish
  - Hợp đồng OEM Wonlex đã ký (>= 100 thiết bị cam kết giao Phase 3)
  - KYC queue vận hành trên staging, admin training xong
  - Production-like staging đã pass 200 req/s + 1.000 devices simulator

## Overview
- **Priority**: 🔴 Critical (chặn Soft Launch Giai đoạn 4)
- **Current Status**: Not Started (waiting for Phase 2)
- **Owner**: CTO + QA Lead (mới hire) + DevOps Senior + 2 Backend Senior + 1 Frontend Senior + 1 IoT Engineer + 1 PM + 1 BD
- **Duration**: 4 tuần (Tuần 27-30) — trùng Sprint S14 (QA + UAT)
- **Brief Description**:
  4 tuần cuối trước Soft Launch. 3 trụ cột song song: (1) **Load test + Pentest** để chứng minh hệ thống chịu tải 1.000 req/s + 10K WebSocket + 10K IoT devices đồng thời, đạt OWASP Top 10; (2) **Pilot với 10 sellers thật + 100 thiết bị Wonlex thật** để validate end-to-end flow (mua hàng → kích hoạt → sinh hiệu → cảnh báo SOS < 5s → chăm sóc sau bán) và đo KPI thực tế; (3) **Hoàn tất pháp lý**: nộp hồ sơ đăng ký sàn TMĐT với BCT, công bố Quy chế sàn, ký hợp đồng production với VNPay/MoMo/GHN/GHTK. Output = sản phẩm production-ready cả kỹ thuật (pass load + pass pentest) lẫn pháp lý (hồ sơ BCT đã nộp) + runbook vận hành 24/7, Go/No-Go cho Phase 4.

## Key Insights
- **Pilot số lượng nhỏ nhưng data quality cao**: 10 sellers + 100 devices là đủ để phát hiện 80% edge cases production (network GSM yếu, packet malformed, race condition payment, voucher abuse). Mỗi case study phải document chi tiết vào `docs/operations/pilot-cases/` để dùng cho training team support Phase 4.
- **Pentest book trước, vendor uy tín mất 2-3 tuần available**: vendor CyStack, VCS, VNPT IS, hay BugCrowd Managed — phải book ngay cuối Tuần 26 (đầu Phase 3) để có slot Tuần 27-29. Budget dự kiến 50-80 triệu (BMC 7.4 đã liệt kê 30-60tr cho pentest lần đầu).
- **Load test phải realistic + kịch bản đặc thù**: không chỉ test sustained 1.000 req/s mà phải simulate (a) flash sale 8/3 traffic spike 5x, (b) alert storm khi 1.000 devices cùng gửi SOS trong 10 giây, (c) Kafka broker fail 1 node, (d) RDS failover. Mỗi kịch bản cần playbook riêng.
- **Pilot devices thật (Wonlex) khác simulator ở 4 điểm chính**: (1) GSM drop thực tế tại VN (cell coverage yếu), (2) pin thực không đều như simulator giả lập, (3) firmware version OEM thay đổi theo lô hàng, (4) GPS accuracy khác nhau giữa indoor/outdoor. Phải test ở 3 vùng: nội đô HCM, ngoại ô Hà Nội, vùng núi (Đà Lạt/Lào Cai).
- **Đăng ký sàn BCT là bottleneck pháp lý lớn nhất**: thời gian review trung bình 2-4 tuần, có trường hợp phải bổ sung hồ sơ → thực tế 4-6 tuần. Nộp Tuần 28 để có kết quả kịp Soft Launch đầu Tuần 31. Nếu có thể, chạy production trên subdomain staging trong khi chờ.
- **Activation rate 60% là KPI khó nhất**: thực tế Phase 1 simulator ước tính >80% nhưng với khách hàng thật (đặc biệt người cao tuổi) thường tụt xuống 40-50%. Cần hotline kích hoạt tận nhà + video tutorial tiếng Việt cực ngắn (≤60s).
- **Performance optimization phải chạy song song từ Phase 2**: nếu đợi đến Phase 3 mới bắt đầu thì không kịp. Phase 2 đã phải có baseline profiling + N+1 query fix + index. Phase 3 chỉ handle bottleneck nặng còn lại.
- **Test environment ≠ Production environment**: 70% bug "chỉ xuất hiện ở prod" đến từ infra (EBS IOPS, NAT gateway, RDS connection limit). Production cluster phải setup riêng Tuần 28 và test full flow từ Tuần 29.
- **Cost pilot cần track riêng**: 100 thiết bị × 30.000đ SIM/tháng = 3tr/tháng; ưu đãi 0% hoa hồng 3 tháng × dự kiến 100 đơn pilot × AOV 2tr = 0vnđ commission nhưng cần track implied cost để tính CAC Phase 4.

## Requirements

### Functional Requirements (FR)

#### Load & Performance Testing
- FR-3.1: Setup k6 (Grafana k6 self-hosted trên K8s riêng, hoặc k6 Cloud) cho load test infrastructure, integrate Prometheus remote_write để real-time dashboard
- FR-3.2: Define baseline scenarios từ BMC 13.3: buyer browse PLP, view PDP, search MeiliSearch, add to cart, multi-vendor checkout, payment success/fail, order tracking
- FR-3.3: Stress test HTTP API: 1.000 req/s sustained trong 5 phút, P95 < 300ms, P99 < 1s, error rate < 0.1% (NFR-3.1, NFR-3.2, NFR-3.8)
- FR-3.4: Stress test WebSocket (Socket.IO): 10.000 concurrent connections, message delivery P95 < 2s, không memory leak
- FR-3.5: Stress test TCP Gateway IoT: 10.000 devices, mỗi device 1 packet/giây (vitals packet 200 bytes), packet loss < 0.01%, CPU < 70%
- FR-3.6: Stress test Kafka pipeline: 10.000 msg/s end-to-end (device → TCP → Kafka → consumer → DB), consumer lag < 1.000 messages steady state
- FR-3.7: Test failover: kill 1 K8s pod (random), system tự recover < 30s không mất request; kill 1 Kafka broker, cluster vẫn serve; restart 1 Postgres replica
- FR-3.8: Test database với 1M records: query PLP pagination P95 < 100ms; order history query P95 < 200ms; index đầy đủ trên `tenant_id`, `seller_id`, `created_at`, `status`
- FR-3.9: Test TimescaleDB với 10M vitals records (giả lập 1 năm data 100 devices): aggregation query (heart rate avg theo giờ/ngày/tuần) < 1s
- FR-3.10: Soak test 24h liên tục ở 50% peak load (500 req/s + 5K devices), check memory leak, connection leak, file descriptor leak, Kafka offset drift
- FR-3.11: Spike test: traffic tăng đột biến 5x (1.000 → 5.000 req/s) trong 1 phút, recovery < 30s (giả lập flash sale 8/3, ngày lễ Tết)
- FR-3.12: Stress test search MeiliSearch: index 50K products, query "máy đo huyết áp cho người già" P95 < 200ms
- FR-3.13: Stress test payment flow: 200 concurrent payment gateway callbacks, idempotency verify 100% pass
- FR-3.14: Chaos engineering: random kill pod, partition network 30s, slow disk 200ms, verify hệ thống graceful degrade
- FR-3.15: Load test CDN/Cloudflare: 10K concurrent static asset requests, cache hit ratio > 95%, origin offload > 80%

#### Security & Penetration Testing
- FR-3.16: OWASP Top 10 (2021) full audit pass — checklist cho 10 category: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection (SQL/NoSQL/LDAP), A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable Components, A07 Authentication Failures, A08 Software & Data Integrity, A09 Logging Failures, A10 SSRF
- FR-3.17: Multi-tenant isolation test: Seller A authenticated thử access Seller B endpoints (sửa URL, đổi ID, đổi JWT claim) → 100% phải bị 403/404
- FR-3.18: Auth bypass: thử (a) JWT tampering đổi role, (b) expired token reuse, (c) signature algorithm confusion (none, HS256 with public key), (d) refresh token replay
- FR-3.19: IDOR test: enumerate `/api/orders/{id}` với user_id khác, tất cả phải trả 403; check cả PUT/DELETE/PATCH
- FR-3.20: Rate limiting bypass: thử (a) đổi IP qua X-Forwarded-For spoofing, (b) rotate session, (c) dùng IPv6, (d) endpoint không có rate limit
- FR-3.21: File upload security: upload (a) .php rename .jpg, (b) file chứa EICAR test virus, (c) PDF với JavaScript embedded, (d) SVG với XSS payload, (e) file > 100MB (zip bomb)
- FR-3.22: XSS, CSRF, SSRF test cases: stored XSS trong product description, CSRF trên state-changing endpoints, SSRF qua webhook URL, image proxy
- FR-3.23: API abuse: enumeration (đoán UUID v4 entropy), scraping rate check, brute force login (100 attempts/IP), coupon code brute force
- FR-3.24: Secrets leakage scan: tìm AWS keys, JWT signing secret, DB password, payment HMAC key trong (a) git history, (b) container image layers, (c) error response, (d) frontend bundle, (e) Sentry stack trace
- FR-3.25: Dependency vulnerability scan: `npm audit`, `trivy image`, `snyk test` — fix tất cả high/critical
- FR-3.26: Infrastructure security: Security group audit, IAM least-privilege review, RDS public access = false, S3 bucket public = false, EKS pod security standards = restricted
- FR-3.27: Payment security test: (a) amount tampering trong request, (b) currency confusion, (c) replay attack webhook, (d) double spend, (e) chargeback flood
- FR-3.28: IoT security test: (a) spoof device IMEI, (b) replay packet captured, (c) downgrade protocol version, (d) flood TCP SYN để DoS gateway
- FR-3.29: Container escape test: chạy pod với privileged, hostPath, chạy malicious image xem có breakout được không
- FR-3.30: Pentest vendor deliver: preliminary report Tuần 28, re-test Tuần 29, final report Tuần 30 với severity classification (Critical/High/Medium/Low) + remediation guidance

#### Pilot Operations
- FR-3.31: Onboard 10 pilot sellers theo 3 batch (3+3+4) trong Tuần 27-29 — sellers đã chọn từ Phase 0 (BMC 12.4)
- FR-3.32: Mỗi seller có 1 BD phụ trách 1-1 trong suốt pilot (Slack channel riêng, daily check-in 5 phút)
- FR-3.33: Hỗ trợ seller setup gian hàng, đăng sản phẩm đầu tiên (≥10 SKU/seller), import kho IMEI thiết bị Wonlex
- FR-3.34: Test 100 thiết bị Wonlex thật: 70 cái HCM nội đô (quận 1, Bình Thạnh, Thủ Đức), 20 cái Hà Nội (Hoàn Kiếm, Cầu Giấy), 10 cái Đà Lạt (test vùng sóng yếu)
- FR-3.35: Kích hoạt 100 devices qua activation wizard thật (người thân đeo thật), track activation rate per device
- FR-3.36: Verify data ingestion end-to-end: vitals (heart rate, SpO2, steps) + GPS location + alert events (SOS, fall, geofence) đều vào TimescaleDB + Alert Engine
- FR-3.37: Verify alert latency thực tế: bấm SOS trên thiết bị thật → đo thời gian caregiver nhận Web Push + SMS + Zalo ZNS (target P95 < 5s theo BMC 13.2 KPI tháng T9)
- FR-3.38: Test edge cases thiết bị: (a) offline 24h, (b) pin yếu < 20% cảnh báo, (c) GSM yếu (RSSI < -100), (d) firmware version lệch, (e) packet corrupted CRC fail
- FR-3.39: Buyer journey test với 50 buyer thật (recruit từ network nội bộ + friends & family): từ tìm kiếm → mua → nhận hàng → kích hoạt → dùng
- FR-3.40: Thu thập feedback: NPS survey (5 câu hỏi, scale 0-10, gửi sau 7 ngày mua), user interview 15 người (60 phút/người, có thưởng 200k)
- FR-3.41: Seller dashboard analytics: GMV/seller, conversion rate, top products, fulfillment time — verify dashboard chính xác so với raw data
- FR-3.42: Daily operations checklist (BMC 8.5): chạy script 09:00 AM mỗi ngày pilot, alert Slack nếu có item fail
- FR-3.43: Pilot incident tracking: mỗi Sev 1/2/3 phải có root cause + fix + post-mortem trong 48h
- FR-3.44: Pilot report cuối Tuần 30: GMV, số đơn, conversion, NPS, activation rate, top 10 issues, recommendation Go/No-Go

#### Pháp lý Pilot
- FR-3.45: Nộp hồ sơ đăng ký Sàn TMĐT với Bộ Công Thương (qua Cổng dịch vụ công BCT) — Tuần 28
- FR-3.46: Public Quy chế hoạt động sàn trên website (footer link + trang `/quy-che`) trước khi bán đơn đầu tiên
- FR-3.47: Đăng ký Trademark "CareNest" + logo với Cục Sở hữu trí tuệ (SHTT) — Tuần 28
- FR-3.48: Review & finalize Điều khoản dịch vụ (Terms of Service), Chính sách bảo mật (Privacy Policy) — publish trên website Tuần 30
- FR-3.49: Hợp đồng seller template: review lại với luật sư, customize cho 10 pilot sellers, ký số (e-signature)
- FR-3.50: Cập nhật DPIA report v1 với pilot data thật (số user, loại data, retention, security measures) — nộp lưu Bộ Công An Tuần 30
- FR-3.51: Ký hợp đồng merchant production với VNPay (merchant ID, settlement bank, fee structure 1.8-2.2%)
- FR-3.52: Ký hợp đồng merchant production với MoMo (Business account, fee 1.5-2.0%)
- FR-3.53: Ký hợp đồng doanh nghiệp GHN (volume commit, COD fee, return fee) + GHTK backup
- FR-3.54: Đăng ký với Cục Thuế: MST, kê khai thuế TNCN cho commission, hóa đơn điện tử (VNPT/Viettel invoice)
- FR-3.55: Tư vấn pháp lý về bảo hiểm trách nhiệm nghề nghiệp (cyber insurance + medical device liability) — chọn gói nếu feasible budget

#### Documentation & Runbook
- FR-3.56: System Architecture Document v1.0 (50-80 trang) cho stakeholder & onboarding nhân viên mới
- FR-3.57: OpenAPI 3.1 spec đầy đủ cho 11 services (generated từ NestJS decorators, host trên `/api/docs`)
- FR-3.58: Runbook on-call: 7 documents (oncall-guide, common-alerts, incident-response, disaster-recovery, deployment-procedures, database-operations, kafka-operations) theo BMC 14.3
- FR-3.59: Disaster Recovery Plan: RTO 1h, RPO 15min, backup verification procedure, restore drill thật
- FR-3.60: Incident Response Plan: Severity 1/2/3 procedure, escalation tree, communication template, post-mortem template
- FR-3.61: User Guide 3 portals (Vietnamese) cho buyer, seller, admin — PDF + video ngắn
- FR-3.62: Video tutorials seller onboarding (3-5 video, ≤5 phút/video, record qua Loom, host YouTube unlisted)
- FR-3.63: API Reference cho partner integration (payment, shipping) + Postman collection public
- FR-3.64: Blog SEO content 10 bài đầu tiên (chăm sóc người cao tuổi, top 5 máy đo huyết áp, v.v.) — 800-1500 từ/bài, target keyword research
- FR-3.65: Press kit + company fact sheet cho media

### Non-Functional Requirements (NFR)
- NFR-3.1: API P95 < 300ms dưới tải sustained 1.000 req/s (per FR-3.3)
- NFR-3.2: API P99 < 1s dưới tải sustained 1.000 req/s
- NFR-3.3: TCP Gateway handle 10K concurrent devices, packet loss < 0.01%, CPU < 70%
- NFR-3.4: Alert latency end-to-end P95 < 5s (device bấm SOS → caregiver nhận push) — đo trên thiết bị thật, không simulator
- NFR-3.5: WebSocket scale 10K concurrent, message delivery P95 < 2s
- NFR-3.6: Kafka consumer lag < 1.000 messages steady state, < 5.000 peak
- NFR-3.7: Database connection pool utilization < 80% (Postgres `max_connections=200`, app pool 50/instance)
- NFR-3.8: API error rate < 0.1% trong 24h soak test
- NFR-3.9: Uptime SLA 99.9% trong pilot (downtime tối đa ~43 phút/tháng)
- NFR-3.10: MTTR < 30 phút cho Sev 2, < 4h cho Sev 1 (BMC 14.3)
- NFR-3.11: Pentest 0 critical vulnerabilities, ≤ 2 high severity còn open (remediation plan bắt buộc)
- NFR-3.12: Security audit pass baseline SOC 2 (control list) — không cần certification nhưng phải ready
- NFR-3.13: Data residency 100% tại Việt Nam (AWS ap-southeast-1 Singapore OK nếu có data residency addendum, hoặc dùng VN provider VNG/Viettel IDC)
- NFR-3.14: PCI DSS: không lưu card data — dùng VNPay/MoMo hosted fields, redirect iframe
- NFR-3.15: GDPR/PDPA: explicit consent UI (checkbox trước khi tạo tài khoản), right to be forgotten (delete account → anonymize sau 30 ngày), data export (JSON trong 7 ngày)
- NFR-3.16: Encryption at-rest: AES-256 (RDS encryption, S3 SSE, EBS encryption)
- NFR-3.17: Encryption in-transit: TLS 1.3 only, HSTS preload, mTLS giữa internal services (Istio hoặc linkerd)
- NFR-3.18: Logging: structured JSON log, retention 90 ngày hot + 7 năm cold archive (NĐ 13/2023)
- NFR-3.19: Observability: RED metrics (Rate, Error, Duration) cho mọi service, USE metrics cho infra, distributed tracing 100% request có user_id correlation
- NFR-3.20: RPO ≤ 15 phút, RTO ≤ 1h cho database (continuous WAL archiving + PITR)

## Architecture

### Load Test Infrastructure
```
┌─────────────────────────────────────────────────────────────────────┐
│  LOAD TEST CLUSTER (separate EKS node group, t3.xlarge ×3)        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ k6 runner #1 │  │ k6 runner #2 │  │ k6 runner #3 │                │
│  │ 3K VUs       │  │ 3K VUs       │  │ 4K VUs       │                │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │
│         └──────────────────┴──────────────────┘                     │
│                            │                                         │
│                  Prometheus remote_write                             │
│                            ▼                                         │
│                  ┌──────────────────┐                                │
│                  │ Grafana Cloud    │                                │
│                  │ (load-test view) │                                │
│                  └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (target)
┌─────────────────────────────────────────────────────────────────────┐
│  STAGING CLUSTER (production-like)                                  │
│  - 11 services × 2 replicas                                         │
│  - RDS PostgreSQL db.r6g.2xlarge                                     │
│  - MSK Kafka 3 brokers                                               │
│  - ElastiCache Redis r6g.large                                       │
│  - 100 thiết bị Wonlex thật (TCP Gateway)                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Security Audit Process
```
TUẦN 27:
  - Mon: Book Pentest vendor (CyStack/VCS) — 50-80tr VND
  - Wed: Kickoff meeting, scope finalization, NDA ký
  - Fri: Vendor nhận credentials, môi trường test setup

TUẦN 27-28: Black-box test + Grey-box test (có credentials test)
  - Automated scanning (Burp Suite Pro, OWASP ZAP, nuclei)
  - Manual exploitation cho logic flaws
  - Daily standup vendor ↔ CTO track finding mới

TUẦN 28 (Fri): Vendor deliver preliminary report
  - Severity classification
  - Reproduction steps
  - Remediation recommendation

TUẦN 28-29: Fix critical/high vulnerabilities
  - Critical: fix trong 24h
  - High: fix trong 3 ngày
  - Medium: back log sprint sau
  - Low: note thôi

TUẦN 29: Re-test các fix
  - Vendor verify từng finding
  - New finding nếu có → fix tiếp

TUẦN 30 (Wed): Final Pentest report với sign-off
  - Executive summary cho board
  - Technical details cho dev team
  - Attestation letter (vendor đóng dấu)
```

### Pilot Operations Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│  PILOT MANAGEMENT                                                    │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│  │ Notion DB    │    │ Slack        │    │ PagerDuty    │            │
│  │ - 10 sellers │◄──►│ #pilot-ops   │◄──►│ - DevOps     │            │
│  │ - 100 devices│    │ #pilot-sos   │    │ - Backend    │            │
│  │ - 50 buyers  │    │ #pilot-sell  │    │ - IoT        │            │
│  └──────────────┘    └──────────────┘    └──────────────┘            │
│         │                   │                   │                  │
│         └───────────────────┴───────────────────┘                  │
│                            │                                         │
│                  ┌─────────▼─────────┐                               │
│                  │ Daily 09:00 Sync  │                               │
│                  │ - Health check    │                               │
│                  │ - Top 3 issues    │                               │
│                  │ - Demo feature    │                               │
│                  └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘

RUM: Sentry (frontend error) + Datadog RUM (web vitals)
APM: Datadog APM cho backend services
Synthetic: Checkly ping các endpoint mỗi 1 phút
```

## Related Code Files

### Files cần tạo trong Phase 3

#### Load Test Scripts
- `infrastructure/load-test/scripts/api-load.js` (k6 baseline scenario, 1.000 req/s)
- `infrastructure/load-test/scripts/websocket-load.js` (10K Socket.IO concurrent)
- `infrastructure/load-test/scripts/tcp-gateway-load.js` (10K devices, custom k6 TCP/xk6-sublevel)
- `infrastructure/load-test/scripts/kafka-load.js` (10K msg/s pipeline)
- `infrastructure/load-test/scripts/soak-test.js` (24h @ 500 req/s)
- `infrastructure/load-test/scripts/spike-test.js` (5x burst trong 60s)
- `infrastructure/load-test/scripts/chaos-test.js` (kill pod, network partition)
- `infrastructure/load-test/scripts/payment-load.js` (200 concurrent callback)
- `infrastructure/load-test/scenarios/checkout.js` (full buyer flow)
- `infrastructure/load-test/scenarios/search.js` (MeiliSearch query patterns)
- `infrastructure/load-test/scenarios/activation.js` (device activation flow)
- `infrastructure/load-test/scenarios/alert-burst.js` (1.000 devices gửi SOS đồng thời)
- `infrastructure/load-test/data/faker.js` (test data generator, 100K users + 10K products + 1M orders)
- `infrastructure/load-test/config/thresholds.js` (SLI/SLO definition)
- `infrastructure/load-test/README.md` (cách chạy, kết quả baseline)

#### Security Testing
- `infrastructure/security/owasp-checklist.md` (OWASP Top 10 check list)
- `infrastructure/security/pentest-scope.md` (scope cho vendor)
- `infrastructure/security/reports/phase3-preliminary.md` (vendor output Tuần 28)
- `infrastructure/security/reports/phase3-final.md` (vendor output Tuần 30)
- `infrastructure/security/remediation-log.md` (tracking fix theo từng finding)
- `infrastructure/security/scripts/scan-deps.sh` (npm audit + trivy + snyk CI)
- `infrastructure/security/scripts/secrets-scan.sh` (gitleaks + trufflehog)
- `infrastructure/security/scripts/nuclei-templates/` (custom templates cho CareNest)

#### Pilot Runbook & Docs
- `docs/operations/runbook/01-oncall-guide.md` (rotation, contact, escalation)
- `docs/operations/runbook/02-common-alerts.md` (top 20 alerts + cách xử lý)
- `docs/operations/runbook/03-incident-response.md` (Sev 1/2/3 theo BMC 14.3)
- `docs/operations/runbook/04-disaster-recovery.md` (backup, restore, RTO/RPO)
- `docs/operations/runbook/05-deployment-procedures.md` (deploy, rollback, canary)
- `docs/operations/runbook/06-database-operations.md` (migration, vacuum, replication)
- `docs/operations/runbook/07-kafka-operations.md` (partition rebalance, lag, schema evolution)
- `docs/operations/pilot-checklist.md` (master checklist cho 4 tuần pilot)
- `docs/operations/pilot-sellers-list.md` (10 sellers, BD owner, status)
- `docs/operations/pilot-devices-list.md` (100 devices, IMEI, location, owner)
- `docs/operations/pilot-buyers-list.md` (50 buyers, source, feedback status)
- `docs/operations/pilot-cases/` (case study directory, mỗi case 1 file)
- `docs/operations/pilot-final-report.md` (Go/No-Go analysis)

#### Documentation
- `docs/architecture/system-design-v1.md` (50-80 trang, mermaid diagrams)
- `docs/architecture/sequence-diagrams/` (auth, checkout, alert, activation)
- `docs/api/openapi.yaml` (OpenAPI 3.1 spec generated)
- `docs/api/postman-collection.json` (public collection)
- `docs/user-guides/buyer-guide.md` (Vietnamese, PDF export)
- `docs/user-guides/seller-guide.md` (Vietnamese, PDF export)
- `docs/user-guides/admin-guide.md` (Vietnamese, PDF export)
- `docs/user-guides/videos/` (Loom embed links hoặc YouTube unlisted)
- `docs/legal/quy-che-hoat-dong.md` (Quy chế sàn theo NĐ 85/2021)
- `docs/legal/dieu-khoan-dich-vu.md` (Terms of Service)
- `docs/legal/chinh-sach-bao-mat.md` (Privacy Policy)
- `docs/legal/hop-dong-seller-template.md` (Seller contract)
- `docs/legal/dpia-report-v1.md` (DPIA với pilot data thật)
- `docs/marketing/press-kit.md` (fact sheet, logos, screenshots)
- `docs/marketing/blog/` (10 bài SEO đầu tiên)

#### Monitoring Enhancements
- `infrastructure/grafana/dashboards/api-performance.json` (RED metrics per service)
- `infrastructure/grafana/dashboards/kafka-health.json` (lag, throughput, errors)
- `infrastructure/grafana/dashboards/business-kpis.json` (GMV, conversion, retention)
- `infrastructure/grafana/dashboards/iot-devices.json` (online/offline, alert latency)
- `infrastructure/grafana/dashboards/load-test.json` (real-time load test view)
- `infrastructure/grafana/alerts/api-error-rate.yaml` (> 0.1% trong 5 phút)
- `infrastructure/grafana/alerts/alert-latency.yaml` (P95 > 5s)
- `infrastructure/grafana/alerts/kafka-lag.yaml` (> 5.000)
- `infrastructure/grafana/alerts/db-connections.yaml` (> 80%)
- `infrastructure/grafana/alerts/payment-stuck.yaml` (callback pending > 30 phút)
- `infrastructure/grafana/alerts/device-offline.yaml` (> 24h offline)
- `infrastructure/grafana/alerts/sev1-incident.yaml` (PagerDuty integration)

#### Production Deployment
- `infrastructure/terraform/prod/main.tf` (root module)
- `infrastructure/terraform/prod/vpc.tf` (3 AZ, public/private subnets, NAT)
- `infrastructure/terraform/prod/rds.tf` (PostgreSQL 16, multi-AZ, encryption)
- `infrastructure/terraform/prod/eks.tf` (3 node groups: system/services/iot)
- `infrastructure/terraform/prod/msk.tf` (Kafka 3.7 KRaft, 3 brokers)
- `infrastructure/terraform/prod/elasticache.tf` (Redis 7 cluster mode)
- `infrastructure/terraform/prod/s3.tf` (encrypted buckets, lifecycle, replication)
- `infrastructure/terraform/prod/cloudfront.tf` (CDN, OAI, ACM)
- `infrastructure/terraform/prod/route53.tf` (DNS, health check, failover)
- `infrastructure/terraform/prod/waf.tf` (Cloudflare WAF + AWS WAF rules)
- `infrastructure/terraform/prod/secrets.tf` (AWS Secrets Manager + rotation)
- `infrastructure/terraform/prod/monitoring.tf` (Datadog, Sentry, PagerDuty)
- `infrastructure/k8s/prod/namespace.yaml` (production namespace, network policy)
- `infrastructure/k8s/prod/resource-quota.yaml` (CPU/memory limits)
- `infrastructure/k8s/prod/postgres-cluster.yaml` (RDS via External Secrets)
- `infrastructure/k8s/prod/kafka-cluster.yaml` (Strimzi hoặc MSK connector)
- `infrastructure/k8s/prod/ingress.yaml` (ALB + cert-manager + Cloudflare)
- `infrastructure/k8s/prod/hpa.yaml` (Horizontal Pod Autoscaler cho services)
- `infrastructure/k8s/prod/pdb.yaml` (Pod Disruption Budget)
- `infrastructure/k8s/prod/network-policies.yaml` (default deny + explicit allow)
- `infrastructure/k8s/prod/secrets-vault.yaml` (Vault hoặc External Secrets Operator)
- `infrastructure/k8s/prod/canary-deployment.yaml` (Argo Rollouts hoặc Flagger)
- `infrastructure/k8s/prod/backup-cronjob.yaml` (pg_dump, kafka topic backup)
- `infrastructure/scripts/dr-drill.sh` (disaster recovery rehearsal script)

### Files KHÔNG tạo trong Phase 3
- KHÔNG tạo: Mobile native apps (iOS/Android) — để Phase 4
- KHÔNG tạo: New feature lớn — chỉ bug fix + critical optimization
- KHÔNG tạo: B2B Enterprise portal — Phase 4+
- KHÔNG tạo: AI/ML recommendation — Phase 4+
- KHÔNG tạo: Telemedicine integration — Phase 4+
- KHÔNG tạo: Marketplace Ads platform — Phase 4+
- KHÔNG tạo: Loyalty program — Phase 4+
- KHÔNG tạo: Thiết bị OEM thứ 2 — Phase 4+

## Implementation Steps

### Tuần 27: Setup Load Test + Pilot Kickoff (S14 bắt đầu)
1. (CTO) Book Pentest vendor uy tín (CyStack, VCS, VNPT IS) — Tuần 26 chốt, Tuần 27 ký NDA + scope
2. (CTO) Gửi RFC cuối cùng cho BCT về hồ sơ đăng ký sàn, nhờ luật sư review
3. (DevOps Senior) Setup k6 test infrastructure trên K8s cluster riêng (3 nodes t3.xlarge, có thể teardown sau pilot)
4. (DevOps Senior) Setup production-like K8s staging cluster nếu chưa có (match prod spec: 11 services × 2 replicas, RDS multi-AZ, MSK 3 brokers)
5. (DevOps Senior) Generate test data với faker.js: 100K users, 10K products, 1M orders, 1M vitals records
6. (DevOps Senior) Define baseline metrics capture: P95/P99 hiện tại, throughput, error rate, memory baseline
7. (Backend Senior #1) Chạy baseline load test 100 req/s, capture bottleneck đầu tiên (DB? query? external API?)
8. (Backend Senior #1) Profile application: APM trace, slow query log, N+1 detection
9. (CEO + BD) Finalize 10 pilot sellers list từ pipeline Phase 0 (BMC 12.4), confirm commitment
10. (CEO) Ký hợp đồng 10 pilot sellers (e-signature qua DocuSign hoặc VNPT-CA)
11. (BD + Seller Ops) Onboard seller batch 1 (3 sellers) — 1-1 training, setup gian hàng, đăng SKU đầu tiên
12. (CTO) Order 100 thiết bị Wonlex thật từ OEM (đã ký hợp đồng Phase 2), confirm lead time ≤ 2 tuần
13. (IoT Engineer) Chuẩn bị 100 SIM 4G (Viettel/Mobifone IoT plan), kích hoạt gói data
14. (IoT Engineer) Setup device staging station: 100 vị trí test ở 3 vùng (HCM/HN/Đà Lạt), người thân đeo thật
15. (PM) Update project roadmap (Tuần 27 → In Progress), changelog (Pilot kickoff)

### Tuần 28: Pilot Batch 1 + Performance Optimization + Nộp BCT
16. (BD + Seller Ops) Onboard seller batch 2 (3 sellers) — same process, capture time-to-onboard
17. (Backend Senior #1) Fix bottleneck #1 từ Tuần 27 (thường là: missing index, N+1 query, large payload)
18. (Backend Senior #1) Chạy load test 500 req/s, identify bottleneck #2 (Kafka? WebSocket? CDN?)
19. (Backend Senior #2) Optimize Kafka consumer: tăng batch.size lên 64KB, tune `linger.ms=5`, thêm partition cho hot topic
20. (Backend Senior #2) Optimize WebSocket: implement backpressure (drop oldest nếu client lag), heartbeat tune
21. (Backend Senior #2) Optimize TCP Gateway: dùng SO_REUSEPORT, epoll thay select, zero-copy sendfile cho broadcast
22. (IoT Engineer) Bắt đầu test TCP Gateway với 100 thiết bị Wonlex thật (deploy lần lượt batch 20 cái/tuần)
23. (IoT Engineer) Verify packet parsing cho từng firmware version OEM, document edge cases (malformed CRC, GSM drop, GPS timeout)
24. (IoT Engineer) Implement hotfix cho codec bugs phát hiện từ thiết bị thật (cập nhật `packages/iot-codec`)
25. (CTO) Nộp hồ sơ đăng ký sàn TMĐT tại Bộ Công Thương (online qua Cổng dịch vụ công + bản cứng qua bưu điện)
26. (CTO) Nộp hồ sơ Trademark "CareNest" tại Cục SHTT
27. (CTO + Legal) Update DPIA report với pilot data thật (số user pilot, loại data, retention policy chi tiết)
28. (CTO) Review hợp đồng production VNPay (đã nhận draft), chốt fee 1.9%, settlement T+1
29. (CTO) Review hợp đồng production MoMo, chốt fee 1.7%, business account active
30. (DevOps Senior) Setup production environment riêng (separate EKS, prod RDS, prod MSK, prod Redis) — Terraform apply
31. (DevOps Senior) Setup CI/CD pipeline production (deploy qua ArgoCD hoặc Flux, manual approval gate)
32. (PM) Setup Notion/Airtable tracking pilot: 1 record/seller, 1 record/device, daily status update
33. (CTO) Pentest kickoff với vendor Tuần 28 thứ 2 (black-box + grey-box parallel)

### Tuần 29: Pilot Batch 2 + Security Audit + Load Test Target
34. (BD + Seller Ops) Onboard seller batch 3 (4 sellers cuối) — đạt 10/10 pilot sellers
35. (PM) Recruit 50 pilot buyers (internal network + F&F + outreach LinkedIn/Facebook), offer voucher -10% đơn đầu + 1 tháng BASIC miễn phí
36. (PM) Setup NPS survey (Typeform hoặc Google Form), tự động gửi sau 7 ngày mua hàng
37. (PM) Schedule 15 user interviews (60 phút/người, thưởng 200k VND/người), target đa dạng persona
38. (Backend Senior #3) Performance optimization round 2: target các hot path (PDP render, search, cart)
39. (Backend Senior #3) Chạy load test 1.000 req/s (target cuối cùng), capture full metrics
40. (DevOps Senior) Chạy soak test 24h ở 500 req/s + 5K devices, monitor memory/connection/FD leak
41. (DevOps Senior) Chạy spike test 5x traffic trong 1 phút, measure recovery time
42. (DevOps Senior) Chạy chaos test: kill random pod mỗi 10 phút trong 2h, verify graceful recovery
43. (CTO + Vendor) Pentest: vendor deliver preliminary report, review findings cùng team
44. (CTO) Triage findings: Critical (fix 24h), High (fix 3 ngày), Medium (backlog), Low (note)
45. (Backend Senior #1) Fix tất cả Critical/High vulnerabilities, verify bằng test case riêng
46. (Backend Senior #2) Fix Medium vulnerabilities ưu tiên (rate limit, security header, CSP)
47. (CTO) Daily check-in với pilot sellers qua Slack #pilot-ops, escalate blockers ngay
48. (CTO) Chạy daily operations checklist theo BMC 8.5 mỗi 09:00 AM (Kafka lag, error rate, alert latency, payment pending)
49. (PM) Thu thập feedback từ 15 user interviews Tuần 29-30, synthesis thành top 10 issues
50. (Designer) UX polish round 1 dựa trên feedback pilot (thường: activation flow quá dài, search không gợi ý tốt, PDP thiếu thông tin)

### Tuần 30: UAT + Finalize + Sign-off
51. (PM) Coordinate UAT với 3 pilot sellers (focus group 3h, thưởng 1tr/seller): test toàn bộ flow seller dashboard
52. (PM + Designer) UX polish round 2 (nếu feedback UAT có major issue)
53. (CTO + Vendor) Pentest re-test các fix, verify tất cả Critical/High đã đóng
54. (CTO) Nhận final Pentest report Tuần 30 thứ 3, có attestation letter từ vendor
55. (CTO) Disaster Recovery Plan: chạy thật backup + restore drill, đo RTO/RPO đạt yêu cầu
56. (DevOps Senior) Production deployment rehearsal (dry run full flow: build → push → canary 10% → full rollout → rollback)
57. (DevOps Senior) Final security hardening: firewall rules, rate limit config, CSP header, HSTS preload submit
58. (DevOps Senior) Setup PagerDuty rotation 3 người × 7 ngày × 24h (DevOps, Backend, IoT) cho Phase 4
59. (CTO) System Architecture Document finalized (50-80 trang, mermaid + sequence diagram đầy đủ)
60. (CTO) Runbook 7 documents finalized, host trên Confluence/Notion, on-call training 2h cho team
61. (CTO) On-call training session: walkthrough runbook, simulate 3 tình huống (Kafka down, RDS failover, payment stuck)
62. (CEO) Final review với stakeholders (BOD + advisor), present pilot report + Go/No-Go recommendation
63. (CEO) Quyết định Go/No-Go cho Soft Launch Tuần 31, nếu No-Go thì lên kế hoạch delay 2-3 tuần
64. (CTO) Sprint retrospective Phase 3, capture lessons learned vào docs
65. (CTO) Kickoff Phase 4 (Soft Launch), brief team về 4 tuần tới
66. (Marketing) Chuẩn bị soft launch campaign: PR, Facebook Ads, content calendar 4 tuần
67. (Marketing) Publish 10 bài blog SEO đầu tiên (research keyword đã làm từ Tuần 28)
68. (BD) Ký hợp đồng GHN doanh nghiệp + GHTK backup, lưu trên hệ thống contract management
69. (CTO) Nộp DPIA report v1 cho Bộ Công An (theo NĐ 13/2023)
70. (PM) Update project roadmap (Tuần 30 → Complete), changelog (Pilot complete, ready for launch)

## Todo List
- [ ] Tuần 27 — Book Pentest vendor (CyStack/VCS/VNPT) và ký NDA + scope
- [ ] Tuần 27 — Setup k6 load test cluster (3 nodes, network isolated)
- [ ] Tuần 27 — Generate test data faker: 100K users, 10K products, 1M orders
- [ ] Tuần 27 — Chạy baseline load test 100 req/s, capture bottleneck
- [ ] Tuần 27 — Finalize 10 pilot sellers list, ký hợp đồng
- [ ] Tuần 27 — Onboard seller batch 1 (3 sellers)
- [ ] Tuần 27 — Order 100 thiết bị Wonlex + 100 SIM 4G
- [ ] Tuần 27 — Setup device staging 3 vùng (HCM/HN/Đà Lạt)
- [ ] Tuần 28 — Onboard seller batch 2 (3 sellers)
- [ ] Tuần 28 — Fix bottleneck #1, chạy load test 500 req/s
- [ ] Tuần 28 — Optimize Kafka consumer (batch + linger + partition)
- [ ] Tuần 28 — Optimize WebSocket backpressure + TCP Gateway zero-copy
- [ ] Tuần 28 — Test 20 thiết bị Wonlex thật batch 1
- [ ] Tuần 28 — Nộp hồ sơ đăng ký sàn TMĐT tại BCT
- [ ] Tuần 28 — Nộp Trademark CareNest tại Cục SHTT
- [ ] Tuần 28 — Ký hợp đồng VNPay production (merchant + fee 1.9%)
- [ ] Tuần 28 — Ký hợp đồng MoMo production (business + fee 1.7%)
- [ ] Tuần 28 — Update DPIA report với pilot data
- [ ] Tuần 28 — Setup production environment (Terraform apply, EKS + RDS + MSK + Redis)
- [ ] Tuần 28 — Setup CI/CD production (ArgoCD + manual approval)
- [ ] Tuần 29 — Onboard seller batch 3 (4 sellers) — đủ 10/10
- [ ] Tuần 29 — Recruit 50 pilot buyers, phát voucher -10% + 1 tháng BASIC free
- [ ] Tuần 29 — Setup NPS survey, schedule 15 user interviews
- [ ] Tuần 29 — Chạy load test 1.000 req/s (target)
- [ ] Tuần 29 — Chạy soak test 24h @ 500 req/s
- [ ] Tuần 29 — Chạy spike test 5x traffic
- [ ] Tuần 29 — Chạy chaos test (kill pod random)
- [ ] Tuần 29 — Pentest preliminary report từ vendor
- [ ] Tuần 29 — Fix tất cả Critical/High vulnerabilities
- [ ] Tuần 29 — Daily check-in pilot sellers + chạy operations checklist
- [ ] Tuần 29 — UX polish round 1 dựa trên feedback
- [ ] Tuần 30 — UAT với 3 pilot sellers (focus group 3h)
- [ ] Tuần 30 — UX polish round 2 (nếu cần)
- [ ] Tuần 30 — Pentest re-test, nhận final report + attestation
- [ ] Tuần 30 — DR drill thật, verify RTO < 1h, RPO < 15 phút
- [ ] Tuần 30 — Production deployment rehearsal (canary → full → rollback)
- [ ] Tuần 30 — Final security hardening (CSP, HSTS, rate limit, WAF)
- [ ] Tuần 30 — Setup PagerDuty rotation 24/7 cho Phase 4
- [ ] Tuần 30 — System Architecture Document finalized (50-80 trang)
- [ ] Tuần 30 — Runbook 7 docs finalized + on-call training 2h
- [ ] Tuần 30 — Pilot final report (GMV, conversion, NPS, activation, top issues)
- [ ] Tuần 30 — Go/No-Go decision với stakeholders
- [ ] Tuần 30 — Nộp DPIA v1 cho Bộ Công An
- [ ] Tuần 30 — Ký hợp đồng GHN + GHTK doanh nghiệp
- [ ] Tuần 30 — Sprint retro Phase 3, kickoff Phase 4
- [ ] Tuần 30 — Marketing: publish 10 bài blog SEO đầu tiên
- [ ] Tuần 30 — Update roadmap + changelog

## Success Criteria

### Technical
- ✅ Load test 1.000 req/s pass, P95 < 300ms, P99 < 1s, error rate < 0.1%
- ✅ WebSocket 10K concurrent pass, message delivery P95 < 2s
- ✅ TCP Gateway 10K devices pass, packet loss < 0.01%, CPU < 70%
- ✅ Kafka pipeline 10K msg/s pass, consumer lag < 1.000
- ✅ TimescaleDB 10M vitals, aggregation query < 1s
- ✅ Soak test 24h pass, không memory/connection/FD leak
- ✅ Spike test pass (5x traffic 1 phút, recovery < 30s)
- ✅ Failover test pass (kill pod < 30s recovery, kill Kafka broker OK)
- ✅ Pentest pass: 0 critical, ≤ 2 high vulnerabilities còn open (với remediation plan)
- ✅ OWASP Top 10 (2021) audit 100% pass
- ✅ Multi-tenant isolation 100% pass (100 test cases)
- ✅ MTTR < 30 phút cho Sev 2 (drill thật đo được)
- ✅ Production environment ready (separate from staging, IaC 100%)
- ✅ DR drill: RTO < 1h, RPO < 15 phút verified
- ✅ Tất cả secrets trong AWS Secrets Manager, rotation enabled
- ✅ TLS 1.3 only, mTLS internal services
- ✅ Structured logging 100% services, retention 90 ngày hot + 7 năm cold
- ✅ Distributed tracing 100% requests với user_id correlation

### Pilot
- ✅ 10/10 pilot sellers onboarded, có đơn hàng thành tiền đầu tiên
- ✅ 100 thiết bị Wonlex thật đã kích hoạt, 70 hoạt động liên tục
- ✅ Activation rate > 60% (theo BMC 12.4 target)
- ✅ Alert latency thực tế P95 < 5s (verified với devices thật, không simulator)
- ✅ GMV pilot ≥ 50 đơn hàng thành công (target BMC 12.4)
- ✅ 50 buyer thật đã mua hàng, ≥ 80% hoàn thành activation
- ✅ NPS score > 35 (theo BMC 12.4 target)
- ✅ 15 user interviews hoàn thành, top 10 issues documented
- ✅ Hỗ trợ pilot: response time < 8h (BD trả lời Slack)
- ✅ 0 Sev 1 incidents trong pilot
- ✅ ≤ 2 Sev 2 incidents, fix trong MTTR
- ✅ 1 case study documentation per major feature (ít nhất 5 cases)
- ✅ Activation wizard completion time < 3 phút (UX KPI)

### Pháp lý
- ✅ Hồ sơ đăng ký sàn TMĐT đã nộp BCT (tracking số hồ sơ + expected approval date)
- ✅ Trademark CareNest đã nộp SHTT (tracking số đơn)
- ✅ Hợp đồng VNPay production đã ký (merchant active, test transaction pass)
- ✅ Hợp đồng MoMo production đã ký (business active, test transaction pass)
- ✅ Hợp đồng GHN doanh nghiệp đã ký (COD enabled)
- ✅ Hợp đồng GHTK backup đã ký
- ✅ Quy chế sàn đã công bố trên website (public URL)
- ✅ Điều khoản dịch vụ, Chính sách bảo mật đã publish
- ✅ DPIA report v1 đã update với pilot data
- ✅ Hợp đồng seller template đã ký với 10 pilot sellers
- ✅ Hóa đơn điện tử setup xong (VNPT/Viettel)

### Documentation
- ✅ System Design Document v1.0 (50-80 trang, 4 reviewer đã duyệt)
- ✅ OpenAPI spec đầy đủ cho 11 services, hosted `/api/docs`
- ✅ Runbook vận hành (7 documents, on-call training hoàn thành)
- ✅ User guide 3 portals (Vietnamese PDF + video)
- ✅ Video tutorials seller onboarding (3-5 videos, ≤5 phút/video)
- ✅ Blog SEO 10 bài published, target keyword research
- ✅ Press kit + fact sheet sẵn sàng cho media
- ✅ API Reference + Postman collection public

## Risk Assessment

| # | Rủi ro | XS | TD | Mức | Phòng ngừa | Owner |
|---|--------|-----|-----|------|------------|-------|
| 1 | Pentest phát hiện nhiều critical vulnerabilities phải delay launch | TB | Rất cao | 🔴 | Book vendor sớm từ Tuần 26; budget 2-3 tuần fix; có plan B nếu không kịp (delay 2-3 tuần) | CTO |
| 2 | Pilot devices Wonlex thật có edge cases không lường trước (GSM drop, firmware khác) | Cao | Cao | 🟠 | Test với simulator trước (đã làm Phase 1); có 100 devices mới phát hiện hết; sẵn sàng update codec | IoT Eng |
| 3 | Load test phát hiện bottleneck không fix kịp trong pilot | TB | Cao | 🟠 | Performance optimization liên tục từ Phase 2; chỉ handle bottleneck nặng còn lại; có 2 tuần buffer | Backend #1 |
| 4 | Pilot sellers không onboard đúng hẹn hoặc không active | TB | Cao | 🟠 | BD phụ trách sát 1-1; ưu đãi 0% hoa hồng 3 tháng; featured listing; daily check-in | BD |
| 5 | Hồ sơ đăng ký sàn BCT bị trả về yêu cầu bổ sung | TB | Cao | 🟠 | Có luật sư chuyên TMĐT y tế review; chuẩn bị docs đầy đủ; backup plan chạy trên subdomain "staging" trong khi chờ | Legal + CTO |
| 6 | Pentest vendor conflict, không available hoặc scope trượt | Thấp | Cao | 🟡 | Book 2-3 vendors Tuần 26, chọn available; nếu cần có thể in-house security audit bằng OWASP ZAP + manual | CTO |
| 7 | Pilot buyer trải nghiệm kém → NPS thấp < 30 | TB | TB | 🟡 | User test với 5 người trước pilot (Tuần 26); UX polish liên tục; hotline hỗ trợ 24/7 pilot | PM + Designer |
| 8 | Production environment khác staging → bug "chỉ xuất hiện ở prod" | Cao | Cao | 🟠 | Production-like staging (match spec); rehearsal deployment Tuần 30; có rollback plan tự động; canary 10% đầu | DevOps |
| 9 | Chi phí pilot vượt budget (100 thiết bị, ưu đãi seller, vendor pentest) | TB | TB | 🟡 | Track sát bằng expense tracking; có buffer 20% trong pilot budget (BMC 10.3 one-time 170-340tr) | CFO/CEO |
| 10 | Pilot devices gây alert spam làm nhiễu dashboard (SOS test quá nhiều) | TB | TB | 🟡 | Phân biệt test alert vs real alert qua tag; rate limit test alert 1 cái/giờ/seller | Backend + QA |
| 11 | Nộp BCT trễ do luật sư review chậm | Thấp | Cao | 🟡 | Book luật sư từ Tuần 25, deadline Tuần 28 phải có; backup luật sư thứ 2 | CTO |
| 12 | Thiết bị OEM giao trễ, không đủ 100 cái để pilot | Thấp | Cao | 🟡 | Confirm lead time Tuần 27; order dư 10-20% (110-120 cái); backup supplier ở Phase 4+ | CTO + BD |
| 13 | Sự cố thanh toán production (VNPay/MoMo) ảnh hưởng pilot | Thấp | Cao | 🟡 | Test end-to-end trên sandbox Tuần 28; giữ COD làm fallback; có 2 payment gateway parallel | Backend #2 |
| 14 | 1 hoặc nhiều pilot seller rút lui giữa chừng | TB | TB | 🟡 | Ký hợp đồng có cam kết 4 tuần; incentive tốt; pipeline seller dự phòng 3-5 seller | CEO + BD |
| 15 | 1 trong 11 services bị lỗi nghiêm trọng, không recover kịp | Thấp | Rất cao | 🟠 | Multi-AZ + replica + circuit breaker; DR plan; rollback tự động | DevOps + Backend |

## Security Considerations
- **Production isolation**: Production EKS cluster tách biệt hoàn toàn với staging, không share credentials, không share database
- **Secrets rotation**: Tất cả credentials (DB master password, payment HMAC, IoT broker key, JWT signing) rotate sau pilot, lưu AWS Secrets Manager với auto-rotation 30-90 ngày
- **Audit log retention**: 7 năm (theo NĐ 13/2023/NĐ-CP), lưu S3 Glacier + compliance lock
- **Pentest fixes**: Critical/High bắt buộc fix trước Soft Launch, Medium đưa vào sprint backlog, Low note
- **Vulnerability scan**: Chạy Snyk + Trivy + npm audit mỗi CI build; weekly full scan trên Docker images
- **DDoS protection**: Cloudflare Pro cho buyer/seller portals, rate limit + WAF rules
- **WAF rules**: OWASP CRS profile enable, custom rules cho CareNest-specific endpoints
- **MFA bắt buộc**: Admin (TOTP), Seller Owner (TOTP optional nhưng recommended), Buyer (SMS OTP khi thanh toán > 5tr)
- **Penetration test frequency**: Mỗi 6 tháng + sau major release (Phase 4 launch, B2B add-on, AI feature)
- **Bug bounty**: Setup HackerOne hoặc BugCrowd post-Phase 4 launch, reward tier 100-5000 USD
- **SOC 2 baseline**: Document controls, không cần certification Phase 3-4 nhưng ready cho audit Phase 5+
- **Cyber insurance**: Mua gói cơ bản 50-100tr/năm (BMC 10.3 chưa có, nên add vào)
- **Data backup**: RDS automated backup + PITR (Point In Time Recovery) 7 ngày, S3 versioning, daily snapshot toàn hệ thống
- **GDPR/PDPA explicit consent**: Checkbox trước khi đăng ký, banner cookie, right to be forgotten, data export
- **Encryption**: AES-256 at-rest, TLS 1.3 in-transit, mTLS giữa services, key rotation 90 ngày
- **IP whitelist**: Admin panel chỉ accessible từ VPN hoặc IP VN whitelist
- **Rate limit**: 100 req/s per IP cho public API, 1000 req/s per authenticated user, 10 req/s cho auth endpoints

## Next Steps

### Dependencies cho Phase 4 (Soft Launch — Tuần 31+)
Phase 4 phụ thuộc chặt Phase 3 phải đạt:
- [ ] Production environment ready (IaC 100%, separate from staging)
- [ ] Pentest pass với 0 critical vulnerabilities
- [ ] Load test 1.000 req/s pass
- [ ] Pilot với 10 sellers + 100 devices thành công (NPS > 30, activation > 60%)
- [ ] Hồ sơ pháp lý BCT đã nộp (không cần approved, chỉ cần submitted)
- [ ] Runbook + on-call team ready (3 người rotation 24/7)
- [ ] Documentation đầy đủ (System Design, API spec, user guides)
- [ ] Marketing materials ready (press kit, 10 blog posts, social content)
- [ ] VNPay/MoMo production test transaction pass
- [ ] GHN/GHTK doanh nghiệp contract active
- [ ] Pilot final report với Go recommendation

### Go/No-Go Criteria cho Soft Launch
Phải đạt TẤT CẢ tiêu chí dưới đây:
- ✅ Pentest pass (0 critical, ≤ 2 high với remediation plan)
- ✅ Load test 1.000 req/s pass với NFR đạt
- ✅ Pilot NPS > 30 (target 35)
- ✅ Pilot GMV > 50 đơn thành công
- ✅ Pilot activation rate > 60%
- ✅ Hồ sơ BCT đã nộp (tracking số + expected approval)
- ✅ Production deploy rehearsal pass (canary + full + rollback)
- ✅ Team on-call ready (3 người, 24/7 rotation, training xong)
- ✅ Marketing campaign ready (PR + ads + content)
- ✅ Bug bash tổng kết, top 20 issues đã fix hoặc có plan
- ✅ DPIA report v1 đã update
- ✅ Disaster recovery drill pass (RTO < 1h)

### Follow-up tasks nếu có vấn đề
- Nếu Pentest fail nhiều critical → delay launch 2-3 tuần, re-pilot batch nhỏ
- Nếu pilot NPS < 25 → extensive UX iteration, delay launch 1 tháng
- Nếu production deploy gặp bug nghiêm trọng → rollback, fix, re-rehearsal
- Recruit thêm 5 người cho Phase 4: 1 Customer Success, 1 Marketing Lead, 1 B2B Sales, 1 Content Writer, 1 QA Engineer

### Handoff sang Phase 4 (Soft Launch)
- CTO brief Phase 4 plan với team, target metrics 4 tuần
- Setup channel #phase-4-launch trên Slack
- Marketing campaign launched (PR + Facebook Ads + content marketing)
- 24/7 on-call rotation active
- Daily standup mới 09:30 AM (track pilot → soft launch transition)
- Weekly Business Review theo BMC 13.3 bắt đầu từ Tuần 31
- Recruit CS team (3 người) cho support buyer/seller
- Plan thêm tuần 35-38: bug bash tổng, performance tune, onboarding thêm 20-30 sellers
