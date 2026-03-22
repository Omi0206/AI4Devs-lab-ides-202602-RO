import { Candidate } from './Candidate';
import { ValidationAppError } from '../errors/AppError';

describe('Candidate', () => {
  it('assertEducationLimit throws when more than 3 educations', () => {
    const row = { institution: 'U', title: 'T', startDate: '2020-01-01T00:00:00.000Z' };
    expect(() =>
      Candidate.assertEducationLimit({
        firstName: 'John',
        lastName: 'Doe',
        email: 'a@b.co',
        educations: [row, row, row, row],
      }),
    ).toThrow(ValidationAppError);
  });
});
