import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { Prisma } from '@prisma/client';
import { createCandidate } from './candidateService';
import { DuplicateEmailAppError, InvalidResumeReferenceAppError } from '../../domain/errors/AppError';
import type { CreateCandidateRequest } from '../types';

const uploadRoot = path.join(os.tmpdir(), `candidate-svc-test-${process.pid}`);

jest.mock('../../config/env', () => {
  const actual = jest.requireActual<typeof import('../../config/env')>('../../config/env');
  return {
    ...actual,
    getUploadDir: (): string => uploadRoot,
  };
});

const createMock = jest.fn();

const prismaMock = {
  candidate: {
    create: createMock,
  },
} as never;

describe('createCandidate', () => {
  beforeEach(async () => {
    createMock.mockReset();
    await fs.mkdir(uploadRoot, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(uploadRoot, { recursive: true, force: true }).catch(() => undefined);
  });

  it('throws DuplicateEmailAppError on P2002', async () => {
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const data: CreateCandidateRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'a@b.co',
    };

    await expect(createCandidate(prismaMock, data)).rejects.toBeInstanceOf(DuplicateEmailAppError);
  });

  it('rethrows other Prisma errors', async () => {
    createMock.mockRejectedValue(new Error('db down'));

    const data: CreateCandidateRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'a@b.co',
    };

    await expect(createCandidate(prismaMock, data)).rejects.toThrow('db down');
  });

  it('returns created candidate on success', async () => {
    createMock.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'a@b.co',
      phone: null,
      address: null,
    });

    const data: CreateCandidateRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'a@b.co',
    };

    const result = await createCandidate(prismaMock, data);
    expect(result).toEqual({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'a@b.co',
      phone: null,
      address: null,
    });
  });

  it('rejects cv when file does not exist', async () => {
    await expect(
      createCandidate(prismaMock, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'missing@b.co',
        cv: { filePath: 'does-not-exist.pdf', fileType: 'application/pdf' },
      }),
    ).rejects.toBeInstanceOf(InvalidResumeReferenceAppError);
  });

  it('rejects cv path outside upload root', async () => {
    await expect(
      createCandidate(prismaMock, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'escape@b.co',
        cv: { filePath: path.join('..', 'outside.txt'), fileType: 'application/pdf' },
      }),
    ).rejects.toBeInstanceOf(InvalidResumeReferenceAppError);
  });

  it('validates cv file exists under upload root', async () => {
    const name = `resume-${Date.now()}.pdf`;
    await fs.writeFile(path.join(uploadRoot, name), 'pdf-bytes');
    createMock.mockResolvedValue({
      id: 2,
      firstName: 'John',
      lastName: 'Doe',
      email: 'cv@b.co',
      phone: null,
      address: null,
    });

    await createCandidate(prismaMock, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'cv@b.co',
      cv: { filePath: name, fileType: 'application/pdf' },
    });

    await fs.unlink(path.join(uploadRoot, name));
  });
});
