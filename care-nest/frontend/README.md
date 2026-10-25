# `frontend/` — Hệ Thống Ứng Dụng Client Nền Tảng CareNest

> **CareNest Frontend Workspaces** — Tập hợp các ứng dụng Web giao diện người dùng được xây dựng trên nền tảng **Next.js 14 (App Router)**, **React 18**, và **TypeScript**, vận hành dưới kiến trúc **Monorepo** với **pnpm Workspaces** và **Turborepo**.

---

## 📌 Tổng Quan Hệ Thống

Hệ thống frontend của CareNest phục vụ trọn vẹn 3 nhóm người dùng trọng yếu trong hệ sinh thái sàn thương mại điện tử y tế kết hợp giám sát sức khỏe IoT:

1. **Người tiêu dùng & Gia đình / Người chăm sóc (`web-buyer`)**: Mua sắm thiết bị y tế chính hãng, theo dõi các chỉ số sinh tồn và định vị người thân theo thời gian thực, nhận cảnh báo khẩn cấp SOS.
2. **Nhà bán hàng & Đối tác y tế (`web-seller`)**: Quản lý hồ sơ thẩm định y tế (KYC), đăng bán sản phẩm, quản lý kho & số IMEI/Serial thiết bị IoT, đóng gói đơn hàng và theo dõi doanh thu/payout.
3. **Quản trị viên & Chuyên viên kiểm duyệt (`web-admin`)**: Thẩm định nhà bán y tế, kiểm duyệt sản phẩm, phân quyền người dùng, giám sát vận hành logistics, quản lý gói thuê bao IoT, trực ban cảnh báo SOS và kiểm toán hệ thống.

---

## 🚀 Danh Sách Ứng Dụng Frontend

| Ứng Dụng | Package Name | Port Mặc Định | Đối Tượng Sử Dụng | Công Nghệ Chủ Chốt | Trạng Thái |
|---|---|:---:|---|---|:---:|
| [**`web-buyer/`**](./web-buyer) | `@carenest/web-buyer` | **`3000`** | Khách hàng mua sắm, Gia đình, Người chăm sóc (Caregiver) | Next.js 14, React 18, React-Leaflet (GPS), Socket.IO Client, Custom CSS Tokens, Lucide Icons | 🟢 **Hoàn thiện** |
| [**`web-seller/`**](./web-seller) | `@carenest/web-seller` | **`3020`** | Nhà bán hàng trang thiết bị y tế, Nhà phân phối IoT | Next.js 14, React 18, `next-intl` (i18n), Recharts, React Hook Form, Zod | 🟢 **Hoàn thiện** |
| [**`web-admin/`**](./web-admin) | `@carenest/web-admin` | **`3030`** | Quản trị viên CareNest, Chuyên viên kiểm duyệt y tế | Next.js 14, React 18, `next-intl` (i18n), Recharts, Socket.IO Client, Date-fns | 🟢 **Hoàn thiện** |

---

## 🧭 Chi Tiết & Tính Năng Của Từng Ứng Dụng

### 1. 🛒 Cổng Mua Sắm & Giám Sát Người Thân — `web-buyer` (Port `3000`)
- **E-Commerce Y Tế & CareNest Mall**:
  - Tìm kiếm, lọc sản phẩm y tế (máy đo huyết áp, que thử đường huyết, đồng hồ định vị Wonlex, tã người lớn, thiết bị hỗ trợ vận động).
  - Chi tiết sản phẩm kèm thông số y tế, chứng nhận kiểm định, đánh giá từ khách hàng.
  - **Gian hàng người bán chính hãng (CareNest Mall)**: Xem thông tin pháp lý nhà phân phối, chứng nhận Bộ Y Tế, lưu voucher độc quyền, bộ lọc phân loại sản phẩm và xem 128+ đánh giá xác thực.
  - Giỏ hàng và quy trình thanh toán đa kênh: COD, VNPay, MoMo, ZaloPay.
  - **Chức năng Giả Lập Thanh Toán (`/shop/payment-simulator`)**: Hỗ trợ quét mã VietQR giả lập, thẻ tín dụng Visa/MasterCard, ví điện tử với tỷ lệ thành công/thất bại tùy chọn.
  - Quản lý lịch sử đơn hàng, hành trình giao vận và tính năng **Xác nhận đã nhận hàng & Đánh giá đơn hàng 5 sao (`/orders/[orderId]/review`)**.
