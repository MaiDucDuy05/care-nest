# Phase 4: Ra mắt và Tăng tốc (Tuần 31+)

## Context Links
- Project docs: [carenest-de-xuat.md](../../docs/carenest-de-xuat.md), [carenest-bmc-report.md](../../docs/carenest-bmc-report.md)
- Related reports:
  - [Phase 0 Plan](./phase-00-khoi-dong-va-rd.md) — nền tảng pháp lý + R&D
  - [Phase 1 Plan](./phase-01-xay-dung-core-platform.md) — Core platform (Auth, Catalog, Cart, Order, IoT Gateway)
  - [Phase 2 Plan](./phase-02-tich-hop-dich-vu.md) — Tích hợp Payment/Logistics/Subscription/Alert
  - [Phase 3 Plan](./phase-03-pilot-thu-nghiem.md) — Pentest, 10 pilot sellers, 100 devices
  - [Device Simulator PDR](../../device_simulator/docs/project-overview-pdr.md) — reference cho mobile app integration
- Đề xuất Section 13.2: Gantt chart `p4_1` Soft Launch (4 tuần), `p4_2` Mở rộng B2B + Mobile (8 tuần)
- Đề xuất Section 13.3: Bảng phân kỳ — deliverables Phase 4 (Soft Launch, 1.000 đơn đầu tiên, Mobile App)
- Đề xuất Section 14: KPI framework (Commerce, Sellers, IoT, Tech ops)
- BMC Section 6: 5 dòng doanh thu (Commission, Subscription, Seller Plans, B2B, Ads)
- BMC Section 7.3: Team expansion (Mobile Lead, B2B Sales, Data Engineer, ML Engineer)
- BMC Section 12.5: Phase 4 Scale roadmap table (initiatives + timeline + KPI)
- BMC Section 13.2: KPI theo tháng T3/T6/T9/T12 (đặc biệt T9 GMV 2.8B, T12 GMV 4.5B)
- BMC Section 14: Runway management & Incident Response
- Skills liên quan: `.claude/skills/wonlex-tcp-command/`, `sequential-thinking/`, `code-reviewer/`

## Overview
- **Priority**: 🔴 Critical (business milestone — sống còn cho Year 1-2)
- **Current Status**: Not Started (chờ Phase 3 sign-off + Pentest pass)
- **Owner**: CEO + CTO + Head of Marketing + Head of B2B Sales (mới tuyển) + Mobile Lead (mới)
- **Duration**: 8+ tuần (Tuần 31-38+), có thể kéo dài tới T12 để đạt full KPI
- **Brief Description**:
  Phase 4 chuyển CareNest từ "platform chạy được trên pilot 10 sellers" sang "sàn TMĐT y tế quy mô quốc gia với multi-channel". Gồm 6 trụ cột song song: (1) **Soft Launch chính thức** truyền thông rộng rãi (PR, Facebook/Zalo/Google Ads, SEO, KOL) để đạt 1.000 đơn đầu tiên trong 60 ngày; (2) **Mở rộng sellers** từ 10 lên 80 với BD team 3 người và self-service onboarding portal; (3) **B2B Sales** chuyên trách cho viện dưỡng lão + phòng khám với B2B service tách riêng (Fleet Dashboard, API, contract); (4) **Mobile App React Native + Expo** (iOS + Android) với UX đặc biệt cho user 60+ tuổi; (5) **Quảng cáo nội sàn** (Sponsored CPC + Banner CPM) mở thêm revenue stream; (6) **AI Recommendations** (collaborative + content-based) A/B test tăng conversion. Bên cạnh đó: Loyalty Program, data warehouse + BI dashboard, mobile push notification (APNs/FCM), B2B hóa đơn VAT, regional expansion research, Series A preparation. Mục tiêu cuối Phase 4 (tháng 12): GMV 4.5 tỷ/tháng, 2.200 đơn, 80 sellers, 2.500 SKU, 800 devices activated, MRR 80M, NPS >52, tiến gần break-even tháng 20-24.

## Key Insights
- **Soft Launch cần "controlled chaos"**: Không launch all-in một ngày. Tuần 1-2 chỉ 10% traffic organic, tăng dần 20-30-50-100% theo từng tuần để team vận hành kịp phát hiện bug dần, không để dồn vào launch day (giảm rủi ro Sev 1 incident trong 48h đầu).
- **Mobile App retention thấp nếu chỉ copy web**: Phải thiết kế native UX đặc biệt cho user 60+ tuổi (font 18-22px, ít bước, 1 nút bấm lớn, voice input optional, push notification cá nhân hóa). 70% người dùng 60+ từng dùng app y tế 1 lần rồi uninstall vì UX phức tạp — đây là cơ hội khác biệt.
- **B2B có LTV gấp 10-20x B2C**: Một hợp đồng viện dưỡng lão 30-300 triệu/năm, retention >90% (switching cost cao vì đã tích hợp quy trình). Sales cycle dài 3-6 tháng nhưng đáng để ưu tiên — cần B2B Sales Manager có network ngành y tế từ đầu.
- **Runway management quan trọng nhất khi scale**: Burn rate sẽ tăng theo growth (team từ 17 lên 32+ người, marketing từ 80tr lên 250tr/tháng, mobile app dev + ads + ML) nhưng revenue chưa kịp. Weekly financial review bắt buộc, alert nếu burn > budget 20% liên tiếp 2 tháng.
- **AI/ML chỉ nên làm khi có đủ data**: Recommendation engine cần 200K+ data points mới hiệu quả. Pilot ở tháng 38 dùng rule-based trước (top seller, top category, recently viewed), sau đó A/B test ML model — nếu conversion +10% thì mới scale.
- **Reuse 80% buyer infrastructure cho B2B/Mobile/Ads**: Không nên xây lại từ đầu. Auth, Catalog, Order, Payment, IoT đã ổn định ở Phase 0-3; chỉ thêm 20% B2B-specific (multi-tenant Fleet Dashboard, API rate limit, PDF contract) và 20% Mobile-specific (biometric, push, offline cache).
- **Marketing CAC tỉ lệ nghịch với trust**: Trong y tế, người dùng cần tin tưởng trước khi mua. Organic (SEO, PR, KOL y tế) có CAC thấp hơn paid ads 3-5x, đồng thời tăng brand trust. Phase 4 nên 60% effort vào organic + referral.
- **Ads nội sàn chỉ work khi traffic đủ**: CPC và CPM cần minimum 2.000 SKU + 5.000 visitors/ngày mới break-even ad operations cost. Mở ads ở tháng 36 (sau khi đạt scale), không mở sớm ở tháng 31.

## Requirements

### Functional Requirements (FR)

