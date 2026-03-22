import { isAxiosError } from 'axios';
import type { ErrorResponse } from '../types/candidate';

export type ApiErrorKind =
  | 'duplicate_email'
  | 'validation'
  | 'upload_client'
  | 'network'
  | 'server';

export class NormalizedApiError extends Error {
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = 'NormalizedApiError';
    this.kind = kind;
  }
}

export function isNormalizedApiError(err: unknown): err is NormalizedApiError {
  return err instanceof NormalizedApiError;
}

function parseErrorBody(data: unknown): ErrorResponse | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }
  const o = data as Record<string, unknown>;
  if (typeof o.message !== 'string') {
    return undefined;
  }
  return {
    message: o.message,
    error: typeof o.error === 'string' ? o.error : undefined,
  };
}

export function normalizeAxiosError(err: unknown): NormalizedApiError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const body = parseErrorBody(err.response?.data);
    const msg = body?.message ?? err.message ?? 'Request failed';

    if (status === 400) {
      if (/already exists/i.test(msg)) {
        return new NormalizedApiError(
          'duplicate_email',
          'A candidate with this email already exists',
        );
      }
      return new NormalizedApiError('validation', msg);
    }
    if (status !== undefined && status >= 500) {
      return new NormalizedApiError(
        'server',
        'The server could not complete the request. Please try again.',
      );
    }
    if (status !== undefined && status >= 400) {
      return new NormalizedApiError('validation', msg);
    }
    return new NormalizedApiError(
      'network',
      'Unable to reach the server. Check your connection and try again.',
    );
  }
  return new NormalizedApiError(
    'network',
    'Something went wrong. Please try again.',
  );
}

export function normalizeUploadError(
  status: number | undefined,
  body: unknown,
): NormalizedApiError {
  const parsed = parseErrorBody(body);
  const msg =
    parsed?.message ??
    (status === 400
      ? 'The file type is not allowed or the file is too large.'
      : 'Upload failed. Please try again.');

  if (status === 400) {
    return new NormalizedApiError('upload_client', msg);
  }
  if (status !== undefined && status >= 500) {
    return new NormalizedApiError(
      'server',
      'The server could not complete the upload. Please try again.',
    );
  }
  return new NormalizedApiError('validation', msg);
}
