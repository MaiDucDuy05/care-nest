/**
 * Admin API client — wraps HTTP calls to all backend microservices.
 */

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
const CATALOG_API = process.env.NEXT_PUBLIC_CATALOG_API_URL || 'http://localhost:3002';
const ALERT_API = process.env.NEXT_PUBLIC_ALERT_API_URL || 'http://localhost:3007';
const SUBSCRIPTION_API = process.env.NEXT_PUBLIC_SUBSCRIPTION_API_URL || 'http://localhost:3008';
const SHIPPING_API = process.env.NEXT_PUBLIC_SHIPPING_API_URL || 'http://localhost:3009';

function authHeaders(token?: string) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}`, 'X-Admin-Token': token } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  auth: {
    async login(credentials: { email: string; password: string }) {
      const res = await fetch(`${AUTH_API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return handleResponse<{ token: string; user: AuthUser }>(res);
    },
    async me(token: string) {
      const res = await fetch(`${AUTH_API}/api/v1/auth/me`, {
        headers: authHeaders(token),
      });
      return handleResponse<AuthUser>(res);
    },
    async refresh(token: string) {
      const res = await fetch(`${AUTH_API}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      return handleResponse<{ token: string }>(res);
    },
  },

  kyc: {
    async listPending(params?: { page?: number; limit?: number }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      const res = await fetch(`${CATALOG_API}/api/v1/kyc/admin/pending?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<KycListResponse>(res);
    },
    async getById(sellerId: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/kyc/admin/${sellerId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<KycDetailResponse>(res);
    },
    async approve(sellerId: string, reason?: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/kyc/admin/${sellerId}/approve`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ reason }),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    async reject(sellerId: string, reason: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/kyc/admin/${sellerId}/reject`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ reason }),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    async lock(sellerId: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/kyc/admin/${sellerId}/lock`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      return handleResponse<{ lockExpiresAt: string }>(res);
    },
  },

  products: {
    async listPending(params?: { page?: number; limit?: number; search?: string }) {
      const q = new URLSearchParams();
      q.set('status', 'PENDING_REVIEW');
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.search) q.set('search', params.search);
      const res = await fetch(`${CATALOG_API}/api/v1/products/admin?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<ProductListResponse>(res);
    },
    async getById(productId: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/products/admin/${productId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<ProductDetailResponse>(res);
    },
    async approve(productId: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/products/admin/${productId}/approve`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    async reject(productId: string, reason: string, token?: string) {
      const res = await fetch(`${CATALOG_API}/api/v1/products/admin/${productId}/reject`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ reason }),
      });
      return handleResponse<{ success: boolean }>(res);
    },
  },

  users: {
    async list(params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
    }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.search) q.set('search', params.search);
      if (params?.role) q.set('role', params.role);
      if (params?.status) q.set('status', params.status);
      const res = await fetch(`${AUTH_API}/api/v1/users/admin?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<UserListResponse>(res);
    },
    async getById(userId: string, token?: string) {
      const res = await fetch(`${AUTH_API}/api/v1/users/admin/${userId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<UserDetailResponse>(res);
    },
    async suspend(userId: string, reason: string, token?: string) {
      const res = await fetch(`${AUTH_API}/api/v1/users/admin/${userId}/suspend`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ reason }),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    async unsuspend(userId: string, token?: string) {
      const res = await fetch(`${AUTH_API}/api/v1/users/admin/${userId}/unsuspend`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    async updateRole(userId: string, role: string, token?: string) {
      const res = await fetch(`${AUTH_API}/api/v1/users/admin/${userId}/role`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ role }),
      });
      return handleResponse<{ success: boolean }>(res);
    },
  },

  orders: {
    async list(params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      from?: string;
      to?: string;
    }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.search) q.set('search', params.search);
      if (params?.status) q.set('status', params.status);
      if (params?.from) q.set('from', params.from);
      if (params?.to) q.set('to', params.to);
      const res = await fetch(`${AUTH_API}/api/v1/orders/admin?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<OrderListResponse>(res);
    },
    async getById(orderId: string, token?: string) {
      const res = await fetch(`${AUTH_API}/api/v1/orders/admin/${orderId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<OrderDetailResponse>(res);
    },
    async refund(orderId: string, reason: string, token?: string) {
      const res = await fetch(`${AUTH_API}/api/v1/orders/admin/${orderId}/refund`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ reason }),
      });
      return handleResponse<{ success: boolean }>(res);
    },
  },

  alerts: {
    async list(params?: {
      page?: number;
      limit?: number;
      severity?: string;
      type?: string;
      status?: string;
    }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.severity) q.set('severity', params.severity);
      if (params?.type) q.set('type', params.type);
      if (params?.status) q.set('status', params.status);
      const res = await fetch(`${ALERT_API}/api/v1/alerts/admin?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<AlertListResponse>(res);
    },
    async getById(alertId: string, token?: string) {
      const res = await fetch(`${ALERT_API}/api/v1/alerts/admin/${alertId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<AlertDetailResponse>(res);
    },
    async ack(alertId: string, token?: string) {
      const res = await fetch(`${ALERT_API}/api/v1/alerts/admin/${alertId}/ack`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      return handleResponse<{ success: boolean }>(res);
    },
    async resolve(alertId: string, token?: string) {
      const res = await fetch(`${ALERT_API}/api/v1/alerts/admin/${alertId}/resolve`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      return handleResponse<{ success: boolean }>(res);
    },
  },

  audit: {
    async list(params?: {
      page?: number;
      limit?: number;
      actor?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      from?: string;
      to?: string;
    }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.actor) q.set('actor', params.actor);
      if (params?.action) q.set('action', params.action);
      if (params?.entityType) q.set('entityType', params.entityType);
      if (params?.entityId) q.set('entityId', params.entityId);
      if (params?.from) q.set('from', params.from);
      if (params?.to) q.set('to', params.to);
      const res = await fetch(`${AUTH_API}/api/v1/audit?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<AuditListResponse>(res);
    },
    async getByEntity(entityType: string, entityId: string, token?: string) {
      const res = await fetch(
        `${AUTH_API}/api/v1/audit/entity/${entityType}/${entityId}`,
        { headers: authHeaders(token) },
      );
      return handleResponse<AuditListResponse>(res);
    },
  },

  subscriptions: {
    async list(params?: { page?: number; limit?: number; status?: string }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.status) q.set('status', params.status);
      const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/admin?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<SubscriptionListResponse>(res);
    },
    async getById(subId: string, token?: string) {
      const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/admin/${subId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<SubscriptionDetailResponse>(res);
    },
    async mrr() {
      const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/admin/mrr`, {
        headers: authHeaders(),
      });
      return handleResponse<MrrResponse>(res);
    },
    async churn() {
      const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/admin/churn`, {
        headers: authHeaders(),
      });
      return handleResponse<ChurnResponse>(res);
    },
    async planDistribution() {
      const res = await fetch(`${SUBSCRIPTION_API}/api/v1/subscriptions/admin/distribution`, {
        headers: authHeaders(),
      });
      return handleResponse<PlanDistributionResponse>(res);
    },
  },

  shipping: {
    async listProviders(token?: string) {
      const res = await fetch(`${SHIPPING_API}/api/v1/shipments/admin/providers`, {
        headers: authHeaders(token),
      });
      return handleResponse<ProviderHealthResponse>(res);
    },
    async listShipments(params?: {
      page?: number;
      limit?: number;
      status?: string;
      carrier?: string;
      search?: string;
    }) {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit ?? 50));
      if (params?.status) q.set('status', params.status);
      if (params?.carrier) q.set('carrier', params.carrier);
      if (params?.search) q.set('search', params.search);
      const res = await fetch(`${SHIPPING_API}/api/v1/shipments/admin?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<ShipmentListResponse>(res);
    },
    async getById(shipmentId: string, token?: string) {
      const res = await fetch(`${SHIPPING_API}/api/v1/shipments/admin/${shipmentId}`, {
        headers: authHeaders(token),
      });
      return handleResponse<ShipmentDetailResponse>(res);
    },
    async listFailoverEvents(params?: { limit?: number }) {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit ?? 100));
      const res = await fetch(`${SHIPPING_API}/api/v1/shipments/admin/failover?${q}`, {
        headers: authHeaders(),
      });
      return handleResponse<FailoverEventsResponse>(res);
    },
  },
};

// ── Shared types ──────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SUPPORT' | 'MEDICAL_REVIEWER' | 'USER' | 'SELLER';
  avatarUrl?: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KycListResponse extends PaginatedResponse<KycDocumentAdmin> {}
export interface KycDocumentAdmin {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  type: string;
  status: string;
  filename?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KycDetailResponse {
  seller: { id: string; fullName: string; email: string; phone?: string };
  documents: KycDocumentAdmin[];
  lockedBy?: string;
  lockExpiresAt?: string;
}

export interface ProductListResponse extends PaginatedResponse<ProductAdmin> {}
export interface ProductAdmin {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  category: string;
  priceVnd: number;
  status: string;
  images: string[];
  createdAt: string;
}

export interface ProductDetailResponse extends ProductAdmin {
  description?: string;
  specifications?: Record<string, string>;
  documents?: string[];
}

export interface UserListResponse extends PaginatedResponse<UserAdmin> {}
export interface UserAdmin {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  totalOrders?: number;
  totalSpentVnd?: number;
}

export interface UserDetailResponse extends UserAdmin {
  orders?: { id: string; totalVnd: number; status: string; createdAt: string }[];
  subscriptions?: { id: string; planName: string; status: string }[];
  alerts?: { id: string; severity: string; message: string; createdAt: string }[];
}

export interface OrderListResponse extends PaginatedResponse<OrderAdmin> {}
export interface OrderAdmin {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: string;
  totalVnd: number;
  paymentMethod: string;
  createdAt: string;
}

export interface OrderDetailResponse extends OrderAdmin {
  updatedAt: string;
  items: { productId: string; name: string; quantity: number; unitPriceVnd: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  timeline: { status: string; timestamp: string }[];
  shipmentId?: string;
}

export interface AlertListResponse extends PaginatedResponse<AlertAdmin> {}
export interface AlertAdmin {
  id: string;
  type: string;
  severity: string;
  message: string;
  userId?: string;
  userName?: string;
  deviceId?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertDetailResponse extends AlertAdmin {
  metadata?: Record<string, unknown>;
  resolvedBy?: string;
}

export interface AuditListResponse extends PaginatedResponse<AuditEventAdmin> {}
export interface AuditEventAdmin {
  id: string;
  userId: string;
  actorEmail: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface SubscriptionListResponse extends PaginatedResponse<SubscriptionAdmin> {}
export interface SubscriptionAdmin {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  interval: string;
  status: string;
  priceVnd: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
}

export interface SubscriptionDetailResponse extends SubscriptionAdmin {
  reminders?: { id: string; kind: string; triggerAt: string }[];
}

export interface MrrResponse {
  current: number;
  previous: number;
  trend: number; // percentage
  history: { month: string; mrr: number }[];
}

export interface ChurnResponse {
  current: number; // percentage
  previous: number;
  trend: number;
  history: { month: string; rate: number }[];
}

export interface PlanDistributionResponse {
  distribution: { planId: string; planName: string; count: number; revenueVnd: number }[];
}

export interface ProviderHealth {
  code: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  lastHeartbeat: string;
  successRate: number;
}

export interface ProviderHealthResponse {
  providers: ProviderHealth[];
}

export interface ShipmentListResponse extends PaginatedResponse<ShipmentAdmin> {}
export interface ShipmentAdmin {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  carrierCode: string;
  trackingNumber?: string;
  status: string;
  shippingFeeVnd: number;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface ShipmentDetailResponse extends ShipmentAdmin {
  items: { productId: string; name: string; quantity: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    ward?: string;
    district?: string;
    province?: string;
  };
}

export interface FailoverEvent {
  id: string;
  fromProvider: string;
  toProvider: string;
  reason: string;
  shipmentId: string;
  autoSwitched: boolean;
  createdAt: string;
}

export interface FailoverEventsResponse {
  events: FailoverEvent[];
}

export { AUTH_API, CATALOG_API, ALERT_API, SUBSCRIPTION_API, SHIPPING_API };
