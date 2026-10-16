import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { JwtAuthGuard } from '../cart/guards/jwt-auth.guard.js';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, JwtAuthGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}
