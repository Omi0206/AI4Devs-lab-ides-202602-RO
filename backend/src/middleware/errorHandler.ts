import { NextFunction, Request, Response } from 'express';
import { AppError, UnexpectedAppError } from '../domain/errors/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.detail ? { error: err.detail } : {}),
    });
    return;
  }

  console.error(err);
  const fallback = new UnexpectedAppError();
  res.status(fallback.statusCode).json({
    message: fallback.message,
  });
}
