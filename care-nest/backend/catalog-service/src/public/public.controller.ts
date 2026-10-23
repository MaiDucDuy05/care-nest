import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service.js';
import { ProductsService } from '../products/products.service.js';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly productsService: ProductsService
  ) {}

  @Get('sellers/:slug')
  async getSeller(@Param('slug') slug: string) {
    return this.publicService.getSellerBySlug(slug);
  }

  @Get('sellers/:slug/storefront')
  async getStorefront(
    @Param('slug') slug: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    return this.publicService.getStorefront(slug, p, ps);
  }

  @Get('products/:idOrSlug')
  async getProduct(@Param('idOrSlug') idOrSlug: string) {
    // Try by id (UUID); fall back to slug
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    if (isUuid) {
      return this.productsService.getProductById(idOrSlug);
    }
    // slug lookup
    const { getPrismaClient } = await import('@carenest/database');
    const prisma = getPrismaClient();
    const product = await prisma.product.findFirst({
      where: { slug: idOrSlug, status: 'ACTIVE', deletedAt: null },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        seller: { select: { id: true, storeName: true, storeSlug: true, ratingAvg: true } },
      },
    });
    if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm "${idOrSlug}"`);
    return product;
  }

  /**
   * Sitemap helpers — return lightweight id/slug lists for the
   * Next.js sitemap.xml route to consume. Public, no PII.
   */
  @Get('sitemap/sellers')
  async sitemapSellers() {
    return this.publicService.listAllSellerSlugs();
  }

  @Get('sitemap/products')
  async sitemapProducts() {
    return this.publicService.listAllProductIds();
  }
}
