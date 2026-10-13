import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { cacheGet, cacheSet } from '@carenest/shared-redis';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async listProducts(query: ProductQueryDto) {
    return this.productsRepository.findMany(query);
  }

  async getProductById(id: string) {
    const cacheKey = `product:${id}`;
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
      await cacheSet(cacheKey, product, 300); // 5 min TTL
    } catch {
      // Ignore cache write error
    }

    return product;
  }

  async createProduct(dto: CreateProductDto) {
    return this.productsRepository.create(dto);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.getProductById(id);
    return this.productsRepository.update(id, dto);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);
    return this.productsRepository.softDelete(id);
  }
}
