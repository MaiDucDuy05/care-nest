import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, KycStatus, SellerStatus } from '@carenest/database';
import type { SubmitKycDto, ReviewKycDto } from './kyc.dto.js';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Submit KYC documents for a user. Creates a Seller record in DRAFT
   * if one doesn't exist, and attaches the documents.
   */
  async submit(userId: string, dto: SubmitKycDto): Promise<any> {
    // 1) Find or create seller
    let seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      // Check slug uniqueness
      const slugClash = await this.prisma.seller.findUnique({ where: { storeSlug: dto.storeSlug } });
      if (slugClash) throw new ConflictException(`Store slug '${dto.storeSlug}' đã được sử dụng`);
      seller = await this.prisma.seller.create({
        data: {
          userId,
          storeName: dto.storeName,
          storeSlug: dto.storeSlug,
          taxId: dto.taxId ?? null,
          status: SellerStatus.PENDING_REVIEW,
          kycStatus: KycStatus.IN_REVIEW,
        },
      });
    } else {
      if (seller.status === SellerStatus.ACTIVE) {
        throw new BadRequestException('Seller đã được phê duyệt trước đó');
      }
      seller = await this.prisma.seller.update({
        where: { id: seller.id },
        data: {
          status: SellerStatus.PENDING_REVIEW,
          kycStatus: KycStatus.IN_REVIEW,
          storeName: dto.storeName,
          storeSlug: dto.storeSlug,
          taxId: dto.taxId ?? undefined,
        },
      });
    }

    // 2) Create documents
    const docs = await this.prisma.sellerKycDocument.createMany({
      data: dto.documents.map((d) => ({
        sellerId: seller!.id,
        type: d.type,
        fileUrl: d.fileUrl,
        status: KycStatus.IN_REVIEW,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      })),
    });

    return { seller, submittedCount: docs.count };
  }

  /**
   * List all KYC submissions pending review (admin only).
   */
  async listPending(page = 1, pageSize = 20): Promise<any> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where: { status: SellerStatus.PENDING_REVIEW },
        include: { kycDocs: true, user: { select: { id: true, email: true, fullName: true, phone: true } } },
        orderBy: { updatedAt: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.seller.count({ where: { status: SellerStatus.PENDING_REVIEW } }),
    ]);
    return { items, total, page, pageSize };
  }

  /**
   * Admin/Support reviews a KYC submission. Approves or rejects.
   */
  async review(sellerId: string, reviewerId: string, dto: ReviewKycDto): Promise<any> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId }, include: { kycDocs: true } });
    if (!seller) throw new NotFoundException(`Không tìm thấy seller ${sellerId}`);
    if (seller.status !== SellerStatus.PENDING_REVIEW) {
      throw new BadRequestException(`Seller không ở trạng thái chờ duyệt (hiện: ${seller.status})`);
    }
    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason là bắt buộc khi từ chối');
    }

    const decision = dto.decision === 'APPROVED' ? KycStatus.APPROVED : KycStatus.REJECTED;
    const sellerStatus = dto.decision === 'APPROVED' ? SellerStatus.ACTIVE : SellerStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      // Update all docs
      await tx.sellerKycDocument.updateMany({
        where: { sellerId },
        data: {
          status: decision,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: dto.rejectionReason ?? null,
        },
      });
      // Update seller
      return tx.seller.update({
        where: { id: sellerId },
        data: { status: sellerStatus, kycStatus: decision },
      });
    });
  }

  async getByUserId(userId: string): Promise<any> {
    return this.prisma.seller.findUnique({
      where: { userId },
      include: { kycDocs: { orderBy: { createdAt: 'desc' } } },
    });
  }
}
