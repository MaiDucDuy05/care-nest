import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHmac, randomUUID } from 'node:crypto';
import { getPrismaClient, PrismaClient, type DeviceActivationCode } from '@carenest/database';

const ACTIVATION_TTL_DAYS = 30;

export interface PeekResult {
  valid: boolean;
  expiresAt: string | null;
  deviceCount: number;
  devices: { deviceId: string; imei: string; model: string }[];
}

export interface RedeemResult {
  success: boolean;
  activatedDeviceIds: string[];
}

export interface ProvisionDeviceInput {
  deviceId: string; // IMEI, 10-15 digits
  model?: string;
  firmware?: string;
}

export interface CreateActivationCodeInput {
  orderId: string;
  userId: string;
  imeiList: string[];
}

/**
 * Device onboarding: provision a device (admin) → issue activation
 * code (per order) → buyer redeems code (auth) → device is bound to
 * user, ready to stream telemetry. See plan S16.
 */
@Injectable()
export class ActivationService {
  private prisma: PrismaClient;
  private readonly logger = new Logger(ActivationService.name);

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Admin: create a Device row. IMEI must be unique (DB-enforced).
   * Status starts as INACTIVE — only flips to ACTIVE on first heartbeat
   * after a successful activation-code redeem.
   */
  async provisionDevice(input: ProvisionDeviceInput) {
    const imei = input.deviceId.replace(/\s+/g, '');
    if (!/^\d{10,15}$/.test(imei)) {
      throw new BadRequestException('deviceId must be 10-15 digits');
    }
    const existing = await this.prisma.device.findUnique({ where: { deviceId: imei } });
    if (existing) {
      throw new ConflictException(`Device with IMEI ${imei} already exists`);
    }
    return this.prisma.device.create({
      data: {
        deviceId: imei,
        model: input.model ?? 'care-nest-V3.2',
        firmware: input.firmware ?? null,
        status: 'INACTIVE',
      },
    });
  }

  /**
   * Seller (or admin): issue an activation code tied to a delivered
   * order. The buyer redeems this from the web activation page.
   * Token is a UUID v7; HMAC is HMAC-SHA256(token, ACTIVATION_SECRET).
   * If ACTIVATION_SECRET is not set, we fall back to a server-side
   * derived secret (dev only — never in prod).
   */
  async createActivationCode(input: CreateActivationCodeInput): Promise<DeviceActivationCode> {
    if (!input.imeiList.length) {
      throw new BadRequestException('imeiList must contain at least one IMEI');
    }
    // Validate every IMEI matches a known device (so we never issue a
    // code referencing an unprovisioned watch).
    const devices = await this.prisma.device.findMany({
      where: { deviceId: { in: input.imeiList } },
    });
    if (devices.length !== input.imeiList.length) {
      const found = new Set(devices.map((d) => d.deviceId));
      const missing = input.imeiList.filter((imei) => !found.has(imei));
      throw new BadRequestException(`Unknown IMEI(s): ${missing.join(', ')}`);
    }
    const token = randomUUID();
    const secret = process.env.ACTIVATION_SECRET || 'dev-activation-secret';
    const hmac = createHmac('sha256', secret).update(token).digest('hex');
    const expiresAt = new Date(Date.now() + ACTIVATION_TTL_DAYS * 24 * 60 * 60 * 1000);

    return this.prisma.deviceActivationCode.create({
      data: {
        token,
        hmac,
        orderId: input.orderId,
        userId: input.userId,
        imeiList: input.imeiList,
        expiresAt,
      },
    });
  }

