import type { CreateCandidateRequest } from '../../application/types';
import { ValidationAppError } from '../errors/AppError';

export class Candidate {
  static assertEducationLimit(data: CreateCandidateRequest): void {
    const count = data.educations?.length ?? 0;
    if (count > 3) {
      throw new ValidationAppError('Maximum of 3 education records allowed');
    }
  }
}
