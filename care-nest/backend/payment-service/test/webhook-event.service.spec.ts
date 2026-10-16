import { describe, it, expect, beforeEach, vi } from 'vitest';

const prismaState: any = {
  events: new Map<string, any>(), // key: gateway:gatewayEventId
};

vi.mock('@carenest/database', () => {
  return {
    getPrismaClient: () => ({
      paymentWebhookEvent: {
        findUnique: async ({ where }: any) => {
          const k = `${where.gateway_gatewayEventId.gateway}:${where.gateway_gatewayEventId.gatewayEventId}`;
          return prismaState.events.get(k) ?? null;
        },
        create: async ({ data }: any) => {
          // Postgres unique constraint with NULL is "distinct" — two
          // rows with NULL gatewayEventId can both exist. The mock
          // models that by keying only on the gateway when eventId
          // is null. We use a counter suffix for non-null eventIds
          // and per-row uniqueness via an internal id.
          const k = data.gatewayEventId
            ? `${data.gateway}:${data.gatewayEventId}`
            : `__null__:${data.gateway}:${prismaState.events.size + 1}`;
          if (data.gatewayEventId && prismaState.events.has(k)) {
            const err: any = new Error('duplicate');
            err.code = 'P2002';
            throw err;
          }
          const row = { id: `e-${prismaState.events.size + 1}`, ...data };
          prismaState.events.set(k, row);
          return row;
        },
      },
    }),
  };
});

// Minimal MetricsService stub for unit tests
const stubMetrics = {
  inc: vi.fn(),
  observe: vi.fn(),
  startTimer: vi.fn(() => () => {}),
  render: vi.fn(async () => ''),
  contentType: vi.fn(() => 'text/plain; version=0.0.4'),
  registry: { getSingleMetric: () => null, registerMetric: vi.fn() },
} as any;

import { WebhookEventService } from '../src/webhooks/webhook-event.service.js';

describe('WebhookEventService (S17)', () => {
  let service: WebhookEventService;

  beforeEach(() => {
    prismaState.events.clear();
    vi.clearAllMocks();
    service = new WebhookEventService(stubMetrics);
  });

  it('records a new event and returns recorded=true', async () => {
    const r = await service.recordOnce({
      gateway: 'VNPAY',
      gatewayEventId: 'tx-1',
      transactionRef: 'tx-1',
      signatureValid: true,
      responseCode: '00',
      processedAction: 'markPaid',
      payload: { foo: 'bar' },
    });
    expect(r.recorded).toBe(true);
  });

  it('returns recorded=false for a replay', async () => {
    await service.recordOnce({
      gateway: 'VNPAY',
      gatewayEventId: 'tx-1',
      signatureValid: true,
      payload: {},
    });
    const r = await service.recordOnce({
      gateway: 'VNPAY',
      gatewayEventId: 'tx-1',
      signatureValid: true,
      payload: {},
    });
    expect(r.recorded).toBe(false);
  });

  it('records events without a gateway event id (no dedup)', async () => {
    const r1 = await service.recordOnce({
      gateway: 'VNPAY',
      signatureValid: false,
      payload: {},
    });
    const r2 = await service.recordOnce({
      gateway: 'VNPAY',
      signatureValid: false,
      payload: {},
    });
    expect(r1.recorded).toBe(true);
    expect(r2.recorded).toBe(true);
  });
});
