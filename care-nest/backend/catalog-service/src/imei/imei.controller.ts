import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { ImeiService } from './imei.service.js';
import {
  AllocateImeiSchema,
  BulkImportImeiSchema,
  ListImeiQuerySchema,
  ReleaseImeiSchema,
} from './dto/imei.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('seller/imeis')
@UseGuards(JwtAuthGuard)
export class ImeiController {
  constructor(private readonly imeiService: ImeiService) {}

  @Post('bulk')
  async bulkImport(
    @CurrentUser() user: { id: string; role?: string },
    @Body() body: unknown
  ) {
    const parsed = BulkImportImeiSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.imeiService.bulkImport(user.id, parsed.data);
  }

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: unknown
  ) {
    const parsed = ListImeiQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.imeiService.list(user.id, parsed.data);
  }

  @Post('allocate')
  async allocate(
    @CurrentUser() user: { id: string },
    @Body() body: unknown
  ) {
    const parsed = AllocateImeiSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.imeiService.allocate(user.id, parsed.data);
  }

  @Post('release')
  async release(
    @CurrentUser() user: { id: string },
    @Body() body: unknown
  ) {
    const parsed = ReleaseImeiSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors);
    return this.imeiService.release(user.id, parsed.data);
  }

  /**
   * Cross-service endpoint called by order-service when an order
   * transitions to SHIPPED. The order-service owns the auth context
   * (intra-cluster) and passes a service token; for now this endpoint
   * is gated by JwtAuthGuard and any authenticated user can call it
   * (consistent with the existing /kyc/pending pattern).
   */
  @Post(':orderId/ship')
  async markShipped(@Param('orderId') orderId: string) {
    return this.imeiService.markOrderShipped(orderId);
  }
}
