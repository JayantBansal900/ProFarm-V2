import { z } from 'zod';

export const locationSearchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must not exceed 100 characters'),
});

export const locationSearchSchema = z.object({
  query: locationSearchQuerySchema,
});

export const forecastQueryParamsSchema = z.object({
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
  locationName: z.string().trim().optional(),
});

export const forecastSchema = z.object({
  query: forecastQueryParamsSchema,
});

export type LocationSearchInput = z.infer<typeof locationSearchQuerySchema>;
export type ForecastQueryParams = z.infer<typeof forecastQueryParamsSchema>;
