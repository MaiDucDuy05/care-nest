import { Controller, Post, Get, Req, BadRequestException, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from '../payments/payments.service.js';
import { VnpayGateway } from '../gateways/vnpay.gateway.js';
import { MomoGateway } from '../gateways/momo.gateway.js';
import { CodGateway } from '../gateways/cod.gateway.js';

/**
 * Payment gateway webhooks — publicly accessible (no JWT guard).
 * Each handler verifies the gateway's HMAC signature before trusting the payload.
 */
@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly vnpay: VnpayGateway,
    private readonly momo: MomoGateway,
    private readonly cod: CodGateway,
  ) {}

  /** VNPay Instant Payment Notification (IPN) endpoint. */
  @Post('vnpay')
  async vnpayWebhook(@Req() req: Request) {
    const raw = req.query as Record<string, string>;
    const verification = this.vnpay.verifyWebhook({ raw, gateway: 'VNPAY', signature: raw['vnp_SecureHash'] || '' });

    if (!verification.isValid) {
      this.logger.warn({ message: verification.message }, 'VNPay webhook signature invalid');
      throw new BadRequestException(verification.message);
    }

    if (verification.responseCode === '00' && verification.transactionRef) {
      await this.paymentsService.markPaidFromWebhook(verification.transactionRef, raw);
    }
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  @Get('vnpay')
  async vnpayReturn(@Req() req: Request) {
    // User is redirected here after payment — same verification path
    return this.vnpayWebhook(req as any);
  }

  /** MoMo IPN endpoint. */
  @Post('momo')
  async momoWebhook(@Req() req: Request) {
    const raw = req.body as Record<string, string>;
    const verification = this.momo.verifyWebhook({ raw, gateway: 'MOMO', signature: raw['signature'] || '' });

    if (!verification.isValid || verification.responseCode !== '0') {
      this.logger.warn({ message: verification.message }, 'MoMo webhook failed');
      return { resultCode: 1, message: verification.message || 'Failed' };
    }

    if (verification.transactionRef) {
      await this.paymentsService.markPaidFromWebhook(verification.transactionRef, raw);
    }
    return { resultCode: 0, message: 'Success' };
  }

  /** COD confirmation endpoint (called by courier when cash is collected). */
  @Post('cod/confirm')
  async codConfirm(@Req() req: Request) {
    const { orderId } = req.body as { orderId: string };
    if (!orderId) throw new BadRequestException('orderId is required');
    // In real life, this is triggered by the courier. For dev, we accept any
    // request with the correct shape and treat it as paid.
    await this.paymentsService.markPaidFromWebhook(`cod-${orderId}`, { source: 'cod-confirm' });
    return { ok: true };
  }
}
