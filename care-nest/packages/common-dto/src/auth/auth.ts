import { z } from 'zod';
import { NonEmptyString, PasswordSchema, PhoneSchema } from '../shared/primitives.js';

export const RegisterRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: PasswordSchema,
  fullName: NonEmptyString.max(100),
  phone: PhoneSchema.optional(),
  tenantId: z.string().uuid().optional(), // for explicit tenant onboarding
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
  tenantId: z.string().uuid().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  mfaRequired: z.boolean().default(false),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

export const RefreshRequestSchema = z.object({ refreshToken: z.string().min(20) });
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const MfaEnrollRequestSchema = z.object({ password: z.string().min(1) });
export const MfaEnrollResponseSchema = z.object({
  secret: z.string(), // base32
  otpauthUrl: z.string().url(),
});
export const MfaVerifyRequestSchema = z.object({ code: z.string().regex(/^\d{6}$/u) });

export const RoleEnum = z.enum([
  'PLATFORM_ADMIN',
  'TENANT_ADMIN',
  'SELLER',
  'BUYER',
  'CAREGIVER',
  'DEVICE',
]);
export type Role = z.infer<typeof RoleEnum>;
