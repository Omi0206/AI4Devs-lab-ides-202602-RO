import multer from 'multer';
import { getMaxUploadBytes } from '../config/env';

const memory = multer.memoryStorage();

export const uploadResume = multer({
  storage: memory,
  limits: { fileSize: getMaxUploadBytes() },
});
