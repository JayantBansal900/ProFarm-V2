import { z } from 'zod';

export const advisorRequestBodySchema = z.object({
  cropId: z
    .string()
    .trim()
    .min(1, 'Crop identifier is required')
    .max(100, 'Crop identifier must not exceed 100 characters'),
  soilId: z
    .string()
    .trim()
    .max(100, 'Soil identifier must not exceed 100 characters')
    .optional()
    .nullable(),
  location: z
    .object({
      latitude: z.coerce
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .refine((val) => Number.isFinite(val), 'Latitude must be a valid finite number'),
      longitude: z.coerce
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .refine((val) => Number.isFinite(val), 'Longitude must be a valid finite number'),
      locationName: z
        .string()
        .trim()
        .max(120, 'Location name must not exceed 120 characters')
        .optional(),
    })
    .optional()
    .nullable(),
});

export const advisorRequestSchema = z.object({
  body: advisorRequestBodySchema,
});

export type AdvisorRequestBody = z.infer<typeof advisorRequestBodySchema>;
