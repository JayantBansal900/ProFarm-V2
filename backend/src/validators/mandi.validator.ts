import { z } from 'zod';
import { paginationQuerySchema } from './pagination.validator';

export const mandiPriceQuerySchema = paginationQuerySchema.extend({
  commodity: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  market: z.string().trim().max(100).optional(),
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
