import { z } from 'zod';
import { dateOnlySchema } from './date.validator';

const finite = z.number().finite();
const percentage = finite.min(0).max(100);
const nonnegative = finite.min(0);
const week = (schema: z.ZodNumber) => z.array(schema).length(7);

export const upstreamGeocodingSchema = z.object({
  results: z.array(z.object({
    id: finite.int(), name: z.string().min(1), latitude: finite.min(-90).max(90),
    longitude: finite.min(-180).max(180), country: z.string().min(1),
  })).optional(),
});

export const upstreamForecastSchema = z.object({
  latitude: finite.min(-90).max(90).optional(),
  longitude: finite.min(-180).max(180).optional(),
  elevation: finite.optional(),
  timezone: z.string().min(1).optional(),
  current: z.object({
    temperature_2m: finite, apparent_temperature: finite,
    relative_humidity_2m: percentage, precipitation: nonnegative,
    weather_code: finite.int(), cloud_cover: percentage, wind_speed_10m: nonnegative,
    is_day: z.union([z.literal(0), z.literal(1)]), time: z.string().min(1),
  }),
  daily: z.object({
    time: z.array(dateOnlySchema).length(7).refine((dates) => dates.every((date, i) => i === 0 || date > dates[i - 1])),
    weather_code: week(finite.int()), temperature_2m_max: week(finite), temperature_2m_min: week(finite),
    precipitation_sum: week(nonnegative), precipitation_probability_max: week(percentage), wind_speed_10m_max: week(nonnegative),
  }),
});
