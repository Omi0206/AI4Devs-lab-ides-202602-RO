import { access, mkdir, realpath } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { CreateCandidateRequest, CreateCandidateResponse } from '../types';
import { Candidate } from '../../domain/models/Candidate';
import {
  DuplicateEmailAppError,
  InvalidResumeReferenceAppError,
  UnexpectedAppError,
} from '../../domain/errors/AppError';
import { getUploadDir } from '../../config/env';

function parseDate(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new UnexpectedAppError();
  }
  return d;
}

async function assertResumeFileAllowed(uploadRoot: string, relativePath: string): Promise<void> {
  await mkdir(uploadRoot, { recursive: true, mode: 0o755 });
  const root = await realpath(uploadRoot);
  const candidatePath = path.resolve(root, relativePath);
  let resolved: string;
  try {
    resolved = await realpath(candidatePath);
  } catch {
    throw new InvalidResumeReferenceAppError();
  }
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (resolved !== root && !resolved.startsWith(prefix)) {
    throw new InvalidResumeReferenceAppError();
  }
  try {
    await access(resolved, fsConstants.R_OK);
  } catch {
    throw new InvalidResumeReferenceAppError();
  }
}

export async function createCandidate(
  prisma: PrismaClient,
  data: CreateCandidateRequest,
): Promise<CreateCandidateResponse> {
  Candidate.assertEducationLimit(data);

  const uploadDir = getUploadDir();
  if (data.cv) {
    await assertResumeFileAllowed(uploadDir, data.cv.filePath);
  }

  try {
    const created = await prisma.candidate.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        educations: data.educations?.length
          ? {
              create: data.educations.map((e) => ({
                institution: e.institution,
                title: e.title,
                startDate: parseDate(e.startDate),
                endDate: e.endDate ? parseDate(e.endDate) : null,
              })),
            }
          : undefined,
        workExperiences: data.workExperiences?.length
          ? {
              create: data.workExperiences.map((w) => ({
                company: w.company,
                position: w.position,
                description: w.description ?? null,
                startDate: parseDate(w.startDate),
                endDate: w.endDate ? parseDate(w.endDate) : null,
              })),
            }
          : undefined,
        resumes: data.cv
          ? {
              create: {
                filePath: data.cv.filePath,
                fileType: data.cv.fileType,
              },
            }
          : undefined,
      },
    });

    return {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      phone: created.phone,
      address: created.address,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new DuplicateEmailAppError();
    }
    throw err;
  }
}