#### Soft Launch và Marketing
- **FR-4.1**: Soft Launch chính thức vào ngày thứ 31, có communications plan 2 tuần trước (email warm-up, social countdown, teaser campaign).
- **FR-4.2**: Landing page care-nest.vn với hero section, value prop "Buy right. Care always", 3 CTA (mua sắm, xem thiết bị, đăng ký tư vấn), testimonials.
- **FR-4.3**: PR báo chí: 5-10 bài trên VnExpress Sức khỏe, Tuổi Trẻ, Dân Trí, Sức khỏe Đời sống, VietnamNet; có bài PR dạng native content (review sản phẩm, phỏng vấn founder).
- **FR-4.4**: Social media presence: Facebook Page "CareNest Vietnam" (đăng 5-7 bài/tuần), Zalo OA chính thức, TikTok channel (video ngắn về chăm sóc người cao tuổi).
- **FR-4.5**: Facebook Ads + Zalo Ads targeting 30-55 tuổi, quan tâm chăm sóc sức khỏe gia đình, ngân sách khởi điểm 50tr/tháng, scale lên 150tr/tháng sau 4 tuần nếu ROAS >2x.
- **FR-4.6**: Google Search Ads cho high-intent keywords: "đồng hồ người già", "máy đo huyết áp chính hãng", "thiết bị y tế thông minh", "đồng hồ định vị Wonlex", "que thử đường huyết"; ngân sách 30tr/tháng, CPC target <5k.
- **FR-4.7**: SEO content: 20 bài blog chất lượng tháng đầu (tiêu chuẩn 1500-2500 chữ/bài, có hình ảnh, internal link), chủ đề: chăm sóc người cao tuổi, review thiết bị y tế, hướng dẫn sử dụng, huyết áp bình thường theo tuổi.
- **FR-4.8**: Email marketing: 4-5 campaign onboarding (D+1, D+3, D+7, D+14, D+30), retention weekly digest, cart abandoner winback 24h, NPS survey monthly.
- **FR-4.9**: Referral program: Người giới thiệu nhận voucher 50k khi người được giới thiệu hoàn tất đơn đầu tiên; người được giới thiệu giảm 100k đơn đầu; tracking qua mã ref + cookie 30 ngày.
- **FR-4.10**: KOL partnership: 5-10 micro-influencer về y tế, chăm sóc gia đình, bà mẹ bỉm sữa (10K-100K followers); mỗi KOL 1-2 bài post + 1 video; ngân sách 2-5 triệu/KOL.

#### Mở rộng Sellers
- **FR-4.11**: Scale từ 10 pilot lên 30 sellers active trong tháng 11 (T11).
- **FR-4.12**: Scale lên 80 sellers active trong tháng 12 (T12), với target mỗi seller ≥1 đơn/tháng.
- **FR-4.13**: BD team tăng từ 1 lên 3 người (1 Head of BD + 2 BD Exec), target 6-8 seller onboard/tháng/người.
- **FR-4.14**: Seller self-service onboarding portal: cho phép seller đăng ký KYC, upload giấy phép TTBYT, đăng sản phẩm, xem analytics mà không cần BD thủ công; giảm BD effort 60%.
- **FR-4.15**: Seller Health Score tracking tự động: dựa trên fulfillment rate, response time, return rate, NPS, listing quality; cảnh báo sớm seller yếu (score <60) cho BD can thiệp.
- **FR-4.16**: Featured Seller program: ưu tiên hiển thị trên homepage, badge "Uy tín", boost SEO; yêu cầu Health Score >80, fulfillment rate >95%.
- **FR-4.17**: Seller training webinar hàng tháng (chủ đề: tối ưu listing, quản lý đơn hàng, marketing tools, pháp lý TTBYT); ghi hình + đăng YouTube.

#### B2B (Viện dưỡng lão, Phòng khám)
- **FR-4.18**: Tuyển B2B Sales team: 1 B2B Sales Manager (senior, có network y tế) + 2 B2B Account Executives; target 2-3 deals/tháng/người.
- **FR-4.19**: B2B landing page riêng tại care-nest.vn/b2b với value prop riêng, case study viện dưỡng lão pilot, demo Fleet Dashboard, contact form.
- **FR-4.20**: B2B pricing tier rõ ràng: STARTER (5-20 devices, 5-15 triệu/tháng), BUSINESS (21-100 devices, 15-60 triệu/tháng), ENTERPRISE (100+ devices, custom contract); hỗ trợ cả pricing theo thiết bị lẫn pricing trọn gói.
- **FR-4.21**: B2B inquiry form + auto-routing cho sales (theo region, device count); CRM tracking pipeline; SLA response <4h.
- **FR-4.22**: Fleet Management Dashboard cho B2B: 1 màn hình hiển thị tất cả devices, filter theo phòng/người cao tuổi, alert timeline, health summary; tối ưu cho 100+ devices.
- **FR-4.23**: API integration cho B2B: REST API đầy đủ (devices, alerts, users, reports) + Webhook cho sự kiện (SOS, fall, low_battery); OpenAPI 3.0 spec; rate limit 10K req/day.
- **FR-4.24**: B2B SLA: 99.9% uptime, dedicated account manager, support 24/7 cho sự cố khẩn cấp, monthly business review.
- **FR-4.25**: B2B contract management: tạo PDF hợp đồng từ template (dùng puppeteer + Handlebars), e-signature integration (DocuSign API hoặc VNPT eSign), lưu trữ 7 năm.
- **FR-4.26**: Hóa đơn VAT cho B2B: tự động xuất hóa đơn điện tử sau mỗi kỳ thanh toán, tích hợp với nhà cung cấp hóa đơn điện tử (VNPT/Viettel/MISA), gửi email cho B2B customer.
- **FR-4.27**: On-site training cho B2B customers: 1 buổi 2-4h tại viện, hướng dẫn nhân viên sử dụng Fleet Dashboard, xử lý alert, troubleshoot cơ bản; có tài liệu PDF + video.

#### Mobile App (React Native + Expo)
- **FR-4.28**: React Native setup với Expo (managed workflow) — code reuse 80-90% với web; sử dụng TypeScript strict, EAS Build cho CI/CD.
- **FR-4.29**: iOS app build + Android app build; sử dụng Expo EAS Build để generate iOS archive (.ipa) và Android APK/AAB.
- **FR-4.30**: App Store + Google Play submission; chuẩn bị metadata (screenshots, description, keywords, privacy policy), review guideline compliance.
- **FR-4.31**: Mobile UX đặc biệt cho user 60+: font 18-22px, nút bấm to ≥48px, ít bước (max 3 bước cho task chính), voice input optional (cho search), high-contrast mode.
- **FR-4.32**: Push notification qua APNs (iOS) + FCM (Android); deep link từ notification vào màn hình device alert, order detail, promotion.
- **FR-4.33**: Offline mode: cache 7 ngày data (orders, devices, health summary) bằng AsyncStorage hoặc MMKV; sync khi online; offline indicator.
- **FR-4.34**: Biometric login: Face ID (iOS), Touch ID (iOS), Fingerprint (Android); sử dụng expo-local-authentication.
- **FR-4.35**: Health Dashboard native: real-time vitals (heart rate, SpO2, BP), alert timeline, biểu đồ (dùng react-native-svg + victory-native hoặc react-native-gifted-charts).
- **FR-4.36**: Camera integration: scan QR code để kích hoạt device (dùng expo-camera + expo-barcode-scanner); OCR cho giấy tờ y tế (optional).
- **FR-4.37**: Background location tracking cho thiết bị đeo: dùng TaskManager + expo-location; permission flow rõ ràng.
- **FR-4.38**: App size <50MB (sau khi cài đặt); sử dụng Hermes JS engine, ProGuard/R8 cho Android, Bitcode cho iOS.

#### Quảng cáo nội sàn
- **FR-4.39**: Sponsored Products: CPC bidding cho keywords trong search results và category pages; seller tự đặt giá thầu, budget daily, ranking theo bid × quality score.
- **FR-4.40**: Banner Display: CPM cho homepage (1 vị trí trên cùng), category pages (2 vị trí), product detail page (sidebar); reserve 7-14 ngày trước.
- **FR-4.41**: Ads admin panel (web-seller): tạo campaign, set budget (daily/total), target keywords/audience, upload creative, xem report.
- **FR-4.42**: Ads reporting: impressions, clicks, CTR, conversions, ROAS, spend; export CSV; real-time dashboard cho seller.
- **FR-4.43**: Auto-bid optimization (sau khi có data 2-4 tuần): thuật toán tự điều chỉnh bid để tối ưu ROAS; ML model dự đoán conversion probability.

