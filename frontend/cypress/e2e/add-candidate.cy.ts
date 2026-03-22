describe('Add candidate flow', () => {
  it('navigates from dashboard to the add-candidate form', () => {
    cy.visit('/');
    cy.get('[data-testid="add-candidate-cta"]').should('be.visible');
    cy.get('[data-testid="add-candidate-cta"]').click();
    cy.url().should('include', '/candidates/new');
    cy.contains('Add candidate').should('be.visible');
  });

  it('submits a candidate without CV (stubbed API)', () => {
    cy.intercept('POST', '**/candidates', {
      statusCode: 201,
      body: {
        id: 42,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: null,
        address: null,
      },
    }).as('createCandidate');

    cy.visit('/candidates/new');
    cy.get('[data-testid="field-firstName"]').type('Jane');
    cy.get('[data-testid="field-lastName"]').type('Doe');
    cy.get('[data-testid="field-email"]').type('jane@example.com');
    cy.get('[data-testid="add-candidate-submit"]').click();

    cy.wait('@createCandidate');
    cy.contains('Candidate added successfully').should('be.visible');
    cy.contains('42').should('be.visible');
  });

  it('shows duplicate email message when API returns 400', () => {
    cy.intercept('POST', '**/candidates', {
      statusCode: 400,
      body: {
        message: 'A candidate with this email already exists',
      },
    }).as('createCandidate');

    cy.visit('/candidates/new');
    cy.get('[data-testid="field-firstName"]').type('Jane');
    cy.get('[data-testid="field-lastName"]').type('Doe');
    cy.get('[data-testid="field-email"]').type('dup@example.com');
    cy.get('[data-testid="add-candidate-submit"]').click();

    cy.wait('@createCandidate');
    cy.contains('A candidate with this email already exists').should(
      'be.visible',
    );
  });
});
