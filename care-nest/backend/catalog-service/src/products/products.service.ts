import { Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '@carenest/database';
import { ProductsRepository, type PaginatedProducts } from './products.repository.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { cacheGet, cacheSet } from '@carenest/shared-redis';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async listProducts(query: ProductQueryDto): Promise<PaginatedProducts> {
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
    return this.productsRepository.create(dto);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.getProductById(id);
    return this.productsRepository.update(id, dto);
  }

  async deleteProduct(id: string): Promise<Product> {
    await this.getProductById(id);
    return this.productsRepository.softDelete(id);
  }
}
