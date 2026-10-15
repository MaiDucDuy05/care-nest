import { describe, it, expect } from 'vitest';
import { SubmitKycSchema, ReviewKycSchema } from '../src/kyc/kyc.dto.js';

describe('SubmitKycSchema', () => {
  it('accepts a valid submission', () => {
    const r = SubmitKycSchema.safeParse({
      storeName: 'Cửa hàng thiết bị y tế ABC',
      storeSlug: 'abc-medical',
      taxId: '0123456789',
      documents: [
        { type: 'TAX_ID', fileUrl: 'https://example.com/docs/tax.pdf' },
        { type: 'BUSINESS_LICENSE', fileUrl: 'https://example.com/docs/license.pdf' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid storeSlug', () => {
    const r = SubmitKycSchema.safeParse({
      storeName: 'Test Store',
      storeSlug: 'Invalid Slug!',
      documents: [{ type: 'TAX_ID', fileUrl: 'https://example.com/x.pdf' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty documents', () => {
    const r = SubmitKycSchema.safeParse({
      storeName: 'Test Store',
      storeSlug: 'test-store',
      documents: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects invalid fileUrl', () => {
    const r = SubmitKycSchema.safeParse({
      storeName: 'Test Store',
      storeSlug: 'test-store',
      documents: [{ type: 'TAX_ID', fileUrl: 'not-a-url' }],
    });
    expect(r.success).toBe(false);
  });
});

describe('ReviewKycSchema', () => {
  it('accepts APPROVED', () => {
    const r = ReviewKycSchema.safeParse({ decision: 'APPROVED' });
    expect(r.success).toBe(true);
  });

  it('accepts REJECTED with reason', () => {
    const r = ReviewKycSchema.safeParse({ decision: 'REJECTED', rejectionReason: 'Tax ID not visible' });
    expect(r.success).toBe(true);
  });

  it('rejects unknown decision', () => {
    const r = ReviewKycSchema.safeParse({ decision: 'MAYBE' });
    expect(r.success).toBe(false);
  });
});
