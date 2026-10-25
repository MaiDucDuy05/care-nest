import { Injectable } from '@nestjs/common';
import { getPrismaClient, type PrismaClient, type ImeiRecord, ImeiStatus } from '@carenest/database';
import type {
  AllocateImeiDto,
  BulkImportImeiDto,
  ListImeiQueryDto,
  ReleaseImeiDto,
} from './dto/imei.dto.js';

export interface ImeiWithProduct extends ImeiRecord {
  productName?: string;
}

export interface PaginatedImei {
  items: ImeiWithProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BulkImportResult {
  imported: string[];
  duplicates: string[];
  invalid: string[];
}

@Injectable()
export class ImeiRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async resolveSellerId(userIdOrSellerId: string): Promise<string | null> {
    const seller = await this.prisma.seller.findFirst({
      where: {
        OR: [{ id: userIdOrSellerId }, { userId: userIdOrSellerId }],
      },
      select: { id: true },
    });
    return seller ? seller.id : null;
  }

  /**
   * Bulk import. Existing IMEIs (unique-constraint conflict) are reported
   * back as `duplicates`. Luhn-failed inputs are reported as `invalid`
   * and never reach the DB.
   */
  async bulkImport(
    userIdOrSellerId: string,
    dto: BulkImportImeiDto,
    luhnValid: (s: string) => boolean
  ): Promise<BulkImportResult> {
    const sellerId = (await this.resolveSellerId(userIdOrSellerId)) ?? userIdOrSellerId;
    const validImeis: string[] = [];
    const invalid: string[] = [];
    for (const imei of dto.imeis) {
      if (luhnValid(imei)) validImeis.push(imei);
      else invalid.push(imei);
    }

    if (validImeis.length === 0) {
      return { imported: [], duplicates: [], invalid };
    }

    // Use ON CONFLICT DO NOTHING to skip existing IMEIs; we then read
    // back which actually got inserted. The implementation here uses
    // createMany + skipDuplicates where supported, then compares.
    const existing = await this.prisma.imeiRecord.findMany({
      where: { imei: { in: validImeis } },
      select: { imei: true },
    });
    const existingSet = new Set(existing.map((e) => e.imei));
    const toInsert = validImeis.filter((i) => !existingSet.has(i));

    if (toInsert.length === 0) {
      return {
        imported: [],
        duplicates: validImeis,
        invalid,
      };
    }

    const result = await this.prisma.imeiRecord.createMany({
      data: toInsert.map((imei) => ({
        imei,
        productId: dto.productId,
        sellerId,
        status: ImeiStatus.IN_STOCK,
      })),
    });

    return {
      imported: toInsert,
      duplicates: validImeis.filter((i) => existingSet.has(i)),
      invalid,
    };
  }

  async findMany(userIdOrSellerId: string, query: ListImeiQueryDto): Promise<PaginatedImei> {
    const sellerId = await this.resolveSellerId(userIdOrSellerId);
    if (!sellerId) {
      return {
        items: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: false,
      };
    }

    const { productId, status, page, pageSize } = query;
    const where: any = {
      sellerId,
      ...(productId ? { productId } : {}),
      ...(status ? { status } : {}),
    };
    const skip = (page - 1) * pageSize;
    const [records, total] = await Promise.all([
      this.prisma.imeiRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      }),
      this.prisma.imeiRecord.count({ where }),
    ]);

    const items = records.map((r) => ({
      ...r,
      productName: r.product?.name,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  async findByOrder(orderId: string): Promise<ImeiRecord[]> {
    return this.prisma.imeiRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Reserve `imeis` for an order line. Only IN_STOCK records may be
   * reserved; the operation is atomic — if any IMEI is not eligible,
   * the entire call throws and no state changes.
   */
  async allocate(userIdOrSellerId: string, dto: AllocateImeiDto): Promise<ImeiRecord[]> {
    const sellerId = (await this.resolveSellerId(userIdOrSellerId)) ?? userIdOrSellerId;
    return this.prisma.$transaction(async (tx) => {
      const records = await tx.imeiRecord.findMany({
        where: { imei: { in: dto.imeis }, sellerId },
      });
      if (records.length !== dto.imeis.length) {
        const found = new Set(records.map((r) => r.imei));
        const missing = dto.imeis.filter((i) => !found.has(i));
        throw new Error(`IMEI không thuộc seller: ${missing.join(', ')}`);
      }
      const notInStock = records.filter((r) => r.status !== ImeiStatus.IN_STOCK);
      if (notInStock.length > 0) {
        throw new Error(
          `IMEI không ở trạng thái IN_STOCK: ${notInStock.map((r) => r.imei).join(', ')}`
        );
      }

      await tx.imeiRecord.updateMany({
        where: { imei: { in: dto.imeis } },
        data: {
          status: ImeiStatus.RESERVED,
          orderId: dto.orderId,
          orderItemId: dto.orderItemId,
        },
      });

      return tx.imeiRecord.findMany({
        where: { imei: { in: dto.imeis } },
      });
    });
  }

  /**
   * Release IMEIs back to IN_STOCK. Used when an order is cancelled
   * before shipping.
   */
  async release(userIdOrSellerId: string, dto: ReleaseImeiDto): Promise<ImeiRecord[]> {
    const sellerId = (await this.resolveSellerId(userIdOrSellerId)) ?? userIdOrSellerId;
    return this.prisma.$transaction(async (tx) => {
      const records = await tx.imeiRecord.findMany({
        where: { orderId: dto.orderId, sellerId, status: ImeiStatus.RESERVED },
      });
      if (records.length === 0) return [];

      const imeis = records.map((r) => r.imei);
      await tx.imeiRecord.updateMany({
        where: { imei: { in: imeis } },
        data: {
          status: ImeiStatus.IN_STOCK,
          orderId: null,
          orderItemId: null,
        },
      });

      return tx.imeiRecord.findMany({
        where: { imei: { in: imeis } },
      });
    });
  }

  /**
   * Mark IMEIs as SHIPPED. Used by the order-service state machine
   * when transitioning to OrderStatus.SHIPPED. Returns the count.
   */
  async markShipped(orderId: string): Promise<number> {
    const result = await this.prisma.imeiRecord.updateMany({
      where: { orderId, status: ImeiStatus.RESERVED },
      data: { status: ImeiStatus.SHIPPED },
    });
    return result.count;
  }

  /**
   * Read IMEIs by order. Used by the order-service to validate SHIPPED
   * transitions.
   */
  async listByOrder(orderId: string): Promise<ImeiRecord[]> {
    return this.prisma.imeiRecord.findMany({ where: { orderId } });
  }
}
