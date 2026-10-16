import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  getPrismaClient,
  PrismaClient,
  OrderStatus,
  type Review,
} from '@carenest/database';

export interface CreateReviewInput {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface SellerReviewListItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyerName: string;
  orderId: string;
}

export interface SellerReviewsResult {
  items: SellerReviewListItem[];
  total: number;
  averageRating: number;
  ratingCount: number;
}

/**
 * Read + write reviews. On insert we let the DB trigger
 * `reviews_after_insert_recompute_seller_rating` keep
 * `sellers.rating_avg` / `rating_count` in sync — we don't recompute
 * here to avoid a second transaction that could drift.
 */
@Injectable()
export class ReviewsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Buyer writes a review for one of their delivered orders. One
   * review per order (DB-enforced via UNIQUE on orderId). Rating
   * must be 1..5. Trigger updates seller aggregates.
   */
  async create(buyerId: string, input: CreateReviewInput): Promise<Review> {
    const rating = Math.trunc(input.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('rating must be an integer between 1 and 5');
    }
    const comment = input.comment?.trim();
    if (comment && comment.length > 2000) {
      throw new BadRequestException('comment must be 2000 characters or fewer');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true },
    });
    if (!order) throw new NotFoundException(`Order ${input.orderId} not found`);
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only review your own orders');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be reviewed');
    }

    const existing = await this.prisma.review.findUnique({
      where: { orderId: input.orderId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This order has already been reviewed');
    }

    return this.prisma.review.create({
      data: {
        orderId: input.orderId,
        sellerId: order.sellerId,
        buyerId,
        rating,
        comment: comment || null,
      },
    });
  }

  /**
   * Public-ish read: list reviews for a seller, newest first.
   * Buyer name is exposed so storefronts can render a friendly
   * label; we never expose buyerId or email.
   */
  async listForSeller(sellerId: string, limit = 10, offset = 0): Promise<SellerReviewsResult> {
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = Math.max(offset, 0);

    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { ratingAvg: true, ratingCount: true },
    });
    if (!seller) throw new NotFoundException(`Seller ${sellerId} not found`);

    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          buyer: { select: { fullName: true } },
        },
      }),
      this.prisma.review.count({ where: { sellerId } }),
    ]);

    const items: SellerReviewListItem[] = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      buyerName: r.buyer.fullName,
      orderId: r.orderId,
    }));

    return {
      items,
      total,
      averageRating: Number(seller.ratingAvg),
      ratingCount: seller.ratingCount,
    };
  }
}
