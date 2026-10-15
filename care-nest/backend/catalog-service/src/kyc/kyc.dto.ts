import { z } from 'zod';

export const SubmitKycSchema = z.object({
  storeName: z.string().min(3).max(120),
  storeSlug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/, 'storeSlug chỉ chứa a-z, 0-9 và dấu gạch ngang'),
  taxId: z.string().min(8).max(20).optional(),
  documents: z.array(z.object({
    type: z.enum(['TAX_ID', 'BUSINESS_LICENSE', 'BANK_ACCOUNT', 'ID_CARD']),
    fileUrl: z.string().url(),
    expiresAt: z.string().datetime().optional(),
  })).min(1, 'Cần tối thiểu 1 tài liệu KYC'),
});

export const ReviewKycSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
});

export type SubmitKycDto = z.infer<typeof SubmitKycSchema>;
export type ReviewKycDto = z.infer<typeof ReviewKycSchema>;
