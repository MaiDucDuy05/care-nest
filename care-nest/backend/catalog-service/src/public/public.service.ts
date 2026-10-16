import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, Prisma } from '@carenest/database';

export interface PublicSeller {
  id: string;
  storeName: string;
  storeSlug: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface PublicStorefront {
  seller: PublicSeller;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    compareAtPrice: number | null;
    images: { url: string; alt: string | null }[];
    isMedical: boolean;
    isIotDevice: boolean;
  }>;
  total: number;
  hasMore: boolean;
}

@Injectable()
export class PublicService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Public-facing seller info. Only ACTIVE + KYC-approved sellers are
   * returned. Excludes bank info, tax ID, personal details.
   */
  async getSellerBySlug(slug: string): Promise<PublicSeller> {
    const seller = await this.prisma.seller.findFirst({
      where: {
        storeSlug: slug,
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        deletedAt: null,
      },
      select: {
        id: true,
        storeName: true,
        storeSlug: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    });
    if (!seller) {
      throw new NotFoundException(`Không tìm thấy cửa hàng "${slug}"`);
    }
    return {
      id: seller.id,
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      ratingAvg: Number(seller.ratingAvg),
      ratingCount: seller.ratingCount,
      createdAt: seller.createdAt.toISOString(),
    };
  }

  /**
   * List a seller's products for their public storefront. Only
   * ACTIVE products are returned.
   */
  async getStorefront(slug: string, page: number, pageSize: number): Promise<PublicStorefront> {
    const seller = await this.getSellerBySlug(slug);
    const skip = (page - 1) * pageSize;
    const where: Prisma.ProductWhereInput = {
      sellerId: seller.id,
      status: 'ACTIVE',
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            select: { url: true, altText: true },
            orderBy: { position: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      seller,
      products: items.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: Number(p.basePrice),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        images: p.images.map((i) => ({ url: i.url, alt: i.altText })),
        isMedical: p.isMedical,
        isIotDevice: p.isIotDevice,
      })),
      total,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Slugs for sitemap generation. Lightweight — no joins, only ACTIVE
   * sellers + products.
   */
  async listAllSellerSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    const rows = await this.prisma.seller.findMany({
      where: { status: 'ACTIVE', kycStatus: 'APPROVED', deletedAt: null },
      select: { storeSlug: true, updatedAt: true },
    });
    return rows.map((r) => ({ slug: r.storeSlug, updatedAt: r.updatedAt.toISOString() }));
  }

  async listAllProductIds(): Promise<{ id: string; updatedAt: string }[]> {
    const rows = await this.prisma.product.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, updatedAt: true },
    });
    return rows.map((r) => ({ id: r.id, updatedAt: r.updatedAt.toISOString() }));
  }
}