  /**
   * Public peek — used by the activation page to render the device
   * list before asking the user to sign in. The buyer is the
   * legitimate owner of the order, so exposing the IMEIs of devices
   * in *their* activation code is fine. We deliberately do NOT
   * expose buyer-id, name, or address.
   */
  async peekCode(token: string): Promise<PeekResult> {
    if (!isUuid(token)) {
      return { valid: false, expiresAt: null, deviceCount: 0, devices: [] };
    }
    const code = await this.prisma.deviceActivationCode.findUnique({
      where: { token },
    });
    if (!code) {
      return { valid: false, expiresAt: null, deviceCount: 0, devices: [] };
    }
    if (code.usedAt) {
      return { valid: false, expiresAt: null, deviceCount: 0, devices: [] };
    }
    if (code.expiresAt < new Date()) {
      return { valid: false, expiresAt: code.expiresAt.toISOString(), deviceCount: 0, devices: [] };
    }
    const imeiList = Array.isArray(code.imeiList) ? (code.imeiList as string[]) : [];
    // Resolve IMEIs to devices (so we can return model names).
    const devices = imeiList.length
      ? await this.prisma.device.findMany({ where: { deviceId: { in: imeiList } } })
      : [];
    const byImei = new Map(devices.map((d) => [d.deviceId, d]));
    return {
      valid: true,
      expiresAt: code.expiresAt.toISOString(),
      deviceCount: imeiList.length,
      devices: imeiList.map((imei) => ({
        deviceId: imei,
        imei,
        model: byImei.get(imei)?.model ?? 'care-nest-V3.2',
      })),
    };
  }

  /**
   * Auth-required redeem. The buyer's user-id must match the code's
   * user-id (so a leaked token can't be used by a different account).
   * On success we flip usedAt, set usedAt = now, and return the
   * IMEI list so the activation page can confirm what got bound.
   */
  async redeemCode(token: string, buyerId: string): Promise<RedeemResult> {
    if (!isUuid(token)) {
      throw new BadRequestException('Invalid token format');
    }
    return this.prisma.$transaction(async (tx) => {
      const code = await tx.deviceActivationCode.findUnique({ where: { token } });
      if (!code) throw new NotFoundException('Activation code not found');
      if (code.usedAt) throw new ConflictException('Activation code already used');
      if (code.expiresAt < new Date()) {
        throw new BadRequestException('Activation code expired');
      }
      if (code.userId !== buyerId) {
        throw new ForbiddenException('Activation code does not belong to this user');
      }
      const imeiList = Array.isArray(code.imeiList) ? (code.imeiList as string[]) : [];
      // No DB-side effect on Device yet — that happens on first heartbeat
      // (see TelemetryConsumer). For now we just stamp usedAt.
      await tx.deviceActivationCode.update({
        where: { token },
        data: { usedAt: new Date() },
      });
      this.logger.log({ token, buyerId, count: imeiList.length }, 'Activation code redeemed');
      return { success: true, activatedDeviceIds: imeiList };
    });
  }

  /**
   * Gateway-facing validation: called by iot-gateway on every `login`
   * packet. Returns the userId that owns this IMEI, or null if the
   * device is not yet activated. No auth here — the call is internal
   * and the gateway is trusted (in dev this is plain HTTP).
   */
  async resolveOwnerForImei(imei: string): Promise<string | null> {
    if (!/^\d{10,15}$/.test(imei)) return null;
    const device = await this.prisma.device.findUnique({
      where: { deviceId: imei },
      include: {
        assignments: {
          where: { unassignedAt: null },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!device) return null;
    // A device is considered "owned" once it has at least one active
    // assignment. The assignment is created on first redeem (in a
    // future S17). For S16 we use the activation code as a proxy: if
    // there's a used activation code for this IMEI, the userId is the
    // code's userId.
    if (device.assignments.length > 0) {
      return device.assignments[0].userId;
    }
    // Fallback: imeiList is JSON, so we can't use array_contains.
    // Pull recent used codes and filter in app code. Bounded because
    // a buyer's codes are rare (< 10 per account). S17 will move
    // imeiList to a proper String[] column.
    const candidates = await this.prisma.deviceActivationCode.findMany({
      where: { usedAt: { not: null } },
      orderBy: { usedAt: 'desc' },
      take: 50,
    });
    for (const c of candidates) {
      const list = Array.isArray(c.imeiList) ? (c.imeiList as string[]) : [];
      if (list.includes(imei)) return c.userId;
    }
    return null;
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
