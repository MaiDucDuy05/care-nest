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

type InventoryStockRow = { quantity: number; reserved: number };

function withAvailableStock<T extends { inventory: InventoryStockRow[] }>(product: T) {
  const { inventory, ...productData } = product;
  const stock = inventory.reduce(
    (total, row) => total + Math.max(0, row.quantity - row.reserved),
    0,
  );
  return { ...productData, stock };
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
          inventory: { select: { quantity: true, reserved: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => withAvailableStock(item)),
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  async findById(id: string): Promise<any | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        inventory: { select: { quantity: true, reserved: true } },
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
    return product ? withAvailableStock(product) : null;
  }

  async create(data: CreateProductDto): Promise<any> {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
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
          requiresImei: data.requiresImei ?? true,
        },
      });
      await tx.inventory.create({
        data: {
          productId: product.id,
          sellerId: data.sellerId,
          warehouseCode: 'HN-01',
          quantity: data.stock,
          reserved: 0,
          reorderThreshold: 10,
        },
      });
      return product;
    });
    return { ...created, stock: data.stock };
  }

  async update(id: string, data: UpdateProductDto): Promise<any> {
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.basePrice = data.price;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: updateData,
      });

      if (data.stock !== undefined) {
        const inventoryRows = await tx.inventory.findMany({
          where: { productId: id },
          orderBy: { createdAt: 'asc' },
        });

        if (inventoryRows.length === 0) {
          await tx.inventory.create({
            data: {
              productId: id,
              sellerId: updated.sellerId,
              warehouseCode: 'HN-01',
              quantity: data.stock,
              reserved: 0,
              reorderThreshold: 10,
            },
          });
        } else {
          const availableStock = inventoryRows.reduce(
            (total, row) => total + Math.max(0, row.quantity - row.reserved),
            0,
          );
          let adjustment = data.stock - availableStock;

          for (const row of inventoryRows) {
            if (adjustment === 0) break;
            const availableInRow = Math.max(0, row.quantity - row.reserved);
            const rowAdjustment = adjustment > 0
              ? adjustment
              : -Math.min(availableInRow, -adjustment);
            await tx.inventory.update({
              where: { id: row.id },
              data: { quantity: row.quantity + rowAdjustment },
            });
            adjustment -= rowAdjustment;
          }
        }
      }

      const inventory = await tx.inventory.findMany({
        where: { productId: id },
        select: { quantity: true, reserved: true },
      });
      return withAvailableStock({ ...updated, inventory });
    });
  }

  async softDelete(id: string): Promise<Product> {
    const deleted = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    return deleted as unknown as Product;
  }
}
