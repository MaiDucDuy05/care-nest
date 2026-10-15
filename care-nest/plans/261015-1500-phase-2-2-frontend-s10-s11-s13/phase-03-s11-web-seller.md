# Phase 03 — S11 web-seller (Next.js 14, port 3004)

> **Wave**: 2 (chạy song song với phase 04 — web-admin)
> **Output**: Next.js 14 app mới `frontend/web-seller` (port 3004) — KYC submission, product CRUD, order PACKING flow, inventory dashboard, sales analytics, IMEI bulk-scan
> **Gate**: G2 — S11 review (cả seller + admin)

## Context Links

- Plan: `plan.md`
- Phase 0: `phase-01-shared-types-and-design-tokens.md` (entities Plan, KycDocument, Shipment, DeviceActivationCode, AuditEvent)
- Phase 1: `phase-02-s10-web-buyer-pages.md` (design tokens, i18n pattern)
- Backend: `backend/catalog-service/src/{kyc,products}/`, `backend/order-service/src/{orders,inventory}/`, `backend/auth-service/src/audit/`

## Overview

- **Priority**: P1 (Sprint 11)
- **Status**: Not started
- **Brief**: Dựng Next.js 14 App Router app mới cho medical seller / IoT distributor. 6 tính năng chính: KYC submission, product CRUD, order PACKING flow, inventory dashboard, sales analytics, IMEI bulk-scan. App sẽ authenticate seller role riêng (`role: 'SELLER'`), reuse design tokens từ phase 0, dùng i18n pattern từ phase 1.

## Key Insights

- App mới hoàn toàn — không kế thừa web-buyer code. Chỉ import `@carenest/shared-types` + design tokens.
- KYC status flow: `NONE → PENDING → APPROVED|REJECTED`. Sau khi APPROVED, seller mới được tạo product.
- Product có 2 loại: thường (thực phẩm chức năng, mask) vs IoT device (có thêm flag `isIotDevice: true` + IMEI tracking).
- Order PACKING: khi seller click "Đã đóng gói" → backend emit Kafka `order.ready_to_ship` → shipping-service consume → tạo shipment. Frontend chỉ POST state transition, không tự emit.
- IMEI scan: dùng `qr-scanner` (modern, no jQuery) + camera fallback manual input. Bulk scan = scan N IMEI liên tiếp, lưu array.
- Analytics: dùng `recharts` (de facto React chart lib). Data từ `GET /api/v1/seller/analytics/revenue?from=...&to=...`.
- Role guard: middleware kiểm tra JWT token + role claim = SELLER hoặc ADMIN.

## Requirements

### Functional
- FR-3.1: KYC submission (4 loại document: TAX_ID, BUSINESS_LICENSE, BANK_ACCOUNT, ID_CARD)
- FR-3.2: KYC status display (NONE/PENDING/APPROVED/REJECTED + rejection reason)
- FR-3.3: Product CRUD (name, description, price, images, category, stock, isIotDevice)
- FR-3.4: Product list với search/filter (status: DRAFT, PENDING_REVIEW, ACTIVE, REJECTED)
- FR-3.5: Order list + filter (status: PACKING, READY_TO_SHIP, SHIPPED...)
- FR-3.6: Order PACKING action (state transition + IMEI assign nếu IoT)
- FR-3.7: Inventory dashboard (stock level + hold/release)
- FR-3.8: Sales analytics (revenue chart, top products, IoT vitals activity nếu applicable)
- FR-3.9: IMEI bulk-scan (camera + manual)
- FR-3.10: Settings page (shop info, bank account)

### Non-functional
- First contentful paint < 1.5s
- Mỗi page < 200KB JS (lazy load charts, IMEI scanner)
- 100% TypeScript strict
- Không có secrets trong repo (file upload dùng presigned URL từ backend, không hardcode)

## Architecture

