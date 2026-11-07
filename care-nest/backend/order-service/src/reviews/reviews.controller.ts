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
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(['orders/:orderId/reviews', 'reviews/:orderId'])
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

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  async createDirect(
    @CurrentUser() user: { id: string },
    @Body() body: { orderId: string; rating: number; comment?: string }
  ): Promise<{ id: string; orderId: string; rating: number; createdAt: string }> {
    const input: CreateReviewInput = {
      orderId: body.orderId,
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

  @Get(['reviews', 'orders/reviews'])
  async list(
    @Query('sellerId') sellerId?: string,
    @Query('productId') productId?: string,
    @Query('limit') limitRaw = '10',
    @Query('offset') offsetRaw = '0'
  ) {
    const limit = parseInt(limitRaw, 10);
    const offset = parseInt(offsetRaw, 10);
    const take = Number.isFinite(limit) ? limit : 10;
    const skip = Number.isFinite(offset) ? offset : 0;

    if (productId) {
      return this.reviewsService.listForProduct(productId, take, skip);
    }
    if (sellerId) {
      return this.reviewsService.listForSeller(sellerId, take, skip);
    }
    return { items: [], total: 0, averageRating: 0, ratingCount: 0 };
  }
}
