import { describe, it, expect, beforeEach, vi } from 'vitest';

const prismaState: any = {
  devices: new Map<string, any>(),
  codes: new Map<string, any>(), // key: token
};

vi.mock('@carenest/database', () => {
  return {
    getPrismaClient: () => ({
      device: {
        findUnique: async ({ where, include }: any) => {
          const d = prismaState.devices.get(where.deviceId);
          if (!d) return null;
          if (include?.assignments) {
            return { ...d, assignments: d.assignments ?? [] };
          }
          return d;
        },
        findMany: async ({ where }: any) => {
          let rows = Array.from(prismaState.devices.values());
          if (where?.deviceId?.in) {
            const set = new Set(where.deviceId.in);
            rows = rows.filter((r: any) => set.has(r.deviceId));
          }
          return rows;
        },
        create: async ({ data }: any) => {
          const row = { id: `dev-${prismaState.devices.size + 1}`, ...data, status: data.status || 'INACTIVE' };
          prismaState.devices.set(data.deviceId, row);
          return row;
        },
      },
      deviceActivationCode: {
        findUnique: async ({ where }: any) => prismaState.codes.get(where.token) ?? null,
        findFirst: async ({ where, orderBy, take }: any) => {
          let rows = Array.from(prismaState.codes.values());
          if (where?.usedAt?.not === null) {
            rows = rows.filter((r: any) => r.usedAt != null);
          }
          rows = rows.slice(0, take ?? 1);
          return rows[0] ?? null;
        },
        findMany: async ({ where, take = 50 }: any) => {
          let rows = Array.from(prismaState.codes.values());
          if (where?.usedAt?.not === null) {
            rows = rows.filter((r: any) => r.usedAt != null);
          }
          return rows.slice(0, take);
        },
        create: async ({ data }: any) => {
          const row = { id: `c-${prismaState.codes.size + 1}`, createdAt: new Date(), ...data };
          prismaState.codes.set(data.token, row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const cur = prismaState.codes.get(where.token);
          const updated = { ...cur, ...data };
          prismaState.codes.set(where.token, updated);
          return updated;
        },
      },
      $transaction: async (fn: any) => fn({
        deviceActivationCode: {
          findUnique: async ({ where }: any) => prismaState.codes.get(where.token) ?? null,
          update: async ({ where, data }: any) => {
            const cur = prismaState.codes.get(where.token);
            const updated = { ...cur, ...data };
            prismaState.codes.set(where.token, updated);
            return updated;
          },
        },
      }),
    }),
  };
});

import { ActivationService } from '../src/activation/activation.service.js';

describe('ActivationService', () => {
  let service: ActivationService;

  beforeEach(() => {
    prismaState.devices.clear();
    prismaState.codes.clear();
    service = new ActivationService();
  });

  describe('provisionDevice', () => {
    it('creates a device in INACTIVE status', async () => {
      const d = await service.provisionDevice({ deviceId: '123456789012345' });
      expect(d.deviceId).toBe('123456789012345');
      expect(d.status).toBe('INACTIVE');
    });

    it('rejects an invalid IMEI', async () => {
      await expect(
        service.provisionDevice({ deviceId: '12345' })
      ).rejects.toThrow(/10-15 digits/);
      await expect(
        service.provisionDevice({ deviceId: '12345abc6789012' })
      ).rejects.toThrow(/10-15 digits/);
    });

    it('rejects a duplicate IMEI', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      await expect(
        service.provisionDevice({ deviceId: '123456789012345' })
      ).rejects.toThrow(/already exists/);
    });
  });

  describe('createActivationCode', () => {
    it('rejects an empty IMEI list', async () => {
      await expect(
        service.createActivationCode({ orderId: 'o-1', userId: 'u-1', imeiList: [] })
      ).rejects.toThrow(/at least one/);
    });

    it('rejects unknown IMEIs', async () => {
      await expect(
        service.createActivationCode({
          orderId: 'o-1',
          userId: 'u-1',
          imeiList: ['000000000000000'],
        })
      ).rejects.toThrow(/Unknown IMEI/);
    });

    it('issues a 30-day code for a known IMEI', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1',
        userId: 'u-1',
        imeiList: ['123456789012345'],
      });
      expect(code.token).toMatch(/^[0-9a-f-]{36}$/i);
      expect(code.hmac).toMatch(/^[a-f0-9]{64}$/);
      expect(code.usedAt).toBeUndefined();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const ttl = code.expiresAt.getTime() - code.createdAt.getTime();
      expect(ttl).toBeGreaterThan(thirtyDaysMs - 60_000);
      expect(ttl).toBeLessThan(thirtyDaysMs + 60_000);
    });
  });

  describe('peekCode', () => {
    it('returns invalid for an unknown token', async () => {
      const r = await service.peekCode('00000000-0000-0000-0000-000000000000');
      expect(r.valid).toBe(false);
      expect(r.deviceCount).toBe(0);
      expect(r.devices).toEqual([]);
    });

    it('returns invalid for a used code', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1', userId: 'u-1', imeiList: ['123456789012345'],
      });
      await service.redeemCode(code.token, 'u-1');
      const r = await service.peekCode(code.token);
      expect(r.valid).toBe(false);
    });

    it('returns valid with device details for a fresh code', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1', userId: 'u-1', imeiList: ['123456789012345'],
      });
      const r = await service.peekCode(code.token);
      expect(r.valid).toBe(true);
      expect(r.deviceCount).toBe(1);
      expect(r.devices).toHaveLength(1);
      expect(r.devices[0]).toMatchObject({ imei: '123456789012345', model: 'care-nest-V3.2' });
    });

    it('handles a malformed token gracefully', async () => {
      const r = await service.peekCode('not-a-uuid');
      expect(r.valid).toBe(false);
    });
  });

  describe('redeemCode', () => {
    it('rejects an unknown token', async () => {
      await expect(
        service.redeemCode('00000000-0000-0000-0000-000000000000', 'u-1')
      ).rejects.toThrow(/not found/);
    });

    it('rejects a code owned by a different user', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1', userId: 'u-1', imeiList: ['123456789012345'],
      });
      await expect(
        service.redeemCode(code.token, 'u-2')
      ).rejects.toThrow(/does not belong/);
    });

    it('rejects a second redeem on the same code', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1', userId: 'u-1', imeiList: ['123456789012345'],
      });
      await service.redeemCode(code.token, 'u-1');
      await expect(
        service.redeemCode(code.token, 'u-1')
      ).rejects.toThrow(/already used/);
    });

    it('stamps usedAt on success and returns IMEIs', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1', userId: 'u-1', imeiList: ['123456789012345'],
      });
      const r = await service.redeemCode(code.token, 'u-1');
      expect(r.success).toBe(true);
      expect(r.activatedDeviceIds).toEqual(['123456789012345']);
      // verify side-effect
      const peek = await service.peekCode(code.token);
      expect(peek.valid).toBe(false);
    });
  });

  describe('resolveOwnerForImei', () => {
    it('returns null for an unknown device', async () => {
      const r = await service.resolveOwnerForImei('000000000000000');
      expect(r).toBeNull();
    });

    it('returns null for a device whose code has not been redeemed', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const r = await service.resolveOwnerForImei('123456789012345');
      expect(r).toBeNull();
    });

    it('returns the userId after a successful redeem', async () => {
      await service.provisionDevice({ deviceId: '123456789012345' });
      const code = await service.createActivationCode({
        orderId: 'o-1', userId: 'u-1', imeiList: ['123456789012345'],
      });
      await service.redeemCode(code.token, 'u-1');
      const r = await service.resolveOwnerForImei('123456789012345');
      expect(r).toBe('u-1');
    });

    it('returns null for a malformed IMEI', async () => {
      const r = await service.resolveOwnerForImei('nope');
      expect(r).toBeNull();
    });
  });
});
