import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '@carenest/shared-utils';
import { SubscriptionsService } from './subscriptions.service.js';
import { PlansRepository } from '../plans/plans.repository.js';
import { calculateProration } from '../proration/proration.js';
import {
  CreateSubscriptionSchema,
  ChangePlanSchema,
  CancelSubscriptionSchema,
} from './dto/subscriptions.dto.js';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansRepository: PlansRepository,
  ) {}

  @Get('me')
  async getMySubscription(@CurrentUser() user: { id: string }) {
    const list = await this.subscriptionsService.getMySubscriptions(user.id);
    if (!list || list.length === 0) return null;
    const sub = list[0];
    return {
      ...sub,
      planId: sub.planId || sub.plan,
      interval: 'MONTHLY',
      currentPeriodStart: sub.startedAt,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  @Get('me/payments')
  async getMyPayments(@CurrentUser() _user: { id: string }) {
    return [];
  }

  @Get('mine')
  async listMine(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscriptions(user.id);
  }

  @Post('preview-proration')
  async previewProration(
    @CurrentUser() _user: { id: string },
    @Body() body: { fromPlanId: string; toPlanId: string; effectiveAt?: string },
  ) {
    if (!body?.fromPlanId || !body?.toPlanId) {
      throw new BadRequestException('fromPlanId and toPlanId are required');
    }
    const [fromPlan, toPlan] = await Promise.all([
      this.plansRepository.findById(body.fromPlanId),
      this.plansRepository.findById(body.toPlanId),
    ]);

    if (!fromPlan || !toPlan) {
      throw new NotFoundException('One or both plans not found');
    }

    const effectiveAt = body.effectiveAt ? new Date(body.effectiveAt) : new Date();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const proration = calculateProration({
      currentPriceMonthly: Number(fromPlan.priceMonthly),
      newPriceMonthly: Number(toPlan.priceMonthly),
      effectiveAt,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    const creditVnd = proration.netCharge < 0 ? Math.abs(proration.netCharge) : 0;
    const chargeVnd = proration.netCharge > 0 ? proration.netCharge : 0;
    const mode = proration.isUpgrade ? 'UPGRADE' : proration.isDowngrade ? 'DOWNGRADE' : 'SAME';

    return {
      creditVnd,
      chargeVnd,
      netVnd: proration.netCharge,
      mode,
    };
  }

  @Post('switch')
  async switchPlan(
    @CurrentUser() user: { id: string },
    @Body() body: { toPlanId: string },
  ) {
    if (!body?.toPlanId) throw new BadRequestException('toPlanId is required');
    const toPlan = await this.plansRepository.findById(body.toPlanId);
    if (!toPlan) throw new NotFoundException('Target plan not found');

    const subs = await this.subscriptionsService.getMySubscriptions(user.id);
    if (subs.length === 0) {
      return this.subscriptionsService.create(user.id, {
        planCode: toPlan.code,
        trialDays: 0,
      } as any);
    }

    const currentSub = subs[0];
    return this.subscriptionsService.applyChangePlan(currentSub.id, toPlan.id, toPlan.code);
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
