import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Product, Prisma } from '@carenest/database';
import { Roles, RolesGuard } from '@carenest/nestjs-common';
import { ProductsService } from './products.service.js';
import { ProductQuerySchema, type ProductQueryDto } from './dto/product-query.dto.js';
import { CreateProductSchema, type CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductSchema, type UpdateProductDto } from './dto/update-product.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

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

  @Get('seller')
  @UseGuards(JwtAuthGuard)
  async listSeller(
    @CurrentUser() user: { id: string },
    @Query() query: any,
  ): Promise<PaginatedProducts> {
    return this.productsService.listForSeller(user.id, query);
  }

  @Post('seller')
  @UseGuards(JwtAuthGuard)
  async createSeller(
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ): Promise<Product> {
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.productsService.createForSeller(user.id, parsed.data);
  }

  @Put('seller/:id')
  @UseGuards(JwtAuthGuard)
  async updateSeller(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Product> {
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.productsService.updateForSeller(user.id, id, parsed.data);
  }

  @Delete('seller/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSeller(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productsService.deleteForSeller(user.id, id);
  }

  @Get()
  async list(@Query() query: unknown): Promise<PaginatedProducts> {
    const parsed = ProductQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.listProducts({ ...parsed.data, status: 'ACTIVE' }) as unknown as PaginatedProducts;
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listAdmin(@Query() query: any): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
    const search = query.search || undefined;
    const res = await this.productsService.listProducts({
      page,
      pageSize: limit,
      status: 'PENDING_REVIEW',
      search,
    });
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveAdmin(@Param('id') id: string): Promise<any> {
    const product = await this.productsService.getProductById(id);
    if (product.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Only products awaiting review can be approved.');
    }
    await this.productsService.updateProduct(id, { status: 'ACTIVE' } as any);
    return { success: true };
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectAdmin(@Param('id') id: string): Promise<any> {
    const product = await this.productsService.getProductById(id);
    if (product.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Only products awaiting review can be rejected.');
    }
    await this.productsService.updateProduct(id, { status: 'REJECTED' } as any);
    return { success: true };
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Product | null> {
    const product = await this.productsService.getProductById(id);
    if (product.status !== 'ACTIVE') {
      throw new NotFoundException('Product is not available.');
    }
    return product as Product;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: string }, @Body() body: unknown): Promise<Product> {
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.createForSeller(user.id, parsed.data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Product> {
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.updateForSeller(user.id, id, parsed.data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string): Promise<Product> {
    return this.productsService.deleteForSeller(user.id, id);
  }
}
