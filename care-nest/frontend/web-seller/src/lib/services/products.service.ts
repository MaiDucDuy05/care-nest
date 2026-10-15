import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { Product, ProductStatus } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

let MOCK_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    sellerId: 'seller-mock-1',
    name: 'Máy đo huyết áp Omron HEM-7156T',
    slug: 'may-do-huyet-ap-omron',
    description: 'Máy đo huyết áp bắp tay Bluetooth, chính hãng Omron',
    sku: 'OMR-7156T',
    priceVnd: 2490000,
    categoryId: 'cat-1',
    categoryName: 'Máy đo huyết áp',
    stock: 25,
    status: 'ACTIVE' as ProductStatus,
    images: [],
    createdAt: '2025-10-15T10:00:00Z',
    updatedAt: '2025-10-15T10:00:00Z',
  },
  {
    id: 'p-2',
    sellerId: 'seller-mock-1',
    name: 'Nhiệt kế điện tử Microlife MT 550',
    slug: 'nhiet-ke-microlife-550',
    description: 'Nhiệt kế đo trán hồng ngoại, đo trong 3 giây',
    sku: 'MIC-MT550',
    priceVnd: 890000,
    categoryId: 'cat-2',
    categoryName: 'Nhiệt kế',
    stock: 3,
    status: 'ACTIVE' as ProductStatus,
    images: [],
    createdAt: '2025-10-15T10:00:00Z',
    updatedAt: '2025-10-15T10:00:00Z',
  },
];

export interface ProductInput {
  name: string;
  description?: string;
  sku: string;
  priceVnd: number;
  categoryId: string;
  stock: number;
  status: ProductStatus;
}

export const productsService = {
  async list(params?: { search?: string; status?: ProductStatus }): Promise<Product[]> {
    if (USE_MOCK) {
      let result = [...MOCK_PRODUCTS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
      }
      if (params?.status) result = result.filter((p) => p.status === params.status);
      return result;
    }
    const token = getToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return apiFetch<Product[]>(`${CATALOG_API}/api/v1/seller/products?${query.toString()}`, { token });
  },

  async getById(id: string): Promise<Product> {
    if (USE_MOCK) {
      const found = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!found) throw new Error('product not found');
      return found;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Product>(`${CATALOG_API}/api/v1/seller/products/${id}`, { token });
  },

  async create(input: ProductInput): Promise<Product> {
    if (USE_MOCK) {
      const now = new Date().toISOString();
      const created: Product = {
        id: 'p-' + Date.now(),
        sellerId: 'seller-mock-1',
        ...input,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        images: [],
        createdAt: now,
        updatedAt: now,
      };
      MOCK_PRODUCTS = [created, ...MOCK_PRODUCTS];
      return created;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Product>(`${CATALOG_API}/api/v1/seller/products`, {
      method: 'POST',
      body: JSON.stringify(input),
      token,
    });
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    if (USE_MOCK) {
      const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('product not found');
      MOCK_PRODUCTS[idx] = { ...MOCK_PRODUCTS[idx], ...input, updatedAt: new Date().toISOString() };
      return MOCK_PRODUCTS[idx];
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<Product>(`${CATALOG_API}/api/v1/seller/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
      token,
    });
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.id !== id);
      return;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<void>(`${CATALOG_API}/api/v1/seller/products/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