```
frontend/web-seller/
├── messages/
│   ├── vi.json                          # default
│   └── en.json
├── src/
│   ├── i18n/
│   │   ├── request.ts
│   │   └── routing.ts
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (no locale here)
│   │   ├── [locale]/
│   │   │   ├── layout.tsx               # Locale + auth check
│   │   │   ├── (public)/
│   │   │   │   ├── login/page.tsx       # Seller login
│   │   │   │   └── register/page.tsx    # Seller register
│   │   │   ├── (onboarding)/
│   │   │   │   └── kyc/
│   │   │   │       ├── page.tsx         # KYC form (step 1-4)
│   │   │   │       └── status/page.tsx  # KYC status display
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx           # Sidebar layout (after KYC OK)
│   │   │   │   ├── page.tsx             # Dashboard home (KPIs)
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx         # Product list
│   │   │   │   │   ├── new/page.tsx     # Create product
│   │   │   │   │   └── [id]/page.tsx    # Edit product
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx         # Order list
│   │   │   │   │   └── [id]/page.tsx    # Order detail + PACKING action
│   │   │   │   ├── inventory/page.tsx   # Stock dashboard
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── page.tsx         # Revenue chart
│   │   │   │   │   └── products/page.tsx # Top products
│   │   │   │   ├── imei-scan/
│   │   │   │   │   ├── page.tsx         # Bulk scan entry
│   │   │   │   │   └── [orderId]/page.tsx # Assign to order
│   │   │   │   └── settings/page.tsx
│   │   │   └── not-found.tsx
│   │   └── api/                          # không cần Next API routes (gọi thẳng backend)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx              # Sidebar nav (KYC, Products, Orders, ...)
│   │   │   ├── topbar.tsx               # User menu + locale switcher
│   │   │   └── kyc-banner.tsx           # Banner nếu KYC chưa APPROVED
│   │   ├── kyc/
│   │   │   ├── kyc-stepper.tsx
│   │   │   ├── kyc-step-store-info.tsx
│   │   │   ├── kyc-step-tax-id.tsx
│   │   │   ├── kyc-step-business-license.tsx
│   │   │   ├── kyc-step-bank-account.tsx
│   │   │   └── kyc-status-card.tsx
│   │   ├── products/
│   │   │   ├── product-form.tsx
│   │   │   ├── product-table.tsx
│   │   │   ├── product-image-uploader.tsx
│   │   │   └── iot-flag-toggle.tsx
│   │   ├── orders/
│   │   │   ├── order-table.tsx
│   │   │   ├── order-detail-card.tsx
│   │   │   ├── packing-action-modal.tsx
│   │   │   └── imei-assignment-list.tsx
│   │   ├── inventory/
│   │   │   ├── stock-level-card.tsx
│   │   │   └── inventory-table.tsx
│   │   ├── analytics/
│   │   │   ├── revenue-chart.tsx        # recharts LineChart
│   │   │   ├── top-products-table.tsx
│   │   │   └── kpi-card.tsx
│   │   ├── imei/
│   │   │   ├── imei-scanner-cam.tsx     # dynamic import qr-scanner
│   │   │   ├── imei-manual-input.tsx
│   │   │   └── imei-bulk-list.tsx
│   │   └── ui/
│   │       ├── file-upload.tsx
│   │       ├── data-table.tsx
│   │       └── locale-switcher.tsx
│   ├── lib/
│   │   ├── api-client.ts                # Re-exports
│   │   ├── services/
│   │   │   ├── auth.ts                  # SELLER login/register
│   │   │   ├── catalog.ts               # products + KYC
│   │   │   ├── orders.ts                # PACKING action
│   │   │   ├── inventory.ts
│   │   │   ├── analytics.ts
│   │   │   └── uploads.ts               # presigned URL
│   │   ├── role-guard.ts                # client-side role check
│   │   └── format.ts                    # VND, date, etc.
│   └── hooks/
│       ├── use-auth.ts
│       └── use-upload.ts
├── middleware.ts                        # role-based redirect
├── next.config.mjs
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Related Code Files

### Create (toàn bộ NEW — không modify gì từ phase 0/1)
- `frontend/web-seller/` (root) — toàn bộ thư mục mới (~80 files)
- `pnpm-workspace.yaml` — không cần modify (đã có `frontend/*`)

### Modify
- `package.json` (root) — KHÔNG (web-seller tự khai báo scripts của nó)
- `turbo.json` — KHÔNG (turbo tự discover)

### Delete
- None

## Implementation Steps

1. **Bootstrap Next.js app** (tay, không dùng create-next-app vì cần custom từ đầu):
   - Copy cấu trúc từ `web-buyer/` (next.config, tsconfig, layout pattern)
   - Đổi port → 3004
   - Đổi package name → `@carenest/web-seller`
   - Thay `globals.css` bằng bản copy từ web-buyer (giữ nguyên design tokens)
2. **Cài deps**: `next-intl`, `recharts`, `qr-scanner`, `react-hook-form`, `zod`, `@hookform/resolvers`
3. **i18n + middleware**: copy pattern từ phase 1
4. **Auth + role guard**:
   - `/login` + `/register` cho seller
   - `middleware.ts` check JWT role = SELLER, redirect về `/kyc` nếu chưa APPROVED
5. **KYC flow**: 4 step form (store info → tax ID → business license → bank account). Mỗi step 1 page riêng, dùng React Hook Form + Zod resolver.
6. **Product CRUD**: 3 pages (list, new, edit). Image upload dùng presigned URL từ backend.
7. **Order PACKING**: order detail page có button "Đã đóng gói" → modal xác nhận → POST state transition → toast success.
8. **IMEI scan**: 2 pages. Page 1 là bulk scan (camera + manual list). Page 2 assign list vào order cụ thể.
9. **Inventory dashboard**: SSR fetch stock, render table với sort + filter.
10. **Analytics**: recharts LineChart cho revenue, table cho top products. Filter theo date range.
11. **Settings**: shop info form + bank account.
12. **Verify**: `pnpm turbo run type-check lint build --filter @carenest/web-seller`

## Todo List

- [ ] Bootstrap Next.js 14 app structure
- [ ] Copy + adapt globals.css from web-buyer
- [ ] Install deps
- [ ] i18n scaffold (vi/en)
- [ ] Auth pages (login/register) with seller role
- [ ] Middleware for role guard
- [ ] KYC 4-step flow
- [ ] KYC status page
- [ ] Product list page
- [ ] Product create/edit page
- [ ] Order list page
- [ ] Order detail + PACKING modal
- [ ] IMEI scan (camera + manual) page
- [ ] IMEI assign to order page
- [ ] Inventory dashboard
- [ ] Analytics revenue chart page
- [ ] Analytics top products page
- [ ] Settings page
- [ ] Sidebar layout
- [ ] Topbar with user menu + locale switcher
- [ ] KYC banner component
- [ ] Type-check + lint + build pass
- [ ] Commit `feat(web-seller): S11 medical seller portal MVP`

## Success Criteria

- App chạy được trên port 3004, login với SELLER role
- KYC submission hoàn chỉnh 4 step
- Tạo/sửa product với image upload
- Order PACKING action emit Kafka event thành công
- IMEI scan hoạt động với camera
- Analytics chart render với data thật
- i18n switch vi ↔ en OK
- Build + type-check + lint pass
- 0 secrets trong repo

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| KYC form 4 step quá phức tạp, abandon rate cao | Medium | Medium | Auto-save draft mỗi step, cho phép back/forward |
| IMEI scan camera không hoạt động trên Safari | Medium | Low | Fallback manual input luôn hiển thị |
| Recharts bundle lớn (~100KB) | Low | Low | Dynamic import chỉ trên analytics page |
| Order PACKING race condition (2 seller cùng đóng gói) | Low | Medium | Optimistic locking với `version` field, backend reject nếu stale |
| KYC document upload timeout với file lớn | Medium | Medium | Client resize ảnh < 2MB trước khi upload, hiển thị progress bar |

## Security Considerations

- JWT token lưu `httpOnly` cookie
- Role-based middleware: reject nếu không phải SELLER
- File upload: chỉ accept JPG/PNG/PDF, max 5MB, validate magic bytes client-side
- IMEI validation: regex 14-16 digits + Luhn check (optional Phase 3)
- Form CSRF: dùng Next.js built-in SameSite cookie
- Sensitive bank account: mask trừ 4 số cuối khi hiển thị
- Order PACKING: confirm modal yêu cầu password re-entry nếu > 1M VND (optional)

## Next Steps

- Sau khi G2 seller pass → wave 3 (S13 PWA/SEO) áp dụng cho cả web-seller
- Nếu backend presigned URL endpoint chưa có, thêm sub-task "uploads.controller" trong catalog-service
- IMEI Luhn check có thể là sub-task Phase 3 hardening
