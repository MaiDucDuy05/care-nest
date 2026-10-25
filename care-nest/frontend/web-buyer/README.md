# `@carenest/web-buyer` — Cổng Mua Sắm & Giám Sát Người Thân

> **Port:** `3000`  
> **Framework:** Next.js 14 (App Router) + React 18 + TypeScript  
> **Styling:** Custom CSS Design Tokens (Vanilla CSS) + Lucide Icons

---

## 📌 Tổng Quan

`web-buyer` là ứng dụng web trung tâm dành cho khách hàng mua sắm thiết bị y tế và người thân/người chăm sóc theo dõi sức khỏe người cao tuổi trong gia đình.

---

## 🚀 Tính Năng Chính

### 1. Thương Mại Điện Tử & CareNest Mall
- **Danh mục & Chi tiết sản phẩm y tế**: Máy đo huyết áp bắp tay Omron, que đo đường huyết, đồng hồ định vị GPS Wonlex, nệm chống loét, thiết bị radar phát hiện té ngã.
- **Gian hàng chính hãng CareNest Mall (`/shop/sellers/[slug]`)**:
  - Giao diện Mall chuyên nghiệp (Header banner, số lượng người theo dõi, cam kết y tế 4 điểm vàng).
  - Khung mã giảm giá độc quyền (Store Vouchers: `MEDTECH50K`, `MEDTECH150K`, `FREESHIPMAX`).
  - Hệ thống 6 tab: Tất cả sản phẩm, Bán chạy, Huyết áp, Radar SOS, Đánh giá uy tín (128 lượt) và Hồ sơ pháp lý (Mã số thuế, giấy phép kinh doanh trang thiết bị y tế Bộ Y Tế cấp).
  - Tích hợp nút **"Chat Dược Sĩ"** trên banner và từng thẻ sản phẩm.
- **Giả Lập Thanh Toán Đa Kênh (`/shop/payment-simulator`)**:
  - Giả lập thanh toán tức thì qua VietQR, Thẻ quốc tế Visa/MasterCard, Ví điện tử MoMo/ZaloPay và COD.
  - Hỗ trợ mô phỏng kịch bản thành công / thất bại để kiểm thử quy trình đơn hàng.
- **Xác Nhận Đã Nhận Hàng & Đánh Giá Đơn Hàng (`/orders/[orderId]/review`)**:
  - Nút xác nhận nhận hàng ("Đã nhận hàng") cập nhật trạng thái `DELIVERED`.
  - Đánh giá sao 1-5★ và bình luận kèm phản hồi chính thức từ nhà bán hàng.

### 2. Chat Realtime Dược Sĩ & Shop (`FloatingChatWidget`)
- Widget chat nổi toàn cục ở góc phải màn hình (`bottom-6 right-6`) có huy hiệu tin chưa đọc.
- Kết nối Socket.IO tới `chat-service` (Port 3010).
- Thẻ sản phẩm tương tác (Product Card snippet) có nút **"Thêm Giỏ Hàng"** và **"Xem Chi Tiết"** trực tiếp trong bong bóng chat.
- Gợi ý câu hỏi nhanh (Quick Question Pills), hiệu ứng gõ phím (Typing indicator) và phản hồi tự động thông minh từ dược sĩ.

### 3. Giám Sát Sức Khỏe & Vùng An Toàn Geofence
- **Tổng quan sinh tồn (`/health/dashboard`)**: Theo dõi nhịp tim (BPM), huyết áp (SYS/DIA), nồng độ SpO2, thân nhiệt cập nhật thời gian thực.
- **Bản đồ Vùng An Toàn GPS (`/health/geofence`)**: Tích hợp Leaflet GIS hiển thị trực quan các điểm an toàn (Nhà riêng, Bệnh viện, Công viên) với bán kính bảo vệ tùy chỉnh và cảnh báo ra/vào tức thì.
- **Nhật ký cảnh báo khẩn cấp (`/health/alerts`)**: Tiếp nhận tức thì cảnh báo té ngã hoặc nút bấm SOS khẩn cấp.

---

## 📂 Cấu Trúc Thư Mục

```
src/
├── app/
│   ├── [locale]/                      # Next-intl i18n routing (vi, en)
│   │   ├── layout.tsx                 # Root layout & Metadata
│   │   ├── page.tsx                   # Trang chủ CareNest
│   │   ├── activation/                # Kích hoạt thiết bị & SIM IoT
│   │   ├── auth/                      # Đăng nhập & Đăng ký
│   │   ├── health/                    # Dashboard sinh tồn, Geofence, Caregivers
│   │   ├── orders/                    # Lịch sử đơn hàng & Trang đánh giá review
│   │   ├── shop/                      # Sản phẩm, Gian hàng Mall, Giỏ hàng, Thanh toán
│   │   └── subscription/              # Gói cước SIM 4G & dịch vụ định kỳ
│   └── globals.css                    # CSS Design Tokens & Micro-animations
│
├── components/
│   ├── chat/                          # FloatingChatWidget & Chat components
│   ├── geofence/                      # Bản đồ Leaflet GeofenceMap, GeofenceList
│   ├── health/                        # Biểu đồ sinh tồn, VitalCards, AlertList
│   ├── layout/                        # AppLayoutShell, ShopHeader, HealthHeader, Footer
│   ├── payment/                       # PaymentSimulatorModal & Checkout form
│   └── shop/                          # SellerStorefrontView, ProductCard, FilterBar
│
├── lib/                               # Dịch vụ API, Socket client, SEO
└── services/                          # CartService, OrdersService, AlertsService
```

---

## 🚀 Khởi Chạy Cục Bộ

```bash
# Từ thư mục gốc care-nest
pnpm --filter @carenest/web-buyer dev

# Mở trình duyệt tại:
# http://localhost:3000
```
