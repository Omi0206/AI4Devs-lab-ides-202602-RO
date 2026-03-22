import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../App';

function renderApp(initialPath = '/'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

test('dashboard shows Add candidate and navigates to form', async () => {
  renderApp('/');
  expect(
    screen.getByRole('heading', { name: /recruiter dashboard/i }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('add-candidate-cta'));
  expect(
    await screen.findByRole('heading', { name: /add candidate/i }),
  ).toBeInTheDocument();
});

test('add-candidate route renders form fields', () => {
  renderApp('/candidates/new');
  expect(screen.getByTestId('field-firstName')).toBeInTheDocument();
  expect(screen.getByTestId('field-lastName')).toBeInTheDocument();
  expect(screen.getByTestId('field-email')).toBeInTheDocument();
});
