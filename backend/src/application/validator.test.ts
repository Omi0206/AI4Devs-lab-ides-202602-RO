import { validateCreateCandidateRequest } from './validator';
import { ValidationAppError } from '../domain/errors/AppError';

const base = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

describe('validateCreateCandidateRequest', () => {
  it('accepts minimal valid payload', () => {
    const result = validateCreateCandidateRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
      address: null,
      educations: undefined,
      workExperiences: undefined,
      cv: undefined,
    });
  });

  it('normalizes email to lowercase', () => {
    const result = validateCreateCandidateRequest({
      ...base,
      email: 'John.Doe@Example.COM',
    });
    expect(result.email).toBe('john.doe@example.com');
  });

  it('accepts optional phone and address', () => {
    const result = validateCreateCandidateRequest({
      ...base,
      phone: '612345678',
      address: 'Calle 1',
    });
    expect(result.phone).toBe('612345678');
    expect(result.address).toBe('Calle 1');
  });

  it('rejects non-object body', () => {
    expect(() => validateCreateCandidateRequest(null)).toThrow(ValidationAppError);
  });

  it('rejects short first name', () => {
    expect(() =>
      validateCreateCandidateRequest({ ...base, firstName: 'J' }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid name characters', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John3',
        lastName: 'Doe',
        email: 'a@b.co',
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid email format', () => {
    expect(() =>
      validateCreateCandidateRequest({ ...base, email: 'not-an-email' }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid phone format', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'a@b.co',
        phone: '123456789',
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects non-string phone', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        phone: 123 as unknown as string,
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long address', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        address: 'x'.repeat(101),
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects non-array educations', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: {} as never,
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects fourth education row', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: [
          { institution: 'A', title: 'B', startDate: '2020-01-01T00:00:00.000Z' },
          { institution: 'C', title: 'D', startDate: '2020-01-01T00:00:00.000Z' },
          { institution: 'E', title: 'F', startDate: '2020-01-01T00:00:00.000Z' },
          { institution: 'G', title: 'H', startDate: '2020-01-01T00:00:00.000Z' },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid education item', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: ['bad' as never],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid education dates', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: [{ institution: 'U', title: 'T', startDate: 'not-a-date' }],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects end date before start date in education', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'a@b.co',
        educations: [
          {
            institution: 'Uni',
            title: 'CS',
            startDate: '2020-01-02T00:00:00.000Z',
            endDate: '2019-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid endDate type in education', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: [
          {
            institution: 'Uni',
            title: 'CS',
            startDate: '2020-01-02T00:00:00.000Z',
            endDate: 123 as unknown as string,
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('accepts work experiences', () => {
    const result = validateCreateCandidateRequest({
      ...base,
      email: 'a@b.co',
      workExperiences: [
        {
          company: 'Acme',
          position: 'Dev',
          startDate: '2019-01-01T00:00:00.000Z',
          description: 'coding',
        },
      ],
    });
    expect(result.workExperiences?.length).toBe(1);
  });

  it('rejects invalid work experience', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [{} as never],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid work experience date order', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [
          {
            company: 'Acme',
            position: 'Dev',
            startDate: '2020-01-02T00:00:00.000Z',
            endDate: '2019-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid cv object', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        cv: 'x' as never,
      }),
    ).toThrow(ValidationAppError);
  });

  it('accepts cv object', () => {
    const result = validateCreateCandidateRequest({
      ...base,
      email: 'a@b.co',
      cv: { filePath: 'a.pdf', fileType: 'application/pdf' },
    });
    expect(result.cv).toEqual({ filePath: 'a.pdf', fileType: 'application/pdf' });
  });

  it('rejects non-array workExperiences', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: {} as never,
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects email that is too long', () => {
    const longEmail = `${'a'.repeat(250)}@example.com`;
    expect(longEmail.length).toBeGreaterThan(255);
    expect(() =>
      validateCreateCandidateRequest({ ...base, email: longEmail }),
    ).toThrow(ValidationAppError);
  });

  it('rejects phone longer than 15 chars', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        phone: '6123456789012346',
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects non-string address', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        address: 1 as unknown as string,
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long institution in education', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: [
          {
            institution: 'x'.repeat(101),
            title: 'T',
            startDate: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long title in education', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        educations: [
          {
            institution: 'Uni',
            title: 'x'.repeat(251),
            startDate: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long company in work experience', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [
          {
            company: 'x'.repeat(101),
            position: 'Dev',
            startDate: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long position in work experience', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [
          {
            company: 'Acme',
            position: 'x'.repeat(101),
            startDate: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long description in work experience', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [
          {
            company: 'Acme',
            position: 'Dev',
            description: 'x'.repeat(201),
            startDate: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects non-string description in work experience', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [
          {
            company: 'Acme',
            position: 'Dev',
            description: 1 as unknown as string,
            startDate: '2020-01-01T00:00:00.000Z',
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects invalid endDate type in work experience', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        workExperiences: [
          {
            company: 'Acme',
            position: 'Dev',
            startDate: '2020-01-02T00:00:00.000Z',
            endDate: 1 as unknown as string,
          },
        ],
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long cv filePath', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        cv: { filePath: 'x'.repeat(501), fileType: 'application/pdf' },
      }),
    ).toThrow(ValidationAppError);
  });

  it('rejects long cv fileType', () => {
    expect(() =>
      validateCreateCandidateRequest({
        ...base,
        email: 'a@b.co',
        cv: { filePath: 'a.pdf', fileType: `${'x'.repeat(51)}` },
      }),
    ).toThrow(ValidationAppError);
  });
});
