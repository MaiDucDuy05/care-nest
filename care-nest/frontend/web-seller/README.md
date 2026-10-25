# `@carenest/web-seller` — Cổng Quản Lý Nhà Bán Hàng Y Tế

> **Port:** `3020`  
> **Framework:** Next.js 14 (App Router) + React 18 + TypeScript  
> **Styling:** Custom CSS Design Tokens (Vanilla CSS) + Lucide Icons  
> **Đa ngôn ngữ:** `next-intl` (Tiếng Việt & Tiếng Anh)

---

## 📌 Tổng Quan

`web-seller` là cổng quản lý bán hàng chuyên biệt dành cho các nhà phân phối thiết bị y tế (như MedTech Healthcare, Wonlex Vietnam) và đối tác cung ứng vật tư chăm sóc sức khỏe trên nền tảng CareNest.

---

## 🚀 Tính Năng Chính

### 1. Thẩm Định Hồ Sơ Pháp Lý Y Tế (KYC)
- Tải lên giấy phép đăng ký kinh doanh, chứng nhận đủ điều kiện kinh doanh trang thiết bị y tế loại A-B-C do Sở/Bộ Y Tế cấp, chứng nhận ủy quyền phân phối chính hãng.
- Theo dõi trạng thái thẩm định KYC từ đội ngũ kiểm duyệt CareNest.

### 2. Trung Tâm Tin Nhắn & Tư Vấn Realtime (`/chat`)
- Giao diện 3 cột chuẩn Shopee/Lazada Seller Chat:
  - **Cột Trái**: Danh sách khách hàng chat, tìm kiếm theo tên/SĐT, bộ lọc (Tất cả, Chưa đọc, Khách VIP) và số lượng tin nhắn chưa trả lời.
  - **Cột Giữa**: Khung chat chính, thanh câu trả lời mẫu nhanh (*Quick Macros*), nút 1-click gửi voucher 50k (`MEDTECH50K`) và thẻ sản phẩm kèm nút mua hàng.
  - **Cột Phải (Customer 360)**: Hồ sơ chi tiết người mua, tổng chi tiêu, lịch sử đơn hàng gần nhất, sản phẩm đang hỏi mua và khung ghi chú nội bộ của shop.

### 3. Quản Trị Sản Phẩm & Kho Hàng
- Đăng tải sản phẩm y tế với đầy đủ thông số kỹ thuật, hình ảnh, mã SKU, chứng nhận kiểm định.
- Quản lý tồn kho theo lô, cảnh báo hàng sắp hết hạn/hết tồn.

### 4. Quản Lý Thiết Bị IoT & Quét IMEI/Serial
- Nhập và quản lý danh sách IMEI/Serial của các thiết bị thông minh (đồng hồ Wonlex, máy đo huyết áp Bluetooth).
- Hỗ trợ quét và gán IMEI cho từng sản phẩm xuất kho trước khi bàn giao giao vận.

### 5. Xử Lý Đơn Hàng & Tài Chính (Orders & Payouts)
- Tiếp nhận đơn hàng mới, thực hiện đóng gói (`PACKING`), in phiếu gửi và bàn giao cho đơn vị vận chuyển.
- Thống kê doanh thu theo biểu đồ trực quan (Recharts), quản lý ví nhà bán và tạo lệnh yêu cầu rút tiền (Payouts).

---

## 📂 Cấu Trúc Thư Mục

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (authenticated)/           # Các trang yêu cầu đăng nhập
│   │   │   ├── analytics/             # Phân tích doanh thu & hiệu suất
│   │   │   ├── chat/                  # Trung tâm tin nhắn & Tư vấn khách hàng 3 cột
│   │   │   ├── dashboard/             # Bảng điều khiển tổng quan
│   │   │   ├── imei/                  # Quét và quản lý IMEI thiết bị IoT
│   │   │   ├── inventory/             # Quản trị kho hàng & lô hàng
│   │   │   ├── orders/                # Tiếp nhận & đóng gói đơn hàng
│   │   │   ├── payouts/               # Ví nhà bán & yêu cầu rút tiền
│   │   │   ├── products/              # Quản lý danh sách sản phẩm y tế
│   │   │   └── settings/              # Cài đặt cửa hàng
│   │   ├── kyc/                       # Nộp hồ sơ thẩm định y tế
│   │   ├── login/                     # Đăng nhập cổng người bán
│   │   └── register/                  # Đăng ký tài khoản người bán
│   └── globals.css
│
├── components/
│   ├── kyc/                           # KycBanner & tài liệu pháp lý
│   └── layout/                        # DashboardLayout, Sidebar, Topbar
│
├── i18n/                              # Routing & Request i18n
├── lib/                               # API Client & Services (Orders, Products, IMEI, Payouts)
└── messages/                          # Từ điển vi.json & en.json
```

---

## 🚀 Khởi Chạy Cục Bộ

```bash
# Từ thư mục gốc care-nest
pnpm --filter @carenest/web-seller dev

# Mở trình duyệt tại:
# http://localhost:3020
```

