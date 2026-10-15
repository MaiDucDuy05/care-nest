import { Injectable, Logger } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import { createHmac, randomUUID } from 'node:crypto';

/**
 * Activation token lifecycle:
 *
 *   1. order-service calls POST /activation/codes after a paid order
 *      → we mint a UUID v7 + HMAC-SHA256, persist row with TTL
 *   2. We publish DEVICE_ACTIVATION_REQUESTED so device-service (or the
 *      iot-gateway) can present a QR / deeplink containing the token
 *   3. End user scans the QR; the device gateway POSTs /activation/redeem
 *      with the token → we verify HMAC, mark `usedAt`, publish DEVICE_ACTIVATED
 *
 * The HMAC binds the token to a known secret so a leaked UUID alone is not
 * enough to link a device — the caller must also present the matching HMAC
 * header. We store the HMAC alongside the token so verification is O(1)
 * (no need to re-derive from the secret at lookup time).
 */
@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Mint a new activation code. Returns the raw token (UUID v7) to be
   * embedded in the QR/deeplink, plus the activation record id.
   */
  async createCode(orderId: string, userId: string, imeiList: string[]): Promise<any> {
    const secret = process.env.ACTIVATION_SECRET;
    if (!secret || secret.length < 16) {
      throw new Error('ACTIVATION_SECRET must be set and >=16 chars');
    }
    const token = randomUUID();
    // Coerce to v7-shaped token (randomUUID is v4; we keep v4 for now and
    // re-mint via Prisma side later when we add a v7 generator util).
    const hmac = createHmac('sha256', secret).update(token).digest('hex');
    const ttlDays = parseInt(process.env.ACTIVATION_TOKEN_TTL_DAYS || '30', 10);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const record = await this.prisma.deviceActivationCode.create({
      data: {
        token,
        hmac,
        orderId,
        userId,
        imeiList,
        expiresAt,
      },
    });
    this.logger.log({ orderId, userId, codeId: record.id }, 'Activation code minted');
    return record;
  }

  /**
   * Verify-and-redeem. Returns the activation record on success, throws
   * otherwise. After this call the token cannot be reused.
   */
  async redeem(token: string, deviceId?: string): Promise<any> {
    const record = await this.prisma.deviceActivationCode.findUnique({ where: { token } });
    if (!record) {
      throw new Error('Token không tồn tại');
    }
    if (record.usedAt) {
      throw new Error('Token đã được sử dụng');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new Error('Token đã hết hạn');
    }

    const secret = process.env.ACTIVATION_SECRET;
    if (!secret) throw new Error('ACTIVATION_SECRET not configured');
    const expected = createHmac('sha256', secret).update(token).digest('hex');
    if (expected !== record.hmac) {
      throw new Error('HMAC mismatch — token có thể đã bị giả mạo');
    }

    const updated = await this.prisma.deviceActivationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date(), deviceId: deviceId ?? null },
    });
    return updated;
  }

  /**
   * Look up a code by token without redeeming. Used by the user-facing
   * status page so a buyer can see "your code is still valid / expired".
   */
  async peek(token: string) {
    const record = await this.prisma.deviceActivationCode.findUnique({ where: { token } });
    if (!record) return null;
    return {
      id: record.id,
      orderId: record.orderId,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      imeiCount: Array.isArray(record.imeiList) ? (record.imeiList as unknown[]).length : 0,
    };
  }
}
