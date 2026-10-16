import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { withLock } from '@carenest/shared-redis';
import type { ImeiRecord, Product } from '@carenest/database';
import { ImeiRepository, type BulkImportResult, type PaginatedImei } from './imei.repository.js';
import type { ImeiEventPublisher } from './imei-event.publisher.js';
import { isValidImei } from './imei-luhn.js';
import type {
  AllocateImeiDto,
  BulkImportImeiDto,
  ListImeiQueryDto,
  ReleaseImeiDto,
} from './dto/imei.dto.js';

@Injectable()
export class ImeiService {
  private readonly logger = new Logger(ImeiService.name);

  constructor(
    private readonly repository: ImeiRepository,
    private readonly eventPublisher: ImeiEventPublisher
  ) {}

  /**
   * Bulk-import IMEIs for a product. Validates Luhn before any DB write.
   * Idempotent: re-running the same batch is safe (duplicates are reported).
   */
  async bulkImport(sellerId: string, dto: BulkImportImeiDto): Promise<BulkImportResult> {
    const product = await this.repository['prisma'].product.findFirst({
      where: { id: dto.productId, sellerId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} không thuộc seller hoặc không tồn tại`);
    }
    if (!product.requiresImei) {
      throw new BadRequestException(`Product ${product.name} không yêu cầu IMEI`);
    }

    const result = await this.repository.bulkImport(sellerId, dto, isValidImei);
    this.logger.log(
      { sellerId, productId: dto.productId, ...result },
      'IMEI bulk import'
    );
    return result;
  }

  async list(sellerId: string, query: ListImeiQueryDto): Promise<PaginatedImei> {
    return this.repository.findMany(sellerId, query);
  }

  /**
   * Reserve IMEIs for an order line. Wrapped in a Redis lock keyed by
   * orderId to prevent two concurrent allocations racing for the same
   * IMEIs.
   */
  async allocate(sellerId: string, dto: AllocateImeiDto): Promise<ImeiRecord[]> {
    return withLock(
      `imei-allocate:${dto.orderId}`,
      async () => {
        const result = await this.repository.allocate(sellerId, dto);
        await this.eventPublisher.publishAllocated(result);
        return result;
      },
      { ttlMs: 5_000 }
    );
  }

  async release(sellerId: string, dto: ReleaseImeiDto): Promise<ImeiRecord[]> {
    return withLock(
      `imei-release:${dto.orderId}`,
      async () => this.repository.release(sellerId, dto),
      { ttlMs: 5_000 }
    );
  }

  /**
   * Cross-service helper: when the order-service transitions an order
   * to SHIPPED, it calls this endpoint to mark the IMEIs as SHIPPED.
   * Returns the count updated. Throws if any reserved IMEI is missing.
   */
  async markOrderShipped(orderId: string): Promise<{ count: number; records: ImeiRecord[] }> {
    const records = await this.repository.listByOrder(orderId);
    const reserved = records.filter((r) => r.status === 'RESERVED');
    if (reserved.length === 0) {
      throw new ConflictException(`Order ${orderId} has no reserved IMEIs to ship`);
    }
    const count = await this.repository.markShipped(orderId);
    const updated = await this.repository.listByOrder(orderId);
    const sellerId = updated[0]?.sellerId;
    if (sellerId) {
      await this.eventPublisher.publishShipped(orderId, sellerId, updated);
    }
    return { count, records: updated };
  }
}