#### AI Recommendations (Pilot)
- **FR-4.44**: Data pipeline: collect user behavior từ Kafka events (product.view, product.click, search.query, add_to_cart, purchase) → store vào user_events table.
- **FR-4.45**: Feature engineering: user demographics (age range, gender, region), health profile (care receiver age, conditions), browsing history (last 30/60/90 ngày), purchase history.
- **FR-4.46**: Model: hybrid collaborative filtering (matrix factorization) + content-based (product embeddings từ category, brand, attributes); scikit-learn + implicit library.
- **FR-4.47**: A/B test infrastructure: 50/50 split dựa trên user_id hash, exposure logging, conversion tracking; sử dụng Statsig hoặc custom feature flag.
- **FR-4.48**: Recommendation API: `GET /recommendations?user_id=xxx&context=homepage|pdp&limit=10`; response trong <100ms; cache Redis 5 phút.
- **FR-4.49**: Hiển thị "Gợi ý cho bạn" trên homepage (carousel 10 sản phẩm) + PDP ("Khách hàng cũng mua" 5 sản phẩm); fallback về top sellers nếu chưa có data.
- **FR-4.50**: ML model retraining pipeline: cron job hàng tuần (Chủ nhật 02:00) train lại model với data mới nhất; A/B test tự động khi có model mới.

#### Loyalty Program
- **FR-4.51**: Điểm thưởng: 1 điểm / 10.000đ mua hàng (delivered order); điểm cộng sau khi order delivered + 7 ngày return window.
- **FR-4.52**: Tier tự động: Silver (0-2 triệu spend/năm), Gold (2-10 triệu, 1.2x điểm), Platinum (>10 triệu, 1.5x điểm + free ship); review lại mỗi tháng.
- **FR-4.53**: Đổi điểm: catalog quà tặng (voucher giảm giá, free shipping, quà tặng sức khỏe, thiết bị nhỏ); tỷ lệ 100 điểm = 10.000đ voucher.
- **FR-4.54**: Birthday bonus: tự động gửi voucher 200k cho member vào ngày sinh nhật (qua email + push); valid 30 ngày.
- **FR-4.55**: Member-only deals: sản phẩm giảm giá chỉ cho member từ Gold trở lên; weekly flash sale cho Platinum.

### Non-Functional Requirements (NFR)
- **NFR-4.1**: Hỗ trợ 10.000+ concurrent buyers (P95 latency tăng không quá 20% so với 1.000 concurrent); verified bằng k6 load test.
- **NFR-4.2**: Mobile app cold start <3s trên iPhone 11 / Samsung Galaxy A52; dùng Hermes + lazy loading + skeleton UI.
- **NFR-4.3**: Mobile app battery usage <5% / hour (background) cho health monitoring; sử dụng background fetch + push thay vì polling liên tục.
- **NFR-4.4**: Uptime SLA 99.9% (cho phép 8.7h downtime/năm); track qua Better Uptime + Datadog Synthetics.
- **NFR-4.5**: P95 page load <2.5s (Lighthouse score >85 cho Performance, Accessibility, SEO, Best Practices).
- **NFR-4.6**: CDN coverage 90%+ requests served from edge (CloudFront + Cloudflare); cache static assets 1 năm, HTML 1 giờ, API responses per-cache-control.
- **NFR-4.7**: Marketing dashboard: real-time GMV, conversion, traffic; refresh mỗi 5 phút; dùng Metabase + PostgreSQL replica hoặc BigQuery.
- **NFR-4.8**: B2B API rate limit: 10.000 req/day cho mỗi API key; burst 100 req/minute; HTTP 429 khi vượt.
- **NFR-4.9**: Mobile app crash rate <0.1% (theo dõi qua Sentry + Firebase Crashlytics); free of Sev 1 crash >24h.
- **NFR-4.10**: Recommendation API latency <100ms (P95); pre-compute top-N và cache Redis 5 phút.
- **NFR-4.11**: Ads load latency <200ms; lazy load dưới fold, không block critical render path.
- **NFR-4.12**: Database connection pool auto-scale (PgBouncer với max 200 conn → RDS Proxy); monitor pg_stat_activity.
- **NFR-4.13**: Data warehouse cho analytics: BigQuery (Google) hoặc Redshift (AWS) hoặc ClickHouse (self-hosted, tiết kiệm chi phí); sync từ PostgreSQL qua Kafka Connect hoặc nightly ETL.
- **NFR-4.14**: BI dashboard: Metabase (open-source) hoặc Looker Studio (free); CEO dashboard (GMV, customers, burn), Marketing dashboard (CAC, ROAS), Tech dashboard (uptime, latency, errors).
- **NFR-4.15**: Cost monitoring: AWS/GCP cost dashboard (Vantage hoặc CloudZero), alert qua email/Slack nếu cost >budget 110%.

## Architecture

