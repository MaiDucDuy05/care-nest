import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient, PaymentStatus, type PaymentMethod } from '@carenest/database';

@Injectable()
export class PaymentsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Find existing payment by idempotency key. The key is the dedup primitive
   * — webhooks retry, so we need a deterministic way to detect replays.
   */
  async findByIdempotencyKey(key: string): Promise<any> {
    return this.prisma.payment.findFirst({
      where: { transactionRef: key },
    });
  }

  async findByTransactionRef(ref: string): Promise<any> {
    return this.prisma.payment.findUnique({ where: { transactionRef: ref } });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<any> {
    return this.prisma.payment.findUnique({ where: { orderId } });
  }

  async create(data: {
    orderId: string;
    userId: string;
    method: PaymentMethod;
    amount: number;
    transactionRef: string;
    expiredAt?: Date;
    gatewayResponse?: object;
  }): Promise<any> {
    try {
      return await this.prisma.payment.create({
        data: {
          orderId: data.orderId,
          userId: data.userId,
          method: data.method,
          amount: data.amount,
          status: PaymentStatus.PENDING,
          transactionRef: data.transactionRef,
          expiredAt: data.expiredAt,
          gatewayResponse: data.gatewayResponse as any,
        },
      });
    } catch (err: any) {
      // Unique constraint on transactionRef => duplicate idempotency key
      if (err.code === 'P2002') {
        throw new ConflictException('Idempotency key đã tồn tại');
      }
      throw err;
    }
  }

  async markPaid(transactionRef: string, gatewayResponse?: object): Promise<any> {
    return this.prisma.payment.update({
      where: { transactionRef },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        gatewayResponse: gatewayResponse as any,
      },
    });
  }

  async markFailed(transactionRef: string, reason?: string): Promise<any> {
    return this.prisma.payment.update({
      where: { transactionRef },
      data: { status: PaymentStatus.FAILED },
    });
  }

  async markRefunded(transactionRef: string, amount?: number): Promise<any> {
    return this.prisma.payment.update({
      where: { transactionRef },
      data: { status: PaymentStatus.REFUNDED },
    });
  }
}
