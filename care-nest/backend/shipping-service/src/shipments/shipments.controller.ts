import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '@carenest/shared-utils';
import { ShipmentsService } from './shipments.service.js';
import { QuoteFeeSchema, CreateShipmentSchema } from './dto/shipments.dto.js';

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  /** Quote a fee for a specific carrier. */
  @Post('quote')
  async quote(@Body(new ZodValidationPipe(QuoteFeeSchema)) dto: any) {
    return this.shipmentsService.quoteFee(dto);
  }

  /** Quote the cheapest carrier. */
  @Post('quote/cheapest')
  async quoteCheapest(@Body(new ZodValidationPipe(QuoteFeeSchema)) dto: any) {
    return this.shipmentsService.quoteCheapest(dto);
  }

  /** Hand an order to a carrier. */
  @Post()
  async create(
    @CurrentUser() _user: { id: string },
    @Body(new ZodValidationPipe(CreateShipmentSchema)) dto: any,
  ) {
    return this.shipmentsService.create(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.shipmentsService.getById(id);
  }

  @Get('track/:trackingCode')
  async track(@Param('trackingCode') code: string) {
    return this.shipmentsService.getByTrackingCode(code);
  }

  /** Force-poll the carrier and apply the latest status. */
  @Post('track/:trackingCode/refresh')
  async refresh(@Param('trackingCode') code: string) {
    return this.shipmentsService.refreshStatus(code);
  }

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
  ) {
    // NOTE: in real life we'd look up sellerId from a join with the user
    // table; for Phase 2 we treat the JWT subject as the seller id.
    return this.shipmentsService.listForSeller(user.id, status);
  }
}
