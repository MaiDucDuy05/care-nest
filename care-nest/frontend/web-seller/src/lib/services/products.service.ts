import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { Product, ProductStatus } from '../types';

export interface ProductInput {
  name: string;
  description?: string;
  brand?: string;
  sku: string;
  priceVnd: number;
  categoryId: string;
  stock: number;
  status?: ProductStatus;
  requiresImei?: boolean;
  images?: string[];
}

type CatalogProduct = Omit<Product, 'priceVnd' | 'stock' | 'images'> & {
  priceVnd?: number | string | null;
  basePrice?: number | string | null;
  stock?: number | string | null;
  inventory?: Array<{ quantity: number; reserved: number }>;
  images?: Array<string | { url: string }> | null;
};

interface ProductListResponse {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function toSellerProduct(product: CatalogProduct): Product {
  const rawPrice = product.priceVnd ?? product.basePrice;
  const priceVnd = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
  const rawStock = product.stock ?? product.inventory?.reduce(
    (total, row) => total + Math.max(0, row.quantity - row.reserved),
    0,
  );
  const stock = typeof rawStock === 'number' ? rawStock : Number(rawStock ?? 0);

  return {
    ...product,
    images: (product.images ?? []).map((image) => typeof image === 'string' ? image : image.url),
    priceVnd: Number.isFinite(priceVnd) ? priceVnd : 0,
    stock: Number.isFinite(stock) ? stock : 0,
  };
}

export const productsService = {
  async list(params?: { search?: string; status?: ProductStatus; sellerId?: string }): Promise<Product[]> {
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.sellerId) query.set('sellerId', params.sellerId);

    // Call dedicated seller products endpoint
    try {
      const res = await apiFetch<ProductListResponse>(
        `${CATALOG_API}/api/v1/seller/products?${query.toString()}`,
        { token }
      );
      if (res && Array.isArray(res.items)) {
        return res.items.map(toSellerProduct);
      }
    } catch {
      // Fallback to /api/v1/products/seller
      try {
        const res = await apiFetch<ProductListResponse>(
          `${CATALOG_API}/api/v1/products/seller?${query.toString()}`,
          { token }
        );
        if (res && Array.isArray(res.items)) {
          return res.items.map(toSellerProduct);
        }
      } catch {
        // Fallback to /api/v1/products?sellerId=...
      }
    }

    const res = await apiFetch<ProductListResponse>(
      `${CATALOG_API}/api/v1/products?${query.toString()}`,
      { token }
    );
    return (res?.items || []).map(toSellerProduct);
  },

  async getById(id: string): Promise<Product> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/seller/products/${id}`, { token });
    return toSellerProduct(product);
  },

  async create(input: ProductInput): Promise<Product> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const { priceVnd, ...productInput } = input;
    try {
      const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/seller/products`, {
        method: 'POST',
        body: JSON.stringify({ ...productInput, price: priceVnd }),
        token,
      });
      return toSellerProduct(product);
    } catch {
      const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/products/seller`, {
        method: 'POST',
        body: JSON.stringify({ ...productInput, price: priceVnd }),
        token,
      });
      return toSellerProduct(product);
    }
  },

  async uploadImage(file: File): Promise<string> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiFetch<{ url: string }>(`${CATALOG_API}/api/v1/seller/products/images`, {
      method: 'POST',
      body: formData,
      token,
    });
    return result.url;
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const { priceVnd, ...productInput } = input;
    try {
      const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/seller/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...productInput,
          ...(priceVnd === undefined ? {} : { price: priceVnd }),
        }),
        token,
      });
      return toSellerProduct(product);
    } catch {
      const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/products/seller/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...productInput,
          ...(priceVnd === undefined ? {} : { price: priceVnd }),
        }),
        token,
      });
      return toSellerProduct(product);
    }
  },

  async remove(id: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    try {
      return await apiFetch<void>(`${CATALOG_API}/api/v1/seller/products/${id}`, {
        method: 'DELETE',
        token,
      });
    } catch {
      return await apiFetch<void>(`${CATALOG_API}/api/v1/products/seller/${id}`, {
        method: 'DELETE',
        token,
      });
    }
  },
};
