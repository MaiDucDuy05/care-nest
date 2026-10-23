import { Controller, Post, Get, Req, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from '../payments/payments.service.js';
import { VnpayGateway } from '../gateways/vnpay.gateway.js';
import { MomoGateway } from '../gateways/momo.gateway.js';
import { CodGateway } from '../gateways/cod.gateway.js';
import { WebhookEventService } from './webhook-event.service.js';
import { WebhookRateLimitGuard } from './webhook-rate-limit.guard.js';

/**
 * Payment gateway webhooks — publicly accessible (no JWT guard).
 * Every attempt (valid or rejected) is logged to
 * `payment_webhook_events` for audit. Replays of the same
 * `gateway_event_id` are deduped via the unique index.
 *
 * S17: rate-limited to 100 requests/minute per (gateway, IP).
 */
@Controller('webhooks')
@UseGuards(WebhookRateLimitGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly vnpay: VnpayGateway,
    private readonly momo: MomoGateway,
    private readonly cod: CodGateway,
    private readonly eventLog: WebhookEventService,
  ) {}

  /** VNPay Instant Payment Notification (IPN) endpoint. */
  @Post('vnpay')
  async vnpayWebhook(@Req() req: Request) {
    const raw = req.query as Record<string, string>;
    const verification = this.vnpay.verifyWebhook({ raw, gateway: 'VNPAY', signature: raw['vnp_SecureHash'] || '' });
    const eventId = raw['vnp_TxnRef'] ?? null;

    if (!verification.isValid) {
      await this.eventLog.recordOnce({
        gateway: 'VNPAY',
        gatewayEventId: eventId,
        transactionRef: eventId,
        signatureValid: false,
        responseCode: 'INVALID_SIG',
        processedAction: 'reject',
        payload: raw,
      });
      this.logger.warn({ message: verification.message }, 'VNPay webhook signature invalid');
      throw new BadRequestException(verification.message);
    }

    const recorded = await this.eventLog.recordOnce({
      gateway: 'VNPAY',
      gatewayEventId: eventId,
      transactionRef: verification.transactionRef ?? null,
      signatureValid: true,
      responseCode: verification.responseCode ?? null,
      processedAction: 'markPaid',
      payload: raw,
    });
    if (!recorded.recorded) {
      this.logger.debug({ eventId }, 'Duplicate VNPay webhook — already processed');
      return { RspCode: '00', Message: 'Already processed' };
    }

    if (verification.responseCode === '00' && verification.transactionRef) {
      await this.paymentsService.markPaidFromWebhook(verification.transactionRef, raw);
    }
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  @Get('vnpay')
  async vnpayReturn(@Req() req: Request) {
    return this.vnpayWebhook(req as any);
  }

  /** MoMo IPN endpoint. */
  @Post('momo')
  async momoWebhook(@Req() req: Request) {
    const raw = req.body as Record<string, string>;
    const verification = this.momo.verifyWebhook({ raw, gateway: 'MOMO', signature: raw['signature'] || '' });
    const eventId = raw['requestId'] ?? raw['orderId'] ?? null;

    if (!verification.isValid || verification.responseCode !== '0') {
      await this.eventLog.recordOnce({
        gateway: 'MOMO',
        gatewayEventId: eventId,
        signatureValid: !!verification.isValid,
        responseCode: verification.responseCode ?? 'INVALID',
        processedAction: 'reject',
        payload: raw,
      });
      this.logger.warn({ message: verification.message }, 'MoMo webhook failed');
      return { resultCode: 1, message: verification.message || 'Failed' };
    }

    const recorded = await this.eventLog.recordOnce({
      gateway: 'MOMO',
      gatewayEventId: eventId,
      transactionRef: verification.transactionRef ?? null,
      signatureValid: true,
      responseCode: '0',
      processedAction: 'markPaid',
      payload: raw,
    });
    if (!recorded.recorded) {
      return { resultCode: 0, message: 'Already processed' };
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
    const eventId = `cod-${orderId}`;
    const recorded = await this.eventLog.recordOnce({
      gateway: 'COD',
      gatewayEventId: eventId,
      transactionRef: eventId,
      signatureValid: true,
      responseCode: 'OK',
      processedAction: 'markPaid',
      payload: req.body,
    });
    if (!recorded.recorded) {
      return { ok: true, dedup: true };
    }
    // In real life, this is triggered by the courier. For dev, we accept any
    // request with the correct shape and treat it as paid.
    await this.paymentsService.markPaidFromWebhook(eventId, { source: 'cod-confirm' });
    return { ok: true };
  }
}
