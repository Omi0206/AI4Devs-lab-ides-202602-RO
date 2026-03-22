import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { buildPostCandidateController } from '../controllers/candidateController';

export function candidateRoutes(prisma: PrismaClient): Router {
  const router = Router();
  router.post('/', buildPostCandidateController(prisma));
  return router;
}
