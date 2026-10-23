import { Controller, Get, Post, Delete, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { PushSubscriptionsService } from './push-subscriptions.service.js';
import { PushSubscriptionCreateSchema } from './dto/push-subscription.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('push/subscriptions')
@UseGuards(JwtAuthGuard)
export class PushSubscriptionsController {
  constructor(private readonly pushSubscriptionsService: PushSubscriptionsService) {}

  @Post()
  async subscribe(
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    const parsed = PushSubscriptionCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.pushSubscriptionsService.subscribe(user.id, parsed.data);
  }

  @Delete()
  async unsubscribe(@Body() body: { endpoint?: string }, @Query('endpoint') queryEndpoint?: string) {
    const endpoint = body?.endpoint ?? queryEndpoint;
    if (!endpoint) {
      throw new BadRequestException('endpoint is required');
    }
    await this.pushSubscriptionsService.unsubscribe(endpoint);
    return { ok: true };
  }

  @Get('me')
  async listMine(@CurrentUser() user: { id: string }) {
    return this.pushSubscriptionsService.listForUser(user.id);
  }
}
