/**
 * KYC document entity schema.
 * NOTE: fileUrl is intentionally omitted — raw URLs never leave the backend.
 * The frontend receives a signed, short-lived URL from the upload endpoint.
 */

import { z } from 'zod';
import { AuditTimestampsSchema } from '../common.js';
import { isoDateSchema } from '../ids.js';
import { userIdSchema } from '../ids.js';

export const KycDocumentTypeSchema = z.enum([
  'IDENTITY_CARD',
  'PASSPORT',
  'DRIVERS_LICENSE',
  'HEALTH_INSURANCE',
  'OTHER',
]);
export type KycDocumentType = z.infer<typeof KycDocumentTypeSchema>;

export const KycStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']);
export type KycStatus = z.infer<typeof KycStatusSchema>;

/** KYC document — metadata only, no raw fileUrl */
export const KycDocumentSchema = z.object({
  id: z.string().uuid(),
  userId: userIdSchema,
  type: KycDocumentTypeSchema,
  status: KycStatusSchema,
  /** Original filename for display only */
  filename: z.string().min(1).max(255).optional(),
  /** SHA-256 hash of the uploaded file for integrity checks */
  fileHash: z.string().length(64).regex(/^[a-f0-9]{64}$/i).optional(),
  rejectionReason: z.string().max(500).nullable().optional(),
  expiresAt: isoDateSchema.nullable().optional(),
  ...AuditTimestampsSchema.shape,
});

export type KycDocument = z.infer<typeof KycDocumentSchema>;
