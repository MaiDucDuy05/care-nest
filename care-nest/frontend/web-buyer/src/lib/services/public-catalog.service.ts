/**
 * Public catalog service. Unauthenticated reads against the
 * catalog-service /api/v1/public/* endpoints. No PII, no tokens.
 */

import { CATALOG_API } from '../api-client';

export interface PublicSeller {
  id: string;
  storeName: string;
  storeSlug: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  images: { url: string; alt: string | null }[];
  category?: { id: string; name: string; slug: string };
  seller?: { id: string; storeName: string; storeSlug: string; ratingAvg: number };
  description?: string;
  isMedical: boolean;
  isIotDevice: boolean;
  stock?: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  updatedAt?: string;
}

export interface PublicStorefront {
  seller: PublicSeller;
  products: PublicProduct[];
  total: number;
  hasMore: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CATALOG_API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    // Always revalidate server-rendered pages so SEO content stays fresh
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const publicCatalogService = {
  /**
   * Paginated list of public products. Mirrors the catalog-service
   * /api/v1/products shape.
   */
  listProducts: async (params?: {
    search?: string;
    categoryId?: string;
    sellerId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<PublicProduct>> => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.sellerId) query.set('sellerId', params.sellerId);
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', String(params?.pageSize ?? 20));
    return get<Paginated<PublicProduct>>(`/api/v1/products?${query.toString()}`);
  },

  getProduct: async (idOrSlug: string): Promise<PublicProduct> =>
    get<PublicProduct>(`/api/v1/public/products/${encodeURIComponent(idOrSlug)}`),

  getSeller: async (slug: string): Promise<PublicSeller> =>
    get<PublicSeller>(`/api/v1/public/sellers/${encodeURIComponent(slug)}`),

  getStorefront: async (slug: string, page = 1, pageSize = 20): Promise<PublicStorefront> => {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('pageSize', String(pageSize));
    return get<PublicStorefront>(
      `/api/v1/public/sellers/${encodeURIComponent(slug)}/storefront?${query.toString()}`
    );
  },

  /**
   * For sitemap generation. Returns lightweight id/slug lists.
   */
  sitemapSellers: async (): Promise<{ slug: string; updatedAt: string }[]> =>
    get(`/api/v1/public/sitemap/sellers`),

  sitemapProducts: async (): Promise<{ id: string; updatedAt: string }[]> =>
    get(`/api/v1/public/sitemap/products`),
};
