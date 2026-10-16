/**
 * Local types for the seller portal. Backend entities will eventually move
 * to @carenest/shared-types; for now we keep these colocated with the front-end
 * to avoid forcing a shared-types release.
 */

export type KYCStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'MISSING_DOCS';

export interface KYCDocument {
  id: string;
  type: 'BUSINESS_LICENSE' | 'ID_FRONT' | 'ID_BACK' | 'TAX_CERT' | 'OTHER';
  url: string;
  fileName?: string;
  uploadedAt: string;
}

export interface KYCApplication {
  id: string;
  sellerId: string;
  status: KYCStatus;
  businessName: string;
  taxId: string;
  businessAddress: string;
  businessType: string;
  businessPhone: string;
  licenseNumber: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  documents: KYCDocument[];
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  priceVnd: number;
  categoryId: string;
  categoryName?: string;
  stock: number;
  status: ProductStatus;
  requiresImei?: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceVnd: number;
  imeis: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  status: OrderStatus;
  totalVnd: number;
  items: OrderItem[];
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export type IMEIStatus = 'IN_STOCK' | 'RESERVED' | 'SHIPPED' | 'ACTIVATED' | 'RETURNED' | 'FAULTY';

export interface IMEIRecord {
  id: string;
  imei: string;
  productId: string;
  productName?: string;
  status: IMEIStatus;
  orderId?: string | null;
  orderItemId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  revenueVnd: number;
  ordersCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  soldCount: number;
  revenueVnd: number;
}

export interface AnalyticsSummary {
  rangeDays: number;
  totalRevenueVnd: number;
  ordersCount: number;
  averageOrderVnd: number;
  daily: DailyRevenue[];
  topProducts: TopProduct[];
}

export interface SellerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'SELLER' | 'ADMIN' | 'USER';
  kycStatus: KYCStatus;
  storeName: string;
  storeSlug: string;
  description: string;
  createdAt: string;
}

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';

export interface Payout {
  id: string;
  sellerId: string;
  amountVnd: number;
  status: PayoutStatus;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  transferRef?: string | null;
  failureReason?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  paidAt?: string | null;
}

export interface SellerWallet {
  balanceVnd: number;
  pendingVnd: number;
  lifetimeVnd: number;
  currency: string;
}
