import { describe, it, expect } from 'vitest';
import { CreateNotificationSchema } from '../src/notifications/dto/notification.dto.js';

describe('CreateNotificationSchema', () => {
  it('accepts a valid email notification', () => {
    const r = CreateNotificationSchema.safeParse({
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      channel: 'EMAIL',
      templateKey: 'order.created',
      payload: { orderNumber: 'CN-001', to: 'buyer@example.com' },
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid channel', () => {
    const r = CreateNotificationSchema.safeParse({
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      channel: 'TELEGRAM',
      templateKey: 'order.created',
      payload: {},
    });
    expect(r.success).toBe(false);
  });

  it('defaults payload to {} when omitted', () => {
    const r = CreateNotificationSchema.safeParse({
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      channel: 'PUSH',
      templateKey: 'alert.sos',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.payload).toEqual({});
  });
});
