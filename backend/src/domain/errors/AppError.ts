export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, detail?: string) {
    super(400, message, detail);
    this.name = 'ValidationAppError';
  }
}

export class DuplicateEmailAppError extends AppError {
  constructor() {
    super(400, 'A candidate with this email already exists');
    this.name = 'DuplicateEmailAppError';
  }
}

export class FileUploadAppError extends AppError {
  constructor(message: string, detail?: string) {
    super(400, message, detail);
    this.name = 'FileUploadAppError';
  }
}

export class InvalidResumeReferenceAppError extends AppError {
  constructor(message = 'Invalid resume file reference') {
    super(400, message);
    this.name = 'InvalidResumeReferenceAppError';
  }
}

export class UnexpectedAppError extends AppError {
  constructor() {
    super(500, 'An unexpected error occurred');
    this.name = 'UnexpectedAppError';
  }
}
