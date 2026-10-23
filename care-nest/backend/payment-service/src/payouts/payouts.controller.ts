import { Controller, Get, Param, Query, UseGuards, BadRequestException, Post } from '@nestjs/common';
import { z } from 'zod';
import { PayoutsService } from './payouts.service.js';
import { PayoutsRepository } from './payouts.repository.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const EntriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  kind: z.enum(['ORDER_CREDIT', 'COMMISSION_DEBIT', 'REFUND_DEBIT', 'PAYOUT_DEBIT', 'ADJUSTMENT']).optional(),
});

@Controller('seller/payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly repository: PayoutsRepository
  ) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: unknown
  ): Promise<{ items: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    const parsed = ListQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    const prisma = (await import('@carenest/database')).getPrismaClient();
    const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) return { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };
    const { page, pageSize } = parsed.data;
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.payout.findMany({
        where: { sellerId: seller.id },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.payout.count({ where: { sellerId: seller.id } }),
    ]);
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  @Get('wallet')
  async getWallet(@CurrentUser() user: { id: string }) {
    const prisma = (await import('@carenest/database')).getPrismaClient();
    const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) return { balanceVnd: 0, pendingVnd: 0, lifetimeVnd: 0, currency: 'VND' };
    const wallet = await this.repository.getOrCreateWallet(seller.id);
    return {
      balanceVnd: Number(wallet.balanceVnd),
      pendingVnd: Number(wallet.pendingVnd),
      lifetimeVnd: Number(wallet.lifetimeVnd),
      currency: wallet.currency,
    };
  }

  /**
   * S17: Wallet ledger for the seller — every in/out (ORDER_CREDIT,
   * COMMISSION_DEBIT, REFUND_DEBIT, PAYOUT_DEBIT, ADJUSTMENT) in
   * reverse-chronological order. Powers the "Escrow timeline" UI
   * on the seller payouts page.
   *
   * Optional `kind` filter scopes the query to a single entry type
   * (e.g. `?kind=REFUND_DEBIT` to audit refunds only).
   */
  @Get('entries')
  async listEntries(
    @CurrentUser() user: { id: string },
    @Query() query: unknown
  ): Promise<{ items: unknown[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    const parsed = EntriesQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    const prisma = (await import('@carenest/database')).getPrismaClient();
    const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    const wallet = await prisma.sellerWallet.findUnique({ where: { sellerId: seller.id } });
    if (!wallet) return { items: [], total: 0, page: 1, pageSize: 50, hasMore: false };
    const { page, pageSize, kind } = parsed.data;
    const skip = (page - 1) * pageSize;
    const where = {
      walletId: wallet.id,
      ...(kind ? { kind } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.walletEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.walletEntry.count({ where }),
    ]);
    const items = rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      amountVnd: Number(r.amountVnd),
      balanceAfterVnd: Number(r.balanceAfterVnd),
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      description: r.description,
      createdAt: r.createdAt,
    }));
    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  /**
   * Admin-only: trigger the payout processor manually. Used for
   * testing and for ops to force a flush.
   */
  @Post('process')
  async process() {
    return this.payoutsService.processPendingPayouts();
  }

  /**
   * Admin-only: trigger the escrow-release worker manually. Useful
   * for integration tests that need to bypass the cron schedule.
   */
  @Post('release-pending')
  async releasePending() {
    // Lazy import to avoid circular dep
    const { EscrowReleaseWorker } = await import('./escrow-release.worker.js');
    // Note: this is a controller-level convenience; in production
    // the worker runs on its own @Cron schedule.
    const worker = new EscrowReleaseWorker(this.payoutsService, this.repository);
    return worker.runOnce();
  }
}
