import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ActivationService } from './activation.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

interface AuthedUser {
  id: string;
  role?: string;
}

/**
 * Activation endpoints.
 *   GET  /api/v1/activation/codes/:token  — public peek (no PII)
 *   POST /api/v1/activation/redeem        — auth, buyer redeems a code
 *
 * Provisioning is exposed on /api/v1/devices (devices.controller).
 */
@Controller('api/v1/activation')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Get('codes/:token')
  async peek(@Param('token') token: string) {
    return this.activationService.peekCode(token);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(
    @CurrentUser() user: AuthedUser,
    @Body() body: { token: string }
  ) {
    if (!body?.token || typeof body.token !== 'string') {
      throw new BadRequestException('token is required');
    }
    return this.activationService.redeemCode(body.token, user.id);
  }

  /**
   * Internal: called by iot-gateway on every `login` packet. Returns
   * the userId bound to this IMEI, or null if the device is not yet
   * activated. No auth — internal-only endpoint.
   */
  @Post('internal/resolve-owner')
  async resolveOwner(@Body() body: { imei: string }) {
    if (!body?.imei) throw new BadRequestException('imei is required');
    const userId = await this.activationService.resolveOwnerForImei(body.imei);
    return { userId };
  }
}
