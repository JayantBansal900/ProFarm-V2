import { z } from 'zod';

export const healthCheckQuerySchema = z.object({
  query: z.object({
    verbose: z.enum(['true', 'false']).optional(),
  }),
});
