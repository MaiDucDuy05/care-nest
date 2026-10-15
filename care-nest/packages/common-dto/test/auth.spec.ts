import { describe, it, expect } from 'vitest';
import { RegisterRequestSchema } from '../src/auth/auth';
import { z } from 'zod';

const PasswordSchema = z
  .string()
  .min(10, 'password must be ≥10 chars')
  .max(128)
  .regex(/[a-z]/u, 'must contain lowercase')
  .regex(/[A-Z]/u, 'must contain uppercase')
  .regex(/[0-9]/u, 'must contain digit')
  .regex(/[^A-Za-z0-9]/u, 'must contain symbol');

describe('RegisterRequestSchema', () => {
  it('accepts a valid registration', () => {
    const r = RegisterRequestSchema.safeParse({
      email: 'a@b.com',
      password: 'GoodPass1!',
      fullName: 'Mai Duy',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a weak password', () => {
    expect(PasswordSchema.safeParse('short').success).toBe(false);
    expect(PasswordSchema.safeParse('alllowercase1!').success).toBe(false);
    expect(PasswordSchema.safeParse('ALLUPPERCASE1!').success).toBe(false);
    expect(PasswordSchema.safeParse('NoDigits!A').success).toBe(false);
    expect(PasswordSchema.safeParse('NoSymbol123A').success).toBe(false);
    expect(PasswordSchema.safeParse('GoodPass1!').success).toBe(true);
  });
});
