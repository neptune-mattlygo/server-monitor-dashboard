// Cypress support file - custom commands and global configuration

// Custom command type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       * @example cy.login('admin@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to log in as admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Custom command to log in as editor
       * @example cy.loginAsEditor()
       */
      loginAsEditor(): Chainable<void>;

      /**
       * Custom command to log in as viewer
       * @example cy.loginAsViewer()
       */
      loginAsViewer(): Chainable<void>;

      /**
       * Custom command to log out
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to set authentication cookie
       * @example cy.setAuthCookie('session-token')
       */
      setAuthCookie(token: string): Chainable<void>;

      /**
       * Custom command to seed database
       * @example cy.seedDatabase()
       */
      seedDatabase(): Chainable<void>;

      /**
       * Custom command to clear database
       * @example cy.clearDatabase()
       */
      clearDatabase(): Chainable<void>;

      /**
       * Custom command to create a test server
       * @example cy.createServer({ name: 'Test Server', url: 'https://example.com' })
       */
      createServer(data: any): Chainable<any>;

      /**
       * Custom command to create a test host
       * @example cy.createHost({ name: 'Test Host', region: 'us-east-1' })
       */
      createHost(data: any): Chainable<any>;

      /**
       * Custom command to send a webhook
       * @example cy.sendWebhook('uptimerobot', payload)
       */
      sendWebhook(source: string, payload: any): Chainable<any>;

      /**
       * Custom command to wait for server status update
       * @example cy.waitForServerStatus('server-id', 'up')
       */
      waitForServerStatus(serverId: string, status: string): Chainable<void>;

      /**
       * Custom command to get element by data-testid
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<any>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.getByTestId('email-input').type(email);
  cy.getByTestId('password-input').type(password);
  cy.getByTestId('submit-button').click();
  cy.url().should('include', '/dashboard');
});

// Login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'AdminPassword123!');
});

// Login as editor
Cypress.Commands.add('loginAsEditor', () => {
  cy.login('editor@example.com', 'EditorPassword123!');
});

// Login as viewer
Cypress.Commands.add('loginAsViewer', () => {
  cy.login('viewer@example.com', 'ViewerPassword123!');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.visit('/logout');
  cy.url().should('include', '/login');
});

// Set auth cookie
Cypress.Commands.add('setAuthCookie', (token: string) => {
  cy.setCookie('server_monitor_session', token, {
    httpOnly: true,
    secure: false, // Set to true in production
    sameSite: 'lax',
  });
});

// Seed database
Cypress.Commands.add('seedDatabase', () => {
  cy.task('db:seed');
});

// Clear database
Cypress.Commands.add('clearDatabase', () => {
  cy.task('db:clear');
});

// Create server via API
Cypress.Commands.add('createServer', (data: any) => {
  return cy.request({
    method: 'POST',
    url: '/api/servers',
    body: data,
    failOnStatusCode: false,
  });
});

// Create host via API
Cypress.Commands.add('createHost', (data: any) => {
  return cy.request({
    method: 'POST',
    url: '/api/hosts',
    body: data,
    failOnStatusCode: false,
  });
});

// Send webhook
Cypress.Commands.add('sendWebhook', (source: string, payload: any) => {
  const secrets: Record<string, string> = {
    uptimerobot: 'development_secret_uptimerobot',
    filemaker: 'development_secret_filemaker',
    backup: 'development_secret_backup',
    n8n: 'development_secret_n8n',
  };

  return cy.request({
    method: 'POST',
    url: `/api/webhooks/${source}`,
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secrets[source] || 'development_secret',
    },
    body: payload,
    failOnStatusCode: false,
  });
});

// Wait for server status
Cypress.Commands.add('waitForServerStatus', (serverId: string, expectedStatus: string) => {
  cy.getByTestId(`server-row-${serverId}`)
    .find('[data-testid^="status-badge-"]')
    .should('have.attr', 'data-testid', `status-badge-${expectedStatus}`);
});

// Get by test ID
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on certain errors
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Add custom assertion messages
chai.Assertion.addMethod('toHaveTestId', function (expected: string) {
  const actual = this._obj.attr('data-testid');
  this.assert(
    actual === expected,
    `expected element to have data-testid "${expected}" but got "${actual}"`,
    `expected element not to have data-testid "${expected}"`,
    expected,
    actual
  );
});

export {};
