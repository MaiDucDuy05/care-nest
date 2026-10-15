import { describe, it, expect } from 'vitest';
import { CaregiverInviteSchema } from '../src/caregivers/dto/caregiver.dto.js';

const validInvite = {
  caretakerEmail: 'nurse@example.com',
  relationship: 'NURSE',
  permissions: { viewHealth: true, receiveAlerts: true, manageDevices: false },
};

describe('CaregiverInviteSchema', () => {
  it('accepts a valid invite', () => {
    const r = CaregiverInviteSchema.safeParse(validInvite);
    expect(r.success).toBe(true);
  });

  it('accepts FAMILY relationship', () => {
    const r = CaregiverInviteSchema.safeParse({ ...validInvite, relationship: 'FAMILY' });
    expect(r.success).toBe(true);
  });

  it('accepts DOCTOR relationship', () => {
    const r = CaregiverInviteSchema.safeParse({ ...validInvite, relationship: 'DOCTOR' });
    expect(r.success).toBe(true);
  });

  it('accepts OTHER relationship', () => {
    const r = CaregiverInviteSchema.safeParse({ ...validInvite, relationship: 'OTHER' });
    expect(r.success).toBe(true);
  });

  it('defaults permissions to false', () => {
    const r = CaregiverInviteSchema.safeParse({
      caretakerEmail: 'nurse@example.com',
      relationship: 'NURSE',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.permissions).toEqual({ viewHealth: false, receiveAlerts: false, manageDevices: false });
    }
  });

  it('rejects invalid email', () => {
    const r = CaregiverInviteSchema.safeParse({ ...validInvite, caretakerEmail: 'not-email' });
    expect(r.success).toBe(false);
  });

  it('rejects missing email', () => {
    const r = CaregiverInviteSchema.safeParse({ relationship: 'NURSE', permissions: validInvite.permissions });
    expect(r.success).toBe(false);
  });

  it('rejects invalid relationship', () => {
    const r = CaregiverInviteSchema.safeParse({ ...validInvite, relationship: 'FRIEND' });
    expect(r.success).toBe(false);
  });

  it('rejects missing relationship', () => {
    const r = CaregiverInviteSchema.safeParse({ caretakerEmail: 'nurse@example.com', permissions: validInvite.permissions });
    expect(r.success).toBe(false);
  });

  it('rejects extra permission keys', () => {
    const r = CaregiverInviteSchema.safeParse({
      ...validInvite,
      permissions: { ...validInvite.permissions, unknownPermission: true },
    });
    expect(r.success).toBe(false);
  });
});
