import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Generic Zod validation pipe. Usage:
 *
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateDtoSchema)) dto: CreateDto) { ... }
 *
 * On failure, throws BadRequestException with the structured Zod issues so
 * the API client can highlight individual fields.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }
    return result.data;
  }
}
