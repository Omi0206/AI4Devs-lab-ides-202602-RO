import { ValidationAppError } from '../domain/errors/AppError';
import type {
  CreateCandidateRequest,
  CreateEducationRequest,
  CreateResumeRequest,
  CreateWorkExperienceRequest,
} from './types';

const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\u00f1\u00d1][a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]{1,99}$/;
const EMAIL_MAX = 255;
const SPANISH_MOBILE_PATTERN = /^[679]\d{8}$/;

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationAppError('Validation failed', `${field} is required`);
  }
  return value.trim();
}

function parseIsoDate(value: string, field: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationAppError('Validation failed', `Invalid date for ${field}`);
  }
  return d;
}

function validateName(value: unknown, field: string): string {
  const s = assertNonEmptyString(value, field);
  if (s.length < 2 || s.length > 100) {
    throw new ValidationAppError('Validation failed', `${field} must be between 2 and 100 characters`);
  }
  if (!NAME_PATTERN.test(s)) {
    throw new ValidationAppError('Validation failed', `${field} must contain letters only (spaces and hyphens allowed)`);
  }
  return s;
}

function validateEmail(value: unknown): string {
  const s = assertNonEmptyString(value, 'email');
  if (s.length > EMAIL_MAX) {
    throw new ValidationAppError('Validation failed', 'email is too long');
  }
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basic.test(s)) {
    throw new ValidationAppError('Validation failed', 'email format is invalid');
  }
  return s.toLowerCase();
}

function validateOptionalPhone(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationAppError('Validation failed', 'phone must be a string');
  }
  const s = value.trim();
  if (s.length > 15) {
    throw new ValidationAppError('Validation failed', 'phone exceeds maximum length');
  }
  if (!SPANISH_MOBILE_PATTERN.test(s)) {
    throw new ValidationAppError('Validation failed', 'phone must be a valid Spanish mobile number');
  }
  return s;
}

function validateOptionalAddress(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationAppError('Validation failed', 'address must be a string');
  }
  const s = value.trim();
  if (s.length > 100) {
    throw new ValidationAppError('Validation failed', 'address exceeds maximum length');
  }
  return s;
}

function validateEducationItem(raw: unknown, index: number): CreateEducationRequest {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationAppError('Validation failed', `educations[${index}] must be an object`);
  }
  const o = raw as Record<string, unknown>;
  const institution = assertNonEmptyString(o.institution, `educations[${index}].institution`);
  if (institution.length > 100) {
    throw new ValidationAppError('Validation failed', `educations[${index}].institution is too long`);
  }
  const title = assertNonEmptyString(o.title, `educations[${index}].title`);
  if (title.length > 250) {
    throw new ValidationAppError('Validation failed', `educations[${index}].title is too long`);
  }
  const startDate = assertNonEmptyString(o.startDate, `educations[${index}].startDate`);
  const start = parseIsoDate(startDate, `educations[${index}].startDate`);
  let end: Date | undefined;
  if (o.endDate !== undefined && o.endDate !== null && o.endDate !== '') {
    if (typeof o.endDate !== 'string') {
      throw new ValidationAppError('Validation failed', `educations[${index}].endDate must be a string`);
    }
    end = parseIsoDate(o.endDate, `educations[${index}].endDate`);
    if (end < start) {
      throw new ValidationAppError('Validation failed', `educations[${index}].endDate must be on or after startDate`);
    }
  }
  return {
    institution,
    title,
    startDate,
    endDate: end ? end.toISOString() : undefined,
  };
}

function validateWorkItem(raw: unknown, index: number): CreateWorkExperienceRequest {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationAppError('Validation failed', `workExperiences[${index}] must be an object`);
  }
  const o = raw as Record<string, unknown>;
  const company = assertNonEmptyString(o.company, `workExperiences[${index}].company`);
  if (company.length > 100) {
    throw new ValidationAppError('Validation failed', `workExperiences[${index}].company is too long`);
  }
  const position = assertNonEmptyString(o.position, `workExperiences[${index}].position`);
  if (position.length > 100) {
    throw new ValidationAppError('Validation failed', `workExperiences[${index}].position is too long`);
  }
  let description: string | null | undefined;
  if (o.description !== undefined && o.description !== null && o.description !== '') {
    if (typeof o.description !== 'string') {
      throw new ValidationAppError('Validation failed', `workExperiences[${index}].description must be a string`);
    }
    description = o.description.trim();
    if (description.length > 200) {
      throw new ValidationAppError('Validation failed', `workExperiences[${index}].description is too long`);
    }
  }
  const startDate = assertNonEmptyString(o.startDate, `workExperiences[${index}].startDate`);
  const start = parseIsoDate(startDate, `workExperiences[${index}].startDate`);
  let end: Date | undefined;
  if (o.endDate !== undefined && o.endDate !== null && o.endDate !== '') {
    if (typeof o.endDate !== 'string') {
      throw new ValidationAppError('Validation failed', `workExperiences[${index}].endDate must be a string`);
    }
    end = parseIsoDate(o.endDate, `workExperiences[${index}].endDate`);
    if (end < start) {
      throw new ValidationAppError('Validation failed', `workExperiences[${index}].endDate must be on or after startDate`);
    }
  }
  return {
    company,
    position,
    description: description ?? null,
    startDate,
    endDate: end ? end.toISOString() : undefined,
  };
}

function validateCv(raw: unknown): CreateResumeRequest | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationAppError('Validation failed', 'cv must be an object');
  }
  const o = raw as Record<string, unknown>;
  const filePath = assertNonEmptyString(o.filePath, 'cv.filePath');
  if (filePath.length > 500) {
    throw new ValidationAppError('Validation failed', 'cv.filePath exceeds maximum length');
  }
  const fileType = assertNonEmptyString(o.fileType, 'cv.fileType');
  if (fileType.length > 50) {
    throw new ValidationAppError('Validation failed', 'cv.fileType exceeds maximum length');
  }
  return { filePath: filePath.trim(), fileType: fileType.trim() };
}

export function validateCreateCandidateRequest(body: unknown): CreateCandidateRequest {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationAppError('Validation failed', 'Request body must be a JSON object');
  }
  const o = body as Record<string, unknown>;

  const firstName = validateName(o.firstName, 'firstName');
  const lastName = validateName(o.lastName, 'lastName');
  const email = validateEmail(o.email);
  const phone = validateOptionalPhone(o.phone);
  const address = validateOptionalAddress(o.address);

  let educations: CreateEducationRequest[] | undefined;
  if (o.educations !== undefined && o.educations !== null) {
    if (!Array.isArray(o.educations)) {
      throw new ValidationAppError('Validation failed', 'educations must be an array');
    }
    if (o.educations.length > 3) {
      throw new ValidationAppError('Maximum of 3 education records allowed');
    }
    educations = o.educations.map((item, i) => validateEducationItem(item, i));
  }

  let workExperiences: CreateWorkExperienceRequest[] | undefined;
  if (o.workExperiences !== undefined && o.workExperiences !== null) {
    if (!Array.isArray(o.workExperiences)) {
      throw new ValidationAppError('Validation failed', 'workExperiences must be an array');
    }
    workExperiences = o.workExperiences.map((item, i) => validateWorkItem(item, i));
  }

  const cv = validateCv(o.cv);

  return {
    firstName,
    lastName,
    email,
    phone,
    address,
    educations,
    workExperiences,
    cv,
  };
}
