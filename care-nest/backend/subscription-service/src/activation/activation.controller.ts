import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ActivationService } from './activation.service.js';
import { ZodValidationPipe } from '@carenest/shared-utils';
import { CreateActivationCodeSchema, RedeemActivationCodeSchema } from './dto/activation.dto.js';
import { SubscriptionEventPublisher } from '../kafka/subscription-event.publisher.js';

@Controller('activation')
export class ActivationController {
  constructor(
    private readonly activationService: ActivationService,
    private readonly events: SubscriptionEventPublisher,
  ) {}

  /**
   * Called by order-service after a paid order for a device. We mint the
   * code, persist it, and publish DEVICE_ACTIVATION_REQUESTED so the
   * device-gateway can show a QR / deeplink to the buyer.
   *
   * For Phase 2 we keep it open (no service-to-service mTLS). Phase 3
   * will swap to an mTLS + signed-request pattern.
   */
  @Post('codes')
  async createCode(@Body(new ZodValidationPipe(CreateActivationCodeSchema)) dto: any) {
    const record = await this.activationService.createCode(
      dto.orderId,
      dto.userId,
      dto.imeiList,
    );
    try {
      await this.events.publishDeviceActivationRequested({
        activationCodeId: record.id,
        orderId: record.orderId,
        userId: record.userId,
        imeiList: Array.isArray(record.imeiList) ? (record.imeiList as string[]) : [],
        token: record.token,
        expiresAt: record.expiresAt.toISOString(),
      });
    } catch {
      /* swallow — caller will retry if needed */
    }
    return {
      id: record.id,
      token: record.token,
      expiresAt: record.expiresAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('codes/:token')
  async peek(@Param('token') token: string) {
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      throw new BadRequestException('Token không đúng định dạng UUID');
    }
    return this.activationService.peek(token);
  }

  @Post('redeem')
  async redeem(@Body(new ZodValidationPipe(RedeemActivationCodeSchema)) dto: any): Promise<any> {
    return this.activationService.redeem(dto.token, dto.deviceId);
  }
}
