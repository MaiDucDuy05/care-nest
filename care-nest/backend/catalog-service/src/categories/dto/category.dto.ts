import { z } from 'zod';
import { nonEmptyStringSchema } from '@carenest/shared-types';

export const CreateCategorySchema = z.object({
  name: nonEmptyStringSchema,
  slug: z.string().trim().optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
