import { Controller, Post, Get, Param, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { KycService } from './kyc.service.js';
import { SubmitKycSchema, ReviewKycSchema } from './kyc.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Seller submits KYC documents.
   */
  @Post('submit')
  async submit(@CurrentUser() user: { id: string }, @Body() body: unknown): Promise<any> {
    const parsed = SubmitKycSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.kycService.submit(user.id, parsed.data);
  }

  /**
   * Seller checks their own KYC status.
   */
  @Get('me')
  async me(@CurrentUser() user: { id: string }): Promise<any> {
    return this.kycService.getByUserId(user.id);
  }

  /**
   * Admin lists pending KYC submissions.
   * In a real system we'd check user.role === 'ADMIN'. For Phase 1
   * we expose the endpoint to any authenticated user; role enforcement
   * is added when admin auth is wired up in Phase 2.
   */
  @Get('pending')
  async listPending(@Query('page') page = '1', @Query('pageSize') pageSize = '20'): Promise<any> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 20, 100);
    return this.kycService.listPending(p, ps);
  }

  /**
   * Admin reviews a KYC submission.
   */
  @Post(':sellerId/review')
  async review(
    @CurrentUser() user: { id: string },
    @Param('sellerId') sellerId: string,
    @Body() body: unknown,
  ): Promise<any> {
    const parsed = ReviewKycSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.kycService.review(sellerId, user.id, parsed.data);
  }
}
