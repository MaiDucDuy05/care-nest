# Plan Triển Khai Dự Án CareNest

> **CareNest** — *"Buy right. Care always."*
> Sàn TMĐT y tế (multi-vendor B2B2C) + IoT Health Monitoring SaaS
> Xây dựng từ số 0 (Zero-base Build) — 30 tuần (~7.5 tháng) đến Soft Launch

---

## 📋 Tổng quan 5 giai đoạn

| # | Giai đoạn | Thời gian | Status | Owner chính | Deliverable trọng tâm |
|---|-----------|-----------|--------|-------------|------------------------|
| **0** | [Khởi động & R&D](./phase-00-khoi-dong-va-rd.md) | Tuần 1–6 | 🔴 Not Started | CEO + CTO | Monorepo, IoT Codec, DB Schema, Pháp lý, 8 người core |
| **1** | [Xây dựng Lõi Hệ thống](./phase-01-xay-dung-core-platform.md) | Tuần 7–18 | 🔴 Not Started | CTO + 3 Backend Senior | 8 microservices + TCP Gateway + Alert Engine |
| **2** | [Tích hợp & Hoàn thiện](./phase-02-tich-hop-va-hoan-thien.md) | Tuần 19–26 | 🔴 Not Started | 2 Frontend + 1 Backend | 3 cổng Next.js + GHN + Device Activation + Subscription |
| **3** | [Thử nghiệm & Thẩm định](./phase-03-thu-nghiem-va-tham-dinh.md) | Tuần 27–30 | 🔴 Not Started | CTO + QA + DevOps | Load test, Pentest, 10 pilot sellers, 100 devices, nộp BCT |
| **4** | [Ra mắt & Tăng tốc](./phase-04-ra-mat-va-tang-toc.md) | Tuần 31+ | 🔴 Not Started | CEO + Marketing + B2B Sales | Soft Launch, Mobile App, B2B, AI/ML, đạt 4.5B GMV T12 |

---

## 🏗️ Tech Stack (chốt toàn bộ dự án)

| Layer | Technology | Mục đích |
|-------|-----------|----------|
| Monorepo | Turborepo + pnpm | Quản lý 11 services + 3 portals + shared packages |
| Backend | NestJS 10 (microservices, TypeScript) | 8 core services + 3 supporting services |
| Frontend | Next.js 14 (App Router) | 3 portals: web-buyer, web-seller, web-admin |
| Mobile | React Native + Expo (Phase 4) | iOS + Android, UX cho user 60+ |
| Database | PostgreSQL 16 + TimescaleDB | Relational + time-series vitals |
| Message Broker | Apache Kafka 3.7+ (KRaft) | Event-driven backbone, 8+ topics |
| Cache | Redis 7 | Session, rate limit, cart temp |
| Search | MeiliSearch | Full-text search tiếng Việt |
| IoT Gateway | Node.js TCP Server | 10K+ concurrent Wonlex devices |
| Realtime | Socket.IO | Alert push <5s latency |
| Container | Docker + Kubernetes | Production HA cluster |
| CI/CD | GitHub Actions | Lint + test + deploy |
| Monitoring | Grafana + Prometheus + Sentry | Metrics + logs + errors |
| Payments | VNPay, MoMo, ZaloPay | Escrow + subscription auto-renew |
| Logistics | GHN (primary), GHTK (backup) | Shipping nationwide |
| Notification | SES, VAPID, ESMS.vn, Zalo ZNS | Email + Push + SMS + Zalo |

---

## 📊 Tài nguyên & Ngân sách

