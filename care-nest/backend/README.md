# `backend/` — NestJS back-end microservices

NestJS-based microservices. Each service is a self-contained TypeScript
package with its own `package.json`, Dockerfile, and Helm chart (under
`infrastructure/k8s/<service>/`).

| Folder                | Owner          | Status |
| --------------------- | -------------- | ------ |
| `auth-service/`       | auth team      | Phase 1 |
| `catalog-service/`    | catalog team   | Phase 1 |
| `order-service/`      | order team     | Phase 2 |
| `payment-service/`    | payments team  | Phase 2 |
| `inventory-service/`  | inventory team | Phase 2 |
| `notification-service/`| platform     | Phase 3 |
| `health-service/`     | iot team       | Phase 3 |
| `analytics-service/`  | data team      | Phase 4 |
| `alert-engine/`       | iot team       | Phase 3 |
| `device-service/`     | iot team       | Phase 1 |
| `iot-gateway/`        | iot team       | Phase 1 |

Phase 0 only ships the folder. Real services will be added in their
target phases per the implementation plan.
