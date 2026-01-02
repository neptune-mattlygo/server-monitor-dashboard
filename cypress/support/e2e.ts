// Cypress support index file
import './commands';
import '@testing-library/cypress/add-commands';

// Add custom Cypress configuration
beforeEach(() => {
  // Reset viewport to standard desktop size
  cy.viewport(1280, 720);
  
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Add global error handling
Cypress.on('window:before:load', (win) => {
  // Stub console methods to reduce noise in test output
  cy.stub(win.console, 'log');
  cy.stub(win.console, 'info');
});

export {};