- **Team MVP**: 16–17 người (CEO + CTO + 3 Backend + 2 Frontend + 1 IoT + 1 DevOps + 1 PM + 1 Designer + 1 BD + 1 Marketing + 1 CS Lead + 2 CS + 1 Legal)
- **Team Phase 4**: 25–32 người (mở rộng Mobile, B2B Sales, Data/ML, Marketing)
- **Vốn Year 1**: 7–10 tỷ VND (~280–400K USD)
- **Break-even dự kiến**: Tháng 20–24 (Base Case)
- **KPI T12**: GMV 4.5 tỷ/tháng, 2.200 đơn, 80 sellers, 2.500 SKU, 800 devices, MRR 80M, NPS >52

---

## 🔗 Key Dependencies (chuỗi quan trọng)

```
Phase 0 (Foundation)
   ├── Monorepo + DB + IoT Codec
   └── Team 8 người + Pháp lý nền
         ↓
Phase 1 (Core Services)
   ├── Auth + KYC + Catalog + Order + Payment
   ├── TCP Gateway + Alert Engine
   └── 8 microservices production-ready
         ↓
Phase 2 (Integration & UX)
   ├── 3 Next.js portals
   ├── GHN shipping + Notification multi-channel
   └── Device Activation + Subscription flow
         ↓
Phase 3 (Pilot & Validation)
   ├── Load test 1.000 req/s + Pentest pass
   ├── 10 pilot sellers + 100 devices thật
   └── Nộp hồ sơ BCT + Trademark
         ↓
Phase 4 (Soft Launch & Scale)
   ├── Marketing đa kênh (PR, Ads, SEO, KOL)
   ├── Mobile App + B2B Sales + AI/ML
   └── Đạt 4.5B GMV/tháng (T12)
```

---

## ⚠️ Rủi ro then chốt (R0–R5)

- **R0**: Đốt hết vốn trước khi có traction → weekly runway tracking
- **R1**: Xây platform >12 tháng → scope MVP gọn, 2-week sprints
- **R2**: Không tuyển được kỹ sư IoT → offer equity, outsource codec
- **R3**: Pháp lý TTBYT kéo dài → ký luật sư tuần 1, MVP chỉ TTBYT loại I/II
- **R4**: Khó thu hút sellers (cold start) → 0% hoa hồng 3 tháng, 1-1 onboarding
- **R5**: Lộ dữ liệu sức khỏe → security-by-design, AES-256, TLS 1.3, PDPA

---

## 📂 Cấu trúc Plan

```
plans/261012-0900-carenest-implementation-plan/
├── plan.md                              ← File này (overview)
├── phase-00-khoi-dong-va-rd.md          ← Tuần 1-6 (520 dòng)
├── phase-01-xay-dung-core-platform.md   ← Tuần 7-18 (560 dòng)
├── phase-02-tich-hop-va-hoan-thien.md   ← Tuần 19-26 (696 dòng)
├── phase-03-thu-nghiem-va-tham-dinh.md  ← Tuần 27-30 (616 dòng)
└── phase-04-ra-mat-va-tang-toc.md       ← Tuần 31+ (705 dòng)
```

**Tổng**: 3.097 dòng plan chi tiết | Mỗi phase file có 12 sections theo template (Context → Overview → Insights → Requirements → Architecture → Files → Steps → Todo → Success → Risk → Security → Next Steps).

---

## 🚀 Quick Start

1. **Đọc `plan.md` này** để nắm tổng quan 30 tuần
2. **Bắt đầu từ [Phase 0](./phase-00-khoi-dong-va-rd.md)**: Setup monorepo, tuyển team, R&D protocol Wonlex, nộp pháp lý
3. **Mỗi tuần**: CEO + CTO review sprint progress theo Todo List trong phase file tương ứng
4. **Mỗi phase**: Sprint retrospective + go/no-go decision trước khi qua phase sau

---

*📌 Plan version 1.0 — Ngày tạo: 2026-10-12 | Cập nhật sau mỗi milestone quan trọng.*
*Liên kết docs nguồn: [carenest-de-xuat.md](../../docs/carenest-de-xuat.md) | [carenest-bmc-report.md](../../docs/carenest-bmc-report.md)*
