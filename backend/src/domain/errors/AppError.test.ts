import {
  AppError,
  DuplicateEmailAppError,
  FileUploadAppError,
  InvalidResumeReferenceAppError,
  UnexpectedAppError,
  ValidationAppError,
} from './AppError';

describe('AppError subclasses', () => {
  it('constructs with expected messages and codes', () => {
    expect(new AppError(422, 'm', 'd').statusCode).toBe(422);
    expect(new ValidationAppError('v', 'd').message).toBe('v');
    expect(new DuplicateEmailAppError().message).toMatch(/already exists/i);
    expect(new FileUploadAppError('f').message).toBe('f');
    expect(new InvalidResumeReferenceAppError().message).toBeDefined();
    expect(new UnexpectedAppError().statusCode).toBe(500);
  });
});
