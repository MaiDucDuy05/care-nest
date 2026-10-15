import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '@carenest/shared-utils';
import { SubscriptionsService } from './subscriptions.service.js';
import {
  CreateSubscriptionSchema,
  ChangePlanSchema,
  CancelSubscriptionSchema,
} from './dto/subscriptions.dto.js';

@Controller('api/v1/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('mine')
  async listMine(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscriptions(user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.subscriptionsService.getById(id);
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(CreateSubscriptionSchema)) dto: any,
  ) {
    return this.subscriptionsService.create(user.id, dto);
  }

  @Post(':id/change-plan')
  async changePlan(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ChangePlanSchema)) dto: any,
  ) {
    return this.subscriptionsService.changePlan(user.id, id, dto);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelSubscriptionSchema)) dto: any,
  ) {
    return this.subscriptionsService.cancel(user.id, id, dto);
  }
}
