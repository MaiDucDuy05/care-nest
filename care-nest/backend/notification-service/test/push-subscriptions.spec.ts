import { describe, it, expect } from 'vitest';
import { PushSubscriptionCreateSchema } from '../src/push-subscriptions/dto/push-subscription.dto.js';

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/dQw4w9WgXcQ',
  keys: {
    p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
    auth: 'tBHItJI5svbpez7KI4CCXg',
  },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};

describe('PushSubscriptionCreateSchema', () => {
  it('accepts a valid subscription', () => {
    const r = PushSubscriptionCreateSchema.safeParse(validSubscription);
    expect(r.success).toBe(true);
  });

  it('accepts without userAgent', () => {
    const { userAgent: _ua, ...rest } = validSubscription;
    const r = PushSubscriptionCreateSchema.safeParse(rest);
    expect(r.success).toBe(true);
  });

  it('rejects missing endpoint', () => {
    const r = PushSubscriptionCreateSchema.safeParse({ keys: validSubscription.keys });
    expect(r.success).toBe(false);
  });

  it('rejects non-URL endpoint', () => {
    const r = PushSubscriptionCreateSchema.safeParse({
      ...validSubscription,
      endpoint: 'not-a-url',
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing p256dh key', () => {
    const r = PushSubscriptionCreateSchema.safeParse({
      endpoint: validSubscription.endpoint,
      keys: { auth: 'test' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing auth key', () => {
    const r = PushSubscriptionCreateSchema.safeParse({
      endpoint: validSubscription.endpoint,
      keys: { p256dh: 'test' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty p256dh', () => {
    const r = PushSubscriptionCreateSchema.safeParse({
      endpoint: validSubscription.endpoint,
      keys: { p256dh: '', auth: 'test' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty auth', () => {
    const r = PushSubscriptionCreateSchema.safeParse({
      endpoint: validSubscription.endpoint,
      keys: { p256dh: 'test', auth: '' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects extra fields in keys', () => {
    const r = PushSubscriptionCreateSchema.safeParse({
      endpoint: validSubscription.endpoint,
      keys: { ...validSubscription.keys, extra: 'field' },
    });
    expect(r.success).toBe(false);
  });
});
