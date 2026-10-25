import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../cart/guards/jwt-auth.guard.js';
import { CurrentUser } from '../cart/decorators/current-user.decorator.js';

const VALID_DAYS = [1, 7, 30, 90];

/**
 * Seller analytics. Mounted at /api/v1/analytics so the seller portal
 * can call it directly with a bearer token. Supports either
 * the seller passing their own sellerId (admin/support) or — for the
 * self-serve case — the controller looks up the seller's sellerId
 * from their JWT user-id.
 */
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async summary(
    @CurrentUser() user: { id: string; role?: string },
    @Query('sellerId') sellerId?: string,
    @Query('days') daysRaw = '7'
  ) {
    const days = parseInt(daysRaw, 10);
    if (!VALID_DAYS.includes(days)) {
      throw new BadRequestException(`days must be one of ${VALID_DAYS.join(', ')}`);
    }
    // If no sellerId passed, resolve from current user's seller record
    let resolvedSellerId = sellerId;
    if (!resolvedSellerId) {
      const { getPrismaClient } = await import('@carenest/database');
      const prisma = getPrismaClient();
      const seller = await prisma.seller.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!seller) throw new BadRequestException('No seller record for this user');
      resolvedSellerId = seller.id;
    }
    if (!resolvedSellerId) {
      throw new BadRequestException('Seller ID required');
    }
    return this.analyticsService.getSellerAnalytics(resolvedSellerId, days);
  }
}
