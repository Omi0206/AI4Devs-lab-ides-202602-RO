import type {
  CreateCandidateRequest,
  CreateEducationRequest,
  CreateResumeRequest,
  CreateWorkExperienceRequest,
} from '../types/candidate';
import { dateInputToIsoDateTime, parseUserDate } from '../utils/dateIso';

/** Matches backend `NAME_PATTERN` in `validator.ts`. */
export const NAME_PATTERN =
  /^[a-zA-ZÀ-ÿ\u00f1\u00d1][a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]{1,99}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPANISH_MOBILE_PATTERN = /^[679]\d{8}$/;

export const MAX_EDUCATION_ROWS = 3;
export const MAX_CV_BYTES = 10 * 1024 * 1024;

const ALLOWED_CV_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export type FieldErrors = Record<string, string | undefined>;

export interface EducationFormRow {
  institution: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface WorkFormRow {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface AddCandidateFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  educations: EducationFormRow[];
  workExperiences: WorkFormRow[];
}

export function isEducationRowEmpty(row: EducationFormRow): boolean {
  return (
    !row.institution.trim() &&
    !row.title.trim() &&
    !row.startDate.trim() &&
    !row.endDate.trim()
  );
}

export function isWorkRowEmpty(row: WorkFormRow): boolean {
  return (
    !row.company.trim() &&
    !row.position.trim() &&
    !row.description.trim() &&
    !row.startDate.trim() &&
    !row.endDate.trim()
  );
}

function educationKey(i: number, field: string): string {
  return `educations.${i}.${field}`;
}

function workKey(i: number, field: string): string {
  return `workExperiences.${i}.${field}`;
}

export function validateCvFile(file: File | null): {
  valid: boolean;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  if (!file) {
    return { valid: true, errors };
  }
  if (file.size > MAX_CV_BYTES) {
    errors.cvFile = 'File must be 10 MB or smaller.';
    return { valid: false, errors };
  }
  const okMime =
    file.type === '' || ALLOWED_CV_MIME.has(file.type);
  const lower = file.name.toLowerCase();
  const okExt = lower.endsWith('.pdf') || lower.endsWith('.docx');
  if (!okMime && !okExt) {
    errors.cvFile = 'Only PDF or DOCX files are allowed.';
    return { valid: false, errors };
  }
  return { valid: true, errors };
}

export function validateCandidateForm(
  state: AddCandidateFormState,
  cvFile: File | null,
): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const first = state.firstName.trim();
  const last = state.lastName.trim();
  const email = state.email.trim();
  const phone = state.phone.trim();
  const address = state.address.trim();

  if (first.length < 2 || first.length > 100) {
    errors.firstName = 'First name must be between 2 and 100 characters.';
  } else if (!NAME_PATTERN.test(first)) {
    errors.firstName =
      'First name must contain letters only (spaces and hyphens allowed).';
  }

