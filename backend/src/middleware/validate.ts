import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export const validateRequest = (schema: ZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Preserve schema transforms/defaults rather than validating a discarded copy.
      if ('body' in parsed) req.body = parsed.body;
      if ('query' in parsed) req.query = parsed.query as Request['query'];
      if ('params' in parsed) req.params = parsed.params as Request['params'];
      next();
    } catch (error) {
      next(error);
    }
  };
};
