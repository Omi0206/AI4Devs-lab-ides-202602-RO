import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import type { Express } from 'express';
import { saveUploadedResume } from './fileUploadService';
import { FileUploadAppError } from '../../domain/errors/AppError';

jest.mock('../../config/env', () => ({
  getUploadDir: () => path.join(os.tmpdir(), `upload-test-${process.pid}`),
  getMaxUploadBytes: () => 10 * 1024 * 1024,
  getAllowedResumeMimeTypes: () => [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}));

describe('saveUploadedResume', () => {
  const uploadRoot = path.join(os.tmpdir(), `upload-test-${process.pid}`);

  afterEach(async () => {
    await fs.rm(uploadRoot, { recursive: true, force: true }).catch(() => undefined);
  });

  function makeFile(partial: Partial<Express.Multer.File>): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'x.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 10,
      buffer: Buffer.from('%PDF-1.4 test', 'utf8'),
      destination: '',
      filename: '',
      path: '',
      stream: undefined as never,
      ...partial,
    };
  }

  it('writes a PDF and returns filePath and fileType', async () => {
    const result = await saveUploadedResume(makeFile({}));
    expect(result.fileType).toBe('application/pdf');
    expect(result.filePath).toMatch(/\.pdf$/);
    const full = path.join(uploadRoot, result.filePath);
    await expect(fs.access(full)).resolves.toBeUndefined();
    await fs.unlink(full);
  });

  it('rejects empty buffer', async () => {
    await expect(saveUploadedResume(makeFile({ buffer: Buffer.alloc(0), size: 0 }))).rejects.toBeInstanceOf(
      FileUploadAppError,
    );
  });

  it('rejects oversize file', async () => {
    await expect(
      saveUploadedResume(
        makeFile({
          size: 20 * 1024 * 1024,
          buffer: Buffer.alloc(20 * 1024 * 1024),
        }),
      ),
    ).rejects.toBeInstanceOf(FileUploadAppError);
  });

  it('rejects disallowed mime type', async () => {
    await expect(
      saveUploadedResume(
        makeFile({
          mimetype: 'image/png',
          originalname: 'x.png',
          buffer: Buffer.from([0, 1, 2]),
        }),
      ),
    ).rejects.toBeInstanceOf(FileUploadAppError);
  });

  it('accepts DOCX by extension when mime is empty', async () => {
    const result = await saveUploadedResume(
      makeFile({
        mimetype: '',
        originalname: 'doc.docx',
        buffer: Buffer.from('PK\x03\x04', 'binary'),
      }),
    );
    expect(result.fileType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    const full = path.join(uploadRoot, result.filePath);
    await fs.unlink(full);
  });
});