- **Chat Realtime Tư Vấn Y Tế & Dược Sĩ (`FloatingChatWidget`)**:
  - Widget chat nổi toàn cục kết nối Socket.IO tới `chat-service` (Port 3010).
  - Khởi tạo hội thoại 1-click từ banner gian hàng hoặc từng thẻ sản phẩm.
  - Đính kèm thẻ sản phẩm tương tác (có nút "Thêm Giỏ Hàng" trực tiếp) và thẻ đơn hàng.
  - Gợi ý câu hỏi nhanh (Quick Pills), thông báo đang nhập (Typing indicator), và phản hồi tư vấn tự động.
- **Tele-health & IoT Dashboard**:
  - Kết nối và hiển thị dữ liệu từ đồng hồ/thiết bị y tế IoT qua Gateway/WebSocket thời gian thực.
  - Giám sát các chỉ số sinh tồn: Nhịp tim (BPM), nồng độ oxy trong máu (SpO2), huyết áp (SYS/DIA), thân nhiệt.
  - **Bản đồ Vùng An Toàn GPS (Geofence GIS)**: Tích hợp Leaflet hiển thị các vùng an toàn (Nhà riêng, Bệnh viện, Công viên) với bán kính tùy chỉnh và cảnh báo ra/vào vùng an toàn tức thời.
- **Cảnh Báo Khẩn Cấp (SOS & Fall Detection)**:
  - Tiếp nhận tức thời cảnh báo té ngã hoặc bấm nút khẩn cấp SOS từ người thân qua Socket.IO < 2s.

### 2. 🏪 Cổng Quản Lý Bán Hàng Y Tế — `web-seller` (Port `3020`)
- **Đăng Ký & Thẩm Định Y Tế (KYC)**:
  - Quy trình nộp giấy phép kinh doanh thiết bị y tế, chứng nhận nhà phân phối và giấy tờ pháp lý.
- **Trung Tâm Tin Nhắn & Tư Vấn Khách Hàng Realtime (`/chat`)**:
  - Bố cục 3 cột chuẩn Shopee/Lazada Seller Chat:
    - *Cột 1*: Danh sách hội thoại kèm bộ lọc (Tất cả, Chưa đọc, Khách VIP) và tìm kiếm khách hàng.
    - *Cột 2*: Khung chat chính, thanh câu trả lời mẫu nhanh (*Quick Macros*), nút 1-click gửi voucher 50k và thẻ sản phẩm có nút mua.
    - *Cột 3 (Customer 360)*: Hồ sơ chi tiết khách mua, tổng chi tiêu, lịch sử đơn hàng gần nhất, sản phẩm đang hỏi mua và ghi chú nội bộ.
- **Quản Trị Sản Phẩm & Kho Hàng**:
  - Đăng tải sản phẩm y tế với đầy đủ thông số kỹ thuật, hình ảnh, mã SKU, chứng nhận kiểm định.
  - Quản lý tồn kho theo lô, cảnh báo hàng sắp hết hạn/hết tồn.
- **Quản Lý Thiết Bị IoT & Quét IMEI/Serial**:
  - Nhập và quản lý danh sách IMEI/Serial của các thiết bị thông minh (đồng hồ Wonlex, thiết bị đo).
  - Hỗ trợ quét và gán IMEI cho từng sản phẩm xuất kho.
- **Quy Trình Xử Lý Đơn Hàng (Order Fulfillment)**:
  - Tiếp nhận đơn hàng mới, thực hiện đóng gói (`PACKING`), in phiếu gửi và bàn giao cho đơn vị vận chuyển.
- **Tài Chính & Doanh Thu**:
  - Thống kê doanh thu theo biểu đồ trực quan (Recharts), quản lý ví nhà bán và yêu cầu rút tiền (Payouts).
- **Đa Ngôn Ngữ**: Hỗ trợ tiếng Việt và tiếng Anh (`next-intl`).

