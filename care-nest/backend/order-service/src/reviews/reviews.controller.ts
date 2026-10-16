import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService, type CreateReviewInput } from './reviews.service.js';
import { JwtAuthGuard } from '../cart/guards/jwt-auth.guard.js';
import { CurrentUser } from '../cart/decorators/current-user.decorator.js';

/**
 * Review endpoints.
 *   POST /api/v1/orders/:orderId/reviews   — buyer writes a review (auth required)
 *   GET  /api/v1/orders/reviews?sellerId=  — list a seller's reviews (public)
 */
@Controller('api/v1/orders')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':orderId/reviews')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Body() body: { rating: number; comment?: string }
  ): Promise<{ id: string; orderId: string; rating: number; createdAt: string }> {
    const input: CreateReviewInput = {
      orderId,
      rating: Number(body.rating),
      comment: body.comment,
    };
    const r = await this.reviewsService.create(user.id, input);
    return {
      id: r.id,
      orderId: r.orderId,
      rating: r.rating,
      createdAt: r.createdAt.toISOString(),
    };
  }

  @Get('reviews')
  async list(
    @Query('sellerId') sellerId: string,
    @Query('limit') limitRaw = '10',
    @Query('offset') offsetRaw = '0'
  ) {
    const limit = parseInt(limitRaw, 10);
    const offset = parseInt(offsetRaw, 10);
    return this.reviewsService.listForSeller(
      sellerId,
      Number.isFinite(limit) ? limit : 10,
      Number.isFinite(offset) ? offset : 0
    );
  }
}
