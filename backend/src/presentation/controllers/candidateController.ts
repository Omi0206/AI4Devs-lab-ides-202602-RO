import { NextFunction, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { validateCreateCandidateRequest } from '../../application/validator';
import { createCandidate } from '../../application/services/candidateService';

export function buildPostCandidateController(prisma: PrismaClient) {
  return async function postCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = validateCreateCandidateRequest(req.body);
      const result = await createCandidate(prisma, validated);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };
}
