import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AddCandidatePage } from '../components/AddCandidatePage';
import { createCandidate } from '../services/candidateService';

jest.mock('../services/candidateService', () => ({
  createCandidate: jest.fn(),
}));

jest.mock('../services/uploadService', () => ({
  uploadFile: jest.fn(),
}));

const mockedCreate = createCandidate as jest.MockedFunction<typeof createCandidate>;

describe('AddCandidatePage', () => {
  beforeEach(() => {
    mockedCreate.mockResolvedValue({
      id: 7,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: null,
      address: null,
    });
  });

  afterEach(() => {
    mockedCreate.mockReset();
  });

  it('submits and shows success with candidate id', async () => {
    render(
      <MemoryRouter>
        <AddCandidatePage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByTestId('field-firstName'), 'Jane');
    await userEvent.type(screen.getByTestId('field-lastName'), 'Doe');
    await userEvent.type(screen.getByTestId('field-email'), 'jane@example.com');
    await userEvent.click(screen.getByTestId('add-candidate-submit'));

    expect(await screen.findByText(/reference id/i)).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(mockedCreate).toHaveBeenCalled();
  });
});
