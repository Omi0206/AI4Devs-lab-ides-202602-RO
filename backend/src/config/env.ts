import path from 'path';

const DEFAULT_PORT = 3000;
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const allowedResumeMime = (
  process.env.ALLOWED_RESUME_MIME_TYPES ??
  'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) {
    return DEFAULT_PORT;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_PORT;
}

export function getUploadDir(): string {
  const raw = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function getMaxUploadBytes(): number {
  const raw = process.env.MAX_UPLOAD_BYTES;
  if (!raw) {
    return DEFAULT_MAX_UPLOAD_BYTES;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_UPLOAD_BYTES;
}

export function getAllowedResumeMimeTypes(): readonly string[] {
  return allowedResumeMime;
}
