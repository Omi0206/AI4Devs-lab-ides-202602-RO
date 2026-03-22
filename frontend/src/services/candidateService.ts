import type {
  CreateCandidateRequest,
  CreateCandidateResponse,
  ErrorResponse,
} from '../types/candidate';
import { getApiClient } from './apiClient';
import {
  isNormalizedApiError,
  NormalizedApiError,
  normalizeAxiosError,
} from './apiError';

function isCreateCandidateResponse(data: unknown): data is CreateCandidateResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const o = data as Record<string, unknown>;
  return (
    typeof o.id === 'number' &&
    typeof o.firstName === 'string' &&
    typeof o.lastName === 'string' &&
    typeof o.email === 'string'
  );
}

export async function createCandidate(
  payload: CreateCandidateRequest,
): Promise<CreateCandidateResponse> {
  const client = getApiClient();
  try {
    const res = await client.post<unknown>('/candidates', payload);

    if (res.status === 201 && isCreateCandidateResponse(res.data)) {
      return res.data;
    }

    const body = res.data as ErrorResponse | undefined;
    const msg = body?.message ?? 'Request failed';

    if (res.status === 400) {
      if (/already exists/i.test(msg)) {
        throw new NormalizedApiError(
          'duplicate_email',
          'A candidate with this email already exists',
        );
      }
      throw new NormalizedApiError('validation', msg);
    }
    if (res.status !== undefined && res.status >= 500) {
      throw new NormalizedApiError(
        'server',
        'The server could not complete the request. Please try again.',
      );
    }
    throw new NormalizedApiError('validation', msg);
  } catch (err) {
    if (isNormalizedApiError(err)) {
      throw err;
    }
    throw normalizeAxiosError(err);
  }
}
