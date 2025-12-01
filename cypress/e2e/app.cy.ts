describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should redirect unauthenticated users to Azure AD login', () => {
    cy.url().should('include', '/api/auth/azure/login');
  });

  // Note: Full Azure AD OAuth flow testing requires mocking or test accounts
  // These tests would be implemented with proper test infrastructure
});

describe('Dashboard', () => {
  beforeEach(() => {
    // Mock authentication
    cy.setCookie('server_monitor_session', 'test-session-id');
  });

  it('should display dashboard for authenticated users', () => {
    cy.visit('/dashboard');
    cy.contains('Server Monitor Dashboard').should('be.visible');
  });
});

describe('Webhooks', () => {
  it('should accept valid UptimeRobot webhook', () => {
    cy.request({
      method: 'POST',
      url: '/api/webhooks/uptimerobot',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'development_secret_uptimerobot',
      },
      body: {
        monitorID: '123',
        monitorFriendlyName: 'Test Server',
        alertTypeFriendlyName: 'Up',
        monitorURL: 'https://example.com',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
    });
  });

  it('should reject webhook with invalid secret', () => {
    cy.request({
      method: 'POST',
      url: '/api/webhooks/uptimerobot',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'invalid-secret',
      },
      body: {
        monitorID: '123',
        monitorFriendlyName: 'Test Server',
        alertTypeFriendlyName: 'Up',
        monitorURL: 'https://example.com',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });
});
