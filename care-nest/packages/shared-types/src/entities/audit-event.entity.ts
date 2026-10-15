/**
 * Audit event entity — minimal frontend subset of the backend AuditLog model.
 * Backend uses class-validator + TypeORM; this mirrors the shape for type safety.
 */

import { z } from 'zod';
import { isoDateSchema } from '../ids.js';
import { userIdSchema } from '../ids.js';

/** Action categories captured in audit logs */
export const AuditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'ACTIVATE',
  'DEACTIVATE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'REJECT',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

/** Minimal audit event for frontend consumption */
export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  userId: userIdSchema,
  action: AuditActionSchema,
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  /** JSON-encoded change payload */
  payload: z.record(z.unknown()).optional(),
  createdAt: isoDateSchema,
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
