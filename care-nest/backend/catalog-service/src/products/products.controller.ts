import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import type { Product, Prisma } from '@carenest/database';
import { ProductsService } from './products.service.js';
import { ProductQuerySchema, type ProductQueryDto } from './dto/product-query.dto.js';
import { CreateProductSchema, type CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductSchema, type UpdateProductDto } from './dto/update-product.dto.js';

export interface PaginatedProducts {
  items: (Product & { category: any; images: any[] })[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(@Query() query: unknown): Promise<PaginatedProducts> {
    const parsed = ProductQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.listProducts(parsed.data) as unknown as PaginatedProducts;
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Product | null> {
    return this.productsService.getProductById(id) as unknown as Product | null;
  }

  @Post()
  async create(@Body() body: unknown): Promise<Product> {
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.createProduct(parsed.data) as unknown as Product;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<Product> {
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.updateProduct(id, parsed.data) as unknown as Product;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Product> {
    return this.productsService.deleteProduct(id) as unknown as Product;
  }
}
