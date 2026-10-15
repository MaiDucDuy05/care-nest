import { describe, it, expect } from 'vitest';
import {
  NotificationChannelSchema,
  NotificationCategorySchema,
  NotificationPreferencesSchema,
  UpdatePreferencesSchema,
  DEFAULT_CHANNELS,
} from '../src/preferences/dto/preference.dto.js';

describe('NotificationChannelSchema', () => {
  it('accepts valid channels', () => {
    for (const ch of ['EMAIL', 'PUSH', 'SMS', 'ZNS']) {
      const r = NotificationChannelSchema.safeParse(ch);
      expect(r.success).toBe(true);
    }
  });

  it('rejects invalid channel', () => {
    const r = NotificationChannelSchema.safeParse('TELEGRAM');
    expect(r.success).toBe(false);
  });
});

describe('NotificationCategorySchema', () => {
  it('accepts valid categories', () => {
    for (const cat of ['ORDER', 'ALERT', 'SUBSCRIPTION', 'KYC']) {
      const r = NotificationCategorySchema.safeParse(cat);
      expect(r.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const r = NotificationCategorySchema.safeParse('MARKETING');
    expect(r.success).toBe(false);
  });
});

describe('NotificationPreferencesSchema', () => {
  it('accepts full valid preferences', () => {
    const r = NotificationPreferencesSchema.safeParse(DEFAULT_CHANNELS);
    expect(r.success).toBe(true);
  });

  it('rejects extra keys in channels', () => {
    const r = NotificationPreferencesSchema.safeParse({
      ...DEFAULT_CHANNELS,
      ORDER: { ...DEFAULT_CHANNELS.ORDER, TELEGRAM: true },
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing categories', () => {
    const r = NotificationPreferencesSchema.safeParse({
      ORDER: DEFAULT_CHANNELS.ORDER,
    });
    expect(r.success).toBe(false);
  });
});

describe('UpdatePreferencesSchema', () => {
  it('accepts empty update', () => {
    const r = UpdatePreferencesSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('accepts partial update for one category', () => {
    const r = UpdatePreferencesSchema.safeParse({
      ORDER: { EMAIL: false, PUSH: true, SMS: false, ZNS: true },
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid channel in partial update', () => {
    const r = UpdatePreferencesSchema.safeParse({
      ORDER: { EMAIL: false, PUSH: true, SMS: false, TELEGRAM: true },
    });
    expect(r.success).toBe(false);
  });
});

describe('DEFAULT_CHANNELS', () => {
  it('has all 4 categories', () => {
    expect(Object.keys(DEFAULT_CHANNELS)).toEqual(['ORDER', 'ALERT', 'SUBSCRIPTION', 'KYC']);
  });

  it('each category has all 4 channels', () => {
    for (const cat of Object.keys(DEFAULT_CHANNELS)) {
      expect(Object.keys(DEFAULT_CHANNELS[cat as keyof typeof DEFAULT_CHANNELS])).toEqual([
        'EMAIL',
        'PUSH',
        'SMS',
        'ZNS',
      ]);
    }
  });
});
