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

const DEMO_STOREFRONTS: Record<string, PublicStorefront> = {
  'medtech-vietnam': {
    seller: {
      id: 'seller-medtech-01',
      storeName: 'MedTech Healthcare Vietnam',
      storeSlug: 'medtech-vietnam',
      ratingAvg: 4.88,
      ratingCount: 128,
      createdAt: '2023-03-15T08:00:00.000Z',
    },
    products: [
      {
        id: 'prod-omron-7361t',
        name: 'Máy Đo Huyết Áp Bắp Tay Omron HEM-7361T (Bluetooth & Cảnh Báo Rung Nhĩ AFib)',
        slug: 'may-do-huyet-ap-bap-tay-omron-hem-7361t-bluetooth',
        basePrice: 1750000,
        compareAtPrice: 2100000,
        images: [{ url: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80', alt: 'Máy Đo Huyết Áp Omron' }],
        category: { id: 'cat-bp', name: 'Máy Đo Huyết Áp & Tim Mạch', slug: 'may-do-huyet-ap' },
        description: 'Máy đo huyết áp tự động số 1 Nhật Bản, tính năng cảnh báo rung nhĩ AFib sớm phòng ngừa đột quỵ, đồng bộ dữ liệu chỉ số huyết áp vào app CareNest 24/7.',
        isMedical: true,
        isIotDevice: true,
        stock: 65,
        status: 'ACTIVE',
      },
      {
        id: 'prod-sos-button-4g',
        name: 'Nút Bấm Cấp Cứu Khẩn Cấp 4G CareNest Home SOS (Chống Nước IP67)',
        slug: 'nut-bam-cap-cuu-khan-cap-4g-carenest-home-sos',
        basePrice: 650000,
        compareAtPrice: 850000,
        images: [{ url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', alt: 'Nút Bấm SOS CareNest' }],
        category: { id: 'cat-sos', name: 'Thiết Bị Cấp Cứu & SOS IoT', slug: 'thiet-bi-cap-cuu' },
        description: 'Nút bấm SOS không dây chống nước chuẩn IP67, gắn phòng ngủ hoặc phòng tắm. 1 chạm gọi cứu hộ lập tức tới 3 số người thân và gửi vị trí qua SMS & App.',
        isMedical: false,
        isIotDevice: true,
        stock: 120,
        status: 'ACTIVE',
      },
      {
        id: 'prod-radar-caresense',
        name: 'Cảm Biến Giường Ngủ Radar Giám Sát Nhịp Thở Không Chạm CareSense 60GHz',
        slug: 'cam-bien-giuong-ngu-radar-giam-sat-nhip-tho-khong-cham-caresense',
        basePrice: 3200000,
        compareAtPrice: 3800000,
        images: [{ url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80', alt: 'Radar CareSense' }],
        category: { id: 'cat-radar', name: 'Cảm Biến Không Chạm AI', slug: 'cam-bien-ai' },
        description: 'Công nghệ Radar sóng milimet 60GHz gắn trần hoặc đầu giường, giám sát liên tục nhịp tim, nhịp thở, trở mình và cảnh báo rời giường quá lâu mà không cần tiếp xúc.',
        isMedical: false,
        isIotDevice: true,
        stock: 25,
        status: 'ACTIVE',
      },
      {
        id: 'prod-beurer-po30',
        name: 'Máy Đo Nồng Độ Oxy Trong Máu SpO2 Beurer PO30 (Nhập Khẩu Đức)',
        slug: 'may-do-nong-do-oxy-trong-mau-spo2-beurer-po30',
        basePrice: 890000,
        compareAtPrice: 1150000,
        images: [{ url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&q=80', alt: 'Máy Đo SpO2 Beurer' }],
        category: { id: 'cat-respiratory', name: 'Thiết Bị Hô Hấp', slug: 'thiet-bi-ho-hap' },
        description: 'Máy kẹp ngón đo nồng độ bão hòa oxy trong máu và nhịp tim nhập khẩu Đức. Độ nhạy cao, màn hình màu hiển thị đồ thị nhịp tim trực quan.',
        isMedical: true,
        isIotDevice: false,
        stock: 90,
        status: 'ACTIVE',
      },
      {
        id: 'prod-microlife-nc200',
        name: 'Nhiệt Kế Điện Tử Hồng Ngoại Đo Trán Microlife NC200 (Thụy Sĩ)',
        slug: 'nhiet-ke-dien-tu-hong-ngoai-do-tran-microlife-nc200',
        basePrice: 790000,
        compareAtPrice: 990000,
        images: [{ url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', alt: 'Nhiệt Kế Microlife' }],
        category: { id: 'cat-temp', name: 'Nhiệt Kế Điện Tử', slug: 'nhiet-ke-dien-tu' },
        description: 'Đo nhiệt độ trán không tiếp xúc trong 1 giây, cảm biến định vị khoảng cách tự động, bộ nhớ 30 lần đo, đèn báo sốt Silent Glow độc quyền.',
        isMedical: true,
        isIotDevice: false,
        stock: 110,
        status: 'ACTIVE',
      },
      {
        id: 'prod-yuwell-7f-5d',
        name: 'Máy Tạo Oxy Y Tế Gia Đình Yuwell 7F-5D (5 Lít/Phút Chuẩn Bệnh Viện)',
        slug: 'may-tao-oxy-y-te-gia-dinh-yuwell-7f-5d',
        basePrice: 9850000,
        compareAtPrice: 11500000,
        images: [{ url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80', alt: 'Máy Tạo Oxy Yuwell' }],
        category: { id: 'cat-respiratory', name: 'Thiết Bị Hô Hấp', slug: 'thiet-bi-ho-hap' },
        description: 'Cung cấp nguồn oxy y tế tinh khiết 93% ± 3% liên tục 24/24 cho bệnh nhân tại nhà, tích hợp chức năng xông khí dung và cảnh báo áp suất thấp.',
        isMedical: true,
        isIotDevice: false,
        stock: 18,
        status: 'ACTIVE',
      },
    ],
    total: 6,
    hasMore: false,
  },
  'wonlex-vietnam': {
    seller: {
      id: 'seller-wonlex-02',
      storeName: 'Wonlex Vietnam Official Store',
      storeSlug: 'wonlex-vietnam',
      ratingAvg: 4.95,
      ratingCount: 340,
      createdAt: '2022-11-10T08:00:00.000Z',
    },
    products: [
      {
        id: 'prod-wonlex-kt17',
        name: 'Đồng Hồ Định Vị & Cảnh Báo Té Ngã SOS Wonlex KT17 4G',
        slug: 'dong-ho-dinh-vi-canh-bao-te-nga-sos-wonlex-kt17-4g',
        basePrice: 1850000,
        compareAtPrice: 2200000,
        images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Wonlex KT17' }],
        category: { id: 'cat-smart', name: 'Thiết Bị Định Vị & SOS', slug: 'thiet-bi-dinh-vi' },
        description: 'Đồng hồ thông minh 4G chuyên biệt cho người lớn tuổi và trẻ nhỏ, tích hợp chip GPS siêu nhạy, cảm biến đo nhịp tim, huyết áp và nút gọi khẩn cấp SOS.',
        isMedical: false,
        isIotDevice: true,
        stock: 85,
        status: 'ACTIVE',
      },
    ],
    total: 1,
    hasMore: false,
  },
};

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
    try {
      return await get<Paginated<PublicProduct>>(`/api/v1/products?${query.toString()}`);
    } catch {
      // Fallback: return mock products list
      const allProds = Object.values(DEMO_STOREFRONTS).flatMap((s) => s.products);
      return {
        items: allProds,
        total: allProds.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      };
    }
  },

  getProduct: async (idOrSlug: string): Promise<PublicProduct> => {
    try {
      return await get<PublicProduct>(`/api/v1/public/products/${encodeURIComponent(idOrSlug)}`);
    } catch {
      const allProds = Object.values(DEMO_STOREFRONTS).flatMap((s) => s.products);
      const match = allProds.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
      if (match) return match;
      return allProds[0];
    }
  },

  getSeller: async (slug: string): Promise<PublicSeller> => {
    try {
      return await get<PublicSeller>(`/api/v1/public/sellers/${encodeURIComponent(slug)}`);
    } catch (err) {
      if (DEMO_STOREFRONTS[slug]) {
        return DEMO_STOREFRONTS[slug].seller;
      }
      throw err;
    }
  },

  getStorefront: async (slug: string, page = 1, pageSize = 20): Promise<PublicStorefront> => {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('pageSize', String(pageSize));
    try {
      return await get<PublicStorefront>(
        `/api/v1/public/sellers/${encodeURIComponent(slug)}/storefront?${query.toString()}`
      );
    } catch (err) {
      if (DEMO_STOREFRONTS[slug]) {
        return DEMO_STOREFRONTS[slug];
      }
      throw err;
    }
  },

  /**
   * For sitemap generation. Returns lightweight id/slug lists.
   */
  sitemapSellers: async (): Promise<{ slug: string; updatedAt: string }[]> => {
    try {
      return await get(`/api/v1/public/sitemap/sellers`);
    } catch {
      return [{ slug: 'medtech-vietnam', updatedAt: new Date().toISOString() }];
    }
  },

  sitemapProducts: async (): Promise<{ id: string; updatedAt: string }[]> => {
    try {
      return await get(`/api/v1/public/sitemap/products`);
    } catch {
      return [{ id: 'prod-omron-7361t', updatedAt: new Date().toISOString() }];
    }
  },
};