### 3. 🛡️ Cổng Quản Trị Vận Hành CareNest — `web-admin` (Port `3030`)
- **Kiểm Duyệt Hồ Sơ Y Tế & Sản Phẩm (Review & Moderation)**:
  - Thẩm định hồ sơ pháp lý nhà bán hàng (KYC Review) trước khi cho phép kinh doanh.
  - Kiểm duyệt danh mục sản phẩm y tế bảo đảm đúng quy định Bộ Y tế.
- **Quản Trị Người Dùng & Phân Quyền (RBAC)**:
  - Quản lý người mua, nhà bán hàng, chuyên viên hỗ trợ y tế, phân quyền quản trị chi tiết.
- **Giám Sát Vận Chuyển & Đơn Hàng Toàn Hệ Thống**:
  - Theo dõi trạng thái toàn bộ đơn hàng, đối soát vận chuyển (Shipping & Logistics) và xử lý khiếu nại.
- **Quản Lý Gói Dịch Vụ Định Kỳ (Subscriptions)**:
  - Quản lý các gói thuê bao SIM/dữ liệu IoT định vị và dịch vụ giám sát y tế chuyên gia.
- **Màn Hình Trực Ban Cảnh Báo Khẩn Cấp (SOS Monitor)**:
  - Tiếp nhận và theo dõi các sự kiện SOS / chỉ số sinh tồn bất thường trên toàn bộ hệ thống thời gian thực.
- **Nhật Ký Kiểm Toán (Audit Trail)**:
  - Ghi nhận chi tiết mọi hành vi quản trị, thay đổi trạng thái nhạy cảm nhằm phục vụ bảo mật và tuân thủ.
- **Đa Ngôn Ngữ**: Hỗ trợ tiếng Việt và tiếng Anh (`next-intl`).

---

## 🎨 Kiến Trúc Giao Diện & Design System

Cả 3 ứng dụng frontend đều tuân thủ các nguyên tắc thiết kế thống nhất:
- **Design Tokens & Vanilla CSS**: Sử dụng hệ thống CSS Variables (`globals.css`) chuẩn y tế & công nghệ:
  - Màu chủ đạo: **Medical Teal** (`#0d9488`), **Deep Indigo** (`#4f46e5`), **Amber Warning** (`#f59e0b`), **Danger Red** (`#ef4444`).
  - Typography: Google Font **Plus Jakarta Sans** hiện đại, dễ đọc trên cả màn hình di động lẫn máy tính bàn.
  - Tối ưu hiệu năng: Không phụ thuộc TailwindCSS cồng kềnh, tối ưu thời gian tải trang và dung lượng mã nguồn.
- **Iconography**: Bộ biểu tượng nhất quán từ `lucide-react`.
- **Form Handling & Validation**: Phối hợp chặt chẽ giữa `react-hook-form` và schema validation từ `zod`.
- **Shared Types**: Dùng chung các interface / DTO thông qua package nội bộ `@carenest/shared-types`.

---

## 📁 Cấu Trúc Thư Mục Chuẩn

```
frontend/
├── README.md                      # Tài liệu tổng quan này
│
├── web-buyer/                     # [Port 3000] Cổng Người mua & Người chăm sóc
│   ├── src/
│   │   ├── app/                   # App Router: Trang chủ, (auth), (shop), (health)
│   │   ├── components/            # UI components, layout Header/Footer, Map, SOS alert
│   │   ├── lib/                   # API client, WebSocket client, SEO, helpers
│   │   ├── messages/              # Từ điển đa ngôn ngữ (vi, en)
│   │   └── types/                 # Type cục bộ của web-buyer
│   └── package.json
│
├── web-seller/                    # [Port 3020] Cổng Nhà bán hàng y tế & IoT
│   ├── src/
│   │   ├── app/[locale]/          # App Router đa ngữ: login, register, kyc, (authenticated)
│   │   │   └── (authenticated)/   # Dashboard, products, inventory, orders, imei, payouts
│   │   ├── components/            # Bảng số liệu, form thêm sản phẩm, camera quét IMEI
│   │   ├── i18n/                  # Cấu hình next-intl
│   │   ├── lib/                   # Seller API client, service calls
│   │   └── middleware.ts          # Định tuyến locale i18n
│   └── package.json
│
└── web-admin/                     # [Port 3030] Cổng Quản trị vận hành hệ thống
    ├── src/
    │   ├── app/[locale]/          # App Router đa ngữ: dashboard, kyc, products, users,
    │   │                          # orders, shipping, subscriptions, alerts, audit
    │   ├── components/            # Bảng kiểm duyệt, widget thống kê, modal xác nhận
    │   ├── i18n/                  # Cấu hình next-intl
    │   ├── lib/                   # Admin API client, Role guard, Socket client
    │   └── middleware.ts          # Định tuyến locale i18n & xác thực admin
    └── package.json
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0` *(dự án ghim phiên bản khuyến nghị `pnpm@12.11.2`)*

