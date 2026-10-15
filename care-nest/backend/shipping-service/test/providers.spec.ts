import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GhnProvider } from '../src/providers/ghn.provider.js';
import { GhtkProvider } from '../src/providers/ghtk.provider.js';

describe('GhnProvider.mapStatus', () => {
  const cases: Array<[string, string]> = [
    ['ready_to_pick', 'PENDING_PICKUP'],
    ['picking', 'PICKED_UP'],
    ['transporting', 'IN_TRANSIT'],
    ['storing', 'IN_TRANSIT'],
    ['delivering', 'OUT_FOR_DELIVERY'],
    ['delivered', 'DELIVERED'],
    ['delivery_fail', 'FAILED_ATTEMPT'],
    ['return', 'RETURNED'],
    ['cancel', 'CANCELLED'],
    ['exception', 'FAILED_ATTEMPT'],
    ['unknown_garbage', 'FAILED_ATTEMPT'],
  ];
  for (const [input, expected] of cases) {
    it(`maps "${input}" → ${expected}`, () => {
      expect(GhnProvider.mapStatus(input)).toBe(expected);
    });
  }
});

describe('GhtkProvider.mapStatus', () => {
  const cases: Array<[string | number, string]> = [
    [-1, 'CANCELLED'],
    [1, 'PENDING_PICKUP'],
    [2, 'PICKED_UP'],
    [3, 'IN_TRANSIT'],
    [4, 'IN_TRANSIT'],
    [5, 'OUT_FOR_DELIVERY'],
    [6, 'DELIVERED'],
    [7, 'RETURNED'],
    [8, 'FAILED_ATTEMPT'],
    [9, 'FAILED_ATTEMPT'],
    [20, 'DELIVERED'],
    [21, 'FAILED_ATTEMPT'],
    [99, 'FAILED_ATTEMPT'],
  ];
  for (const [input, expected] of cases) {
    it(`maps ${JSON.stringify(input)} → ${expected}`, () => {
      expect(GhtkProvider.mapStatus(input)).toBe(expected);
    });
  }
});

describe('GHN sandbox quote (no token configured)', () => {
  // Snapshot env so we can restore
  const originalToken = process.env.GHN_TOKEN;
  const originalShopId = process.env.GHN_SHOP_ID;
  beforeAll(() => {
    delete process.env.GHN_TOKEN;
    delete process.env.GHN_SHOP_ID;
  });
  afterAll(() => {
    if (originalToken) process.env.GHN_TOKEN = originalToken;
    if (originalShopId) process.env.GHN_SHOP_ID = originalShopId;
  });

  it('returns a deterministic sandbox quote', async () => {
    const p = new GhnProvider();
    const q = await p.calculateFee({
      fromAddress: { name: 'A', phone: '0900000000', address: '1', ward: 'w', district: 'd', province: 'Hà Nội' },
      toAddress: { name: 'B', phone: '0900000001', address: '2', ward: 'w', district: 'd', province: 'Hà Nội' },
      package: { weightGrams: 1000 },
    });
    expect(q.carrierCode).toBe('GHN');
    expect(q.totalFee).toBeGreaterThan(0);
    expect(q.estimatedDeliveryDays).toBeGreaterThan(0);
  });

  it('adds cross-province surcharge', async () => {
    const p = new GhnProvider();
    const sameProvince = await p.calculateFee({
      fromAddress: { name: 'A', phone: '0900000000', address: '1', ward: 'w', district: 'd', province: 'Hà Nội' },
      toAddress: { name: 'B', phone: '0900000001', address: '2', ward: 'w', district: 'd', province: 'Hà Nội' },
      package: { weightGrams: 1000 },
    });
    const crossProvince = await p.calculateFee({
      fromAddress: { name: 'A', phone: '0900000000', address: '1', ward: 'w', district: 'd', province: 'Hà Nội' },
      toAddress: { name: 'B', phone: '0900000001', address: '2', ward: 'w', district: 'd', province: 'TP.HCM' },
      package: { weightGrams: 1000 },
    });
    expect(crossProvince.totalFee).toBeGreaterThan(sameProvince.totalFee);
    expect(crossProvince.estimatedDeliveryDays).toBeGreaterThan(sameProvince.estimatedDeliveryDays);
  });
});

describe('GHTK sandbox quote (no token configured)', () => {
  const originalToken = process.env.GHTK_TOKEN;
  beforeAll(() => { delete process.env.GHTK_TOKEN; });
  afterAll(() => { if (originalToken) process.env.GHTK_TOKEN = originalToken; });

  it('GHTK is cheaper than GHN for the same route', async () => {
    const ghn = new GhnProvider();
    const ghtk = new GhtkProvider();
    const input = {
      fromAddress: { name: 'A', phone: '0900000000', address: '1', ward: 'w', district: 'd', province: 'Hà Nội' },
      toAddress: { name: 'B', phone: '0900000001', address: '2', ward: 'w', district: 'd', province: 'TP.HCM' },
      package: { weightGrams: 500 },
    };
    const a = await ghn.calculateFee(input);
    const b = await ghtk.calculateFee(input);
    expect(b.totalFee).toBeLessThan(a.totalFee);
  });
});
