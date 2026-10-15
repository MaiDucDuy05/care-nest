/**
 * Local type extensions for web-admin.
 * Shared-types covers all branded IDs and entities.
 */

// Re-export useful types for convenience
export type {
  AuthUser,
  KycDocumentAdmin,
  KycDetailResponse,
  ProductAdmin,
  ProductDetailResponse,
  UserAdmin,
  UserDetailResponse,
  OrderAdmin,
  OrderDetailResponse,
  AlertAdmin,
  AlertDetailResponse,
  AuditEventAdmin,
  AuditListResponse,
  SubscriptionAdmin,
  SubscriptionDetailResponse,
  MrrResponse,
  ChurnResponse,
  PlanDistributionResponse,
  ProviderHealth,
  ProviderHealthResponse,
  ShipmentAdmin,
  ShipmentDetailResponse,
  FailoverEvent,
  FailoverEventsResponse,
  PaginatedResponse,
} from '@/lib/api-client';

export type { AuditFilters } from '@/lib/hooks/use-audit-filter';
