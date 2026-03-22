import {
  buildCreateCandidatePayload,
  isEducationRowEmpty,
  MAX_CV_BYTES,
  validateCandidateForm,
  validateCvFile,
  type AddCandidateFormState,
} from '../validation/candidateFormValidation';

const baseState = (): AddCandidateFormState => ({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '',
  address: '',
  educations: [],
  workExperiences: [],
});

describe('validateCandidateForm', () => {
  it('accepts minimal valid candidate', () => {
    const { valid, errors } = validateCandidateForm(baseState(), null);
    expect(valid).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('requires first and last name length and pattern', () => {
    const s = baseState();
    s.firstName = 'J';
    let r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors.firstName).toBeDefined();

    s.firstName = 'Jane1';
    r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors.firstName).toBeDefined();
  });

  it('validates email format', () => {
    const s = baseState();
    s.email = 'not-an-email';
    const r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors.email).toBeDefined();
  });

  it('validates Spanish mobile when provided', () => {
    const s = baseState();
    s.phone = '12345';
    const r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors.phone).toBeDefined();

    s.phone = '612345678';
    expect(validateCandidateForm(s, null).valid).toBe(true);
  });

  it('caps education rows at 3', () => {
    const s = baseState();
    s.educations = [
      { institution: 'U', title: 'BSc', startDate: '2020-01-01', endDate: '' },
      { institution: 'U2', title: 'MSc', startDate: '2022-01-01', endDate: '' },
      { institution: 'U3', title: 'PhD', startDate: '2024-01-01', endDate: '' },
      { institution: 'U4', title: 'X', startDate: '2025-01-01', endDate: '' },
    ];
    const r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors.educations).toBeDefined();
  });

  it('validates partial education row', () => {
    const s = baseState();
    s.educations = [
      { institution: 'Uni', title: '', startDate: '', endDate: '' },
    ];
    const r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors['educations.0.title']).toBeDefined();
    expect(r.errors['educations.0.startDate']).toBeDefined();
  });

  it('validates education end after start', () => {
    const s = baseState();
    s.educations = [
      {
        institution: 'Uni',
        title: 'BSc',
        startDate: '2020-01-10',
        endDate: '2019-01-01',
      },
    ];
    const r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors['educations.0.endDate']).toBeDefined();
  });

  it('validates work experience row', () => {
    const s = baseState();
    s.workExperiences = [
      {
        company: 'Acme',
        position: '',
        description: '',
        startDate: '2019-06-01',
        endDate: '',
      },
    ];
    const r = validateCandidateForm(s, null);
    expect(r.valid).toBe(false);
    expect(r.errors['workExperiences.0.position']).toBeDefined();
  });

  it('rejects oversized CV', () => {
    const file = new File([new ArrayBuffer(MAX_CV_BYTES + 1)], 'cv.pdf', {
      type: 'application/pdf',
    });
    const r = validateCandidateForm(baseState(), file);
    expect(r.valid).toBe(false);
    expect(r.errors.cvFile).toBeDefined();
  });
});

describe('validateCvFile', () => {
  it('allows empty selection', () => {
    expect(validateCvFile(null).valid).toBe(true);
  });

  it('allows pdf by mime', () => {
    const f = new File([new ArrayBuffer(100)], 'a.pdf', {
      type: 'application/pdf',
    });
    expect(validateCvFile(f).valid).toBe(true);
  });

  it('rejects wrong type', () => {
    const f = new File([new ArrayBuffer(100)], 'a.exe', {
      type: 'application/octet-stream',
    });
    const r = validateCvFile(f);
    expect(r.valid).toBe(false);
    expect(r.errors.cvFile).toBeDefined();
  });
});

describe('buildCreateCandidatePayload', () => {
  it('omits empty nested arrays', () => {
    const p = buildCreateCandidatePayload(baseState(), undefined);
    expect(p.educations).toBeUndefined();
    expect(p.workExperiences).toBeUndefined();
    expect(p.cv).toBeUndefined();
  });

  it('includes education and work when present', () => {
    const s = baseState();
    s.educations = [
      {
        institution: 'Uni',
        title: 'BSc',
        startDate: '2020-01-15',
        endDate: '',
      },
    ];
    s.workExperiences = [
      {
        company: 'Co',
        position: 'Dev',
        description: '',
        startDate: '2021-02-01',
        endDate: '',
      },
    ];
    const p = buildCreateCandidatePayload(s, undefined);
    expect(p.educations?.length).toBe(1);
    expect(p.workExperiences?.length).toBe(1);
  });
});

describe('isEducationRowEmpty', () => {
  it('detects empty row', () => {
    expect(
      isEducationRowEmpty({
        institution: '',
        title: '',
        startDate: '',
        endDate: '',
      }),
    ).toBe(true);
  });
});
