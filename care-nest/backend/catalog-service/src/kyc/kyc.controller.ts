import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service.js';
import { SubmitKycSchema, ReviewKycSchema } from './kyc.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

type UploadedFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer?: Buffer;
  size: number;
};

@Controller('seller/kyc')
@UseGuards(JwtAuthGuard)
export class SellerKycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Seller submits KYC from web-seller portal (FormData / JSON).
   */
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async submit(
    @CurrentUser() user: { id: string },
    @Body() body: any,
    @UploadedFiles() files?: UploadedFile[],
  ): Promise<any> {
    return this.kycService.submitSellerKyc(user.id, body, files || []);
  }

  /**
   * Seller checks their own KYC status.
   */
  @Get()
  async getStatus(@CurrentUser() user: { id: string }): Promise<any> {
    return this.kycService.getByUserId(user.id);
  }
}

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Seller submits KYC documents (JSON or multipart).
   */
  @Post('submit')
  @UseInterceptors(AnyFilesInterceptor())
  async submit(
    @CurrentUser() user: { id: string },
    @Body() body: any,
    @UploadedFiles() files?: UploadedFile[],
  ): Promise<any> {
    // If structured as SubmitKycSchema JSON
    if (body?.documents && !files?.length) {
      const parsed = SubmitKycSchema.safeParse(body);
      if (parsed.success) {
        return this.kycService.submit(user.id, parsed.data);
      }
    }
    return this.kycService.submitSellerKyc(user.id, body, files || []);
  }

  /**
   * Seller checks their own KYC status.
   */
  @Get('me')
  async me(@CurrentUser() user: { id: string }): Promise<any> {
    return this.kycService.getByUserId(user.id);
  }

  /**
   * Admin lists pending KYC submissions (legacy endpoint).
   */
  @Get('pending')
  async listPending(@Query('page') page = '1', @Query('pageSize') pageSize = '20'): Promise<any> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 20, 100);
    return this.kycService.listPending(p, ps);
  }

  /**
   * Admin lists pending KYC submissions (web-admin portal).
   */
  @Get('admin/pending')
  async listPendingAdmin(@Query('page') page = '1', @Query('limit') limit = '50'): Promise<any> {
    const p = parseInt(page, 10) || 1;
    const l = Math.min(parseInt(limit, 10) || 50, 100);
    return this.kycService.listPendingAdmin(p, l);
  }

  /**
   * Admin gets single seller KYC details (web-admin portal).
   */
  @Get('admin/:sellerId')
  async getByIdAdmin(@Param('sellerId') sellerId: string): Promise<any> {
    return this.kycService.getByIdAdmin(sellerId);
  }

  /**
   * Admin approves a KYC submission (web-admin portal).
   */
  @Post('admin/:sellerId/approve')
  async approveAdmin(
    @Param('sellerId') sellerId: string,
    @Body('reason') reason?: string,
  ): Promise<any> {
    return this.kycService.approveAdmin(sellerId, reason);
  }

  /**
   * Admin rejects a KYC submission (web-admin portal).
   */
  @Post('admin/:sellerId/reject')
  async rejectAdmin(
    @Param('sellerId') sellerId: string,
    @Body('reason') reason?: string,
  ): Promise<any> {
    return this.kycService.rejectAdmin(sellerId, reason);
  }

  /**
   * Admin locks a KYC review item (web-admin portal).
   */
  @Post('admin/:sellerId/lock')
  async lockAdmin(): Promise<any> {
    return { lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
  }

  /**
   * Admin reviews a KYC submission (legacy endpoint).
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
