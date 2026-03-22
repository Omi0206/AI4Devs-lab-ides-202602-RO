import { NextFunction, Request, Response } from 'express';
import { saveUploadedResume } from '../../application/services/fileUploadService';
import { FileUploadAppError } from '../../domain/errors/AppError';

export async function postUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      next(new FileUploadAppError('Invalid file type or file exceeds maximum size'));
      return;
    }
    const result = await saveUploadedResume(file);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
