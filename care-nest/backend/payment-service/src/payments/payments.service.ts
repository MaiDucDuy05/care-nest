import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@carenest/database';
import { MetricsService } from '@carenest/nestjs-common';
import { PaymentsRepository } from './payments.repository.js';
import { VnpayGateway } from '../gateways/vnpay.gateway.js';
import { MomoGateway } from '../gateways/momo.gateway.js';
import { CodGateway } from '../gateways/cod.gateway.js';
import { EscrowService } from '../escrow/escrow.service.js';
import { OrderEventPublisher } from '../kafka/order-event.publisher.js';
import { PayoutsService } from '../payouts/payouts.service.js';
import type { PaymentGateway } from '../gateways/payment-gateway.js';
import type { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly vnpay: VnpayGateway,
    private readonly momo: MomoGateway,
    private readonly cod: CodGateway,
    private readonly escrowService: EscrowService,
    private readonly eventPublisher: OrderEventPublisher,
    private readonly payoutsService: PayoutsService,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Create a payment intent for an order.
   * Idempotent: if the same `idempotencyKey` is replayed, returns the
   * existing payment record (so a retried request never creates two
   * transactions).
   */
  async createPayment(userId: string, dto: CreatePaymentDto) {
    // Dedup check by idempotency key
    const existing = await this.paymentsRepository.findByIdempotencyKey(dto.idempotencyKey);
    if (existing) {
      return existing;
    }

    // Check the order doesn't already have a payment
    const byOrder = await this.paymentsRepository.findByOrderId(dto.orderId);
    if (byOrder) {
      throw new BadRequestException(`Đơn hàng ${dto.orderId} đã có payment`);
    }

    const gateway = this.pickGateway(dto.method);
    const result = await gateway.createPayment({
      orderId: dto.orderId,
      amount: dto.amount,
      orderInfo: `Thanh toán đơn hàng ${dto.orderId}`,
      returnUrl: dto.returnUrl || '',
      idempotencyKey: dto.idempotencyKey,
    });

    const payment = await this.paymentsRepository.create({
      orderId: dto.orderId,
      userId,
      method: dto.method as PaymentMethod,
      amount: dto.amount,
      transactionRef: result.transactionRef,
      expiredAt: result.expiresAt,
      gatewayResponse: { paymentUrl: result.paymentUrl } as any,
    });

    return payment;
  }

  /**
   * Mark a payment as paid (called by the webhook controller after signature
   * verification). Also schedules escrow hold and publishes ORDER_PAID.
   */
  async markPaidFromWebhook(transactionRef: string, gatewayResponse?: object) {
    const existing = await this.paymentsRepository.findByTransactionRef(transactionRef);
    if (!existing) {
      this.logger.warn({ transactionRef }, 'markPaid: payment not found');
      return null;
    }
    if (existing.status === PaymentStatus.PAID) {
      // Idempotent: already paid
      return existing;
    }

    const updated = await this.paymentsRepository.markPaid(transactionRef, gatewayResponse);

    this.metrics.inc('payments_total', { method: existing.method, status: 'paid' });

    // Schedule escrow 7-day hold
    try {
      await this.escrowService.hold(existing.orderId, Number(existing.amount));
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to schedule escrow hold');
    }

    // Publish ORDER_PAID so order-service can flip status
    try {
      await this.eventPublisher.publishOrderPaid({
        orderId: existing.orderId,
        paymentId: existing.id,
        amount: Number(existing.amount),
        method: existing.method,
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish ORDER_PAID');
    }

    return updated;
  }

  /**
   * S17: full refund orchestration.
   *
   *   1. Look up the original payment and validate it's PAID.
   *   2. Push the refund to the gateway (dev stub returns synthetic ref).
   *   3. Reverse the seller's wallet credit (debit + cancel PENDING Payout).
   *   4. Mark the payment REFUNDED.
   *   5. Publish ORDER_REFUNDED so order-service can flip the order.
   *
   * If any step fails the operation is half-done: ops needs to see the
   * partial state in `payment_webhook_events` and the wallet entries.
   * We log loudly and re-throw — caller decides whether to retry.
   */
  async refund(transactionRef: string, dto: RefundPaymentDto) {
    const payment = await this.paymentsRepository.findByTransactionRef(transactionRef);
    if (!payment) throw new NotFoundException(`Không tìm thấy payment ${transactionRef}`);
    if (payment.status === PaymentStatus.REFUNDED) {
      // Idempotent refund.
      return payment;
    }
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Chỉ refund được payment đã PAID');
    }
    if (dto.amount && dto.amount > Number(payment.amount)) {
      throw new BadRequestException('Số tiền refund vượt quá payment');
    }
    // Default to a full refund when no amount is provided.
    const refundAmount = dto.amount ?? Number(payment.amount);

    // 1. Push refund to gateway. The default impl is a dev-only stub.
    const gateway = this.pickGateway(payment.method as PaymentMethod);
    let gatewayResult: { refundRef: string; accepted: boolean; message?: string };
    try {
      gatewayResult = await (gateway as PaymentGateway).refund({
        transactionRef: payment.transactionRef!,
        amount: refundAmount,
        reason: dto.reason,
      });
    } catch (err: any) {
      this.logger.error({ err: err.message, transactionRef }, 'Gateway refund failed');
      throw new BadRequestException(`Gateway refund failed: ${err.message}`);
    }
    if (!gatewayResult.accepted) {
      throw new BadRequestException(`Gateway rejected refund: ${gatewayResult.message}`);
    }

    // 2. Reverse the seller's wallet credit.
    const walletResult = await this.payoutsService.reverseCreditForOrder({
      orderId: payment.orderId,
      reason: `Refund ${refundAmount}VND for payment ${transactionRef}`,
    });
    this.logger.log(
      { orderId: payment.orderId, reversed: walletResult.reversed, amount: walletResult.amountVnd },
      'Wallet credit reversed'
    );

    // 3. Mark the payment refunded.
    const updated = await this.paymentsRepository.markRefunded(transactionRef, refundAmount);
    updated.gatewayResponse = { ...(updated.gatewayResponse as any ?? {}), refundRef: gatewayResult.refundRef };

    this.metrics.inc('refunds_total', { method: payment.method, gateway_accepted: String(gatewayResult.accepted) });
    this.metrics.inc('payments_total', { method: payment.method, status: 'refunded' });

    // 4. Publish ORDER_REFUNDED so order-service can flip the order.
    try {
      await this.eventPublisher.publishOrderRefunded({
        orderId: payment.orderId,
        paymentId: payment.id,
        amountVnd: refundAmount,
        refundRef: gatewayResult.refundRef,
        reason: dto.reason,
      });
    } catch (err: any) {
      this.logger.warn({ err: err.message }, 'Failed to publish ORDER_REFUNDED');
    }

    return updated;
  }

  private pickGateway(method: PaymentMethod) {
    switch (method) {
      case PaymentMethod.VNPAY:
        return this.vnpay;
      case PaymentMethod.MOMO:
        return this.momo;
      case PaymentMethod.COD:
        return this.cod;
      default:
        throw new BadRequestException(`Phương thức thanh toán ${method} chưa được hỗ trợ trong Phase 1`);
    }
  }
}
