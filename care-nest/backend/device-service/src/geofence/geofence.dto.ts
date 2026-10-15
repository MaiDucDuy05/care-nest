import { z } from 'zod';

export const CreateGeofenceSchema = z.object({
  name: z.string().min(1).max(120),
  centerLat: z.number().min(-90).max(90),
  centerLon: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(5000).default(150),
});

export const UpdateGeofenceSchema = CreateGeofenceSchema.partial().extend({
  active: z.boolean().optional(),
});

export type CreateGeofenceDto = z.infer<typeof CreateGeofenceSchema>;
export type UpdateGeofenceDto = z.infer<typeof UpdateGeofenceSchema>;
