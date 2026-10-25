import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.message && err.message.includes('CORS policy blocked')) {
    res.status(403).json({
      status: 'error',
      message: 'Access forbidden by CORS policy',
    });
    return;
  }

  const statusCode = (err as AppError).statusCode || 500;
  const isProduction = env.NODE_ENV === 'production';

  let safeMessage = err.message || 'An unexpected internal server error occurred';
  if (isProduction && statusCode === 500) {
    safeMessage = 'Internal server error';
  }

  // Redact any Windows/Unix file path disclosures
  safeMessage = safeMessage.replace(/[a-zA-Z]:\\[^ \n\r\t]+/g, '[REDACTED_PATH]');

  res.status(statusCode).json({
    status: 'error',
    message: safeMessage,
    ...(!isProduction && err.stack ? { stack: err.stack } : {}),
  });
}
