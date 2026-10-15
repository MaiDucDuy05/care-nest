import { Injectable } from '@nestjs/common';
import { getPrismaClient, PrismaClient, Prisma, type Product } from '@carenest/database';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

export interface PaginatedProducts {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

@Injectable()
export class ProductsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async findMany(query: ProductQueryDto): Promise<PaginatedProducts> {
    const { page, pageSize, categoryId, sellerId, search, isIotDevice } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;
    if (isIotDevice !== undefined) where.isIotDevice = isIotDevice;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items as any[],
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            storeSlug: true,
            ratingAvg: true,
          },
        },
      },
    });
    return product as unknown as Product | null;
  }

  async create(data: CreateProductDto): Promise<Product> {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await this.prisma.product.create({
      data: {
        sellerId: data.sellerId,
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description || '',
        basePrice: data.price,
        compareAtPrice: data.compareAtPrice,
        sku: data.sku,
        status: 'ACTIVE',
        isMedical: data.isMedical || false,
        isIotDevice: data.isIotDevice || false,
        iotDeviceModel: data.iotDeviceModel,
        requiresRx: data.requiresRx || false,
      },
    });
    return created as unknown as Product;
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.basePrice = data.price;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    return updated as unknown as Product;
  }

  async softDelete(id: string): Promise<Product> {
    const deleted = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    return deleted as unknown as Product;
  }
}
