import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { AppError } from '../domain/errors/AppError';

describe('errorHandler', () => {
  it('returns JSON for AppError', () => {
    const req = {} as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const next = jest.fn() as NextFunction;

    errorHandler(new AppError(400, 'Bad', 'detail'), req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Bad', error: 'detail' });
  });

  it('returns 500 for unknown errors', () => {
    const req = {} as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const next = jest.fn() as NextFunction;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(new Error('boom'), req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: 'An unexpected error occurred' });
    consoleSpy.mockRestore();
  });
});
