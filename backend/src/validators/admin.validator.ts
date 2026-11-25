import { z } from 'zod';
import { integerQuery, MAX_PAGE } from './pagination.validator';

export const userIdParamSchema = z.object({ id: z.uuid() });

export const adminUsersQuerySchema = z.object({
  page: integerQuery(1, MAX_PAGE).optional(),
  limit: integerQuery(1, 50).optional(),
  search: z.string().trim().max(100).optional().transform((value) => value || undefined),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const adminAuditQuerySchema = z.object({
  page: integerQuery(1, MAX_PAGE).optional(),
  limit: integerQuery(1, 50).optional(),
});

export const roleBodySchema = z.object({ role: z.enum(['user', 'admin']) }).strict();
