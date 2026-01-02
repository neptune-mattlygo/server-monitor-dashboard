// Component testing support file
import './commands';
import { mount } from 'cypress/react18';

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Add component testing specific configuration
beforeEach(() => {
  // Set up any global mocks or stubs for component tests
});

export {};
