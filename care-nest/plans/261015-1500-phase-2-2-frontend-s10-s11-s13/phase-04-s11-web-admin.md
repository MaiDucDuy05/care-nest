# Phase 04 — S11 web-admin (Next.js 14, port 3005)

> **Wave**: 2 (chạy song song với phase 03 — web-seller, KHÔNG overlap file ownership)
> **Output**: Next.js 14 app mới `frontend/web-admin` (port 3005) — KYC/product review queue, user management, order/alert oversight, audit log viewer, subscription overview, shipping overview
> **Gate**: G2 — S11 review (cả seller + admin)

## Context Links

- Plan: `plan.md`
- Phase 0: `phase-01-shared-types-and-design-tokens.md`
- Phase 03: `phase-03-s11-web-seller.md` (sister app, chạy song song)
- Backend: `backend/catalog-service/src/{kyc,products}/`, `backend/auth-service/src/{users,audit}/`, `backend/order-service/src/orders/`, `backend/alert-service/src/alerts/`, `backend/subscription-service/src/subscriptions/`, `backend/shipping-service/src/shipments/`

## Overview

- **Priority**: P1 (Sprint 11)
- **Status**: Not started
- **Brief**: Dựng Next.js 14 App Router app mới cho CareNest ops + medical reviewer. 8 module: KYC review queue, product review queue, user management, order oversight, alert oversight (live feed), audit log viewer, subscription overview (MRR/churn), shipping overview (provider health + failover). Role bắt buộc `ADMIN` hoặc `MEDICAL_REVIEWER`.

## Key Insights

- App mới hoàn toàn — dùng design tokens + i18n pattern giống web-seller nhưng layout khác (full-width top nav, không sidebar).
- Medical reviewer là 1 sub-role của ADMIN, cần quyền riêng cho product review.
- Review queue dùng optimistic update + WebSocket để real-time (nếu 2 admin cùng review, backend phải reject stale).
- User management: thao tác nhạy cảm (suspend, role change) → confirm modal bắt buộc + audit log tự động ghi.
- Audit log: chỉ đọc, filter theo entityType/entityId/actor/action/date range. Export CSV optional.
- Subscription overview: MRR = sum(active subs price), churn = (canceled / activeAtStartOfMonth). Tính client-side từ raw data.
- Shipping overview: hiển thị provider health (last heartbeat) + failover events từ Kafka. Đọc qua `GET /api/v1/shipments/admin/providers` (cần backend endpoint mới — sẽ thêm sub-task).
- Alert oversight: WebSocket subscribe tất cả alerts (admin scope).

## Requirements

### Functional
- FR-3.11: KYC review queue — list pending, approve/reject với reason
- FR-3.12: Product review queue — list PENDING_REVIEW, approve/reject với reason
- FR-3.13: User management — search, list, suspend, role change
- FR-3.14: Order oversight — search/filter tất cả orders, drill-down
- FR-3.15: Alert oversight — live feed (WebSocket), filter by severity, ack/resolve
- FR-3.16: Audit log viewer — filter + paginate, view detail
- FR-3.17: Subscription overview — MRR chart, churn chart, list all subs
- FR-3.18: Shipping overview — provider health, failover events, recent shipments
- FR-3.19: Admin login + role guard (ADMIN, MEDICAL_REVIEWER)
- FR-3.20: Dashboard home (KPIs: pending KYC count, pending products count, today's orders, today's alerts)

### Non-functional
- Table pagination 50 items/page, server-side
- WebSocket reconnect tự động
- Mỗi action nhạy cảm có confirmation modal
- Build pass, type-check pass

## Architecture

