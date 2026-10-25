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
    requiresImei: true,
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
    requiresImei: false,
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
  requiresImei?: boolean;
}

type CatalogProduct = Omit<Product, 'priceVnd' | 'stock'> & {
  priceVnd?: number | string | null;
  basePrice?: number | string | null;
  stock?: number | string | null;
  inventory?: Array<{ quantity: number; reserved: number }>;
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
    priceVnd: Number.isFinite(priceVnd) ? priceVnd : 0,
    stock: Number.isFinite(stock) ? stock : 0,
  };
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
    const res = await apiFetch<ProductListResponse>(
      `${CATALOG_API}/api/v1/products?${query.toString()}`,
      { token }
    );
    return res.items.map(toSellerProduct);
  },

  async getById(id: string): Promise<Product> {
    if (USE_MOCK) {
      const found = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!found) throw new Error('product not found');
      return found;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/products/${id}`, { token });
    return toSellerProduct(product);
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
    const { priceVnd, ...productInput } = input;
    const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/products`, {
      method: 'POST',
      body: JSON.stringify({ ...productInput, price: priceVnd }),
      token,
    });
    return toSellerProduct(product);
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
    const { priceVnd, ...productInput } = input;
    const product = await apiFetch<CatalogProduct>(`${CATALOG_API}/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...productInput,
        ...(priceVnd === undefined ? {} : { price: priceVnd }),
      }),
      token,
    });
    return toSellerProduct(product);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.id !== id);
      return;
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch<void>(`${CATALOG_API}/api/v1/products/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
