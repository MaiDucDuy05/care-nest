import { describe, it, expect } from 'vitest';
import { NotificationDispatcher } from '../src/channels/dispatcher.js';
import { VapidPushChannel } from '../src/channels/vapid-push.channel.js';
import { EsmsSmsChannel } from '../src/channels/esms-sms.channel.js';
import { SesEmailChannel } from '../src/channels/ses-email.channel.js';
import { ZnsZaloChannel } from '../src/channels/zns-zalo.channel.js';
import { UserChannelResolver } from '../src/channels/user-channel-resolver.js';

function makeDispatcher() {
  return new NotificationDispatcher(
    new VapidPushChannel(),
    new EsmsSmsChannel(),
    new SesEmailChannel(),
    new ZnsZaloChannel(),
    { resolve: async (userId: string) => ({ userId }) } as any,
  );
}

describe('NotificationDispatcher.buildPlan', () => {
  it('ZNS > PUSH > SMS > EMAIL priority ordering', async () => {
    const dispatcher = new NotificationDispatcher(
      new VapidPushChannel(),
      new EsmsSmsChannel(),
      new SesEmailChannel(),
      new ZnsZaloChannel(),
      {
        resolve: async (userId) => ({
          userId,
          zaloUserId: 'zalo-1',
          deviceToken: 'dt-1',
          phone: '0901234567',
          email: 'a@example.com',
        }),
      } as any,
    );
    const plan = await dispatcher.buildPlan('u1', 'order.shipped', {
      to: 'auto',
      subject: 'S',
      body: 'B',
      templateKey: 'order.shipped',
      payload: {},
    });
    expect(plan.channels.map((c) => c.channel)).toEqual([
      'ZNS', 'PUSH', 'SMS', 'EMAIL',
    ]);
  });

  it('skips channels with no contact info', async () => {
    const dispatcher = new NotificationDispatcher(
      new VapidPushChannel(),
      new EsmsSmsChannel(),
      new SesEmailChannel(),
      new ZnsZaloChannel(),
      { resolve: async (userId) => ({ userId, email: 'a@example.com' }) } as any,
    );
    const plan = await dispatcher.buildPlan('u1', 'order.shipped', {
      to: 'auto',
      subject: 'S',
      body: 'B',
      templateKey: 'order.shipped',
      payload: {},
    });
    expect(plan.channels).toHaveLength(1);
    expect(plan.channels[0].channel).toBe('EMAIL');
  });

  it('returns empty plan when no contact info at all', async () => {
    const dispatcher = makeDispatcher();
    const plan = await dispatcher.buildPlan('u1', 'order.shipped', {
      to: 'auto',
      subject: 'S',
      body: 'B',
      templateKey: 'order.shipped',
      payload: {},
    });
    expect(plan.channels).toHaveLength(0);
  });

  it('critical alert (SOS) forces PUSH + SMS fan-out', async () => {
    const dispatcher = new NotificationDispatcher(
      new VapidPushChannel(),
      new EsmsSmsChannel(),
      new SesEmailChannel(),
      new ZnsZaloChannel(),
      {
        resolve: async (userId) => ({
          userId,
          zaloUserId: 'zalo-1',
          deviceToken: 'dt-1',
          phone: '0901234567',
          email: 'a@example.com',
        }),
      } as any,
    );
    const plan = await dispatcher.buildPlan('u1', 'alert.sos', {
      to: 'auto',
      subject: 'S',
      body: 'B',
      templateKey: 'alert.sos',
      payload: {},
    });
    // Critical: PUSH first, then SMS, then ZNS (skip EMAIL entirely)
    expect(plan.channels.map((c) => c.channel)).toEqual(['PUSH', 'SMS', 'ZNS']);
  });

  it('critical alert (FALL) does NOT include EMAIL', async () => {
    const dispatcher = new NotificationDispatcher(
      new VapidPushChannel(),
      new EsmsSmsChannel(),
      new SesEmailChannel(),
      new ZnsZaloChannel(),
      {
        resolve: async (userId) => ({
          userId,
          zaloUserId: 'zalo-1',
          deviceToken: 'dt-1',
          phone: '0901234567',
          email: 'a@example.com',
        }),
      } as any,
    );
    const plan = await dispatcher.buildPlan('u1', 'alert.fall', {
      to: 'auto',
      subject: 'S',
      body: 'B',
      templateKey: 'alert.fall',
      payload: {},
    });
    expect(plan.channels.map((c) => c.channel)).not.toContain('EMAIL');
  });
});

describe('NotificationDispatcher.execute', () => {
  it('first successful channel wins for non-critical', async () => {
    const dispatcher = new NotificationDispatcher(
      new VapidPushChannel(),
      new EsmsSmsChannel(),
      new SesEmailChannel(),
      new ZnsZaloChannel(),
      { resolve: async () => ({}) } as any,
    );
    const results = await dispatcher.execute(
      {
        channels: [
          { channel: 'ZNS' as any, recipient: 'zalo-1', adapter: { send: async () => ({ error: 'zalo down' }) } },
          { channel: 'PUSH' as any, recipient: 'dt-1', adapter: { send: async () => ({ providerMessageId: 'p1' }) } },
          { channel: 'SMS' as any, recipient: 'ph', adapter: { send: async () => ({ providerMessageId: 's1' }) } },
        ],
      },
      { to: 'auto', subject: 'S', body: 'B', templateKey: 'k', payload: {} },
      false,
    );
    // Should stop at PUSH since it succeeded
    expect(results).toHaveLength(2);
    expect(results[0].channel).toBe('ZNS');
    expect(results[0].error).toBe('zalo down');
    expect(results[1].channel).toBe('PUSH');
    expect(results[1].providerMessageId).toBe('p1');
  });

  it('critical alert fans out to all channels', async () => {
    const dispatcher = new NotificationDispatcher(
      new VapidPushChannel(),
      new EsmsSmsChannel(),
      new SesEmailChannel(),
      new ZnsZaloChannel(),
      { resolve: async () => ({}) } as any,
    );
    const results = await dispatcher.execute(
      {
        channels: [
          { channel: 'PUSH' as any, recipient: 'dt-1', adapter: { send: async () => ({ error: 'no' }) } },
          { channel: 'SMS' as any, recipient: 'ph', adapter: { send: async () => ({ providerMessageId: 's1' }) } },
        ],
      },
      { to: 'auto', subject: 'S', body: 'B', templateKey: 'k', payload: {} },
      true,
    );
    // Both should be tried
    expect(results).toHaveLength(2);
  });
});
