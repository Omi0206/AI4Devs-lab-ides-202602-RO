import { Router } from 'express';
import { postUpload } from '../controllers/uploadController';
import { uploadResume } from '../../middleware/uploadMulter';

export function uploadRoutes(): Router {
  const router = Router();
  router.post('/', uploadResume.single('file'), postUpload);
  return router;
}
