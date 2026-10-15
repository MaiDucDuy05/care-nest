import {
  Body,
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ShippingProviderFactory } from '../providers/shipping-provider.factory.js';
import { ShipmentsRepository } from '../shipments/shipments.repository.js';
import { ShipmentsService } from '../shipments/shipments.service.js';
import { GhnProvider } from '../providers/ghn.provider.js';
import { GhtkProvider } from '../providers/ghtk.provider.js';
import { type ShipmentStatus } from '../providers/shipping-provider.interface.js';

interface NormalizedStatusChange {
  trackingCode: string;
  status: ShipmentStatus;
  description?: string;
  location?: string;
  raw: unknown;
}

/**
 * Inbound webhooks from carriers. Both carriers send POST requests with:
 *   - a raw JSON body
 *   - a signature header (X-GHN-Signature for GHN, X-GHTK-Signature for GHTK)
 *
 * The body is read as raw text (NOT JSON-parsed by express.json) so we can
 * verify the HMAC over the exact bytes the carrier sent. We mount these
 * routes with a separate NestJS app or `rawBody: true` config in production.
 *
 * For Phase 2 / sandbox we just read the parsed body and verify against
 * the same JSON, which is fine for testing. Phase 3 will mount a raw-body
 * middleware on these routes.
 */
@Controller('api/v1/webhooks/shipping')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly factory: ShippingProviderFactory,
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly shipmentsService: ShipmentsService,
  ) {}

  @Post('ghn')
  @HttpCode(HttpStatus.OK)
  async ghn(
    @Req() req: Request,
    @Headers('x-ghn-signature') signature: string,
    @Body() body: any,
  ) {
    const provider = this.factory.get('GHN');
    const raw = JSON.stringify(body ?? {});
    const verification = provider.verifyWebhookSignature(raw, signature ?? '');
    if (!verification.isValid) {
      this.logger.warn({ reason: verification.reason }, 'GHN webhook signature failed');
      throw new BadRequestException(verification.reason ?? 'Invalid signature');
    }

    // GHN's payload: { OrderCode, Status, Time, Reason, ... }
    const trackingCode = body?.OrderCode ?? body?.order_code;
    if (!trackingCode) {
      throw new BadRequestException('Missing OrderCode in GHN webhook');
    }
    const status = GhnProvider.mapStatus(body?.Status ?? '');
    return this.apply({ trackingCode, status, description: body?.Reason, raw: body });
  }

  @Post('ghtk')
  @HttpCode(HttpStatus.OK)
  async ghtk(
    @Req() req: Request,
    @Headers('x-ghtk-signature') signature: string,
    @Body() body: any,
  ) {
    const provider = this.factory.get('GHTK');
    const raw = JSON.stringify(body ?? {});
    const verification = provider.verifyWebhookSignature(raw, signature ?? '');
    if (!verification.isValid) {
      this.logger.warn({ reason: verification.reason }, 'GHTK webhook signature failed');
      throw new BadRequestException(verification.reason ?? 'Invalid signature');
    }

    // GHTK's payload: { label_id, status (numeric), status_text, ... }
    const trackingCode = body?.label_id ?? body?.tracking_code;
    if (!trackingCode) {
      throw new BadRequestException('Missing label_id in GHTK webhook');
    }
    const status = GhtkProvider.mapStatus(body?.status ?? '');
    return this.apply({
      trackingCode,
      status,
      description: body?.status_text,
      raw: body,
    });
  }

  private async apply(change: NormalizedStatusChange) {
    const shipment = await this.shipmentsRepository.findByTrackingCode(change.trackingCode);
    if (!shipment) {
      // Idempotent: a webhook for a tracking code we don't have is a no-op.
      // We return 200 so the carrier doesn't retry forever.
      this.logger.warn({ trackingCode: change.trackingCode }, 'Webhook for unknown tracking code');
      return { ok: true, ignored: 'unknown_tracking_code' };
    }
    const updated = await this.shipmentsService.applyStatusChange(
      shipment,
      change.status,
      change.description,
      change.location,
    );
    return { ok: true, status: updated.status };
  }
}
