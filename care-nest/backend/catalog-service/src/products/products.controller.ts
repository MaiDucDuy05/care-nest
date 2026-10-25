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

@Controller('products')
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

  @Get('admin')
  async listAdmin(@Query() query: any): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
    const status = query.status || undefined;
    const search = query.search || undefined;
    const res = await this.productsService.listProducts({ page, limit, status, search } as any);
    const data = res.items.map((p: any) => ({
      id: p.id,
      name: p.name,
      sellerId: p.sellerId || '',
      sellerName: p.seller?.storeName || 'Nhà bán hàng CareNest',
      category: p.category?.name || 'Thiết bị y tế',
      priceVnd: Number(p.basePrice || p.priceVnd || 0),
      status: p.status,
      images: p.images?.map((img: any) => img.url) || [],
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    }));
    return {
      data,
      total: res.total,
      page,
      limit,
      totalPages: Math.ceil(res.total / limit) || 1,
    };
  }

  @Get('admin/:id')
  async getAdminOne(@Param('id') id: string): Promise<any> {
    const p = await this.productsService.getProductById(id);
    return {
      id: p.id,
      name: p.name,
      sellerId: p.sellerId || '',
      sellerName: p.seller?.storeName || 'Nhà bán hàng CareNest',
      category: p.category?.name || 'Thiết bị y tế',
      priceVnd: Number(p.basePrice || p.priceVnd || 0),
      status: p.status,
      images: p.images?.map((img: any) => img.url) || [],
      description: p.description || '',
      specifications: p.specifications || {},
      documents: [],
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  @Post('admin/:id/approve')
  async approveAdmin(@Param('id') id: string): Promise<any> {
    await this.productsService.updateProduct(id, { status: 'ACTIVE' } as any);
    return { success: true };
  }

  @Post('admin/:id/reject')
  async rejectAdmin(@Param('id') id: string): Promise<any> {
    await this.productsService.updateProduct(id, { status: 'REJECTED' } as any);
    return { success: true };
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
