import cors from 'cors';
import express, { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { uploadRoutes } from './presentation/routes/uploadRoutes';
import { candidateRoutes } from './presentation/routes/candidateRoutes';

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.send('Hola LTI!');
  });

  app.use('/upload', uploadRoutes());
  app.use('/candidates', candidateRoutes(prisma));

  app.use(errorHandler);
  return app;
}
