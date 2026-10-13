# `@carenest/auth-service`

Dịch vụ Xác thực và Phân quyền (Authentication & Authorization) trung tâm cho hệ thống CareNest.

## Trách nhiệm chính
- Đăng ký tài khoản (Buyer, Seller, Caregiver, Admin, Support).
- Đăng nhập, cấp phát và refresh JWT token.
- Phân quyền theo vai trò (Role-Based Access Control - RBAC).
- Quản lý trạng thái xác thực và tích hợp KYC.

## Cấu trúc thư mục
```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap HTTP server (Port: 3001)
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts     # /api/v1/auth endpoints
│   ├── auth.service.ts        # Business logic login, register, refresh
│   ├── dto/                   # DTO validated with Zod
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── strategies/            # Passport JWT strategy
│   └── decorators/            # @CurrentUser(), @Roles()
└── users/
    ├── users.module.ts
    ├── users.service.ts
    └── users.repository.ts    # Truy vấn người dùng qua @carenest/database
```

## Chạy cục bộ
```bash
pnpm --filter @carenest/auth-service dev
```
