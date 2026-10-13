# `@carenest/web-buyer`

Cổng thông tin Mua sắm Thiết bị Y tế & Giám sát Sức khỏe Người cao tuổi (Next.js 14 App Router) dành cho khách hàng & gia đình.

## Tính năng chính
- **Thương mại điện tử Y tế**: Tìm kiếm và mua sắm thiết bị y tế gia đình, đồng hồ GPS cảnh báo ngã Wonlex, thực phẩm chức năng chính hãng.
- **Giám sát Sức khỏe Theo Thời Gian Thực (Tele-health & IoT Dashboard)**: Theo dõi chỉ số sinh tồn (huyết áp, nhịp tim, nồng độ oxy trong máu SpO2, thân nhiệt, định vị người cao tuổi).
- **Cảnh báo Khẩn cấp SOS**: Nhận thông báo tức thì khi người thân bấm nút SOS hoặc thiết bị phát hiện té ngã.
- **Quản lý Giỏ hàng & Đơn hàng**: Thanh toán COD, VNPay, MoMo, ZaloPay.

## Cấu trúc thư mục
```
src/
├── app/
│   ├── layout.tsx             # Root layout with Header & Footer
│   ├── page.tsx               # Homepage / Landing page
│   ├── globals.css            # Custom Design System (Tokens, Animations)
│   ├── (auth)/                # Đăng nhập & Đăng ký
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (shop)/                # Mua sắm
│   │   ├── products/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   └── cart/page.tsx
│   └── (health)/              # Dashboard theo dõi sức khỏe
│       └── dashboard/page.tsx
├── components/
│   ├── layout/                # Header, Footer, Nav
│   └── ui/                    # Reusable buttons, cards, badges
├── lib/                       # API clients & utilities
└── types/                     # Local frontend types
```

## Chạy cục bộ
```bash
pnpm --filter @carenest/web-buyer dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.
