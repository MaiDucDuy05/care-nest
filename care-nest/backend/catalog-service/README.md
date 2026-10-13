# `@carenest/catalog-service`

Dịch vụ Quản lý Danh mục & Sản phẩm (Product Catalog) cho nền tảng CareNest.

## Trách nhiệm chính
- Quản lý danh mục sản phẩm y tế, thiết bị đeo IoT, thực phẩm chức năng, thiết bị hỗ trợ người cao tuổi.
- CRUD sản phẩm dành cho Seller và duyệt sản phẩm từ Admin.
- Tìm kiếm, lọc sản phẩm theo tiêu chí (giá, danh mục, đánh giá, tương thích thiết bị).
- Tích hợp Redis Caching (`@carenest/shared-redis`) để tối ưu hóa truy vấn đọc catalog.

## Cấu trúc thư mục
```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap HTTP server (Port: 3002)
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts # /api/v1/products endpoints
│   ├── products.service.ts    # Logic nghiệp vụ + cache layer
│   ├── products.repository.ts # Prisma queries (@carenest/database)
│   └── dto/                   # DTO create, update, query filter
└── categories/
    ├── categories.module.ts
    ├── categories.controller.ts # /api/v1/categories
    ├── categories.service.ts
    └── dto/
```

## Chạy cục bộ
```bash
pnpm --filter @carenest/catalog-service dev
```
