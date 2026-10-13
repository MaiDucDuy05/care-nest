# `frontend/` — Ứng Dụng Client Nền Tảng CareNest

Hệ thống ứng dụng Web phía người dùng được xây dựng trên nền tảng **Next.js 14 (App Router)** với kiến trúc hiện đại, giao diện trực quan và khả năng kết nối thời gian thực.

## Trạng Thái Các Ứng Dụng

| Ứng Dụng | Port | Đối Tượng Sử Dụng | Công Nghệ | Trạng Thái |
|---|---|---|---|---|
| **`web-buyer/`** | `3000` | Khách hàng mua sắm, Gia đình & Người chăm sóc (Caregiver) | Next.js 14, React 18, Custom CSS Tokens, Lucide Icons | ✅ **Scaffolded** (Phase 1) |
| `web-seller/` | `3004` | Nhà bán hàng y tế, đại lý thiết bị IoT | Next.js 14 App Router | ⏳ Kế hoạch Phase 2 |
| `web-admin/` | `3005` | Quản trị viên CareNest, Chuyên viên y tế hỗ trợ | Next.js 14 App Router | ⏳ Kế hoạch Phase 3 |

---

## Chuẩn Cấu Trúc Trong Từng Ứng Dụng
```
<app>/
├── src/
│   ├── app/                   # Next.js App Router (pages & layouts)
│   ├── components/            # Reusable UI components & Layouts
│   ├── lib/                   # API clients & utilities
│   └── types/                 # Frontend types
```

## Chạy Thử
```bash
# Khởi động web-buyer
pnpm --filter @carenest/web-buyer dev
```
Mở trình duyệt: [http://localhost:3000](http://localhost:3000)