```
frontend/web-admin/
├── messages/{vi,en}.json
├── src/
│   ├── i18n/{request,routing}.ts
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── [locale]/
│   │   │   ├── layout.tsx              # Locale + auth + role check
│   │   │   ├── (public)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── forbidden/page.tsx  # 403 nếu role không đủ
│   │   │   ├── (admin)/
│   │   │   │   ├── layout.tsx          # Top nav layout
│   │   │   │   ├── page.tsx            # Dashboard home (KPIs)
│   │   │   │   ├── kyc/
│   │   │   │   │   ├── page.tsx        # Pending KYC list
│   │   │   │   │   └── [sellerId]/page.tsx  # Review detail
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx        # Pending products list
│   │   │   │   │   └── [productId]/page.tsx
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx        # User list
│   │   │   │   │   └── [userId]/page.tsx  # Detail + actions
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [orderId]/page.tsx
│   │   │   │   ├── alerts/
│   │   │   │   │   ├── page.tsx        # Live feed
│   │   │   │   │   └── [alertId]/page.tsx
│   │   │   │   ├── audit/
│   │   │   │   │   ├── page.tsx        # Filter + list
│   │   │   │   │   └── [eventId]/page.tsx
│   │   │   │   ├── subscriptions/
│   │   │   │   │   ├── page.tsx        # Overview + MRR
│   │   │   │   │   └── [subId]/page.tsx
│   │   │   │   └── shipping/
│   │   │   │       ├── page.tsx        # Provider health
│   │   │   │       └── [shipmentId]/page.tsx
│   │   │   └── not-found.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── top-nav.tsx
│   │   │   ├── user-menu.tsx
│   │   │   ├── locale-switcher.tsx
│   │   │   └── role-badge.tsx
│   │   ├── kyc/
│   │   │   ├── kyc-pending-table.tsx
│   │   │   ├── kyc-review-modal.tsx
│   │   │   └── kyc-document-viewer.tsx
│   │   ├── products/
│   │   │   ├── product-pending-table.tsx
│   │   │   ├── product-review-modal.tsx
│   │   │   └── product-spec-viewer.tsx
│   │   ├── users/
│   │   │   ├── user-table.tsx
│   │   │   ├── user-actions-menu.tsx
│   │   │   └── suspend-confirm-modal.tsx
│   │   ├── orders/
│   │   │   ├── order-search-bar.tsx
│   │   │   ├── order-table.tsx
│   │   │   └── order-timeline.tsx
│   │   ├── alerts/
│   │   │   ├── alert-live-feed.tsx
│   │   │   ├── alert-severity-filter.tsx
│   │   │   └── alert-action-bar.tsx
│   │   ├── audit/
│   │   │   ├── audit-filter-bar.tsx
│   │   │   ├── audit-table.tsx
│   │   │   ├── audit-event-diff.tsx
│   │   │   └── audit-csv-export.tsx
│   │   ├── subscriptions/
│   │   │   ├── mrr-chart.tsx
│   │   │   ├── churn-chart.tsx
│   │   │   ├── subscription-table.tsx
│   │   │   └── plan-distribution-pie.tsx
│   │   ├── shipping/
│   │   │   ├── provider-health-card.tsx
│   │   │   ├── failover-events-list.tsx
│   │   │   └── shipment-trace.tsx
│   │   ├── kpi/
│   │   │   ├── kpi-card.tsx
│   │   │   └── kpi-grid.tsx
│   │   └── ui/
│   │       ├── confirm-modal.tsx
│   │       ├── severity-badge.tsx
│   │       ├── data-table.tsx
│   │       └── empty-state.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── services/
│   │   │   ├── auth.ts
│   │   │   ├── catalog.ts              # KYC + products admin endpoints
│   │   │   ├── users.ts
│   │   │   ├── orders.ts
│   │   │   ├── alerts.ts
│   │   │   ├── audit.ts
│   │   │   ├── subscriptions.ts
│   │   │   └── shipping.ts
│   │   ├── role-guard.ts
│   │   ├── socket.ts                   # alert WebSocket
│   │   └── format.ts
│   └── hooks/
│       ├── use-auth.ts
│       ├── use-audit-filter.ts
│       └── use-live-alerts.ts
├── middleware.ts                       # role check (ADMIN/MEDICAL_REVIEWER)
├── next.config.mjs
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Related Code Files

### Create (toàn bộ NEW)
- `frontend/web-admin/` (~75 files)

### Modify
- None (web-admin là app mới hoàn toàn)

### Delete
- None

## Implementation Steps

1. **Bootstrap**: copy cấu trúc từ web-seller, đổi port 3005, package name `@carenest/web-admin`
2. **Cài deps**: `next-intl`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `socket.io-client`, `date-fns`
3. **i18n + middleware**: role check `ADMIN | MEDICAL_REVIEWER` ở middleware
4. **Auth pages**: `/login` (admin login), `/forbidden` (403)
5. **Top nav layout**: full-width với dropdown menu cho từng module
6. **Dashboard home (KPIs)**: 4 KPI cards (pending KYC, pending products, today orders, today alerts)
7. **KYC review queue**: list + modal approve/reject
8. **Product review queue**: list + modal approve/reject (chỉ MEDICAL_REVIEWER + ADMIN)
9. **User management**: search + list + actions menu (suspend, role change)
10. **Order oversight**: search bar + table + drill-down
11. **Alert oversight**: live feed với WebSocket + severity filter
12. **Audit log**: filter bar (entityType, actor, action, date range) + table + diff viewer
13. **Subscription overview**: MRR chart, churn chart, plan distribution pie, subscription table
14. **Shipping overview**: provider health cards + failover events list + shipment trace
15. **Verify**: type-check + lint + build

## Todo List

- [ ] Bootstrap Next.js 14 app
- [ ] Install deps
- [ ] i18n + middleware với role check
- [ ] Auth pages (login, forbidden)
- [ ] Top nav layout
- [ ] Dashboard home với 4 KPIs
- [ ] KYC review queue (list + modal)
- [ ] Product review queue (list + modal)
- [ ] User management (list + actions)
- [ ] Order oversight (search + table)
- [ ] Alert oversight (live feed)
- [ ] Audit log viewer (filter + diff)
- [ ] Subscription overview (MRR/churn charts)
- [ ] Shipping overview (provider health + failover)
- [ ] Type-check + lint + build pass
- [ ] Commit `feat(web-admin): S11 ops + medical reviewer portal MVP`

## Success Criteria

- App chạy port 3005, login với ADMIN role
- KYC review queue: approve/reject hoạt động, optimistic update
- Product review queue tương tự
- User suspend + role change có confirm modal
- Alert live feed cập nhật real-time qua WebSocket
- Audit log filter chính xác, CSV export OK
- MRR/churn chart render với data thật
- Shipping provider health hiển thị trạng thái
- Build + type-check + lint pass
- 0 secrets trong repo

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 2 admin review cùng lúc → conflict | Medium | High | Optimistic locking + WebSocket broadcast `review.taken` để disable button |
| WebSocket connection drop khi switch tab | Medium | Low | `visibilitychange` event reconnect khi tab visible |
| Audit log filter phức tạp dễ sai | Medium | Medium | Dùng URL search params cho filter state, shareable link |
| MRR calculation sai do timezone | Low | Medium | Tính server-side, client chỉ render |
| Shipping provider health không có data thật | Medium | Low | Mock data nếu backend chưa có endpoint (sẽ thêm sub-task) |

## Security Considerations

- JWT `httpOnly` cookie + role claim check ở middleware
- Mọi action ghi (approve/reject/suspend) bắt buộc confirm modal + log IP
- Audit log KHÔNG hiển thị password/secret/token field (mask ở client)
- CSV export chỉ role ADMIN
- User suspend: confirm modal yêu cầu nhập lý do (sẽ lưu vào audit log)
- KYC document download: chỉ role ADMIN/MEDICAL_REVIEWER, log access vào audit

## Next Steps

- Sau khi G2 admin pass → wave 3 (S13) áp dụng cho cả web-admin
- Backend sub-task: shipping provider health endpoint (`/api/v1/shipments/admin/providers`)
- Backend sub-task: admin audit filter API (nếu backend chỉ hỗ trợ filter theo entity)
- File ownership giữa phase 03 (web-seller) và phase 04 (web-admin): TÁCH BIỆT 100% vì 2 app khác nhau
