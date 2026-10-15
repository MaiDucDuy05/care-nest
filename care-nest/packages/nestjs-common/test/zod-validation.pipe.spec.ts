import { describe, it, expect } from 'vitest';
import { ZodValidationPipe } from '../src/pipes/zod-validation.pipe.js';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({ name: z.string().min(2), age: z.number().int().positive() });

  it('returns parsed data on success', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ name: 'Duy', age: 30 })).toEqual({ name: 'Duy', age: 30 });
  });

  it('throws BadRequestException with field-level issues on failure', () => {
    const pipe = new ZodValidationPipe(schema);
    let err: unknown;
    try { pipe.transform({ name: 'D', age: -1 }); } catch (e) { err = e; }
    expect(err).toBeInstanceOf(BadRequestException);
    const body = (err as BadRequestException).getResponse() as { code: string; issues: { path: string; message: string }[] };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.issues.length).toBeGreaterThanOrEqual(2);
  });
});
