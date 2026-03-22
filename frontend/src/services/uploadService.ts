import type { FileUploadResponse } from '../types/candidate';
import { getApiBaseUrl } from './apiClient';
import { normalizeUploadError } from './apiError';

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${getApiBaseUrl()}/upload`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (response.ok && isFileUploadResponse(data)) {
    return data;
  }

  throw normalizeUploadError(response.status, data);
}

function isFileUploadResponse(data: unknown): data is FileUploadResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const o = data as Record<string, unknown>;
  return typeof o.filePath === 'string' && typeof o.fileType === 'string';
}
