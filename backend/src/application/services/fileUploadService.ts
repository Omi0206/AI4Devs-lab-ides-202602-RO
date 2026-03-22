import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { Express } from 'express';
import { FileUploadAppError } from '../../domain/errors/AppError';
import type { FileUploadResponse } from '../types';
import { getAllowedResumeMimeTypes, getMaxUploadBytes, getUploadDir } from '../../config/env';

const PDF_EXT = '.pdf';
const DOCX_EXT = '.docx';

function extensionForMime(mime: string): string {
  if (mime === 'application/pdf') {
    return PDF_EXT;
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return DOCX_EXT;
  }
  return '';
}

function normalizeMime(file: Express.Multer.File): string {
  const mime = (file.mimetype || '').toLowerCase().trim();
  if (mime) {
    return mime;
  }
  const name = file.originalname || '';
  const lower = name.toLowerCase();
  if (lower.endsWith(PDF_EXT)) {
    return 'application/pdf';
  }
  if (lower.endsWith(DOCX_EXT)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return '';
}

export async function ensureUploadDirExists(uploadDir: string): Promise<void> {
  await fs.mkdir(uploadDir, { recursive: true, mode: 0o755 });
}

export async function saveUploadedResume(file: Express.Multer.File): Promise<FileUploadResponse> {
  const uploadDir = getUploadDir();
  const maxBytes = getMaxUploadBytes();
  const allowed = getAllowedResumeMimeTypes();

  if (!file || !file.buffer || file.size === 0) {
    throw new FileUploadAppError('Invalid file upload');
  }
  if (file.size > maxBytes) {
    throw new FileUploadAppError('Invalid file type or file exceeds maximum size');
  }

  const mime = normalizeMime(file);
  if (!allowed.includes(mime)) {
    throw new FileUploadAppError('Invalid file type or file exceeds maximum size');
  }

  const ext = extensionForMime(mime);
  if (!ext) {
    throw new FileUploadAppError('Invalid file type or file exceeds maximum size');
  }

  await ensureUploadDirExists(uploadDir);

  const storedName = `${randomUUID()}${ext}`;
  const fullPath = path.join(uploadDir, storedName);
  await fs.writeFile(fullPath, file.buffer);

  return {
    filePath: storedName,
    fileType: mime,
  };
}
