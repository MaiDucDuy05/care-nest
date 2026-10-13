import { z } from 'zod';
import { emailSchema, vnPhoneSchema } from '@carenest/shared-types';

export const RegisterSchema = z.object({
  email: emailSchema,
  phone: vnPhoneSchema.optional(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  role: z.enum(['BUYER', 'SELLER', 'CAREGIVER']).default('BUYER'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