  if (last.length < 2 || last.length > 100) {
    errors.lastName = 'Last name must be between 2 and 100 characters.';
  } else if (!NAME_PATTERN.test(last)) {
    errors.lastName =
      'Last name must contain letters only (spaces and hyphens allowed).';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (phone) {
    if (phone.length > 15) {
      errors.phone = 'Phone must be at most 15 characters.';
    } else if (!SPANISH_MOBILE_PATTERN.test(phone)) {
      errors.phone =
        'Phone must be a valid Spanish mobile number (9 digits starting with 6, 7, or 9).';
    }
  }

  if (address.length > 100) {
    errors.address = 'Address must be at most 100 characters.';
  }

  if (state.educations.length > MAX_EDUCATION_ROWS) {
    errors.educations = `At most ${MAX_EDUCATION_ROWS} education records are allowed.`;
  }

  state.educations.forEach((row, i) => {
    if (isEducationRowEmpty(row)) {
      return;
    }
    const inst = row.institution.trim();
    const title = row.title.trim();
    const sd = row.startDate.trim();
    const ed = row.endDate.trim();

    if (!inst) {
      errors[educationKey(i, 'institution')] = 'Institution is required.';
    } else if (inst.length > 100) {
      errors[educationKey(i, 'institution')] =
        'Institution must be at most 100 characters.';
    }

    if (!title) {
      errors[educationKey(i, 'title')] = 'Title is required.';
    } else if (title.length > 250) {
      errors[educationKey(i, 'title')] = 'Title must be at most 250 characters.';
    }

    if (!sd) {
      errors[educationKey(i, 'startDate')] = 'Start date is required.';
    } else if (!parseUserDate(sd)) {
      errors[educationKey(i, 'startDate')] = 'Enter a valid start date.';
    }

    if (ed) {
      const start = parseUserDate(sd);
      const end = parseUserDate(ed);
      if (!end) {
        errors[educationKey(i, 'endDate')] = 'Enter a valid end date.';
      } else if (start && end < start) {
        errors[educationKey(i, 'endDate')] =
          'End date must be on or after the start date.';
      }
    }
  });

  state.workExperiences.forEach((row, i) => {
    if (isWorkRowEmpty(row)) {
      return;
    }
    const company = row.company.trim();
    const position = row.position.trim();
    const desc = row.description.trim();
    const sd = row.startDate.trim();
    const ed = row.endDate.trim();

    if (!company) {
      errors[workKey(i, 'company')] = 'Company is required.';
    } else if (company.length > 100) {
      errors[workKey(i, 'company')] = 'Company must be at most 100 characters.';
    }

    if (!position) {
      errors[workKey(i, 'position')] = 'Position is required.';
    } else if (position.length > 100) {
      errors[workKey(i, 'position')] = 'Position must be at most 100 characters.';
    }

    if (desc.length > 200) {
      errors[workKey(i, 'description')] =
        'Description must be at most 200 characters.';
    }

    if (!sd) {
      errors[workKey(i, 'startDate')] = 'Start date is required.';
    } else if (!parseUserDate(sd)) {
      errors[workKey(i, 'startDate')] = 'Enter a valid start date.';
    }

    if (ed) {
      const start = parseUserDate(sd);
      const end = parseUserDate(ed);
      if (!end) {
        errors[workKey(i, 'endDate')] = 'Enter a valid end date.';
      } else if (start && end < start) {
        errors[workKey(i, 'endDate')] =
          'End date must be on or after the start date.';
      }
    }
  });

  const cvResult = validateCvFile(cvFile);
  Object.assign(errors, cvResult.errors);

  const valid = !Object.values(errors).some((v) => v !== undefined);

  return { valid, errors };
}

export function buildCreateCandidatePayload(
  state: AddCandidateFormState,
  cv?: CreateResumeRequest,
): CreateCandidateRequest {
  const educations: CreateEducationRequest[] = state.educations
    .filter((row) => !isEducationRowEmpty(row))
    .map((row) => {
      const endRaw = row.endDate.trim();
      return {
        institution: row.institution.trim(),
        title: row.title.trim(),
        startDate: dateInputToIsoDateTime(row.startDate.trim()),
        endDate: endRaw ? dateInputToIsoDateTime(endRaw) : undefined,
      };
    });

  const workExperiences: CreateWorkExperienceRequest[] =
    state.workExperiences
      .filter((row) => !isWorkRowEmpty(row))
      .map((row) => {
        const endRaw = row.endDate.trim();
        const desc = row.description.trim();
        return {
          company: row.company.trim(),
          position: row.position.trim(),
          description: desc || null,
          startDate: dateInputToIsoDateTime(row.startDate.trim()),
          endDate: endRaw ? dateInputToIsoDateTime(endRaw) : undefined,
        };
      });

  return {
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    email: state.email.trim().toLowerCase(),
    phone: state.phone.trim() || null,
    address: state.address.trim() || null,
    educations: educations.length ? educations : undefined,
    workExperiences: workExperiences.length ? workExperiences : undefined,
    cv,
  };
}
