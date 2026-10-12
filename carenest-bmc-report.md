# 🏥 CARENEST — BÁO CÁO BUSINESS MODEL CANVAS
### *Xây dựng sàn thương mại điện tử y tế từ con số 0 — không có nền tảng sẵn có*

> **CareNest** — *"Buy right. Care always."*
> **Phiên bản:** v2.0 (Từ số 0 hoàn toàn) | **Ngày:** Tháng 10/2026
> **Mô hình:** Multi-vendor B2B2C E-commerce + IoT Health Monitoring SaaS

---

## MỤC LỤC

1. [Tổng quan Business Model Canvas](#1-tổng-quan-business-model-canvas)
2. [Khối 1 — Customer Segments](#2-khối-1--customer-segments-phân-khúc-khách-hàng)
3. [Khối 2 — Value Propositions](#3-khối-2--value-propositions-giá-trị-đề-xuất)
4. [Khối 3 — Channels](#4-khối-3--channels-kênh-tiếp-cận)
5. [Khối 4 — Customer Relationships](#5-khối-4--customer-relationships-quan-hệ-khách-hàng)
6. [Khối 5 — Revenue Streams](#6-khối-5--revenue-streams-dòng-doanh-thu)
7. [Khối 6 — Key Resources](#7-khối-6--key-resources-nguồn-lực-chính)
8. [Khối 7 — Key Activities](#8-khối-7--key-activities-hoạt-động-chính)
9. [Khối 8 — Key Partnerships](#9-khối-8--key-partnerships-đối-tác-chính)
10. [Khối 9 — Cost Structure](#10-khối-9--cost-structure-cơ-cấu-chi-phí)
11. [Tài chính & Break-even](#11-tài-chính--break-even)
12. [Go-to-Market Roadmap](#12-go-to-market-roadmap--lộ-trình-từ-số-0)
13. [KPI Dashboard](#13-kpi-dashboard)
14. [Rủi ro & Giảm thiểu](#14-rủi-ro--giảm-thiểu)
15. [Tech Stack & Kiến trúc](#15-tech-stack--kiến-trúc-xây-mới-hoàn-toàn)
16. [Executive Summary](#16-executive-summary)
17. [Phụ lục](#phụ-lục)

---

## 1. Tổng quan Business Model Canvas

### 1.1. Sơ đồ Canvas 9 khối

```
╔══════════════════╦═══════════════════════╦══════════════════════╦══════════════════════╦══════════════════════╗
║  KEY PARTNERS    ║  KEY ACTIVITIES       ║                      ║  VALUE PROPOSITIONS  ║  CUSTOMER            ║
║                  ║                       ║   KEY RESOURCES      ║                      ║  RELATIONSHIPS       ║
║ • Nhà phân phối  ║ • Xây dựng platform   ║                      ║ Người mua:           ║                      ║
║   TTBYT (sellers)║   TMĐT từ đầu         ║ • Đội ngũ kỹ thuật   ║ • SP y tế chính hãng ║ • Onboarding wizard  ║
║ • Nhà sx thiết   ║ • Tích hợp IoT        ║   full-stack          ║ • Giám sát sức khỏe  ║ • Hotline kích hoạt  ║
║   bị đeo (OEM)   ║   wearable devices    ║ • Vốn đầu tư (seed)  ║   từ xa 24/7         ║ • Push alerts        ║
║ • Cổng thanh     ║ • KYC & duyệt nhà bán ║ • Giấy phép TMĐT     ║ • Cảnh báo < 5 giây  ║ • Monthly report     ║
║   toán (VNPay,   ║ • Marketing & Growth  ║ • Thương hiệu        ║ • "Mua 1 lần,        ║ • Nhắc gia hạn tự   ║
║   MoMo, ZaloPay) ║ • Vận hành sàn        ║ • Quan hệ nhà bán    ║   care mãi mãi"      ║   động D-30/15/7     ║
║ • GHN / GHTK    ║ • Hỗ trợ khách hàng  ║ • IP & bằng sáng chế ║                      ║                      ║
║ • Nhà mạng (SIM) ║ • Đối soát tài chính  ║   (tương lai)        ║ Nhà bán:             ║ Nhà bán:             ║
║ • Cloud AWS/GCP  ║                       ║                      ║ • Kênh bán chuyên    ║ • KYC 1-on-1         ║
║ • Viện dưỡng lão ║                       ║                      ║   biệt, uy tín cao   ║ • Analytics          ║
║ • Phòng khám     ║                       ║                      ║ • Recurring revenue  ║ • Dedicated support  ║
║ • Đơn vị         ║                       ║                      ║ • Quan hệ KH dài hạn ║                      ║
║   kiểm định TTBYT║                       ║                      ║                      ║                      ║
╠══════════════════╩═══════════════════════╩══════════════════════╩══════════════════════╣  CUSTOMER SEGMENTS   ║
║  COST STRUCTURE                                                  REVENUE STREAMS       ║                      ║
║                                                                                        ║ • Gia đình có người  ║
║  Fixed: Nhân sự ~400tr/th (team lớn hơn),                        • Hoa hồng (8–15%)   ║   cao tuổi           ║
║         Cloud ~50tr/th, Office, Legal                            • Thuê bao giám sát  ║ • Bệnh nhân mãn tính ║
║                                                                  • Phí gian hàng       ║ • Caregiver          ║
║  Variable: Marketing CAC, Phí TT (1.5–2.5%),                    • Quảng cáo nội sàn  ║ • Viện dưỡng lão     ║
║            Phí SIM IoT, Hỗ trợ KH                               • Hợp đồng B2B        ║   phòng khám (B2B)   ║
║                                                                                        ║ • Nhà bán TTBYT      ║
║  Vốn Year 1: ~9–11 tỷ (~360–440K USD)    Break-even: Tháng 20–24                       ║                      ║
╚════════════════════════════════════════════════════════════════════════════════════════╩══════════════════════╝
```

### 1.2. Vòng giá trị khép kín — Mô hình độc đáo của CareNest

```
                    ┌─────────────────────────────────────────┐
                    │         VÒNG GIÁ TRỊ KHÉP KÍN          │
                    └─────────────────────────────────────────┘
          ┌──────────────────────┐        ┌──────────────────────┐
          │  🛒 MUA HÀNG         │        │  💡 GỢI Ý & UPSELL   │
          │  Thiết bị y tế +     │        │  Gia hạn gói,        │
          │  Gói giám sát        │        │  vật tư mới,         │
          │  trên CareNest       │        │  SP theo nhu cầu     │
          └──────────┬───────────┘        └──────────▲───────────┘
                     │                               │
          ┌──────────▼───────────┐        ┌──────────┴───────────┐
          │  ⚡ KÍCH HOẠT        │        │  🚨 CẢNH BÁO REALTIME│
          │  Liên kết device     ├───────►│  SOS / Té ngã        │
          │  với tài khoản       │        │  Nhịp tim bất thường │
          │  Bắt đầu giám sát    │◄───────┤  < 5 giây            │
          └──────────┬───────────┘        └──────────▲───────────┘
                     │                               │
          ┌──────────▼───────────────────────────────┴───────────┐
          │              📊 GIÁM SÁT LIÊN TỤC 24/7              │
          │     Sinh hiệu | Vị trí GPS | Lịch sử | Dashboard    │
          └───────────────────────────────────────────────────────┘
```

> **Đối thủ (Shopee / Lazada / Tiki):** `[Bán hàng] → STOP`
> **Chuỗi nhà thuốc online:** `[Bán hàng] → [Tư vấn cơ bản] → STOP`
> **CareNest:** `[Bán hàng] → [Kích hoạt IoT] → [Giám sát 24/7] → [Cảnh báo] → [Gợi ý] → [Mua lại] → ...`

### 1.3. Ba trụ cột kinh doanh

```
TRỤCỘT 1: THƯƠNG MẠI          TRỤCỘT 2: IOT & CSSK          TRỤCỘT 3: DATA & AI
━━━━━━━━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━━━━━━━
Sàn TMĐT TTBYT chuyên biệt    Nền tảng giám sát IoT 24/7    Dữ liệu sức khỏe → insights
Multi-vendor, kiểm duyệt nghiêm Tích hợp thiết bị đeo        Gợi ý SP cá nhân hóa
Đơn hàng, thanh toán, ship    Cảnh báo realtime < 5 giây    Phân tích xu hướng SK
B2B: viện dưỡng lão, PK       Caregiver network              Báo cáo định kỳ
Hoa hồng + Phí gian hàng      Subscription SaaS              (Giai đoạn 2–3)
```

---

## 2. Khối 1 — Customer Segments (Phân Khúc Khách Hàng)

### 2.1. Bản đồ phân khúc tổng thể

| # | Phân khúc | Mô tả | Quy mô (VN 2026) | Ưu tiên |
|:--|:--|:--|:--|:--|
| 1 | **B2C — Gia đình người cao tuổi** | Con cái 30–55 tuổi, mua thiết bị cho cha mẹ >60 tuổi, thu nhập trung lưu+, sống xa | ~12 triệu hộ | 🔴 MVP |
| 2 | **B2C — Người bệnh mãn tính** | Huyết áp, tiểu đường, tim mạch, COPD — cần theo dõi chỉ số tại nhà | ~17 triệu người | 🔴 MVP |
| 3 | **B2C — Caregiver (người chăm sóc)** | Người thân trực tiếp theo dõi — nhận cảnh báo, xem dashboard | ~8 triệu người | 🔴 MVP |
| 4 | **B2B — Viện dưỡng lão / Phòng khám** | Mua số lượng lớn, quản lý nhiều bệnh nhân tập trung | ~600 viện + hàng nghìn PK | 🟡 Giai đoạn 2 |
| 5 | **B2B — Nhà bán (Sellers)** | Nhà phân phối TTBYT, nhà thuốc, đơn vị CSSK tại nhà muốn có kênh bán chuyên biệt | ~2.000–5.000 đơn vị | 🔴 MVP |

### 2.2. Bối cảnh thị trường Việt Nam — Tại sao NOW?

```
DÂN SỐ GIÀ HÓA:
  2020: Người >60 tuổi = 11,4 triệu (11,9% dân số)
  2026: Người >60 tuổi = ~14 triệu  (14,2% dân số)   ← Hiện tại
  2040: Người >60 tuổi = ~22 triệu  (21,0% dân số)   ← Dự báo

XU HƯỚNG HÀNH VI:
  ✅ 92% hộ gia đình VN có smartphone (2025)
  ✅ TMĐT y tế tăng 28%/năm (2023–2026)
  ✅ Con cái sống xa cha mẹ tăng do đô thị hóa
  ✅ COVID-19 thúc đẩy chăm sóc sức khỏe tại nhà

NỖI ĐAU CHƯA ĐƯỢC GIẢI QUYẾT:
  ❌ Không có sàn TMĐT TTBYT chuyên biệt, kiểm duyệt nghiêm
  ❌ Mua thiết bị xong không ai hỗ trợ kích hoạt và giám sát
  ❌ Con cái không biết kịp khi cha mẹ té ngã, bấm SOS
  ❌ Không có nền tảng kết hợp thương mại + IoT monitoring
```

### 2.3. Persona chi tiết — 3 nhân vật đại diện

#### 👩 Persona A — Chị Mai (B2C — Người mua chính)
```
Chị Nguyễn Thị Mai, 38 tuổi | Kế toán | TP.HCM | Thu nhập: 20 triệu/tháng
Hoàn cảnh: Cha mẹ 68 tuổi ở Đà Nẵng, sống một mình, cha bị huyết áp cao
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAIN POINTS:
  ❌ Lo cha bị huyết áp cao không ai biết khi ngã → gọi điện 5–6 lần/ngày
  ❌ Mua máy đo huyết áp trên Shopee → không biết hàng thật hay giả
  ❌ Cha không quen dùng app → số liệu đo xong không lưu, không theo dõi
  ❌ Khoảng cách HCM–Đà Nẵng → không thể chăm sóc trực tiếp

KỲVỌNG:
  ✅ Thiết bị đo chính hãng, được xác thực rõ ràng
  ✅ Tự động gửi cảnh báo ngay khi cha có vấn đề (< 5 giây)
  ✅ Cha chỉ cần đeo hoặc bấm một nút — không cần biết dùng app
  ✅ Xem sức khỏe cha bất cứ lúc nào từ điện thoại của mình

HÀNH VI MUA:
  → Tìm kiếm Google: "đồng hồ theo dõi sức khỏe người già tốt nhất"
  → Hỏi group Zalo "Chăm sóc bố mẹ ở quê"
  → Đọc review kỹ trước khi mua, sợ mua nhầm hàng kém chất lượng
  → Sẵn sàng trả 2–5 triệu cho thiết bị + 99–249k/tháng cho gói giám sát
```

#### 👨‍💼 Persona B — Ông Toàn (Seller)
```
Ông Trần Văn Toàn, 45 tuổi | GĐ nhà phân phối TTBYT | Hà Nội
Doanh nghiệp: 15 nhân viên, doanh thu ~5 tỷ/năm, có giấy phép TTBYT đầy đủ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAIN POINTS:
  ❌ Shopee/Lazada: cạnh tranh giá với hàng TQ không nguồn gốc → phá giá thị trường
  ❌ Bán xong là hết quan hệ → không có doanh thu định kỳ từ dịch vụ
  ❌ Không có kênh bán gói bảo hành, giám sát đi kèm thiết bị
  ❌ Khách hàng B2C không phân biệt được hàng chính hãng vs hàng nhái

KỲVỌNG:
  ✅ Kênh bán chuyên biệt y tế, KH sẵn sàng trả giá cao hơn vì tin tưởng
  ✅ Bán kèm gói giám sát → recurring revenue hàng tháng
  ✅ Dashboard báo cáo doanh thu, đơn hàng chuyên nghiệp
  ✅ ROI dương trong 6 tháng đầu

DECISION CRITERIA:
  → Xem số liệu thực tế, case study → mới ký
  → Quan tâm: hoa hồng bao nhiêu, thanh toán bao lâu, hỗ trợ kỹ thuật không?
```

#### 👩‍⚕️ Persona C — Bà Hoa (B2B Tổ chức)
```
Bà Lê Thị Hoa, 52 tuổi | GĐ viện dưỡng lão tư nhân | TP.HCM | 80 người cao tuổi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAIN POINTS:
  ❌ Quản lý 80 thiết bị theo dõi thủ công → mất thời gian, dễ sai sót
  ❌ Nhân viên ca đêm không phát hiện kịp người cao tuổi té ngã
  ❌ Mua vật tư từ nhiều nguồn → khó đối soát, giá không ổn định
  ❌ Chưa có hệ thống cảnh báo tập trung cho cả viện

KỲVỌNG:
  ✅ Một dashboard quản lý tất cả 80 bệnh nhân và thiết bị
  ✅ Cảnh báo tự động ca đêm → giảm 50% áp lực nhân sự
  ✅ Báo giá B2B, hóa đơn VAT, mua số lượng lớn giá ưu đãi
  ✅ Nhà cung cấp đến triển khai và training nhân viên
```

### 2.4. Customer Journey Map — B2C

```
GIAI ĐOẠN  │ Nhận biết    │ Cân nhắc      │ Quyết định    │ Kích hoạt     │ Giữ chân      │ Giới thiệu
───────────────────────────────────────────────────────────────────────────────────────────────────────────
HÀNH ĐỘNG  │ Thấy quảng   │ So sánh       │ Đặt hàng,     │ Nhận hàng →   │ Nhận push     │ Chia sẻ
           │ cáo, bạn bè  │ thiết bị,     │ chọn gói      │ kích hoạt     │ alerts thực,  │ với anh chị
           │ giới thiệu,  │ đọc review,   │ giám sát,     │ wizard,       │ gia hạn gói,  │ em, referral
           │ SEO          │ hỏi tư vấn    │ thanh toán    │ mời caregiver │ mua thêm      │ code
───────────────────────────────────────────────────────────────────────────────────────────────────────────
CẢM XÚC   │ 😟 Lo lắng   │ 🤔 Phân vân   │ 😌 Tin tưởng  │ 😊 Hài lòng   │ 😍 Yên tâm    │ 🤩 Tự hào
           │ cho người    │ giá và chất   │ sau đọc       │ khi cài đặt  │ mỗi ngày      │ khi cha mẹ
           │ thân         │ lượng         │ review tốt    │ dễ dàng      │ có người     │ an toàn
           │              │               │               │               │ trông nom     │
───────────────────────────────────────────────────────────────────────────────────────────────────────────
ĐIỂM CHẠM  │ FB/Zalo Ads  │ Trang SP,     │ Checkout,     │ Email HD,     │ App/Web push, │ Referral
           │ SEO blog     │ so sánh,      │ voucher,      │ Hotline,      │ nhắc gia hạn, │ program,
           │ WOM          │ live chat     │ COD/Online    │ Video HD      │ health report │ review tool
───────────────────────────────────────────────────────────────────────────────────────────────────────────
CƠ HỘI    │ Retargeting  │ Review thực   │ Voucher       │ Video ngắn    │ Loyalty       │ Referral
CẢI THIỆN  │ SEO nội dung │ tế, Q&A nhanh │ lần đầu       │ < 3 phút      │ program       │ bonus hấp dẫn
```

### 2.5. Quy mô thị trường (TAM → SAM → SOM)

```
TAM — Total Addressable Market:
  Thị trường TMĐT y tế VN dự báo > $2 tỷ USD (2028)
  CAGR 2024–2028: ~22%/năm
  Dân số >60 tuổi: 14 triệu (2026) → 22 triệu (2040)

SAM — Serviceable Addressable Market:
  Người dùng smartphone, thu nhập trung lưu+, nhu cầu CSSK tại nhà
  ~$350–500 triệu USD (2028)

SOM — Serviceable Obtainable Market (Mục tiêu CareNest):
  Năm 1: ~0.1% TAM = ~$2 triệu = ~50 tỷ GMV
  Năm 3: ~1–2% TAM = ~$20–40 triệu = ~500 tỷ–1.000 tỷ GMV
```

---

## 3. Khối 2 — Value Propositions (Giá Trị Đề Xuất)

### 3.1. Tuyên ngôn giá trị

> **"CareNest không chỉ là nơi mua thiết bị y tế — đó là người bạn đồng hành chăm sóc sức khỏe suốt đời."**
>
> Sàn TMĐT duy nhất tại Việt Nam kết hợp **thương mại + IoT monitoring + caregiver network**,
> tạo vòng giá trị khép kín từ lúc mua hàng đến chăm sóc liên tục.

### 3.2. Value Proposition Canvas

#### Cho Người Mua / Gia Đình

| Pain Points | Gain Goals | Pain Relievers | Gain Creators |
|:--|:--|:--|:--|
| Không phân biệt hàng chính hãng trên Shopee | Mua SP y tế đáng tin cậy | KYC nhà bán nghiêm + kiểm duyệt số lưu hành | Badge "Verified Medical Seller" + chứng nhận rõ ràng |
| Mua xong không ai hỗ trợ kích hoạt | Sử dụng được ngay, không cần hiểu kỹ thuật | Wizard kích hoạt 3 bước + hotline | Video hướng dẫn <3 phút + chat hỗ trợ |
| Không biết kịp khi người thân gặp sự cố | Biết ngay trong vòng 5 giây | IoT pipeline: device → server → push <5s | Cảnh báo SOS, té ngã, nhịp tim bất thường |
| Dữ liệu sức khỏe rời rạc, không có xu hướng | Theo dõi lịch sử và xu hướng | Time-series DB + biểu đồ ngày/tuần/tháng | Monthly PDF health report gửi email |
| Thiết bị hỏng không biết bảo hành ở đâu | Hậu mãi minh bạch, dễ xử lý | Đổi trả qua sàn, SLA 7 ngày | Nhà bán chịu trách nhiệm qua hợp đồng với sàn |

#### Cho Nhà Bán

| Pain Points | Gain Goals | Pain Relievers | Gain Creators |
|:--|:--|:--|:--|
| Phá giá với hàng không nguồn gốc | Kênh bán tin cậy, không cạnh tranh bẩn | Chỉ nhà bán có giấy phép được vào sàn | Khách hàng sẵn sàng trả premium |
| Doanh thu không ổn định, bán theo đợt | Recurring revenue hàng tháng | Gói dịch vụ giám sát subscription | Chia sẻ 60–70% subscription fee |
| Khó quản lý device ID, kích hoạt thủ công | Hệ thống hỗ trợ tự động | Device inventory + activation workflow | Nhà bán bán thiết bị, sàn lo phần còn lại |
| Không có analytics về bán hàng | Data-driven decisions | Dashboard doanh thu, sản phẩm bán chạy | Export báo cáo, so sánh với trung bình ngành |

#### Cho Tổ Chức B2B

| Pain Points | Gain Goals | Pain Relievers | Gain Creators |
|:--|:--|:--|:--|
| Quản lý nhiều thiết bị thủ công | Dashboard tập trung | Fleet management cho thiết bị IoT | 1 màn hình quản lý 80+ bệnh nhân |
| Nhân viên đêm không phát hiện sự cố kịp | Cảnh báo tự động 24/7 | IoT alert pipeline, SLA <5s | Giảm 50% thời gian phản ứng |
| Mua sắm rời rạc, nhiều nguồn | Giải pháp tổng thể | B2B package: thiết bị + gói giám sát + hỗ trợ | Hóa đơn VAT, hợp đồng 1–3 năm |

### 3.3. So sánh cạnh tranh toàn diện

| Tiêu chí | Shopee/Lazada | Nhà thuốc online | Cửa hàng TTBYT | **CareNest** |
|:--|:--|:--|:--|:--|
| Chuyên biệt y tế | ❌ | Dược phẩm | TTBYT 1 nhà | ✅✅ TTBYT nhiều nhà |
| Kiểm soát nguồn gốc | ❌ Rất yếu | ✅ | ✅ | ✅✅ KYC nghiêm |
| Giám sát sức khỏe IoT | ❌ | ❌ | ❌ | ✅✅ **Độc quyền thị trường** |
| Cảnh báo realtime | ❌ | ❌ | ❌ | ✅ < 5 giây |
| Caregiver network | ❌ | ❌ | ❌ | ✅ Multi-caregiver |
| Subscription revenue | ❌ | Thấp | ❌ | ✅✅ Recurring SaaS |
| Fleet management B2B | ❌ | ❌ | Một phần | ✅ |
| Gợi ý theo dữ liệu SK | ❌ | ❌ | ❌ | ✅ (Giai đoạn 3) |
| **Tổng điểm** | **2/8** | **3/8** | **3/8** | **8/8** |

---

## 4. Khối 3 — Channels (Kênh Tiếp Cận)

### 4.1. Ma trận kênh theo giai đoạn

| Kênh | Giai đoạn | CAC Ước tính | Ghi chú |
|:--|:--|:--|:--|
| **Website CareNest** | MVP | Thấp | Kênh chính, owned media |
| **SEO content y tế** | MVP → T4+ | 50–150k (dài hạn) | Blog "chăm sóc người cao tuổi", từ khóa dài |
| **Facebook / Instagram Ads** | MVP | 200–500k | Target 30–55 tuổi, quan tâm SK gia đình |
| **Zalo OA + Zalo Ads** | MVP | 150–350k | Zalo rất phổ biến với người VN trên 40 tuổi |
| **Google Search Ads** | T4+ | 100–300k | High-intent: "mua máy đo huyết áp", "thiết bị người già" |
| **Partner Channel (qua Sellers)** | MVP | < 100k | Nhà bán tự dẫn khách, chi phí gần bằng 0 |
| **Referral Program** | T4+ | 50–100k | Word-of-mouth trong y tế rất hiệu quả |
| **PR báo y tế** | MVP | Chi phí thời gian | VnExpress Sức khỏe, Tuổi Trẻ, Dân Việt |
| **Hội nhóm Zalo / Facebook** | MVP | < 50k | Hội nhóm chăm sóc người cao tuổi, bệnh nhân |
| **B2B Direct Sales** | Giai đoạn 2 | 2–10 triệu/deal | Viện dưỡng lão, phòng khám; CLV rất cao |
| **App Mobile** | Giai đoạn 4 | — | Tăng retention, DAU |
| **YouTube / TikTok** | Giai đoạn 2 | Khó đo | Video hướng dẫn, case study thực tế |
| **Email Marketing** | MVP | Rất thấp | Nurture leads, onboarding, retention |

### 4.2. AARRR Funnel chi tiết

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A — ACQUISITION (Thu hút)           Target: 5.000 unique visitors/ngày (T6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Paid:    FB/Zalo Ads 40%, Google Search 25%
  Organic: SEO 20%, WOM + Referral 15%
  Conversion to visit → sign-up: ~2–3%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A — ACTIVATION (Kích hoạt)          Target: >75% kích hoạt thiết bị trong 7 ngày
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Email D+1 sau mua: Hướng dẫn kích hoạt thiết bị
  • Email D+3 sau giao hàng: Wizard 3 bước, video <3 phút
  • Email D+7: "Bạn cần hỗ trợ?" + hotline
  • In-app onboarding: mời caregiver, setup geofence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R — RETENTION (Giữ chân)            Target: D30 >55%, D90 >40%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Daily: Push notification khi có cảnh báo sức khỏe (giá trị thực)
  • Weekly: Email tóm tắt sức khỏe 7 ngày
  • Monthly: PDF health report đẹp, chia sẻ với bác sĩ được
  • Reminder: D-30, D-15, D-7 trước hết hạn gói

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R — REFERRAL (Giới thiệu)           Target: K-factor > 0.25
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Referral code: Người giới thiệu +50k, người được giới thiệu -100k
  • "Mời caregiver" → caregiver thấy dashboard → tự mua thiết bị cho nhà mình
  • Review incentive: Viết review >100 chữ → voucher 30k

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R — REVENUE (Doanh thu)             Target: ARPU >200k/tháng
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Upsell subscription: Gói 6/12 tháng tiết kiệm 16–25%
  • Cross-sell: Vật tư tiêu hao định kỳ (tã, que thử, pin dự phòng)
  • Data-driven: Gợi ý SP dựa trên chỉ số sức khỏe (khi có đủ data + consent)
```

---

## 5. Khối 4 — Customer Relationships (Quan Hệ Khách Hàng)

### 5.1. Ma trận quan hệ theo vòng đời

| Giai đoạn | Trigger | Kênh | Nội dung | Mục tiêu |
|:--|:--|:--|:--|:--|
| **Pre-purchase** | Ghé thăm lần đầu | Live chat, chatbot | Tư vấn so sánh thiết bị, giải đáp Q&A | Tăng conversion |
| **Purchase** | Đặt hàng | Email + Push | Xác nhận đơn, ETA giao hàng realtime | Giảm lo lắng |
| **Onboarding D+1** | Đơn DELIVERED | Email | Hướng dẫn kích hoạt thiết bị, wizard link | Activation >75% |
| **Onboarding D+7** | Chưa kích hoạt | Email + SMS | "Cần hỗ trợ? Hotline miễn phí" | Giảm drop-off |
| **Engagement** | Hàng ngày | Push notification | Cảnh báo sức khỏe, thay đổi chỉ số đáng chú ý | Tăng DAU |
| **Weekly** | Cuối tuần | Email | Health summary 7 ngày, tips CSSK | Giữ engagement |
| **Monthly** | Ngày 1/tháng | Email | PDF health report đẹp | Perceived value |
| **Renewal D-30** | Tự động | Email + Push | "Gói của bạn còn 1 tháng, gia hạn ngay" | Renewal >65% |
| **Renewal D-7** | Tự động | Email + Push + Call | Nhắc lần cuối + offer đặc biệt | Chặn churn |
| **Win-back** | Sau 30 ngày churn | Email + Call | "Chúng tôi nhớ bạn" + 2 tháng giá 1 tháng | Recover 20% churn |

### 5.2. Self-service Resources

| Loại | Nội dung | Kênh |
|:--|:--|:--|
| FAQ | 50+ câu hỏi thường gặp về thiết bị, đơn hàng, đổi trả | Help center trên website |
| Video library | Kích hoạt từng model thiết bị, đọc chỉ số, xử lý lỗi thường gặp | YouTube + in-app |
| Blog y tế | Huyết áp bình thường theo tuổi, SpO2 khi nào nguy hiểm, ... | Website (SEO) |
| Chatbot 24/7 | Trả lời câu hỏi thường gặp, tra cứu đơn hàng, kết nối CS | Website + Zalo OA |
| Community | Group Zalo "Gia đình CareNest" — chia sẻ kinh nghiệm | Zalo Group |

### 5.3. CRM KPIs mục tiêu

| Metric | T6 | T12 | Phương pháp đo |
|:--|:--|:--|:--|
| Activation Rate (7 ngày) | > 72% | > 83% | Activated devices / Delivered wearables |
| D30 Retention | > 55% | > 65% | Active users / New users D-30 ago |
| D90 Retention | > 38% | > 50% | Active users / New users D-90 ago |
| Subscription Renewal Rate | > 58% | > 70% | Renewed / Expired subscriptions |
| Monthly Churn Rate | < 7% | < 4.5% | Cancelled / Total active |
| NPS | > 38 | > 52 | Quarterly survey |
| CSAT | > 3.9/5 | > 4.2/5 | Post-interaction survey |
| Support Response Time | < 8h | < 4h | Ticket system tracking |

---

## 6. Khối 5 — Revenue Streams (Dòng Doanh Thu)

### 6.1. Tổng quan 5 dòng doanh thu

```
STREAM 1: Phí hoa hồng (Commission)
  ├── Tỷ lệ: 5–15% trên GMV tùy ngành hàng
  ├── Cơ chế: Tự động khấu trừ khi đối soát T+7
  └── Đặc điểm: Tăng tuyến tính theo GMV

STREAM 2: Gói thuê bao giám sát (Subscription SaaS)
  ├── BASIC: 99k/tháng — 499k/6 tháng — 899k/12 tháng (1 thiết bị)
  ├── FAMILY: 249k/tháng — 2.199k/12 tháng (3 thiết bị)
  ├── Cơ chế: Định kỳ, tự động gia hạn
  └── Đặc điểm: Recurring revenue, LTV cao

STREAM 3: Phí gian hàng Premium (Seller Plans)
  ├── FREE: 0đ/tháng (hoa hồng +2%)
  ├── PLUS: 499k/tháng (analytics, ưu tiên hiển thị)
  └── PRO: 1.299k/tháng (tất cả + dedicated manager, API)

STREAM 4: Hợp đồng B2B
  ├── Viện dưỡng lão: 30–300 triệu/hợp đồng/năm
  └── Phòng khám, bệnh viện: 50–500 triệu/năm

STREAM 5: Quảng cáo nội sàn (Giai đoạn 2+)
  ├── Sponsored Products: CPC trong kết quả tìm kiếm
  └── Banner Display: CPM trang chủ và danh mục
```

### 6.2. Bảng giá chi tiết gói giám sát

#### Cá nhân / Gia đình

| Gói | Thời hạn | Giá | Tiết kiệm | Tính năng |
|:--|:--|:--|:--|:--|
| **BASIC** | 1 tháng | 99.000 đ | — | 1 thiết bị, cảnh báo SOS/té ngã/nhịp tim, dashboard, 1 caregiver |
| **BASIC** | 6 tháng | 499.000 đ | ~16% | Tất cả BASIC + lịch sử 6 tháng |
| **BASIC** | 12 tháng | 899.000 đ | ~25% | Tất cả + monthly PDF health report |
| **FAMILY** | 1 tháng | 249.000 đ | — | 3 thiết bị, tất cả tính năng BASIC, 3 caregiver/thiết bị |
| **FAMILY** | 12 tháng | 2.199.000 đ | ~27% | 3 thiết bị + priority support + caregiver không giới hạn |

#### Gói tổ chức B2B

| Gói | Số thiết bị | Tính năng | Giá |
|:--|:--|:--|:--|
| **STARTER** | 5–20 | Fleet dashboard, báo cáo tổng hợp, phân quyền nhân viên theo ca | Liên hệ |
| **BUSINESS** | 21–100 | API integration, SLA 99.9%, dedicated account manager | Liên hệ |
| **ENTERPRISE** | 100+ | Custom features, SLA enterprise, hỗ trợ on-site | Hợp đồng |

### 6.3. Dự báo doanh thu 12 tháng (từ số 0)

| Tháng | GMV | Commission (10%) | Subscription | Seller Fee | B2B | Tổng Revenue |
|:--|:--|:--|:--|:--|:--|:--|
| T1 | 20M | 2M | 0 | 0 | 0 | **2M** |
| T2 | 60M | 6M | 1M | 0 | 0 | **7M** |
| T3 | 150M | 15M | 3M | 0.5M | 0 | **18.5M** |
| T4 | 350M | 35M | 6M | 2M | 10M | **53M** |
| T5 | 700M | 70M | 12M | 5M | 20M | **107M** |
| T6 | 1.2B | 120M | 22M | 8M | 30M | **180M** |
| T7 | 1.8B | 180M | 35M | 12M | 40M | **267M** |
| T8 | 2.3B | 230M | 50M | 15M | 50M | **345M** |
| T9 | 2.8B | 280M | 65M | 18M | 60M | **423M** |
| T10 | 3.2B | 320M | 80M | 20M | 70M | **490M** |
| T11 | 3.7B | 370M | 90M | 22M | 85M | **567M** |
| T12 | 4.5B | 450M | 95M | 24M | 100M | **669M** |
| **Năm 1** | **~21B** | **~2.08B** | **~459M** | **~126M** | **~465M** | **~3.13B** |

> ⚠️ *Dự báo này thận trọng hơn so với kịch bản có nền tảng sẵn. Cần validate sau pilot T3–4.*

---

## 7. Khối 6 — Key Resources (Nguồn Lực Chính)

### 7.1. Tài nguyên kỹ thuật — Xây mới hoàn toàn

```
TẤT CẢ CÁC MODULE đều phải xây từ đầu:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYER 1 — Core Platform (Tháng 1–3):
  🔨 Auth Service       — JWT, refresh token, session revoke, MFA
  🔨 Multi-tenant       — Seller isolation, RBAC (Buyer/Seller/Admin/Staff)
  🔨 Database layer     — PostgreSQL schema design, migrations
  🔨 Monorepo setup     — Turborepo, shared packages, CI/CD
  🔨 API Gateway        — Rate limiting, request validation, logging

LAYER 2 — Commerce (Tháng 2–5):
  🔨 Seller onboarding  — KYC, tài liệu, duyệt, multi-tenant
  🔨 Product catalog    — Danh mục, SKU, biến thể, tồn kho, kiểm duyệt
  🔨 Cart & Checkout    — Multi-vendor cart, tách đơn con, phí ship
  🔨 Payment module     — VNPay/MoMo, idempotency, callback HMAC
  🔨 Order management   — Vòng đời đơn hàng, Kafka events
  🔨 Shipping           — GHN/GHTK API, tracking realtime
  🔨 Returns & Refunds  — Quy trình đổi trả, hoàn tiền
  🔨 Settlement         — Đối soát T+7, chi trả nhà bán

LAYER 3 — IoT & Monitoring (Tháng 3–6):
  🔨 IoT Gateway        — TCP server nhận dữ liệu thiết bị đeo (giao thức tùy device)
  🔨 Device management  — Đăng ký, gán user, quản lý fleet
  🔨 Data pipeline      — Kafka → Consumer → TimescaleDB
  🔨 Alert engine       — SOS, té ngã, nhịp tim bất thường, geofence, pin yếu
  🔨 Realtime bridge    — Kafka → Socket.IO → Web Push
  🔨 Caregiver system   — Multi-caregiver, phân quyền, invite flow

LAYER 4 — Subscription (Tháng 5–7):
  🔨 Subscription mgmt  — Tạo, gia hạn, hủy, downgrade/upgrade
  🔨 Reminder system    — Cron job D-30/15/7, email + push
  🔨 Device activation  — Link order_id → device_id → subscription

LAYER 5 — Frontend (Tháng 3–7):
  🔨 web-buyer          — Cổng người mua (Next.js)
  🔨 web-seller         — Cổng nhà bán (Next.js)
  🔨 web-admin          — Cổng quản trị sàn (Next.js)

LAYER 6 — DevOps & Security (Song song):
  🔨 Infrastructure     — Kubernetes, Docker, CI/CD, staging/prod
  🔨 Monitoring         — Grafana + Prometheus + Alertmanager
  🔨 Security           — WAF, rate limit, audit log, pentest
  🔨 Backup & DR        — Automated backup, disaster recovery plan
```

### 7.2. Kafka Topics — Thiết kế event streaming

| Topic | Partition Key | Events | Consumer |
|:--|:--|:--|:--|
| `order.events` | `order_id` | created, confirmed, processing, shipped, delivered, cancelled, refunded | Order/Inventory Consumer |
| `payment.events` | `order_id` | initiated, paid, failed, expired, refunded | Payment Consumer |
| `inventory.events` | `sku_id` | reserved, deducted, released | Inventory Consumer |
| `notification.requests` | `user_id` | email, push_web, sms, zalo_zns | Notification Consumer |
| `seller.events` | `seller_id` | registered, approved, rejected, suspended | Admin Consumer |
| `subscription.events` | `subscription_id` | created, renewed, expired, cancelled | Subscription Consumer |
| `device.events` | `device_id` | connected, vitals, location, disconnected | Data Consumer |
| `device.alerts` | `device_id` | sos, fall_detected, arrhythmia, low_battery, geofence | Alert Consumer |

### 7.3. Team — Xây dựng từ số 0

#### Team MVP (14–16 người — lớn hơn vì xây hoàn toàn mới)

| Vai trò | Số lượng | Lương Range | Kỹ năng |
|:--|:--|:--|:--|
| **CEO / Co-founder** | 1 | Equity | Sản phẩm, huy động vốn, đối tác |
| **CTO / Co-founder** | 1 | Equity + 40–60tr | System design, tech leadership |
| **Backend Engineer (Senior)** | 3 | 22–32tr/th | NestJS, PostgreSQL, Kafka, IoT protocols |
| **Frontend Engineer (Senior)** | 2 | 18–26tr/th | Next.js, React, TypeScript |
| **IoT / Embedded Engineer** | 1 | 20–30tr/th | Protocol parsing (TCP, MQTT), device integration |
| **DevOps / Cloud** | 1 | 22–30tr/th | K8s, AWS/GCP, CI/CD, monitoring |
| **Product Manager** | 1 | 20–30tr/th | Agile, user research, roadmap |
| **UI/UX Designer** | 1 | 15–22tr/th | Figma, user testing, design system |
| **Business Development** | 1 | 15–20tr + commission | Onboard seller, quan hệ đối tác |
| **Marketing Executive** | 1 | 12–18tr/th | Digital marketing, content, SEO, ads |
| **Customer Support Lead** | 1 | 10–15tr/th | CSAT, escalation, knowledge base |
| **Customer Support** | 2 | 8–12tr/th | Hỗ trợ buyer và seller |
| **Legal Consultant (part-time)** | 1 | 5–10tr/th | TMĐT, TTBYT, PDPA |
| **Tổng** | **16–17** | **~280–380tr/th** | |

#### Lộ trình mở rộng team

| Giai đoạn | Team | Vai trò mới |
|:--|:--|:--|
| MVP (T1–T6) | 16–17 người | Như trên |
| Scale T7–T12 | 25 người | +QA Engineer, +Data Analyst, +B2B Sales (2), +CS Agent |
| Năm 2 | 40+ người | +Mobile Dev (React Native), +ML Engineer, +Finance Ops, +Security Engineer |

### 7.4. Tài nguyên pháp lý cần có

| Giấy phép / Đăng ký | Cơ quan | Timeline | Chi phí |
|:--|:--|:--|:--|
| Thành lập công ty TNHH hoặc cổ phần | Sở KH&ĐT | 3–5 ngày | ~1 triệu |
| Đăng ký sàn TMĐT | Bộ Công Thương | 2–4 tuần | ~3 triệu |
| Đăng ký website TMĐT | Bộ Công Thương | 1–2 tuần | ~1 triệu |
| Điều kiện kinh doanh TTBYT (nếu sàn bán trực tiếp) | Sở Y tế | 1–3 tháng | 15–40 triệu |
| Đăng ký bảo hộ nhãn hiệu "CareNest" | Cục SHTT | 12–18 tháng | 10–20 triệu |
| Đánh giá tác động PDPA (dữ liệu sức khỏe) | Nội bộ + tư vấn | 1 tháng | 15–30 triệu tư vấn |

---

## 8. Khối 7 — Key Activities (Hoạt Động Chính)

### 8.1. Sprint Roadmap — Xây từ số 0 (30 tuần đến MVP)

| Sprint | Tuần | Tập trung | Deliverable |
|:--|:--|:--|:--|
| **S0** | 1–2 | Setup & Architecture | Monorepo, DB schema, CI/CD, K8s staging |
| **S1** | 3–4 | Auth + Multi-tenant | JWT, roles (Buyer/Seller/Admin), seller tenant |
| **S2** | 5–6 | Seller onboarding | KYC API, document upload, admin approval queue |
| **S3** | 7–8 | Product catalog | Category tree, Product CRUD, SKU/variant, inventory |
| **S4** | 9–10 | Cart & Checkout | Multi-vendor cart, split order, shipping fee |
| **S5** | 11–12 | Payment | VNPay sandbox, MoMo sandbox, idempotency, callback |
| **S6** | 13–14 | Order management | Order lifecycle, Kafka topics, status transitions |
| **S7** | 15–16 | IoT Gateway | TCP server, device protocol, vitals ingestion |
| **S8** | 17–18 | Alert engine | SOS, fall, arrhythmia, geofence, push < 5s |
| **S9** | 19–20 | web-seller MVP | Dashboard, product mgmt, order processing |
| **S10** | 21–22 | web-buyer MVP | Homepage, search, PDP, cart, checkout, order tracking |
| **S11** | 23–24 | web-admin MVP | Seller approval, product review, ops dashboard |
| **S12** | 25–26 | Device activation | Link order → device, subscription creation |
| **S13** | 27–28 | Subscription mgmt | Pricing plans, renewal, D-30/15/7 reminders |
| **S14** | 29–30 | QA + UAT | E2E testing, security audit, UAT với 3 nhà bán pilot |
| **LAUNCH** | 31 | Pilot launch | 5 nhà bán live, 50 đơn hàng đầu tiên |

> ⚠️ So với kịch bản có nền tảng sẵn (24 tuần), xây từ 0 cần thêm ~6 tuần cho Auth, IoT Gateway, Alert Engine.

### 8.2. Quy trình KYC nhà bán

```
BƯỚC 1 — Đăng ký (Nhà bán tự thực hiện):
  → Điền thông tin: Tên DN, MST, địa chỉ, người đại diện, ngành hàng muốn bán
  → Upload: GPKD, Giấy phép TTBYT, CCCD người đại diện, catalogue sản phẩm

BƯỚC 2 — Pre-screening tự động:
  → Kiểm tra định dạng, kích thước file
  → Check MST qua API thuế công khai (nếu có)
  → Phân loại và gán cho Admin reviewer

BƯỚC 3 — Admin review (SLA: 2 ngày làm việc):
  → Xác minh GPKD còn hiệu lực
  → Xác minh Giấy phép TTBYT phù hợp ngành hàng đăng ký
  → Cross-check CCCD người đại diện

BƯỚC 4 — Quyết định:
  ✅ Phê duyệt → Tạo tenant, email chào mừng, onboarding guide
  ⚠️ Thiếu → Email nêu cụ thể + hạn nộp bổ sung
  ❌ Từ chối → Email nêu lý do + quyền khiếu nại

BƯỚC 5 — Kiểm duyệt sản phẩm đầu tiên:
  → Nhà bán đăng sản phẩm + chứng nhận
  → Admin review (SLA: 1 ngày làm việc)
  → Approve → Live | Reject → Feedback cụ thể
```

### 8.3. Tiêu chí kiểm duyệt sản phẩm

| Tiêu chí | Bắt buộc |
|:--|:--|
| Số lưu hành / công bố hợp lệ (kiểm trên csdl.byt.gov.vn) | ✅ |
| Ảnh ≥ 5 ảnh, nền trắng hoặc môi trường thực, min 1000×1000px | ✅ |
| Mô tả ≥ 300 từ, đầy đủ thông số kỹ thuật | ✅ |
| Giấy chứng nhận xuất xứ (CO) cho hàng nhập khẩu | ✅ |
| Hướng dẫn sử dụng tiếng Việt (PDF hoặc URL) | ✅ |
| Chính sách bảo hành: thời hạn, điều kiện, quy trình | ✅ |
| Ngôn ngữ không vi phạm quy định quảng cáo y tế | ✅ |
| Không dùng: "chữa khỏi bệnh", "100% hiệu quả", "không tác dụng phụ" | ✅ |

### 8.4. Seller Health Score

```
ĐIỂM SỨC KHỎE NHÀ BÁN (0–100):
  Tỷ lệ xử lý đơn đúng hạn    : 30%  |  <95% = cảnh báo   |  <85% = đình chỉ
  Điểm đánh giá trung bình     : 25%  |  <3.7/5 = cảnh báo |  <3.0/5 = đình chỉ
  Tỷ lệ hủy đơn               : 20%  |  >5% = cảnh báo    |  >10% = đình chỉ
  Tỷ lệ hoàn tiền / khiếu nại : 15%  |  >5% = review      |  >10% = đình chỉ
  Thời gian phản hồi tin nhắn  : 10%  |  >12h = cảnh báo   |  >24h = đình chỉ

  Score 80–100: "Trusted Seller" badge, ưu tiên hiển thị
  Score 60–79:  Bình thường
  Score 40–59:  Cảnh báo email + improvement plan
  Score < 40:   Đình chỉ gian hàng, review và quyết định
```

### 8.5. Daily Operations Checklist

```
09:00 AM DAILY:
  □ Kafka consumer lag < 1.000 messages (tất cả topics)
  □ API error rate < 0.1%
  □ Alert latency trung bình < 5 giây
  □ Đơn hàng chờ xác nhận của seller > 4h
  □ Khiếu nại đang open > 48h
  □ Nhà bán mới chờ KYC duyệt
  □ Sản phẩm chờ kiểm duyệt
  □ Payment pending > 30 phút (có thể stuck)
  □ Thiết bị offline > 24h (cần liên hệ người dùng)
```

---

## 9. Khối 8 — Key Partnerships (Đối Tác Chính)

### 9.1. Phân loại đối tác

#### 🔴 Critical — Không có không chạy được

| Đối tác | Giá trị | Rủi ro mất | Chiến lược |
|:--|:--|:--|:--|
| **Nhà sx / phân phối thiết bị đeo (OEM)** | Nguồn thiết bị IoT tích hợp được | Không có thiết bị kết nối | Ký hợp đồng OEM/distributor; test protocol trước; song song 2 nhà |
| **VNPay / MoMo** | Giao dịch online, ví phổ biến nhất VN | Không nhận thanh toán online | Tích hợp cả 2 + COD fallback |
| **GHN / GHTK** | Giao hàng toàn quốc | Không ship được | Hợp đồng cả 2, J&T dự phòng |
| **AWS / GCP (Data Center VN)** | Hạ tầng cloud, lưu trữ tại VN | Downtime, vi phạm pháp lý | Multi-AZ, daily backup |

#### 🟡 Important — Cần để phát triển

| Đối tác | Giá trị |
|:--|:--|
| Nhà phân phối TTBYT lớn (HCM + HN) | Seller đầu tiên, sản phẩm chất lượng từ ngày đầu |
| Viettel / Mobifone | SIM 4G cho thiết bị IoT, giá enterprise |
| ZaloPay | Phủ thêm người dùng hệ sinh thái Zalo |
| Đơn vị kiểm định TTBYT | Hỗ trợ nhà bán verify nhanh hơn |

#### 🟢 Future — Giai đoạn mở rộng

| Đối tác | Tiềm năng |
|:--|:--|
| Nền tảng telemedicine (Jio Health, Doctor Anywhere) | Upsell khám từ xa khi thiết bị phát hiện bất thường |
| Công ty bảo hiểm y tế tư nhân | Premium cá nhân hóa dựa trên dữ liệu sức khỏe (consent-based) |
| Bệnh viện / Phòng khám lớn | Kê đơn TTBYT, data sharing |
| Quỹ AgeTech / HealthTech | Series A strategic investment |

### 9.2. Timeline đàm phán đối tác

```
THÁNG 1:
  • OEM thiết bị đeo: Liên hệ 3–5 nhà, test protocol, chọn 1–2 đối tác chính
  • VNPay: Đăng ký merchant, bắt đầu quy trình duyệt (2–4 tuần)
  • GHN + GHTK: Đăng ký doanh nghiệp, test API

THÁNG 2:
  • Onboard 2–3 nhà phân phối TTBYT lớn tại HCM và HN (pilot sellers)
  • MoMo: Tích hợp song song
  • Viettel/Mobifone: Đàm phán gói SIM IoT theo volume

THÁNG 3–4:
  • Chốt tỷ lệ phí ship với GHN/GHTK theo volume
  • Liên hệ 2–3 viện dưỡng lão cho pilot B2B (Giai đoạn 2)
  • ZaloPay integration (parallel với MoMo/VNPay)

THÁNG 7+:
  • Telemedicine partnership exploration
  • OEM thiết bị thứ 2 (mở rộng danh mục thiết bị kết nối)
  • Insurance company pilot discussions
```

---

## 10. Khối 9 — Cost Structure (Cơ Cấu Chi Phí)

### 10.1. Chi phí cố định hàng tháng

| Hạng mục | Chi tiết | Range (triệu đ/tháng) |
|:--|:--|:--|
| **Nhân sự** | Lương + BHXH + phúc lợi (16–17 người) | 280–400 |
| **Hạ tầng Cloud** | K8s cluster, RDS PostgreSQL, TimescaleDB, Kafka managed, Redis, CDN, S3 | 40–60 |
| **Phần mềm & SaaS** | Jira, Figma, Datadog, GitHub, Sentry, Postman, SonarQube | 10–18 |
| **Văn phòng** | Thuê văn phòng nhỏ hoặc co-working | 15–30 |
| **Legal retainer** | Luật sư tư vấn định kỳ | 5–12 |
| **Bảo mật** | WAF (Cloudflare Pro), SSL, security scanning | 5–8 |
| **Tổng Fixed** | | **355–528 tr/tháng** |

### 10.2. Chi phí biến đổi

| Hạng mục | Cơ chế | Ước tính |
|:--|:--|:--|
| Marketing & CAC | Phụ thuộc growth target | 80–250 tr/tháng (tăng dần) |
| Phí cổng thanh toán | 1.5–2.5% doanh thu thu được | Biến đổi |
| Phí SIM IoT | ~30.000đ/thiết bị/tháng | 3tr/100 thiết bị |
| Email / SMS / ZNS | Per message | 3–8 tr/tháng |
| Customer Support outsource | Khi volume tăng | 15–40 tr/tháng |

### 10.3. Chi phí một lần (One-time)

| Hạng mục | Chi phí |
|:--|:--|
| Thiết lập pháp lý đầy đủ | 50–100 triệu |
| Thiết kế UI/UX + user testing | 30–60 triệu |
| Penetration test lần đầu | 30–60 triệu |
| Trang thiết bị team (laptop, màn hình) | 50–100 triệu |
| Đăng ký nhãn hiệu | 10–20 triệu |
| **Tổng one-time** | **170–340 triệu** |

### 10.4. Budget tổng Year 1 — Xây từ số 0

| Danh mục | Budget Year 1 |
|:--|:--|
| Nhân sự (12 tháng) | 3.4–4.8 tỷ |
| Hạ tầng cloud (tăng dần) | 480–720 triệu |
| Marketing (50tr → 250tr/tháng) | 900–1.500 tỷ |
| Pháp lý & tuân thủ | 150–250 triệu |
| Chi phí một lần | 170–340 triệu |
| Dự phòng phát sinh (10%) | 510–760 triệu |
| **TỔNG VỐN CẦN YEAR 1** | **~5.6–8.4 tỷ đồng** |
| **Bổ sung buffer 20%** | **~7–10 tỷ đồng** |
| **Quy đổi USD** | **~280.000–400.000 USD** |

> 📌 So với kịch bản có nền tảng sẵn (~5 tỷ), xây từ 0 cần **thêm ~2–5 tỷ** và **thêm ~6 tháng** đến break-even.

---

## 11. Tài Chính & Break-even

### 11.1. Unit Economics

| Chỉ số | Công thức | Target (từ số 0) |
|:--|:--|:--|
| **CAC** | Marketing spend / Số khách mới | 250.000 – 500.000 đ |
| **AOV** | GMV / Số đơn | 1.500.000 – 2.500.000 đ |
| **Take Rate** | Revenue / GMV | 10–14% |
| **Gross Margin** | (Revenue – variable COGS) / Revenue | 30–45% |
| **LTV** (3 năm) | ARPU monthly × Gross Margin × 36 / Churn Rate | 1.5–6 triệu đồng |
| **LTV/CAC** | LTV / CAC | > 4x (minimum viable) |
| **Payback Period** | CAC / (ARPU × GM) | 8–14 tháng |

### 11.2. Break-even Analysis

```
INPUT (từ số 0, team lớn hơn):
  Chi phí cố định/tháng:    ~420 triệu (bao gồm nhân sự IoT + kiến trúc lớn hơn)
  Take Rate:                 10%
  Gross Margin:              38%

TÍNH TOÁN:
  Break-even Revenue/tháng = 420M / 38% = ~1.1 tỷ/tháng
  Break-even GMV/tháng     = 1.1B / 10% = ~11 tỷ GMV/tháng

THỜI ĐIỂM ĐẠT 11 TỶ GMV/THÁNG:
  Conservative (tăng 20%/tháng): Tháng 24–30
  Base Case (tăng 30%/tháng):    Tháng 20–24
  Optimistic (tăng 45%/tháng):   Tháng 15–18
```

### 11.3. Lộ trình đến Profitability

```
Tháng 1–4:    GMV 20–350M       │ "Death valley" — đốt vốn ~380–400M/tháng
                                 │ Tập trung: xây platform + onboard seller đầu tiên

Tháng 5–8:    GMV 700M–2.3B     │ Đốt vốn giảm dần (~200–300M/tháng)
                                 │ Subscription bắt đầu có ý nghĩa

Tháng 9–12:   GMV 2.8–4.5B      │ Thu hẹp lỗ nhanh (~100–200M/tháng)
                                 │ B2B deals bắt đầu vào

Tháng 13–18:  GMV 5–8B          │ Tiến gần break-even
                                 │ Marketing ROI dương

Tháng 20–24:  GMV > 11B          │ ✅ BREAK-EVEN
                                 │ Operating profit dương
```

### 11.4. Funding Roadmap

```
PRE-SEED (Tháng 1–6): ~2–3 tỷ đồng
  → Nguồn: Founders + FFF + angel investors
  → Dùng cho: Pháp lý, team core (8 người), infrastructure, prototype
  → Milestone cần đạt: Platform MVP, 5 nhà bán live, 50 đơn hàng

SEED (Tháng 6–12): ~5–8 tỷ đồng
  → Nguồn: Early-stage VC (healthcare/commerce focus)
  → Dùng cho: Scale team đủ (16 người), marketing push, B2B sales
  → Milestone cần đạt trước khi raise: GMV 1B/tháng, subscription MRR 20M

SERIES A (Năm 2–3): ~30–60 tỷ đồng
  → Nguồn: VC, strategic investors (healthcare, insurance)
  → Dùng cho: Mobile app, AI/ML, regional expansion (ASEAN)
  → Điều kiện: Break-even rõ lộ trình, 150+ nhà bán, 2.000+ subscriptions
```

---

## 12. Go-to-Market Roadmap — Lộ Trình Từ Số 0

### 12.1. Phase 0 — Nền Móng & Tuyển Dụng (Tháng 1–2)

```
TUẦN 1 — Pháp lý & Setup:
  □ Tư vấn luật sư TMĐT + TTBYT + PDPA
  □ Đăng ký công ty (TNHH 2 thành viên hoặc cổ phần)
  □ Mở tài khoản ngân hàng doanh nghiệp
  □ Đăng ký sàn TMĐT (Bộ Công Thương) — bắt đầu quy trình

TUẦN 1–2 — Tuyển dụng:
  □ Đăng JD: CTO / Backend Lead (NestJS/Kafka/IoT)
  □ Đăng JD: Frontend Lead (Next.js), DevOps
  □ Đăng JD: UI/UX Designer, Product Manager
  □ Mục tiêu: Hire xong core 6 người trước khi bắt đầu code

TUẦN 2–4 — Đối tác:
  □ Liên hệ 5 nhà cung cấp thiết bị đeo, request protocol docs + sample
  □ Đăng ký merchant VNPay (cần 2–4 tuần duyệt)
  □ GHN + GHTK: Đăng ký tài khoản doanh nghiệp

TUẦN 3–4 — Kỹ thuật:
  □ Setup monorepo (Turborepo / NX)
  □ Database ERD design: users, sellers, products, orders, devices, subscriptions
  □ Setup environments: dev, staging, production
  □ Setup CI/CD pipeline: GitHub Actions → Docker → K8s staging
  □ Kickoff Sprint S0: Architecture + Auth
```

### 12.2. Phase 1 — Nền Tảng Commerce (Tháng 2–6)

```
Tháng 2–3: Core platform
  Sprint S1: Auth + Multi-tenant (roles, JWT, session)
  Sprint S2: Seller onboarding KYC
  Sprint S3: Product catalog backend

Tháng 3–4: Commerce engine
  Sprint S4: Cart & Checkout multi-vendor
  Sprint S5: Payment integration (VNPay + MoMo)
  Sprint S6: Order management + Kafka

Tháng 4–5: Frontend
  Sprint S9: web-seller MVP
  Sprint S10: web-buyer MVP
  Sprint S11: web-admin MVP

Tháng 5–6: IoT integration
  Sprint S7: IoT Gateway (TCP/MQTT, protocol parsing)
  Sprint S8: Alert engine (SOS, fall, vitals, geofence)
```

### 12.3. Phase 2 — Kết Nối Commerce + IoT (Tháng 6–8)

```
1. DEVICE ACTIVATION BRIDGE:
   → Sau khi đơn hàng = DELIVERED:
   → Người mua vào /devices/activate
   → Chọn đơn hàng + nhập device ID / scan QR
   → Hệ thống: link order_id + device_id + user_id
   → Tạo subscription theo gói đã mua
   → Gửi email hướng dẫn đeo và sử dụng

2. SUBSCRIPTION MANAGEMENT:
   → Cron job 06:00 AM hàng ngày:
     SELECT subscriptions WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
   → Publish notification.requests: reminder_d30, d15, d7, d3
   → One-click renewal flow trên web-buyer
   → Auto-renewal với payment token (nếu user đồng ý lưu thẻ)

3. HEALTH DASHBOARD (web-buyer):
   → /devices/{id}/dashboard
   → Realtime: Socket.IO room per device_id
   → Biểu đồ: nhịp tim, SpO2, huyết áp theo ngày/tuần/tháng (Recharts)
   → Alert timeline: danh sách sự kiện SOS, té ngã, bất thường
   → Map: vị trí GPS realtime (nếu thiết bị hỗ trợ)
   → Caregiver panel: mời, xem danh sách, phân quyền
```

### 12.4. Phase 3 — Pilot & Validate (Tháng 8–10)

```
MỤC TIÊU PILOT:
  • 5–10 nhà bán live (seller health score system đang chạy)
  • 100 đơn hàng thành công
  • 60 thiết bị được kích hoạt
  • NPS đầu tiên > 35

ƯU ĐÃI PILOT:
  Nhà bán: 0% hoa hồng tháng 1–3, onboarding 1-on-1, featured listing
  Người mua: Voucher -10% đơn đầu, 1 tháng BASIC miễn phí khi mua thiết bị

ĐO LƯỜNG (mỗi 2 tuần):
  → Conversion rate, activation rate, support tickets volume
  → NPS survey (5 câu hỏi ngắn)
  → User interview: 15 người mua, 5 nhà bán

ITERATION LOOP:
  Collect → Prioritize → 2-week sprint → Release → Measure
  Mục tiêu: Major iteration mỗi tháng
```

### 12.5. Phase 4 — Scale (Tháng 11–24)

| Sáng kiến | Timeline | Điều kiện tiên quyết | KPI mục tiêu |
|:--|:--|:--|:--|
| Mở rộng nhà bán | T11+ | Health Score system ổn định | 30 → 150 nhà bán |
| B2B Sales team | T12+ | 1 pilot B2B thành công | 10 hợp đồng B2B |
| App Mobile (React Native) | T13–T18 | Web ổn định, >2.000 users | DAU >800 |
| Quảng cáo nội sàn | T15+ | >2.000 SKU, traffic ổn | Ad revenue 80tr/tháng |
| Thiết bị IoT thứ 2 | T12–T15 | Gateway plugin architecture | Thêm 1–2 brands |
| AI Recommendations | T18+ | >200k data points | Conversion +12% |
| Loyalty Program | T15+ | Retention baseline đủ | Repeat purchase +18% |
| Regional expansion | Năm 3+ | Break-even, Series A | Thailand / Philippines |

---

## 13. KPI Dashboard

### 13.1. North Star Metric

> **"Số thuê bao giám sát đang hoạt động" (Active Subscriptions)**
>
> Phản ánh đồng thời: Doanh thu định kỳ (MRR) + Người dùng thực sự sử dụng IoT + Giá trị đề xuất cốt lõi
>
> **Target: 500 active subscriptions sau 12 tháng** (thận trọng hơn vì xây từ 0)

### 13.2. KPI theo tháng — Mục tiêu từ số 0

| KPI | T3 | T6 | T9 | T12 | Cách đo |
|:--|:--|:--|:--|:--|:--|
| GMV/tháng | 150M | 1.2B | 2.8B | 4.5B | Sum DELIVERED orders |
| Số đơn/tháng | 70 | 600 | 1.400 | 2.200 | Count orders |
| AOV | 2.1M | 2M | 2M | 2M | GMV / orders |
| Nhà bán hoạt động | 5 | 20 | 50 | 80 | Sellers với ≥1 đơn/tháng |
| SKU trên sàn | 100 | 500 | 1.200 | 2.500 | Approved products |
| Thiết bị kích hoạt (cộng dồn) | 20 | 150 | 400 | 800 | Activated devices |
| Subscription MRR | 2M | 20M | 50M | 80M | Active subs × price |
| Tỷ lệ kích hoạt | >60% | >72% | >80% | >85% | Activated / Delivered wearables |
| Tỷ lệ gia hạn | >50% | >58% | >65% | >70% | Renewed / Expired |
| NPS | >30 | >38 | >45 | >52 | Quarterly survey |
| Uptime | 99.5% | 99.9% | 99.9% | 99.9% | Monitoring |
| Alert latency | <8s | <5s | <5s | <5s | P95 pipeline |

### 13.3. Weekly Business Review Agenda

```
THỨ HAI, 09:00 — Weekly Review (60 phút):

1. COMMERCE (15 phút)
   → GMV tuần vs tuần trước vs kế hoạch
   → Top sellers, top categories
   → Pending: đơn chờ xác nhận, khiếu nại, KYC queue

2. IOT & SUBSCRIPTIONS (10 phút)
   → Thiết bị kích hoạt tuần này
   → Subscription churn vs renewal
   → Alert latency trung bình và peak

3. CUSTOMER (10 phút)
   → New users, activation rate, churn
   → NPS/CSAT từ survey tuần qua
   → Top 5 support ticket categories

4. TECH HEALTH (10 phút)
   → Uptime, error rate, Kafka lag
   → Incidents tuần qua + post-mortem status
   → Deployment frequency

5. FINANCIALS (10 phút)
   → Revenue: commission + subscription + seller fee
   → Burn rate vs kế hoạch
   → Cash runway còn bao nhiêu tháng

6. PRIORITIES (5 phút)
   → Top 3 vấn đề cần giải quyết tuần này
   → Sprint goal check-in
```

---

## 14. Rủi Ro & Giảm Thiểu

### 14.1. Rủi ro đặc thù khi xây từ số 0

| # | Rủi ro | XS | TD | Mức độ | Phương án | Owner |
|:--|:--|:--|:--|:--|:--|:--|
| **R0** | **Đốt hết vốn trước khi có traction** | Cao | Rất cao | 🔴 Critical | Pre-seed đủ cho 9 tháng; raise seed trước khi còn 4 tháng runway | CEO |
| **R1** | Xây platform mất >12 tháng, chậm hơn kế hoạch | Cao | Cao | 🔴 Critical | MVP thực sự nhỏ (chỉ commerce cơ bản T1–T6); IoT phase 2; không scope creep | CTO |
| **R2** | Không tuyển được kỹ sư IoT có kinh nghiệm | Trung bình | Cao | 🔴 Critical | Tuyển từ tháng đầu tiên; offer equity; remote-friendly; consider outsource IoT gateway | CTO |
| **R3** | Pháp lý TTBYT kéo dài >3 tháng | Cao | Cao | 🔴 Critical | Làm việc với luật sư ngay tháng 1; MVP chỉ bán TTBYT loại I/II; tránh loại đòi hỏi giấy phép phức tạp | CEO + Legal |
| **R4** | Khó thu hút nhà bán ban đầu (cold start) | Cao | Cao | 🔴 Critical | 0% hoa hồng 3 tháng; BD phụ trách onboard tay đôi; guarantee 10 seller pilot với incentive | BD |
| **R5** | Lộ lọt dữ liệu sức khỏe → legal + reputation | Trung bình | Rất cao | 🔴 Critical | Security-by-design từ đầu; AES-256, TLS 1.3; pentest trước launch; PDPA compliance | CTO + Legal |
| **R6** | Protocol thiết bị IoT phức tạp, buggy | Cao | Trung bình | 🟠 High | Test với 3+ loại thiết bị trước launch; mock server cho dev; document giao thức kỹ | IoT Eng |
| **R7** | Hàng giả/kém chất lượng trên sàn | Trung bình | Cao | 🟠 High | KYC strict; kiểm duyệt số lưu hành; mystery shopper; xử phạt nặng vi phạm | Admin Ops |
| **R8** | Người dùng cao tuổi gặp khó khăn | Cao | Trung bình | 🟡 Medium | UX: font ≥16px, ít bước; hotline; người thân kích hoạt hộ; video tiếng Việt đơn giản | Product |
| **R9** | Thanh toán lỗi / double charge | Thấp | Cao | 🟡 Medium | Idempotency key; UNIQUE DB constraint; HMAC verify; reconcile hàng ngày | Backend |
| **R10** | Đối thủ lớn ra mắt tính năng tương tự | Thấp | Trung bình | 🟢 Low | Speed to market; network effect caregiver; data moat; brand trust trong y tế | CEO |

### 14.2. Risk R0 — Runway Management (Quan trọng nhất khi xây từ 0)

```
RUNWAY TRACKING:
  Pre-seed: ~2 tỷ → Đủ cho ~5–6 tháng với team 8 người
  Seed: Raise trước khi còn 4 tháng runway
  
  Chỉ số quan trọng nhất cần track hàng tuần:
  → Cash in bank
  → Monthly burn rate (actual vs budget)
  → Revenue growth rate
  → Runway = Cash / Monthly Burn

  Nếu burn > budget 20% liên tiếp 2 tháng:
  → Họp khẩn team → Review và cắt giảm
  → Ưu tiên: Giữ team kỹ thuật core, cắt chi phí marketing trước
```

### 14.3. Incident Response Plan

```
SEVERITY 1 — Platform Down / Data Breach:
  → PagerDuty alert → On-call dev trong 5 phút
  → T+5min: CTO + CEO thông báo
  → T+15min: Status page update
  → T+1h: Rollback hoặc fix deployed
  → T+24h: Post-mortem + report cho stakeholders
  → T+48h: Email khách hàng bị ảnh hưởng

SEVERITY 2 — Tính năng quan trọng lỗi (thanh toán, cảnh báo):
  → T+5min: Dev on-call nhận alert
  → T+4h: Fix hoặc workaround
  → T+4h: Notify khách hàng nếu >50 người ảnh hưởng

SEVERITY 3 — Bug nhỏ không ảnh hưởng giao dịch:
  → Ticket backlog → Fix trong sprint tiếp theo
```

---

## 15. Tech Stack & Kiến Trúc — Xây Mới Hoàn Toàn

### 15.1. Tech Stack chi tiết

| Layer | Technology | Phiên bản | Lý do chọn |
|:--|:--|:--|:--|
| **Monorepo** | Turborepo | Latest | Shared packages, build cache |
| **Backend** | NestJS | v10+ | Module-based, DI, TypeScript, ecosystem tốt |
| **Frontend** | Next.js | v14+ (App Router) | SSR, SEO, server components |
| **Message Broker** | Apache Kafka (KRaft) | v3.7+ | High throughput, ordering, no ZooKeeper |
| **Primary DB** | PostgreSQL | v16 | ACID, transactional, mature |
| **Time-series DB** | TimescaleDB | v2.x | Extension PostgreSQL, tối ưu cho vitals |
| **Cache** | Redis | v7+ | Session, rate limit, cart temp, pub/sub |
| **Search** | MeiliSearch | v1.x | Full-text search tiếng Việt tốt, self-hosted |
| **File Storage** | AWS S3 / GCS | — | Ảnh sản phẩm, tài liệu KYC, PDF reports |
| **Realtime** | Socket.IO | v4 | WebSocket fallback, rooms per device |
| **IoT Protocol** | TCP server (tùy device) | — | Parse binary frame theo giao thức OEM |
| **Container** | Docker + Kubernetes | — | Horizontal scaling, service isolation |
| **Service Mesh** | Istio (optional) | — | mTLS, circuit breaker (Giai đoạn 2) |
| **CI/CD** | GitHub Actions | — | Automated test + deploy lên K8s |
| **Monitoring** | Grafana + Prometheus | — | Metrics, dashboards, alerting |
| **APM** | Datadog | — | Distributed tracing, performance |
| **Error Tracking** | Sentry | — | Frontend + backend error monitoring |
| **Log Management** | ELK Stack | — | Elasticsearch + Logstash + Kibana |
| **Email** | AWS SES / SendGrid | — | Transactional email, templates |
| **Push Notification** | Web Push (VAPID) | — | Browser push, không cần app |
| **SMS Fallback** | Twilio / ESMS.vn | — | Cảnh báo khẩn cấp khi mất internet |
| **Zalo Notification** | Zalo ZNS | — | Hệ sinh thái Zalo rất lớn ở VN |
| **CDN** | Cloudflare | — | DDoS protection, WAF, CDN |

### 15.2. Kiến trúc tổng thể (từ số 0)

```
EXTERNAL USERS:
  [Người mua]  [Nhà bán]  [Admin]      [Thiết bị đeo IoT]
       │            │         │                │
       └────────────┴─────────┘                │ TCP/MQTT
                    │                          │
              [Cloudflare]                      │
              WAF + CDN                         │
                    │                          ▼
              [Load Balancer]         [IoT TCP Gateway]
                    │                  Protocol parser
                    │                 (binary → JSON)
                    │                          │
              ╔═════╧══════════════════════════╧══════╗
              ║         Apache Kafka (KRaft)           ║
              ║  order.events  | device.events         ║
              ║  payment.events| device.alerts         ║
              ║  inventory     | subscription.events   ║
              ║  notification  | seller.events         ║
              ╚═══════════════════════════════════════╝
                         │              │
              ┌──────────┴──────────────┴──────────────┐
              │                                        │
    ┌─────────▼──────────┐               ┌─────────────▼──────────┐
    │   Backend API       │               │   Event Consumers      │
    │   (NestJS)          │               │                        │
    │                     │               │  Order Consumer        │
    │  Auth    Catalog    │               │  Payment Consumer      │
    │  Cart    Order      │               │  Inventory Consumer    │
    │  Payment Seller     │               │  Notification Consumer │
    │  Ship    Return     │               │  Data Consumer (vitals)│
    │  Sub     Device     │               │  Alert Consumer (SOS)  │
    └─────────┬──────────┘               │  Subscription Consumer │
              │                          └─────────────┬──────────┘
     VNPay / MoMo                                      │
     GHN / GHTK                              ┌─────────┴──────────┐
     AWS SES / Zalo ZNS                      │                    │
                                      ┌──────▼──────┐    ┌────────▼───────┐
                                      │ PostgreSQL   │    │  TimescaleDB   │
                                      │ Orders,Users │    │  Vitals,Alerts │
                                      │ Sellers,Subs │    │  Location Hist │
                                      └─────────────┘    └────────────────┘
```

### 15.3. Thiết kế API quan trọng (từ số 0)

```
AUTH:
  POST /auth/register                → Đăng ký tài khoản (buyer/seller)
  POST /auth/login                   → JWT access token + refresh token
  POST /auth/refresh                 → Làm mới access token
  DELETE /auth/sessions/{sid}        → Thu hồi session

SELLER:
  POST /sellers                      → Đăng ký nhà bán (upload KYC)
  GET  /sellers/{id}/status          → Kiểm tra trạng thái duyệt
  PATCH /sellers/{id}/approve        → [ADMIN] Duyệt nhà bán
  GET  /sellers/{id}/dashboard       → Dashboard nhà bán

CATALOG:
  GET  /categories                   → Cây danh mục
  POST /products                     → [SELLER] Thêm sản phẩm mới
  POST /products/{id}/review         → [ADMIN] Kiểm duyệt sản phẩm
  PATCH /products/{id}/skus/{skuId}  → Cập nhật giá/tồn kho

COMMERCE:
  POST /cart/items                   → Thêm vào giỏ hàng
  POST /orders/checkout              → Tạo đơn hàng + tách theo seller
  POST /payments/initiate            → Khởi tạo thanh toán (idempotency key)
  POST /payments/callback/vnpay      → Callback VNPay (HMAC verify, idempotent)
  PATCH /orders/{id}/status          → [SELLER] Cập nhật trạng thái đơn

DEVICE & IOT:
  POST /devices/{id}/activate        → Kích hoạt thiết bị sau giao hàng
  POST /devices/{id}/assign-user     → Gán thiết bị cho người đeo
  POST /devices/{id}/caregivers      → Mời caregiver theo dõi
  GET  /devices/{id}/vitals          → Lấy dữ liệu sinh hiệu (time range)
  GET  /devices/{id}/alerts          → Lịch sử cảnh báo

SUBSCRIPTION:
  POST /subscriptions                → Tạo gói giám sát
  POST /subscriptions/{id}/renew     → Gia hạn gói
  GET  /subscriptions/{id}/usage     → Xem thông tin gói và thiết bị
```

---

## 16. Executive Summary

### 16.1. CareNest — One-Pager (Từ Số 0)

| | |
|:--|:--|
| **Tên** | CareNest |
| **Slogan** | *"Buy right. Care always."* |
| **Mô hình** | Multi-vendor B2B2C TMĐT + IoT Health Monitoring SaaS |
| **Xây dựng** | Từ số 0 hoàn toàn — không có nền tảng sẵn |
| **Thị trường** | Healthcare e-commerce Việt Nam |
| **TAM** | > $2 tỷ USD (2028), CAGR 22%/năm |
| **USP** | Vòng khép kín: Mua → Kích hoạt → Giám sát IoT → Cảnh báo → Gợi ý → Mua lại |
| **Vốn cần Year 1** | ~7–10 tỷ đồng (~280–400K USD) |
| **Break-even dự kiến** | Tháng 20–24 (Base Case) |
| **GMV mục tiêu T12** | 4.5 tỷ/tháng |
| **Revenue mục tiêu Năm 1** | ~3.1 tỷ đồng |
| **Team MVP** | 16–17 người |
| **Timeline đến launch** | ~7–8 tháng (30 tuần) |
| **Tech Stack** | NestJS + Next.js + Kafka + TimescaleDB + PostgreSQL + IoT Gateway |

### 16.2. Tại sao CareNest Sẽ Thắng (dù xây từ 0)

```
1. 📈 TIMING ĐÚng — Macro trend rất rõ:
   Già hóa dân số + đô thị hóa (con cái sống xa cha mẹ) + thói quen mua online
   → Cơn bão hoàn hảo cho CSSK từ xa và TMĐT y tế

2. 🎯 UNMET NEED — Khoảng trống thị trường khổng lồ:
   Không có sàn TMĐT TTBYT chuyên biệt nào ở VN tích hợp IoT monitoring
   First-mover advantage thực sự, không phải "me too"

3. 💰 BUSINESS MODEL ƯU VIỆT:
   Subscription + Commerce = Recurring revenue + Transactional revenue
   LTV cao vì IoT lock-in và caregiver network effect
   Không phụ thuộc vào quảng cáo — doanh thu từ giá trị thực

4. 🔗 NETWORK EFFECTS:
   Nhiều seller → nhiều SP → nhiều buyer
   1 buyer mời 2–3 caregiver → viral trong gia đình
   Nhiều data → gợi ý tốt hơn → conversion cao hơn

5. 🛡️ DEFENSIVE MOATS (khi đã build xong):
   Data moat: lịch sử sức khỏe người dùng (rất khó chuyển đổi)
   Trust moat: thương hiệu trong y tế xây lâu, khó copy
   Network moat: caregiver network của từng gia đình
```

### 16.3. Rủi ro chính cần chấp nhận

```
⚠️ RỦI RO CHÍNH KHI XÂY TỪ SỐ 0:

1. Thời gian xây dựng: 7–8 tháng đến launch (dài hơn so với kịch bản có sẵn)
2. Vốn cần cao hơn: ~7–10 tỷ (so với ~5 tỷ nếu có nền tảng sẵn)
3. Break-even muộn hơn: Tháng 20–24 (vs 13–18)
4. Team lớn hơn: 16–17 người (vs 11 người)
5. Execution risk: Cần đồng thời xây commerce + IoT từ đầu

→ Nhưng cũng có lợi thế: Xây đúng từ đầu, không technical debt,
  kiến trúc tối ưu cho bài toán cụ thể của CareNest.
```

### 16.4. Next Actions — 30 Ngày Đầu Tiên

```
TUẦN 1:
  □ Gặp luật sư chuyên TMĐT và TTBYT (ưu tiên tuyệt đối)
  □ Đăng 5 JD tuyển dụng (CTO, Backend, Frontend, DevOps, Designer)
  □ Liên hệ 5 nhà cung cấp thiết bị đeo IoT, xin tài liệu protocol
  □ Đăng ký merchant VNPay (cần ~2–4 tuần duyệt, bắt đầu ngay)

TUẦN 2:
  □ Phỏng vấn CTO/Tech Lead — ưu tiên tuyển xong trước mọi thứ khác
  □ Thiết kế ERD sơ bộ (users, sellers, products, orders, devices, subscriptions)
  □ Liên hệ 5 nhà phân phối TTBYT tại HCM và HN (nhà bán pilot)
  □ Đăng ký công ty, mở tài khoản ngân hàng

TUẦN 3–4:
  □ Hire xong 3 người đầu tiên (CTO, 1 Backend, 1 Frontend)
  □ Kickoff Sprint S0: Setup monorepo, DB schema, CI/CD, K8s
  □ Ký hợp đồng với GHN (hoặc GHTK)
  □ Bắt đầu wireframe web-buyer và web-seller (Figma)
  □ Liên hệ 2 viện dưỡng lão lớn để tìm hiểu nhu cầu B2B
```

---

## Phụ lục

### A. Glossary

| Thuật ngữ | Giải thích |
|:--|:--|
| GMV | Gross Merchandise Value — tổng giá trị hàng hóa giao dịch (trước khi trừ hoa hồng) |
| AOV | Average Order Value — giá trị trung bình mỗi đơn hàng |
| CAC | Customer Acquisition Cost — chi phí thu hút 1 khách mới |
| LTV | Lifetime Value — tổng doanh thu kỳ vọng từ 1 khách trong vòng đời |
| MRR | Monthly Recurring Revenue — doanh thu định kỳ từ subscription |
| ARR | Annual Recurring Revenue = MRR × 12 |
| Churn Rate | % khách hàng rời bỏ trong 1 kỳ |
| NPS | Net Promoter Score (-100 đến +100) |
| CSAT | Customer Satisfaction Score |
| ARPU | Average Revenue Per User |
| AARRR | Acquisition → Activation → Retention → Referral → Revenue |
| KYC | Know Your Customer — xác minh danh tính |
| TTBYT | Trang thiết bị y tế |
| PDPA | Personal Data Protection Act — luật bảo vệ DLCN |
| SLA | Service Level Agreement |
| Idempotency | Gọi API nhiều lần = kết quả như gọi 1 lần |
| Multi-tenant | Nhiều nhà bán dùng chung hệ thống, dữ liệu hoàn toàn tách biệt |
| DLQ | Dead Letter Queue — hàng đợi message xử lý thất bại |
| MTTR | Mean Time To Recovery |
| OEM | Original Equipment Manufacturer — nhà sản xuất thiết bị |
| IoT | Internet of Things — vạn vật kết nối |

### B. Văn bản pháp lý cần rà soát

| Văn bản | Nội dung liên quan |
|:--|:--|
| Luật Thương mại 2005 | Nền tảng hoạt động thương mại |
| Nghị định 52/2013 (sửa đổi 85/2021) | Thương mại điện tử |
| Thông tư 47/2014/TT-BCT | Quản lý website TMĐT |
| Nghị định 98/2021/NĐ-CP | Quản lý trang thiết bị y tế |
| Thông tư 46/2017/TT-BYT | Điều kiện hành nghề mua bán TTBYT |
| Nghị định 13/2023/NĐ-CP | Bảo vệ dữ liệu cá nhân (PDPA VN) |
| Thông tư 09/2015/TT-NHNN | Thanh toán không dùng tiền mặt |
| Nghị định 181/2013/NĐ-CP | Quảng cáo trong lĩnh vực y tế |

### C. So sánh 2 kịch bản

| Tiêu chí | **Có nền tảng sẵn** | **Từ số 0** |
|:--|:--|:--|
| Thời gian đến launch | ~6 tháng (24 tuần) | ~7.5 tháng (30 tuần) |
| Team MVP | 11–12 người | 16–17 người |
| Vốn Year 1 | ~5 tỷ đồng | ~7–10 tỷ đồng |
| Break-even | Tháng 13–18 | Tháng 20–24 |
| Technical debt | Có thể cao (kế thừa code cũ) | Thấp (xây đúng từ đầu) |
| Kiến trúc | Có thể phải refactor | Tối ưu từ đầu |
| Rủi ro kỹ thuật | Trung bình (kế thừa đã test) | Cao (xây mới toàn bộ) |
| Linh hoạt kiến trúc | Bị ràng buộc bởi hệ thống cũ | Toàn quyền quyết định |

---

*📌 Tài liệu v2.0 — CareNest xây dựng từ con số 0, không có nền tảng kế thừa.*
*Phiên bản: Tháng 10/2026 | Cập nhật sau mỗi milestone quan trọng.*
