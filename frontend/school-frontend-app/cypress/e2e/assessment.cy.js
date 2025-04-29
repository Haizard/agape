describe('Assessment Management System', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type('admin@test.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Assessment Creation', () => {
    it('should create a new assessment', () => {
      cy.visit('/assessments/manage');
      cy.get('[data-testid=create-assessment-button]').click();

      // Fill assessment form
      cy.get('[data-testid=assessment-name-input]').type('End-to-End Test Assessment');
      cy.get('[data-testid=assessment-weightage-input]').type('40');
      cy.get('[data-testid=assessment-maxmarks-input]').type('100');
      cy.get('[data-testid=assessment-term-select]').select('1');
      cy.get('[data-testid=assessment-date-input]').type('2024-03-15');

      // Submit form
      cy.get('[data-testid=submit-assessment-button]').click();

      // Verify success message
      cy.get('[data-testid=success-message]')
        .should('be.visible')
        .and('contain', 'Assessment created successfully');

      // Verify assessment appears in list
      cy.get('[data-testid=assessments-list]')
        .should('contain', 'End-to-End Test Assessment');
    });

    it('should validate assessment form', () => {
      cy.visit('/assessments/manage');
      cy.get('[data-testid=create-assessment-button]').click();

      // Try to submit empty form
      cy.get('[data-testid=submit-assessment-button]').click();

      // Check validation messages
      cy.get('[data-testid=name-error]').should('be.visible');
      cy.get('[data-testid=weightage-error]').should('be.visible');
      cy.get('[data-testid=term-error]').should('be.visible');
      cy.get('[data-testid=date-error]').should('be.visible');
    });
  });

  describe('Assessment List and Filtering', () => {
    beforeEach(() => {
      // Create test assessments via API
      cy.request({
        method: 'POST',
        url: '/api/assessments',
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: {
          name: 'Test Assessment 1',
          weightage: 30,
          maxMarks: 100,
          term: '1',
          examDate: '2024-03-15',
          status: 'active'
        }
      });

      cy.request({
        method: 'POST',
        url: '/api/assessments',
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: {
          name: 'Test Assessment 2',
          weightage: 40,
          maxMarks: 100,
          term: '2',
          examDate: '2024-04-15',
          status: 'active'
        }
      });
    });

    it('should display and filter assessments', () => {
      cy.visit('/assessments/manage');

      // Verify both assessments are visible
      cy.get('[data-testid=assessments-list]')
        .should('contain', 'Test Assessment 1')
        .and('contain', 'Test Assessment 2');

      // Filter by term
      cy.get('[data-testid=term-filter]').select('1');
      cy.get('[data-testid=assessments-list]')
        .should('contain', 'Test Assessment 1')
        .and('not.contain', 'Test Assessment 2');

      // Clear filter
      cy.get('[data-testid=clear-filters]').click();
      cy.get('[data-testid=assessments-list]')
        .should('contain', 'Test Assessment 1')
        .and('contain', 'Test Assessment 2');
    });
  });

  describe('Marks Entry', () => {
    let assessmentId;

    beforeEach(() => {
      // Create test assessment and get its ID
      cy.request({
        method: 'POST',
        url: '/api/assessments',
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: {
          name: 'Marks Entry Test',
          weightage: 50,
          maxMarks: 100,
          term: '1',
          examDate: '2024-03-15',
          status: 'active'
        }
      }).then((response) => {
        assessmentId = response.body.data._id;
      });
    });

    it('should enter marks for students', () => {
      cy.visit(`/assessments/marks/${assessmentId}`);

      // Enter marks for students
      cy.get('[data-testid=marks-input-0]').type('85');
      cy.get('[data-testid=marks-input-1]').type('90');

      // Save marks
      cy.get('[data-testid=save-marks-button]').click();

      // Verify success message
      cy.get('[data-testid=success-message]')
        .should('be.visible')
        .and('contain', 'Marks saved successfully');

      // Verify marks are persisted
      cy.reload();
      cy.get('[data-testid=marks-input-0]').should('have.value', '85');
      cy.get('[data-testid=marks-input-1]').should('have.value', '90');
    });

    it('should validate marks entry', () => {
      cy.visit(`/assessments/marks/${assessmentId}`);

      // Try to enter invalid marks
      cy.get('[data-testid=marks-input-0]').type('150');
      cy.get('[data-testid=save-marks-button]').click();

      // Check validation message
      cy.get('[data-testid=marks-error]')
        .should('be.visible')
        .and('contain', 'exceed maximum marks');
    });
  });

  describe('Reports Generation', () => {
    let assessmentId;

    beforeEach(() => {
      // Create test assessment with marks
      cy.request({
        method: 'POST',
        url: '/api/assessments',
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body: {
          name: 'Report Test Assessment',
          weightage: 50,
          maxMarks: 100,
          term: '1',
          examDate: '2024-03-15',
          status: 'active'
        }
      }).then((response) => {
        assessmentId = response.body.data._id;
        
        // Add test marks
        cy.request({
          method: 'POST',
          url: '/api/assessments/bulk-marks',
          headers: { Authorization: `Bearer ${Cypress.env('token')}` },
          body: {
            marks: [
              { studentId: 'student1', assessmentId, marksObtained: 85 },
              { studentId: 'student2', assessmentId, marksObtained: 90 }
            ]
          }
        });
      });
    });

    it('should generate and display assessment report', () => {
      cy.visit(`/assessments/report/${assessmentId}`);

      // Verify report components
      cy.get('[data-testid=report-header]')
        .should('contain', 'Report Test Assessment');

      cy.get('[data-testid=statistics-section]')
        .should('be.visible')
        .and('contain', 'Average Score')
        .and('contain', 'Pass Rate');

      cy.get('[data-testid=grade-distribution]')
        .should('be.visible');

      cy.get('[data-testid=results-table]')
        .should('be.visible')
        .and('contain', 'Student Name')
        .and('contain', 'Marks')
        .and('contain', 'Grade');
    });

    it('should export report as PDF', () => {
      cy.visit(`/assessments/report/${assessmentId}`);

      // Click export button and verify download
      cy.get('[data-testid=export-pdf-button]').click();
      cy.readFile('cypress/downloads/assessment-report.pdf').should('exist');
    });
  });

  describe('Dashboard Widgets', () => {
    it('should display assessment statistics widget', () => {
      cy.visit('/dashboard');

      cy.get('[data-testid=assessment-stats-widget]')
        .should('be.visible')
        .and('contain', 'Total Assessments')
        .and('contain', 'Completion Rate');
    });

    it('should display upcoming assessments widget', () => {
      cy.visit('/dashboard');

      cy.get('[data-testid=upcoming-assessments-widget]')
        .should('be.visible')
        .and('contain', 'Upcoming Assessments');
    });
  });
});