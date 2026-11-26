import { z } from 'zod';

// Bounds keep even the largest offset below SQLite's signed 32-bit range.
export const MAX_PAGE = 100000;
export const MAX_LIMIT = 100;

export function integerQuery(minimum: number, maximum: number) {
  return z.union([z.string().regex(/^\d+$/, 'Must be a whole-number decimal value')
    .refine((value) => value === value.trim(), 'Whitespace is not allowed'), z.number()])
    .pipe(z.coerce.number<string | number>().int().min(minimum).max(maximum));
}

export const paginationQuerySchema = z.object({
  page: integerQuery(1, MAX_PAGE).default(1),
  limit: integerQuery(1, MAX_LIMIT).default(20),
});

export function paginationWindow(query: { page?: number; limit?: number }) {
  const { page, limit } = paginationQuerySchema.parse(query);
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMetadata(total: number, page: number, limit: number) {
  return { totalRecords: total, totalPages: Math.ceil(total / limit) || 1, currentPage: page, limit };
}
