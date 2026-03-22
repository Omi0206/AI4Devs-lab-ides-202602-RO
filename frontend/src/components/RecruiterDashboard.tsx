import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function RecruiterDashboard(): JSX.Element {
  return (
    <Container className="py-5">
      <h1 className="h3 mb-4">Recruiter dashboard</h1>
      <p className="text-muted mb-4">
        Manage candidates and hiring workflows from this workspace.
      </p>
      <Link
        to="/candidates/new"
        className="btn btn-primary btn-lg"
        data-testid="add-candidate-cta"
      >
        Add candidate
      </Link>
    </Container>
  );
}
