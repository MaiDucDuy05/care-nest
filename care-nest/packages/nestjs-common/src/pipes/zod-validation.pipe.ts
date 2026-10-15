import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * `ZodValidationPipe` — usage:
 *
 *   @Body(new ZodValidationPipe(CreateUserDto))
 *   create(@Body() body: CreateUserDto) { ... }
 *
 * Returns 400 with field-level issues on failure.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) throw new BadRequestException(toErrorBody(parsed.error));
    return parsed.data;
  }
}

function toErrorBody(err: ZodError): { code: string; message: string; issues: unknown[] } {
  return {
    code: 'VALIDATION_ERROR',
    message: 'request body failed validation',
    issues: err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    })),
  };
}
