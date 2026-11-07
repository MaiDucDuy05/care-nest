import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '@carenest/database';
import { ProductsRepository, type PaginatedProducts } from './products.repository.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { cacheDel, cacheGet, cacheSet } from '@carenest/shared-redis';
import { SearchService } from '../search/search.service.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly searchService: SearchService,
  ) {}

  async listProducts(query: ProductQueryDto): Promise<PaginatedProducts> {
    if (query.search && query.search.trim()) {
      const meiliResult = await this.searchService.searchProducts(query.search.trim(), {
        page: query.page,
        pageSize: query.pageSize,
        categoryId: query.categoryId,
        isIotDevice: query.isIotDevice,
      });

      if (meiliResult) {
        const skip = (query.page - 1) * query.pageSize;
        return {
          items: meiliResult.items as any[],
          total: meiliResult.total,
          page: query.page,
          pageSize: query.pageSize,
          hasMore: skip + meiliResult.items.length < meiliResult.total,
        };
      }
    }
    return this.productsRepository.findMany(query);
  }

  async getProductById(id: string): Promise<any> {
    const cacheKey = `product:v2:${id}`;
    try {
      const cached = await cacheGet<any>(cacheKey);
      if (cached) return cached;
    } catch {
      // Redis offline/failsafe fallback
    }

    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có id ${id}`);
    }

    try {
      await cacheSet(cacheKey, product, { ttlSeconds: 300 }); // 5 min TTL
    } catch {
      // Ignore cache write error
    }

    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const created = await this.productsRepository.create(dto);
    this.searchService.indexProduct(created).catch(() => {});
    return created;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.getProductById(id);
    const updated = await this.productsRepository.update(id, dto);
    try {
      await cacheDel(`product:v2:${id}`);
    } catch {
      // The database remains authoritative if cache invalidation fails.
    }
    this.searchService.indexProduct(updated).catch(() => {});
    return updated;
  }

  async deleteProduct(id: string): Promise<Product> {
    await this.getProductById(id);
    const deleted = await this.productsRepository.softDelete(id);
    this.searchService.deleteProduct(id).catch(() => {});
    return deleted;
  }

  async listForSeller(userId: string, query: any): Promise<PaginatedProducts> {
    return this.productsRepository.findManyForSeller(userId, query);
  }

  async assertSeller(userId: string): Promise<void> {
    const sellerId = await this.productsRepository.resolveSellerId(userId);
    if (!sellerId) throw new NotFoundException('Seller profile not found.');
  }

  async getForSeller(userId: string, productId: string): Promise<Product> {
    const sellerId = await this.productsRepository.resolveSellerId(userId);
    const product = await this.getProductById(productId);
    if (!sellerId || product.sellerId !== sellerId) {
      throw new NotFoundException('Product not found.');
    }
    return product as Product;
  }

  async createForSeller(userId: string, dto: CreateProductDto): Promise<Product> {
    const sellerId = await this.productsRepository.resolveSellerId(userId);
    if (!sellerId) {
      throw new NotFoundException('Không tìm thấy thông tin người bán. Vui lòng hoàn tất đăng ký hoặc KYC.');
    }
    const created = await this.productsRepository.create({
      ...dto,
      sellerId,
    });
    this.searchService.indexProduct(created).catch(() => {});
    return created;
  }

  async updateForSeller(userId: string, productId: string, dto: UpdateProductDto): Promise<Product> {
    const sellerId = await this.productsRepository.resolveSellerId(userId);
    const existing = await this.getProductById(productId);
    if (!sellerId || existing.sellerId !== sellerId) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ${productId}`);
    }
    if (dto.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      throw new ForbiddenException('Only an admin can approve a product for sale.');
    }
    if (dto.status === 'REJECTED' && existing.status !== 'REJECTED') {
      throw new ForbiddenException('Only an admin can reject a product.');
    }
    return this.updateProduct(productId, dto);
  }

  async deleteForSeller(userId: string, productId: string): Promise<Product> {
    const sellerId = await this.productsRepository.resolveSellerId(userId);
    const existing = await this.getProductById(productId);
    if (!sellerId || existing.sellerId !== sellerId) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ${productId}`);
    }
    return this.productsRepository.softDelete(productId);
  }
}
