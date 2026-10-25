import { z } from 'zod';

export const mandiPriceQuerySchema = z.object({
  commodity: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  market: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['modal_price_desc', 'modal_price_asc', 'arrival_date_desc']).default('modal_price_desc'),
});

export const mandiPricesRequestSchema = z.object({
  query: mandiPriceQuerySchema,
});

export type MandiPriceQueryInput = z.infer<typeof mandiPriceQuerySchema>;

export const mandiFilterQuerySchema = z.object({
  state: z.string().trim().max(100).optional(),
});

export const mandiFilterRequestSchema = z.object({
  query: mandiFilterQuerySchema,
});

export type MandiFilterQueryInput = z.infer<typeof mandiFilterQuerySchema>;