### 2. Cài Đặt Dependencies
Từ thư mục gốc của monorepo (`care-nest/`):
```bash
pnpm install
```

### 3. Cấu Hình Biến Môi Trường (`.env.local`)
Mỗi ứng dụng có thể tạo file `.env.local` riêng tương ứng:

```bash
# Cấu hình kết nối API Gateway chung
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000

# Hoặc kết nối trực tiếp đến từng microservice khi phát triển cục bộ:
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
NEXT_PUBLIC_CATALOG_API_URL=http://localhost:3002
NEXT_PUBLIC_DEVICE_API_URL=http://localhost:3003
NEXT_PUBLIC_ORDER_API_URL=http://localhost:3004
NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:3005
NEXT_PUBLIC_NOTIFICATION_API_URL=http://localhost:3006
NEXT_PUBLIC_ALERT_API_URL=http://localhost:3007
NEXT_PUBLIC_ALERT_WS_URL=http://localhost:3007
NEXT_PUBLIC_SUBSCRIPTION_API_URL=http://localhost:3008
NEXT_PUBLIC_SHIPPING_API_URL=http://localhost:3009
```

### 4. Khởi Động Ứng Dụng

#### 👉 Khởi động riêng lẻ từng ứng dụng:
```bash
# 1. Chạy Web Buyer (Khách hàng & Người chăm sóc) -> http://localhost:3000
pnpm --filter @carenest/web-buyer dev

# 2. Chạy Web Seller (Nhà bán hàng y tế) -> http://localhost:3020
pnpm --filter @carenest/web-seller dev

# 3. Chạy Web Admin (Quản trị viên) -> http://localhost:3030
pnpm --filter @carenest/web-admin dev
```

#### 👉 Khởi động toàn bộ frontend bằng Turborepo:
```bash
# Chạy đồng thời cả 3 cổng frontend
pnpm turbo run dev --filter="./frontend/*"
```

---

## 🧪 Kiểm Tra Mã Nguồn & Build Sản Phẩm

Từ thư mục gốc monorepo:

```bash
# Kiểm tra TypeScript type của toàn bộ Frontend
pnpm turbo run type-check --filter="./frontend/*"

# Chạy Linter
pnpm turbo run lint --filter="./frontend/*"

# Đóng gói bản Production
pnpm turbo run build --filter="./frontend/*"
```

---

## 🤝 Quy Ước Lập Trình Frontend

1. **Client Components vs Server Components**:
   - Mặc định ưu tiên Server Components để tối ưu SEO và thời gian phản hồi ban đầu (FCP/TTFB).
   - Chỉ thêm directive `'use client'` khi component có sử dụng state, effect, tương tác DOM, browser APIs hoặc các thư viện client (Leaflet, Recharts, Socket.IO).
2. **Quốc Tế Hóa (i18n)**:
   - Các chuỗi hiển thị tĩnh trên giao diện nên được đưa vào tệp `messages/vi.json` và `messages/en.json` tương ứng thay vì hardcode văn bản.
3. **Màu Sắc & Giao Diện**:
   - Sử dụng các biến token đã định nghĩa trong `globals.css` (ví dụ: `var(--primary)`, `var(--bg-card)`), tránh viết mã màu hex rải rác.
4. **Xử Lý Dữ Liệu Thời Gian Thực**:
   - Luôn ngắt kết nối (`socket.disconnect()` / dọn dẹp listener) trong `useEffect` cleanup return để tránh rò rỉ bộ nhớ (memory leaks).
