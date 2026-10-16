import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../cart/guards/jwt-auth.guard.js';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
