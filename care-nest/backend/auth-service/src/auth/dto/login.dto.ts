import { z } from 'zod';
import { emailSchema } from '@carenest/shared-types';

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