### Mobile App Architecture (React Native + Expo)
```
care-nest-mobile/
├── src/
│   ├── app/                       # Expo Router (file-based routing)
│   │   ├── _layout.tsx            # Root layout
│   │   ├── (tabs)/                # Bottom tab navigation
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx          # Home
│   │   │   ├── devices.tsx        # Health Dashboard
│   │   │   ├── cart.tsx
│   │   │   ├── orders.tsx
│   │   │   └── account.tsx
│   │   ├── (auth)/                # Auth flow
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── biometric-setup.tsx
│   │   ├── (shop)/                # Shopping flow
│   │   │   ├── products/[id].tsx
│   │   │   ├── category/[slug].tsx
│   │   │   ├── search.tsx
│   │   │   └── checkout.tsx
│   │   ├── (devices)/             # Device management
│   │   │   ├── [id]/dashboard.tsx
│   │   │   ├── [id]/vitals.tsx
│   │   │   ├── [id]/alerts.tsx
│   │   │   └── activate.tsx
│   │   ├── (loyalty)/             # Loyalty flow
│   │   │   ├── index.tsx
│   │   │   ├── rewards.tsx
│   │   │   └── history.tsx
│   │   └── (more)/                # Settings, help
│   │       ├── settings.tsx
│   │       ├── notifications.tsx
│   │       └── help.tsx
│   ├── components/                # Reusable UI
│   │   ├── ProductCard.tsx
│   │   ├── HealthChart.tsx
│   │   ├── AlertCard.tsx
│   │   ├── TierBadge.tsx
│   │   └── SponsoredProduct.tsx
│   ├── lib/
│   │   ├── api/                   # tRPC client hoặc REST
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── devices.ts
│   │   │   └── recommendations.ts
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCart.ts
│   │   │   ├── useDevices.ts
│   │   │   └── usePushToken.ts
│   │   ├── store/                 # Zustand state
│   │   │   ├── auth.ts
│   │   │   ├── cart.ts
│   │   │   └── notifications.ts
│   │   └── utils/                 # formatters, validators
│   ├── services/
│   │   ├── push.ts                # FCM/APNs
│   │   ├── biometric.ts           # Face ID, Touch ID, Fingerprint
│   │   ├── camera.ts              # QR scan
│   │   ├── location.ts            # GPS
│   │   ├── analytics.ts           # Firebase, Sentry
│   │   └── offline.ts             # AsyncStorage, MMKV
│   ├── constants/
│   ├── types/
│   └── i18n/                      # đa ngôn ngữ (vi, en)
├── assets/                        # images, fonts
├── app.json                       # Expo config
├── eas.json                       # EAS Build config
├── babel.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

### B2B Architecture
- **Subdomain**: b2b.care-nest.vn (tách route, nhưng share auth, catalog, payment, IoT core)
- **Service**: `services/b2b-service/` (NestJS, multi-tenant bằng `organization_id`)
- **Reuse 80% buyer infrastructure**: auth, catalog, order, payment, IoT, notification
- **B2B-specific features**: Fleet Dashboard, B2B API, Contract Management (PDF), e-Signature, VAT Invoice
- **Database schema tách biệt**: `b2b_organizations`, `b2b_fleet_groups`, `b2b_contracts`, `b2b_api_keys`
- **Auth riêng**: B2B user có role `B2B_ADMIN`, `B2B_STAFF`; multi-org membership
- **SLA**: 99.9% uptime, priority support 24/7, dedicated account manager

### Ads Engine Architecture
- **Kafka events**: `ad.impression`, `ad.click`, `ad.conversion` (purchase attributed)
- **Click fraud detection**: rate limit per IP/user, IP reputation check, pattern analysis (click burst trong <1s)
- **Billing system**: deduct từ seller balance monthly (auto-debit); nếu không đủ tiền → pause ads
- **Ranking**: bid × quality_score (CTR, conversion rate, listing relevance)
- **Cache**: Redis cache ads creative 1 giờ; pre-render server-side nếu có thể

### AI/ML Pipeline
- **Data source**: `user_events` table (PostgreSQL) sync sang BigQuery/ClickHouse qua Kafka Connect
- **Feature store**: simple SQL features (no Feast initially); có thể upgrade nếu scale
- **Model training**: Jupyter notebook + scikit-learn / implicit library; scheduled notebook (papermill) chạy hàng tuần
- **Model serving**: embed model vào NestJS service (pickle file → Python microservice hoặc ONNX runtime); cache recommendations trong Redis
- **Monitoring**: track model drift (distribution shift), CTR, conversion; alert nếu CTR drops >20%
- **Fallback**: nếu model fail hoặc chưa có data → trả về top sellers + top category (rule-based)

### Runway & Financial Tracking
- **Weekly financial review** (CEO + CFO + CTO mỗi thứ 2): burn rate, revenue, cash, runway
- **3-statement model** (Google Sheets + updated monthly): P&L, Balance Sheet, Cash Flow
- **Fundraising**: Series A prep từ T12 (nếu cần); pitch deck, data room, target 30-60 tỷ VND
- **Cost monitoring**: AWS Cost Explorer, Vantage.sh, monthly cost report tự động email cho CEO

### Data Warehouse + BI
- **ETL pipeline**: Kafka → BigQuery/ClickHouse (real-time) hoặc PostgreSQL → DW (nightly batch)
- **BI tools**: Metabase (open-source, self-hosted) cho operational dashboard; Looker Studio cho ad-hoc analysis
- **Dashboards chính**:
  - CEO Dashboard: GMV, customers, subscriptions, burn, runway, top KPIs
  - Marketing Dashboard: CAC, ROAS, channel breakdown, campaign performance
  - Tech Dashboard: uptime, P95 latency, error rate, Kafka lag, deployment frequency
  - Sales Dashboard: B2B pipeline, sellers onboarded, GMV per seller

## Related Code Files

### Files cần tạo trong Phase 4

#### Mobile App (React Native + Expo) — ~30 files
- `care-nest-mobile/package.json`, `app.json`, `eas.json`, `tsconfig.json`
- `care-nest-mobile/src/app/_layout.tsx`, `(tabs)/_layout.tsx`, `(auth)/_layout.tsx`
- `care-nest-mobile/src/app/(tabs)/index.tsx` (Home), `devices.tsx`, `cart.tsx`, `orders.tsx`, `account.tsx`
- `care-nest-mobile/src/app/(auth)/login.tsx`, `register.tsx`, `forgot-password.tsx`, `biometric-setup.tsx`
- `care-nest-mobile/src/app/(shop)/products/[id].tsx`, `category/[slug].tsx`, `search.tsx`, `checkout.tsx`
- `care-nest-mobile/src/app/(devices)/[id]/dashboard.tsx`, `[id]/vitals.tsx`, `[id]/alerts.tsx`, `activate.tsx`
- `care-nest-mobile/src/app/(loyalty)/index.tsx`, `rewards.tsx`, `history.tsx`
- `care-nest-mobile/src/components/ProductCard.tsx`, `HealthChart.tsx`, `AlertCard.tsx`, `TierBadge.tsx`, `SponsoredProduct.tsx`
- `care-nest-mobile/src/lib/api/client.ts`, `auth.ts`, `products.ts`, `orders.ts`, `devices.ts`, `recommendations.ts`
- `care-nest-mobile/src/lib/store/auth.ts`, `cart.ts`, `notifications.ts`
- `care-nest-mobile/src/services/push.ts`, `biometric.ts`, `camera.ts`, `location.ts`, `analytics.ts`, `offline.ts`
- `care-nest-mobile/ios/Podfile`, `Info.plist`
- `care-nest-mobile/android/app/build.gradle`, `AndroidManifest.xml`
- `care-nest-mobile/assets/` (icons, splash, fonts)

#### B2B Service (NestJS) — ~10 files
- `services/b2b-service/src/main.ts`
- `services/b2b-service/src/b2b/b2b.controller.ts`, `b2b.service.ts`
- `services/b2b-service/src/fleet/fleet.controller.ts`, `fleet.service.ts`
- `services/b2b-service/src/contracts/contracts.service.ts`, `pdf-generator.ts`
- `services/b2b-service/src/api-keys/api-keys.service.ts`
- `services/b2b-service/src/b2b.module.ts`
- `services/b2b-service/prisma/schema.prisma` (b2b_organizations, b2b_fleet_groups, b2b_contracts, b2b_api_keys)
- `apps/web-buyer/app/b2b/page.tsx` (landing), `b2b/contact/page.tsx`, `b2b/dashboard/page.tsx`
- `apps/web-seller/app/b2b/page.tsx` (B2B pricing)

#### Ads Service (NestJS) — ~8 files
- `services/ads-service/src/main.ts`
- `services/ads-service/src/campaigns/campaigns.service.ts`, `campaigns.controller.ts`
- `services/ads-service/src/sponsored/sponsored.service.ts`
- `services/ads-service/src/banner/banner.service.ts`
- `services/ads-service/src/billing/billing.service.ts`
- `services/ads-service/src/fraud/fraud-detector.ts`
- `services/ads-service/prisma/schema.prisma` (ad_campaigns, ad_impressions, ad_clicks)
- `apps/web-admin/app/ads/page.tsx`, `ads/campaigns/page.tsx`, `ads/reports/page.tsx`
- `apps/web-buyer/components/ads/SponsoredProduct.tsx`, `BannerAd.tsx`

#### Recommendations Service (NestJS + Python) — ~8 files
- `services/recommendation-service/src/main.ts`
- `services/recommendation-service/src/recommend/recommend.service.ts`, `recommend.controller.ts`
- `services/recommendation-service/src/feature-store/feature.service.ts`
- `services/recommendation-service/src/ab-testing/ab.service.ts`
- `services/recommendation-service/src/ml/model-trainer.py`, `serving.py`, `requirements.txt`
- `services/recommendation-service/prisma/schema.prisma` (user_events, recommendation_logs)
- `apps/web-buyer/app/api/recommendations/route.ts`
- `apps/web-buyer/components/recommendations/ProductRecommendations.tsx`

#### Loyalty Service (NestJS) — ~6 files
- `services/loyalty-service/src/main.ts`
- `services/loyalty-service/src/points/points.service.ts`, `points.controller.ts`
- `services/loyalty-service/src/tiers/tiers.service.ts`
- `services/loyalty-service/src/rewards/rewards.service.ts`
- `services/loyalty-service/src/kafka/order-consumer.ts` (tính điểm khi order delivered)
- `services/loyalty-service/prisma/schema.prisma` (loyalty_points, loyalty_tiers, loyalty_redemptions)
- `apps/web-buyer/app/loyalty/page.tsx`
- `apps/web-buyer/components/loyalty/PointsDisplay.tsx`, `TierBadge.tsx`

#### Analytics & Email Marketing — ~6 files
- `services/analytics-service/src/main.ts`
- `services/analytics-service/src/events/events.service.ts`, `events.controller.ts`
- `services/analytics-service/src/funnels/funnel.service.ts`
- `services/analytics-service/src/cohorts/cohort.service.ts`
- `services/email-marketing/src/campaigns/campaigns.service.ts`
- `services/email-marketing/src/templates/` (welcome, abandoned_cart, weekly_digest, birthday, winback)
- `apps/web-buyer/components/analytics/GoogleTag.tsx`, `MetaPixel.tsx`

#### Infrastructure — ~6 files
- `infrastructure/terraform/prod/autoscaling.tf` (HPA, cluster autoscaler)
- `infrastructure/terraform/prod/cloudfront-cdn.tf` (CDN config)
- `infrastructure/terraform/prod/waf.tf` (rate limit rules, SQL injection)
- `infrastructure/terraform/prod/rds-read-replica.tf`
- `infrastructure/k8s/prod/cron-jobs.yaml` (model retraining, billing, report generation)
- `infrastructure/k8s/prod/celery-workers.yaml` (ads, loyalty, email)
- `infrastructure/monitoring/bi/looker-dashboards/` (exported dashboard JSON)
- `infrastructure/monitoring/grafana/prod-dashboards/` (CEO dashboard, Tech dashboard)

### Files KHÔNG tạo trong Phase 4
- ❌ KHÔNG tạo New core service nào khác (chỉ thêm 4 service mới ở trên: b2b, ads, recommendations, loyalty + analytics, email)
- ❌ KHÔNG tạo New payment gateway (ZaloPay đã có ở Phase 2)
- ❌ KHÔNG tạo New logistics provider (GHN + GHTK đủ)
- ❌ KHÔNG tạo Mạng xã hội features (group, chat giữa users) — chưa cần
- ❌ KHÔNG tạo Telemedicine platform (chỉ partnership exploration)
- ❌ KHÔNG tạo Native iOS/Android app riêng (dùng React Native cross-platform)
- ❌ KHÔNG tạo Blockchain/Web3 features (out of scope)
- ❌ KHÔNG refactor các core service đang chạy ổn (Phase 1-3)

## Implementation Steps

### Tuần 31: Soft Launch Day
1. (CEO + Marketing) Gửi Soft Launch announcement qua email warm list, PR, social (đã chuẩn bị 2 tuần trước)
2. (CEO + CTO) Monitor launch day real-time từ 06:00-24:00; incident response team active
3. (DevOps) 24/7 on-call rotation; Datadog monitors, PagerDuty alerts
4. (Marketing) Facebook Ads + Zalo Ads go-live (budget 50tr/tháng đầu)
5. (Marketing) Google Search Ads go-live (budget 30tr/tháng đầu)
6. (Marketing) 20 bài blog SEO publish trên care-nest.vn/blog
7. (BD) Mở rộng seller batch 1: 10 sellers mới onboard (tổng 20)
8. (BD) Mở rộng seller batch 2: 10 sellers mới (tổng 30) vào cuối tuần 31
9. (CTO) Mobile App Expo project setup, skeleton code
10. (CTO) Setup B2B landing page basic tại care-nest.vn/b2b
11. (CS) Setup hotline 1900-CARENEST, ticket system (Zendesk/Intercom)
12. (CEO) Weekly financial review đầu tiên của Phase 4

### Tuần 32: Stabilize + B2B Kickoff
13. (CTO) Fix top 10 issues từ soft launch feedback (bugs, UX issues, performance)
14. (CTO) Performance tuning dựa trên real traffic: enable caching, optimize queries, tune DB indexes
15. (Mobile Lead) Mobile App core screens (Home, Product, Cart, Account, Login)
16. (Marketing) KOL partnership: ký hợp đồng 5-10 micro-influencer, bắt đầu đăng bài
17. (HR + CEO) Hire 1 B2B Sales Manager (senior, có network y tế)
18. (B2B Sales Manager) Outreach 20 viện dưỡng lão + phòng khám đầu tiên
19. (B2B Sales Manager) Pilot 1-2 viện dưỡng lão free 1 tháng (chưa tính tiền)
20. (Marketing) Email campaign: winback cho cart abandoners (D+1, D+3, D+7)
21. (Marketing) A/B test landing page (3 variants: hero image, value prop, CTA)
22. (CS) Thu thập NPS weekly từ buyers active; target NPS >40

### Tuần 33: Mobile App Beta + Ads Service
23. (Mobile Lead) Mobile App complete core feature set (devices dashboard, alerts, biometric)
24. (Mobile Lead) iOS build + TestFlight beta với 50 internal testers
25. (Mobile Lead) Android build + Internal testing với 30 testers (Play Console internal track)
26. (CTO + Ads Team) Ads Service setup: schema, campaign CRUD, sponsored bidding algorithm
27. (CTO) Sponsored Products (CPC) cho search results
28. (CTO) Banner Display cho homepage (1 slot)
29. (Admin) Ads admin panel basic (create campaign, view report)
30. (BD) Mở rộng seller lên 50; self-service onboarding portal go-live
31. (B2B Sales Manager) Chốt 1 deal B2B đầu tiên (viện dưỡng lão pilot convert thành paid)
32. (B2B Service) Setup B2B Fleet Dashboard MVP (xem devices, alerts, health summary)
33. (Marketing) Retargeting ads cho website visitors (Facebook Pixel, Google Tag)

### Tuần 34: Mobile Launch + Recommendations Pilot
34. (Mobile Lead) Submit iOS app lên App Store (chuẩn bị screenshots, description, review)
35. (Mobile Lead) Submit Android app lên Google Play (AAB format, content rating)
36. (CTO + ML Engineer) Recommendation Service setup: data pipeline, feature engineering
37. (CTO + ML Engineer) Initial model training: collaborative filtering trên data pilot
38. (CTO) A/B test infrastructure: 50/50 split, exposure logging
39. (Frontend Senior) Integrate recommendations vào homepage + PDP (component `ProductRecommendations`)
40. (BD) Mở rộng seller lên 60; Seller Health Score tracking go-live
41. (B2B Sales Manager) Pilot 2 viện dưỡng lão (tổng 50 devices B2B)
42. (Marketing) Loyalty program launch: Silver tier (1 điểm/10K, đổi voucher)
43. (CS) CSAT survey sau mỗi support ticket; top 5 feedback categories report

### Tuần 35: Mobile Public + B2B Scale
44. (Mobile Lead) App Store approval → iOS app live; ASO optimization
45. (Mobile Lead) Google Play approval → Android app live
46. (Mobile Lead) Push notification setup với APNs (iOS) + FCM (Android)
47. (B2B Sales Manager + 1 AE) Chốt 3 deals B2B (tổng 100 devices B2B)
48. (B2B Service) Fleet Dashboard tối ưu cho 100+ devices (virtualized list, filters)
49. (B2B Service) API documentation (OpenAPI 3.0) + onboarding guide cho B2B customers
50. (CTO) Loyalty Service launch full (points, tiers, rewards)
51. (CTO) Loyalty: tier upgrade automation (cron job hàng ngày)
52. (BD) Mở rộng seller lên 70; Featured Seller program go-live
53. (Marketing) Birthday bonus campaign: voucher 200k cho member có birthday trong tháng

### Tuần 36: Optimize + Loyalty + Ads Revenue
54. (CTO + ML Engineer) Recommendations A/B test analysis: so sánh conversion, AOV giữa 2 group
55. (CTO + ML Engineer) Optimize model dựa trên feedback; retrain với feature mới
56. (Ads Service) Auto-bid optimization algorithm v1 (rule-based, sau upgrade ML)
57. (Marketing) Sponsored Products campaign cho top 20 sellers (ưu đãi 50% spend tháng đầu)
58. (CTO) Loyalty: rewards catalog expansion (thêm 20+ rewards mới)
59. (CTO) Loyalty: tier-specific deals (Gold: free ship, Platinum: ưu đãi đặc biệt)
60. (BD) Mở rộng seller lên 80; đạt target T12
61. (Mobile Lead) Mobile app optimization: cold start <3s, crash fix
62. (Mobile Lead) Offline mode cho health dashboard (cache 7 ngày data)
63. (B2B Sales) Pilot thêm 3 viện dưỡng lão (tổng 6 viện, 150+ devices)

### Tuần 37: Scale + Data + Regional Research
64. (CTO) Performance tuning cho 10K+ concurrent users: load test, identify bottleneck, optimize
65. (CTO) Cost optimization: RDS reserved instance, CloudFront caching tuning, spot instance cho ML training
66. (CTO) Database query optimization dựa trên slow query log (pg_stat_statements)
67. (CTO) Setup data warehouse: BigQuery hoặc ClickHouse (sync từ PostgreSQL qua Kafka)
68. (CTO) BI dashboards (Metabase): CEO dashboard, GMV dashboard, Marketing dashboard
69. (B2B Sales) Setup pipeline cho 10 deals Q1 năm sau; CRM tracking
70. (B2B Service) API rate limit + quota management (10K req/day, burst 100/min)
71. (CEO + CTO) Regional expansion research: Thailand + Philippines market analysis
72. (CEO) Series A preparation: pitch deck, data room, financial model 3 năm
73. (Marketing) Referral program optimize dựa trên data (top referrer reward tier 2)

### Tuần 38: Stabilize + Plan Year 2
74. (CTO) Final performance audit: load test 10K concurrent, security scan
75. (CTO) Final security audit: penetration test round 2, vulnerability scan
76. (CTO) Disaster recovery test: chaos engineering (kill 1 service, verify auto-recovery)
77. (Mobile Lead) Mobile app v2 planning: native features (background BLE, advanced chart)
78. (CTO) AI/ML roadmap cho năm 2: AI diagnostic, predictive health, anomaly detection
79. (CEO) Final KPI review: đạt target tháng 12 (T12) chưa? Gap analysis
80. (CEO) Year 2 planning kickoff: OKRs, budget, team expansion
81. (CTO) Year 2 tech roadmap: microservices mới, tech debt cleanup
82. (Marketing) Year 2 marketing plan: brand campaign, channel diversification
83. (All) Annual retrospective: ăn mừng thành công, rút kinh nghiệm

## Todo List

### Tuần 31 — Soft Launch
- [ ] (CEO) Gửi Soft Launch announcement qua email + social + PR
- [ ] (CTO) Monitor launch day real-time, incident response
- [ ] (DevOps) 24/7 on-call rotation kích hoạt
- [ ] (Marketing) Facebook Ads + Zalo Ads go-live
- [ ] (Marketing) Google Search Ads go-live
- [ ] (Marketing) 20 bài blog SEO publish
- [ ] (BD) Onboard 20 sellers mới (batch 1 + 2)
- [ ] (CTO) Mobile App Expo project setup
- [ ] (CTO) B2B landing page basic go-live
- [ ] (CS) Setup hotline 1900-CARENEST, ticket system
- [ ] (CEO) Weekly financial review #1 Phase 4

### Tuần 32 — Stabilize + B2B Kickoff
- [ ] (CTO) Fix top 10 issues từ soft launch feedback
- [ ] (CTO) Performance tuning dựa trên real traffic
- [ ] (Mobile Lead) Mobile App core screens (Home, Product, Cart, Account)
- [ ] (Marketing) KOL partnership ký hợp đồng + bắt đầu đăng
- [ ] (HR + CEO) Hire B2B Sales Manager
- [ ] (B2B Sales) Outreach 20 viện dưỡng lão
- [ ] (B2B Sales) Pilot 1-2 viện dưỡng lão free
- [ ] (Marketing) Email winback campaign
- [ ] (Marketing) A/B test landing page
- [ ] (CS) Thu thập NPS weekly

### Tuần 33 — Mobile Beta + Ads
- [ ] (Mobile Lead) Mobile App complete core features
- [ ] (Mobile Lead) iOS TestFlight beta + Android internal testing
- [ ] (CTO) Ads Service setup + sponsored CPC live
- [ ] (CTO) Banner Display live trên homepage
- [ ] (Admin) Ads admin panel basic
- [ ] (BD) Seller lên 50 + self-service onboarding portal
- [ ] (B2B Sales) Chốt 1 deal B2B đầu tiên
- [ ] (B2B Service) Fleet Dashboard MVP
- [ ] (Marketing) Retargeting ads

### Tuần 34 — Mobile Submit + Recommendations
- [ ] (Mobile Lead) Submit iOS app lên App Store
- [ ] (Mobile Lead) Submit Android app lên Google Play
- [ ] (CTO + ML) Recommendation Service setup
- [ ] (CTO + ML) Initial model training + A/B infrastructure
- [ ] (Frontend) Integrate recommendations vào homepage + PDP
- [ ] (BD) Seller lên 60 + Seller Health Score tracking
- [ ] (B2B Sales) Pilot 2 viện dưỡng lão
- [ ] (Marketing) Loyalty program launch (Silver tier)
- [ ] (CS) CSAT survey + feedback categorization

### Tuần 35 — Mobile Public + B2B Scale
- [ ] (Mobile Lead) iOS app live trên App Store
- [ ] (Mobile Lead) Android app live trên Google Play
- [ ] (Mobile Lead) Push notification (APNs + FCM) live
- [ ] (B2B Sales) Chốt 3 deals B2B (100 devices)
- [ ] (B2B Service) Fleet Dashboard tối ưu cho 100+ devices
- [ ] (B2B Service) API documentation + onboarding
- [ ] (CTO) Loyalty Service full launch + tier automation
- [ ] (BD) Seller lên 70 + Featured Seller program
- [ ] (Marketing) Birthday bonus campaign

### Tuần 36 — Optimize + Loyalty + Ads
- [ ] (CTO + ML) Recommendations A/B test analysis
- [ ] (CTO + ML) Model optimization
- [ ] (Ads) Auto-bid optimization v1
- [ ] (Marketing) Sponsored Products campaign cho top sellers
- [ ] (CTO) Loyalty: rewards catalog expansion
- [ ] (CTO) Loyalty: tier-specific deals
- [ ] (BD) Seller lên 80 (đạt T12 target)
- [ ] (Mobile Lead) Mobile app optimization + crash fix
- [ ] (Mobile Lead) Offline mode cho health dashboard
- [ ] (B2B Sales) Pilot thêm 3 viện dưỡng lão

### Tuần 37 — Scale + Data + Regional
- [ ] (CTO) Performance tuning 10K+ concurrent
- [ ] (CTO) Cost optimization (RDS reserved, CloudFront tuning)
- [ ] (CTO) Database query optimization
- [ ] (CTO) Setup data warehouse (BigQuery/ClickHouse)
- [ ] (CTO) BI dashboards (Metabase) cho CEO + Marketing
- [ ] (B2B Sales) Pipeline 10 deals Q1 next year
- [ ] (B2B Service) API rate limit + quota management
- [ ] (CEO + CTO) Regional expansion research (TH, PH)
- [ ] (CEO) Series A prep: pitch deck, data room
- [ ] (Marketing) Referral program optimize

### Tuần 38 — Stabilize + Year 2 Plan
- [ ] (CTO) Final performance audit
- [ ] (CTO) Final security audit
- [ ] (CTO) Disaster recovery test
- [ ] (Mobile Lead) Mobile app v2 planning
- [ ] (CTO) AI/ML roadmap cho Year 2
- [ ] (CEO) Final KPI review T12
- [ ] (CEO) Year 2 OKRs + budget
- [ ] (CTO) Year 2 tech roadmap
- [ ] (Marketing) Year 2 marketing plan
- [ ] (All) Annual retrospective

### Year 2 Preparation
- [ ] (CEO) Brief Year 2 strategy cho toàn team
- [ ] (CEO + HR) Team expansion plan 40+ người
- [ ] (CEO + CFO) Series A fundraising plan (30-60 tỷ VND)
- [ ] (CTO) Hire Native Mobile Lead (Swift + Kotlin) cho Year 2
- [ ] (CTO) Hire Data Engineer + ML Engineer full-time
- [ ] (Marketing) Brand campaign cho Year 2
- [ ] (BD) Target 150+ sellers cho Year 2
- [ ] (B2B Sales) Target 30+ B2B customers cho Year 2

## Success Criteria

### Business KPIs (theo BMC section 13.2)
- ✅ **T6 (Tuần 36)**: GMV 1.2 tỷ/tháng, 600 đơn, 20 sellers, 500 SKU, 150 devices, MRR 20M, NPS >38
- ✅ **T9 (Tuần 36+3)**: GMV 2.8 tỷ/tháng, 1.400 đơn, 50 sellers, 1.200 SKU, 400 devices, MRR 50M, NPS >45
- ✅ **T12 (Tuần 38+)**: GMV 4.5 tỷ/tháng, 2.200 đơn, 80 sellers, 2.500 SKU, 800 devices, MRR 80M, NPS >52
- ✅ Subscription renewal rate >70%
- ✅ Activation rate >85%
- ✅ 1.000 đơn hàng đầu tiên trong 60 ngày sau Soft Launch
- ✅ Uptime 99.9% (Sev 1 incidents <2/tháng)

### Soft Launch
- ✅ Soft Launch thành công, không Sev 1 incident trong 48h đầu
- ✅ Traffic tăng 20% mỗi tuần sau launch (organic + paid)
- ✅ Conversion rate visitor → buyer >2.5%
- ✅ Cart abandonment <65%
- ✅ NPS >40 sau 30 ngày launch

### Mobile App
- ✅ iOS + Android app live trên App Store + Google Play
- ✅ Rating App Store >4.0/5
- ✅ 5.000 downloads trong tháng đầu
- ✅ DAU >30% downloads (1.500+ DAU)
- ✅ Cold start <3s, crash rate <0.1%

### B2B
- ✅ 10+ viện dưỡng lão pilot (active customers)
- ✅ 100+ B2B devices deployed
- ✅ 3+ hợp đồng B2B >30 triệu
- ✅ B2B dashboard real-time cho 100+ devices
- ✅ B2B API uptime 99.9%

### Marketing
- ✅ 20 bài blog SEO publish, organic traffic +50%
- ✅ Facebook Ads ROAS >2x
- ✅ Zalo Ads CPL <100k
- ✅ Google Search Ads CPC <5k
- ✅ KOL partnership: 10+ micro-influencer, 50+ posts
- ✅ Email open rate >25%, click rate >3%
- ✅ Referral program: 100+ referrals thành công

### Ads Engine
- ✅ Sponsored Products live, ≥20 sellers active
- ✅ Banner Display live, fill rate >80%
- ✅ Ads revenue: 30-50 triệu/tháng (cuối Phase 4)
- ✅ Auto-bid optimization giảm CPA 15%

### Loyalty
- ✅ ≥30% buyers là loyalty member
- ✅ Tier distribution: 70% Silver, 25% Gold, 5% Platinum
- ✅ Repeat purchase rate +18% so với trước launch

### AI Recommendations
- ✅ Recommendation API live với <100ms latency
- ✅ A/B test: conversion +10% (recommended group vs control)
- ✅ Coverage: 80%+ homepage/PDP visits có recommendations

### Tech
- ✅ Mobile app cross-platform (1 codebase, 2 platforms)
- ✅ Data warehouse setup, sync real-time
- ✅ BI dashboards cho CEO + Marketing
- ✅ Cost monitoring: AWS cost dashboard, alert >budget
- ✅ Disaster recovery tested, RTO <1h, RPO <15min

## Risk Assessment

| # | Rủi ro | XS | TD | Mức | Phòng ngừa | Owner |
|---|--------|-----|-----|------|------------|-------|
| 1 | **Soft Launch có Sev 1 incident, mất uy tín trong 48h đầu** | TB | Rất cao | 🔴 | 24/7 on-call, monitoring kỹ, rollback plan, status page | CTO |
| 2 | **Marketing CAC cao (>500K), ROI thấp** | Cao | Cao | 🟠 | A/B test liên tục; target audience chặt; focus vào organic + referral | Marketing |
| 3 | **Mobile app bị App Store reject nhiều lần** | TB | Cao | 🟠 | TestFlight beta kỹ; follow App Store guidelines; có app reviewer (nếu cần) | Mobile Lead |
| 4 | **B2B sales cycle dài, không chốt được deal** | Cao | TB | 🟡 | B2B Sales Manager có network; offer pilot miễn phí 1 tháng; case study từ pilot | B2B Sales |
| 5 | **Burn rate tăng nhanh, runway ngắn** | TB | Rất cao | 🔴 | Weekly financial review; cost monitoring; raise Series A sớm nếu cần | CEO + CFO |
| 6 | **AI/ML model không improve conversion** | Cao | TB | 🟡 | A/B test để verify; fallback rule-based; skip AI nếu không hiệu quả | CTO |
| 7 | **Mobile app retention thấp (D30 <30%)** | Cao | TB | 🟡 | Push notification cá nhân hóa; UX đặc biệt cho user 60+ | Mobile Lead |
| 8 | **Đối thủ lớn (Shopee, Long Châu) ra mắt tính năng tương tự** | TB | TB | 🟡 | Speed to market; network effect caregiver; data moat; brand trust y tế | CEO |
| 9 | **Scale team quá nhanh (17 → 32+), culture bị loãng** | TB | TB | 🟡 | Hire chậm, chắc; giữ core values; mentorship program; weekly all-hands | CEO + HR |
| 10 | **Data privacy incident, mất trust** | Thấp | Rất cao | 🔴 | Security audit liên tục; DPO; incident response plan; cyber insurance | CTO + Legal |
| 11 | **Loyalty program bị exploit (fake accounts, points farming)** | TB | TB | 🟡 | Rate limit điểm; manual review cho tier upgrade; email/phone verification | CTO + Marketing |
| 12 | **B2B contract không chốt được do pháp lý chậm** | TB | TB | 🟡 | Luật sư review template sẵn; e-signature tích hợp; SLA rõ ràng | B2B Sales + Legal |
| 13 | **Ads revenue không đạt target do traffic chưa đủ** | TB | TB | 🟡 | Mở ads chỉ khi có 2K+ SKU và 5K+ visitors/ngày | Marketing + CTO |
| 14 | **Mobile app battery drain cao, user tắt app** | TB | TB | 🟡 | Optimize background fetch; dùng push thay vì polling; test trên 5+ devices | Mobile Lead |
| 15 | **Data warehouse cost tăng cao (BigQuery/Redshift)** | TB | TB | 🟡 | ClickHouse self-hosted thay BigQuery nếu cost quá cao; archive data cũ | CTO + Finance |

## Security Considerations
- **Mobile app security**: Certificate pinning (chống MITM), root detection (Android), jailbreak detection (iOS), code obfuscation (ProGuard/R8), secure storage cho tokens (Keychain/Keystore).
- **B2B API security**: OAuth 2.0 (server-to-server), API key rotation mỗi 90 ngày, IP whitelist cho sensitive operations, request signing HMAC-SHA256.
- **Ads fraud detection**: Click pattern analysis (burst detection, geo anomaly), IP reputation check, device fingerprinting, manual review cho ROAS bất thường.
- **Loyalty exploitation**: Rate limit điểm thưởng (max 1.000 điểm/ngày/user), manual review cho tier upgrade lên Gold/Platinum, email/phone verification trước khi redeem.
- **Data analytics privacy**: Anonymize PII trong data warehouse (hash user_id, mask tên/SĐT/email), RBAC cho BI access, audit log mọi query.
- **AI/ML bias**: Audit model cho gender/age bias hàng quý, fairness metric tracking, A/B test stratified theo segment.
- **Marketing compliance**: Luật quảng cáo y tế 2012 + NĐ 181/2013 (không claim chữa bệnh, phải có số công bố), review nội dung quảng cáo y tế trước khi chạy.
- **B2B contracts**: NDA, Data Processing Agreement (DPA) theo PDPA, SLA rõ ràng trong hợp đồng, điều khoản chấm dứt và bảo hành.
- **Cross-border data**: Nếu expand regional (Thailand, Philippines), cần xử lý data residency (mỗi nước 1 cluster), GDPR compliance cho EU users.
- **Penetration test frequency**: Mỗi 6 tháng + sau major release (Mobile app launch, B2B API, Ads engine); third-party pentester (VCS, CyStack, Viettel Cyber Security).
- **Bug bounty**: HackerOne setup sau Soft Launch (T+30 ngày), reward 500K-50M VNĐ tùy severity.
- **Incident response plan**: Sev 1 → 5min response, Sev 2 → 1h, Sev 3 → 4h; status page + email customer trong 24h.
- **Backup strategy**: PostgreSQL PITR 7 ngày + daily snapshot, S3 versioning 90 ngày, off-region backup Singapore hàng tuần.

## Next Steps

### Dependencies cho Year 2
- [x] 80 sellers active (T12 target đạt được)
- [x] 800 devices activated (T12 target)
- [x] MRR 80M (T12 target)
- [x] Mobile app 5K+ downloads
- [x] B2B 10+ customers
- [x] NPS >52
- [x] Data warehouse + BI
- [ ] Series A funding secured (nếu cần runway extension)

### Year 2 Initiatives (high-level)
- **AI Diagnostic Assistant**: Phân tích vitals từ thiết bị, cảnh báo sớm arrhythmia, fall prediction, anomaly detection.
- **Telemedicine partnership**: Tích hợp với Jio Health, Doctor Anywhere, eDoctor; upsell khi device phát hiện bất thường.
- **Insurance integration**: Premium cá nhân hóa dựa trên health data (consent-based), partnership với PVI, Bảo Việt, Manulife.
- **Regional expansion**: Thailand (Q2 Y2), Philippines (Q3 Y2); market research + local partnership.
- **Native Mobile App v2**: Swift + Kotlin (sau khi React Native đã validate product-market fit), advanced features (background BLE, offline ML).
- **B2B Enterprise features**: Multi-location management, SSO (SAML), custom reports, white-label option.
- **Marketplace for caregivers**: Matching service giữa family và caregiver chuyên nghiệp (y tế, điều dưỡng), commission-based.
- **Loyalty program expansion**: Gamification (badges, levels, challenges), referral tier 2-3, partnership với brands khác (FPT, Vinamilk).

### Handoff sang Year 2
- (CEO) Brief Year 2 strategy cho toàn team (all-hands Q1 Y2)
- (CEO + HR) Setup OKRs cho Year 2 (3 OKR chính: Growth, Tech, People)
- (CEO + HR) Team expansion plan (40+ người cuối Y2)
- (CEO + CFO) Series A fundraising plan: target 30-60 tỷ VND, milestone cần đạt
- (CTO) Tech roadmap Y2: AI/ML platform, microservices mới, tech debt cleanup
- (Marketing) Brand campaign Y2: TVC, OOH, digital, KOL tier 1
- (BD) Target 150+ sellers, 5.000+ SKU cuối Y2
- (B2B Sales) Target 30+ B2B customers, 500+ B2B devices cuối Y2

### Series A Preparation (nếu cần)
- **Target raise**: 30-60 tỷ VND (~1.5-2.5M USD)
- **Timing**: T12-T15 (nếu burn rate > 300M/tháng và runway < 9 tháng)
- **Use of funds**:
  - 40% Team scale (40+ người, đặc biệt mobile, data, AI)
  - 25% Marketing (brand campaign, channel diversification)
  - 20% Product development (AI, telemedicine, regional)
  - 10% Infrastructure (multi-region, scaling)
  - 5% Working capital + reserve
- **Milestone to show**:
  - Break-even rõ lộ trình (current burn trending down)
  - 150+ sellers active
  - 2.000+ subscriptions
  - GMV 8-10B/tháng
  - NPS >55
  - 20+ B2B customers

## Appendix: Team Expansion Plan

| Giai đoạn | Team Size | Roles mới thêm |
|-----------|-----------|----------------|
| **Phase 3 (Hiện tại)** | 17 người | CEO, CTO, Head of BD, BD Exec, Head of Marketing, Content, CS Lead, CS (2), Backend Senior (3), Frontend Senior (2), Mobile Lead, Mobile Dev, DevOps, IoT Engineer, PM, Designer, QA |
| **Phase 4 T1-T2 (Tuần 31-34)** | 25 người | +1 Mobile Lead (nếu chưa có), +2 Mobile Dev, +1 B2B Sales Manager, +2 BD Exec, +1 Marketing Manager, +1 Content, +1 CS Lead, +1 QA |
| **Phase 4 T3-T4 (Tuần 35-38)** | 32 người | +1 Data Engineer, +1 ML Engineer, +1 B2B Account Executive, +1 Designer, +2 CS, +1 Finance/Ops |
| **Year 2 T1-T6** | 50 người | +Native Mobile (Swift + Kotlin: 2), +Security Engineer, +Finance Ops, +HR Manager, +B2B Sales (2), +Telemedicine PM, +AI Research Engineer |

> 📌 **Note**: Team expansion phải đi đôi với onboarding chất lượng. Mỗi người mới cần 2 tuần onboarding với buddy system, 1 tháng đầu chỉ làm task nhỏ, 2 tháng mới đảm nhận việc lớn. Tránh scale team quá nhanh dẫn đến code quality giảm và culture loãng.
