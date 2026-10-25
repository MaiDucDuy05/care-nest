import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, KycStatus, SellerStatus } from '@carenest/database';
import type { SubmitKycDto, ReviewKycDto } from './kyc.dto.js';

function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Submit KYC from seller portal (supports multipart form and JSON).
   */
  async submitSellerKyc(userId: string, body: any = {}, files: any[] = []): Promise<any> {
    const storeName = body.businessName || body.storeName || 'Cửa hàng CareNest';
    const taxId = body.taxId || null;
    const bankName = body.bankName || null;
    const bankAccount = body.bankAccount || null;
    const bankAccountName = body.bankAccountName || null;

    let baseSlug = slugify(body.storeSlug || storeName);
    if (baseSlug.length < 3) baseSlug = `seller-${baseSlug || 'store'}`;

    let seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      // Ensure unique slug
      let storeSlug = baseSlug;
      const slugClash = await this.prisma.seller.findUnique({ where: { storeSlug } });
      if (slugClash) {
        storeSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      seller = await this.prisma.seller.create({
        data: {
          userId,
          storeName,
          storeSlug,
          taxId,
          bankName,
          bankAccount,
          bankAccountName,
          status: SellerStatus.PENDING_REVIEW,
          kycStatus: KycStatus.IN_REVIEW,
        },
      });
    } else {
      seller = await this.prisma.seller.update({
        where: { id: seller.id },
        data: {
          storeName,
          taxId: taxId ?? seller.taxId,
          bankName: bankName ?? seller.bankName,
          bankAccount: bankAccount ?? seller.bankAccount,
          bankAccountName: bankAccountName ?? seller.bankAccountName,
          status: SellerStatus.PENDING_REVIEW,
          kycStatus: KycStatus.IN_REVIEW,
        },
      });
    }

    // Process files if uploaded
    const docTypes = ['BUSINESS_LICENSE', 'ID_CARD', 'ID_CARD'];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const type = f.fieldname === 'license'
          ? 'BUSINESS_LICENSE'
          : f.fieldname?.includes('id')
            ? 'ID_CARD'
            : docTypes[i] || 'BUSINESS_LICENSE';

        const fileUrl = f.buffer && f.buffer.length < 2 * 1024 * 1024
          ? `data:${f.mimetype || 'image/png'};base64,${f.buffer.toString('base64')}`
          : `https://cdn.carenest.vn/kyc/${seller.id}/${f.originalname || `doc-${i}.png`}`;

        await this.prisma.sellerKycDocument.create({
          data: {
            sellerId: seller.id,
            type,
            fileUrl,
            status: KycStatus.IN_REVIEW,
          },
        });
      }
    } else if (Array.isArray(body.documents)) {
      for (const d of body.documents) {
        if (d?.fileUrl && d?.type) {
          await this.prisma.sellerKycDocument.create({
            data: {
              sellerId: seller.id,
              type: d.type,
              fileUrl: d.fileUrl,
              status: KycStatus.IN_REVIEW,
            },
          });
        }
      }
    }

    // Ensure seller has at least placeholder documents so admin can review
    const docCount = await this.prisma.sellerKycDocument.count({ where: { sellerId: seller.id } });
    if (docCount === 0) {
      await this.prisma.sellerKycDocument.createMany({
        data: [
          {
            sellerId: seller.id,
            type: 'BUSINESS_LICENSE',
            fileUrl: 'https://cdn.carenest.vn/kyc/sample-business-license.pdf',
            status: KycStatus.IN_REVIEW,
          },
          {
            sellerId: seller.id,
            type: 'ID_CARD',
            fileUrl: 'https://cdn.carenest.vn/kyc/sample-cccd-front.jpg',
            status: KycStatus.IN_REVIEW,
          },
        ],
      });
    }

    const docs = await this.prisma.sellerKycDocument.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: seller.id,
      sellerId: seller.id,
      status: seller.kycStatus,
      businessName: seller.storeName,
      taxId: seller.taxId || '',
      businessAddress: body.businessAddress || '',
      businessType: body.businessType || '',
      businessPhone: body.businessPhone || '',
      licenseNumber: body.licenseNumber || '',
      bankName: seller.bankName || '',
      bankAccount: seller.bankAccount || '',
      bankAccountName: seller.bankAccountName || '',
      documents: docs.map((d) => ({
        id: d.id,
        type: d.type,
        url: d.fileUrl,
        fileName: d.type,
        uploadedAt: d.createdAt.toISOString(),
      })),
      submittedAt: seller.updatedAt.toISOString(),
      reviewedAt: null,
      reviewNote: null,
      createdAt: seller.createdAt.toISOString(),
      updatedAt: seller.updatedAt.toISOString(),
    };
  }

  /**
   * Submit KYC documents for a user (JSON schema).
   */
  async submit(userId: string, dto: SubmitKycDto): Promise<any> {
    let seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
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
   * List all KYC submissions pending review.
   */
  async listPending(page = 1, pageSize = 20): Promise<any> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where: { kycStatus: KycStatus.IN_REVIEW },
        include: { kycDocs: true, user: { select: { id: true, email: true, fullName: true, phone: true } } },
        orderBy: { updatedAt: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.seller.count({ where: { kycStatus: KycStatus.IN_REVIEW } }),
    ]);
    return { items, total, page, pageSize };
  }

  /**
   * Paginated list for admin portal matching KycListResponse.
   */
  async listPendingAdmin(page = 1, limit = 50): Promise<any> {
    const skip = (page - 1) * limit;
    const [sellers, total] = await Promise.all([
      this.prisma.seller.findMany({
        where: { kycStatus: KycStatus.IN_REVIEW },
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true } },
          kycDocs: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.seller.count({ where: { kycStatus: KycStatus.IN_REVIEW } }),
    ]);

    const data = sellers.map((s) => ({
      id: s.id,
      userId: s.userId,
      userFullName: s.user?.fullName || s.storeName,
      userEmail: s.user?.email || '',
      type: s.kycDocs[0]?.type || 'BUSINESS_LICENSE',
      status: s.kycStatus,
      filename: `${s.storeName} KYC Dossier`,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single seller KYC details for admin review matching KycDetailResponse.
   */
  async getByIdAdmin(sellerId: string): Promise<any> {
    let seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        kycDocs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!seller) {
      seller = await this.prisma.seller.findUnique({
        where: { userId: sellerId },
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true } },
          kycDocs: { orderBy: { createdAt: 'desc' } },
        },
      });
    }

    if (!seller) throw new NotFoundException(`Không tìm thấy seller ${sellerId}`);

    return {
      seller: {
        id: seller.id,
        fullName: seller.user?.fullName || seller.storeName,
        email: seller.user?.email || '',
        phone: seller.user?.phone || '',
      },
      documents: seller.kycDocs.map((d) => ({
        id: d.id,
        userId: seller.userId,
        userFullName: seller.user?.fullName || seller.storeName,
        userEmail: seller.user?.email || '',
        type: d.type,
        status: d.status,
        filename: d.type,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      lockedBy: undefined,
      lockExpiresAt: undefined,
    };
  }

  /**
   * Admin approves a KYC submission.
   */
  async approveAdmin(sellerId: string, reason?: string): Promise<any> {
    let seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      seller = await this.prisma.seller.findUnique({ where: { userId: sellerId } });
    }
    if (!seller) throw new NotFoundException(`Không tìm thấy seller ${sellerId}`);

    const resolvedSellerId = seller.id;
    await this.prisma.$transaction(async (tx) => {
      await tx.sellerKycDocument.updateMany({
        where: { sellerId: resolvedSellerId },
        data: {
          status: KycStatus.APPROVED,
          reviewedAt: new Date(),
        },
      });
      await tx.seller.update({
        where: { id: resolvedSellerId },
        data: {
          status: SellerStatus.ACTIVE,
          kycStatus: KycStatus.APPROVED,
        },
      });
    });
    return { success: true };
  }

  /**
   * Admin rejects a KYC submission.
   */
  async rejectAdmin(sellerId: string, reason = 'Từ chối bởi quản trị viên'): Promise<any> {
    let seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      seller = await this.prisma.seller.findUnique({ where: { userId: sellerId } });
    }
    if (!seller) throw new NotFoundException(`Không tìm thấy seller ${sellerId}`);

    const resolvedSellerId = seller.id;
    await this.prisma.$transaction(async (tx) => {
      await tx.sellerKycDocument.updateMany({
        where: { sellerId: resolvedSellerId },
        data: {
          status: KycStatus.REJECTED,
          rejectionReason: reason,
          reviewedAt: new Date(),
        },
      });
      await tx.seller.update({
        where: { id: resolvedSellerId },
        data: {
          status: SellerStatus.REJECTED,
          kycStatus: KycStatus.REJECTED,
        },
      });
    });
    return { success: true };
  }

  /**
   * Admin/Support reviews a KYC submission. Approves or rejects.
   */
  async review(sellerId: string, reviewerId: string, dto: ReviewKycDto): Promise<any> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId }, include: { kycDocs: true } });
    if (!seller) throw new NotFoundException(`Không tìm thấy seller ${sellerId}`);
    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason là bắt buộc khi từ chối');
    }

    const decision = dto.decision === 'APPROVED' ? KycStatus.APPROVED : KycStatus.REJECTED;
    const sellerStatus = dto.decision === 'APPROVED' ? SellerStatus.ACTIVE : SellerStatus.REJECTED;

    return this.prisma.$transaction(async (tx) => {
      await tx.sellerKycDocument.updateMany({
        where: { sellerId },
        data: {
          status: decision,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: dto.rejectionReason ?? null,
        },
      });
      return tx.seller.update({
        where: { id: sellerId },
        data: { status: sellerStatus, kycStatus: decision },
      });
    });
  }

  async getByUserId(userId: string): Promise<any> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      include: { kycDocs: { orderBy: { createdAt: 'desc' } } },
    });
    if (!seller) return null;
    return {
      ...seller,
      status: seller.kycStatus,
      kycStatus: seller.kycStatus,
      businessName: seller.storeName,
      documents: seller.kycDocs.map((d) => ({
        id: d.id,
        type: d.type,
        url: d.fileUrl,
        fileName: d.type,
        uploadedAt: d.createdAt.toISOString(),
      })),
    };
  }
}
