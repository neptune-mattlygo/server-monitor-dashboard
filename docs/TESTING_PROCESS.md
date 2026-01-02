# Testing Process Outline

## Testing Philosophy

This project uses a multi-layered testing approach:
- **Unit Tests (Jest + React Testing Library)**: Test individual components and utility functions in isolation
- **Integration Tests (Jest)**: Test interactions between components, API routes, and database operations
- **E2E Tests (Cypress)**: Test complete user workflows and critical paths
- **Component Tests (Cypress)**: Test complex UI components in isolation with real browser rendering

## Test Coverage Goals

- **API Routes**: 90%+ coverage - Critical for security and data integrity
- **Authentication/Authorization**: 100% coverage - Zero tolerance for security gaps
- **Webhook Handlers**: 95%+ coverage - Mission-critical integration points
- **UI Components**: 70%+ coverage - Focus on user-facing functionality
- **Utility Functions**: 90%+ coverage - High reuse justifies thorough testing

## Directory Structure

```
__tests__/
├── components/          # Unit tests for UI components
│   ├── ui/             # shadcn/ui component tests
│   └── feature/        # Feature-specific component tests
├── dashboard/          # Dashboard page component tests
├── events/             # Events page component tests
├── status/             # Status page component tests
├── lib/                # Library/utility function tests
│   ├── auth/          # Authentication logic tests
│   ├── webhooks/      # Webhook processing tests
│   ├── polling/       # Polling logic tests
│   └── backup-monitoring/  # Backup monitoring tests
└── api/                # API route integration tests

cypress/
├── e2e/                # End-to-end workflow tests
│   ├── auth/          # Authentication flows
│   ├── dashboard/     # Dashboard workflows
│   ├── webhooks/      # Webhook integration tests
│   └── admin/         # Admin functionality
├── component/          # Isolated component tests
└── support/            # Cypress helpers and commands
```

## Component Testing Strategy

### 1. Dashboard Components

**Components to Test:**
- `dashboard-client.tsx` - Main dashboard orchestrator
- `host-server-table.tsx` - Server grouping by host
- `all-servers-table.tsx` - Flat server list
- `add-server-dialog.tsx` - Server creation form
- `add-host-dialog.tsx` - Host creation form
- `server-edit-dialog.tsx` - Server editing
- `edit-host-dialog.tsx` - Host editing
- `server-event-history-dialog.tsx` - Event timeline
- `dashboard-header.tsx` - Header with filters
- `relative-time.tsx` - Time display utility
- `logo-upload-settings.tsx` - Logo management
- `metadata-refresh-settings.tsx` - Metadata refresh controls

**Test Focus:**
- ✅ Component rendering with various props
- ✅ Form validation and submission
- ✅ Permission-based UI changes (viewer/editor/admin)
- ✅ Real-time updates and polling
- ✅ Error states and loading states
- ✅ Dialog open/close behavior
- ✅ Server status badge colors and states
- ✅ Filter and search functionality

### 2. Events Components

**Components to Test:**
- `events-page-client.tsx` - Events page container
- `events-table-client.tsx` - Event list with pagination
- `events-skeleton.tsx` - Loading state

**Test Focus:**
- ✅ Event list rendering with pagination
- ✅ Filtering by server, source, type, status
- ✅ Date range filtering
- ✅ Event payload display
- ✅ Real-time event updates
- ✅ Skeleton loading states

### 3. Status Page Components

**Components to Test:**
- `status-page-client.tsx` - Public status display

**Test Focus:**
- ✅ Public access (no auth required)
- ✅ Server status display
- ✅ Incident display
- ✅ Auto-refresh behavior
- ✅ Responsive design
- ✅ Custom branding display

### 4. Admin Components

**Components to Test:**
- User management components
- Incident management components
- Settings components

**Test Focus:**
- ✅ Admin-only access control
- ✅ User creation/editing/deletion
- ✅ Role assignment
- ✅ Incident creation/resolution
- ✅ System settings modification

### 5. UI Components (shadcn/ui)

**Focus on Custom Modifications:**
- Test only if we've customized beyond shadcn defaults
- Test complex interactions (multi-select, command menu)
- Test accessibility features

## API Route Testing Strategy

### Authentication Routes (`/api/auth/*`)

**Routes to Test:**
- `POST /api/auth/azure/login` - Azure AD OAuth initiation
- `GET /api/auth/azure/callback` - OAuth callback handling
- `POST /api/auth/local/login` - Local username/password login
- `POST /api/auth/local/signup` - Local user registration
- `GET /api/auth/logout` - Session termination

**Test Focus:**
- ✅ Session creation and validation
- ✅ Cookie setting (HTTP-only, secure flags)
- ✅ Invalid credentials handling
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ First user becomes admin logic

### Server Management Routes (`/api/servers/*`)

**Test Focus:**
- ✅ Permission checks (canView, canCreate, canUpdate, canDelete)
- ✅ Input validation (name, URL, type)
- ✅ Metadata handling (JSONB field)
- ✅ Server creation with host association
- ✅ Server updates preserve history
- ✅ Server deletion cascades to events

### Webhook Routes (`/api/webhooks/*`)

**Routes to Test:**
- `POST /api/webhooks/uptimerobot`
- `POST /api/webhooks/filemaker`
- `POST /api/webhooks/backup`
- `POST /api/webhooks/n8n`

**Test Focus:**
- ✅ Signature validation (X-Webhook-Secret header)
- ✅ Rate limiting per source
- ✅ Payload parsing (each source format)
- ✅ Server matching logic
- ✅ Event creation
- ✅ Status change detection
- ✅ Invalid payload rejection
- ✅ Missing server handling

### User Management Routes (`/api/users/*`, `/api/admin/*`)

**Test Focus:**
- ✅ Admin-only access enforcement
- ✅ User creation/listing/updating/deletion
- ✅ Role modification
- ✅ Password encryption
- ✅ Prevent self-demotion (admin can't remove own admin role)

## Library Function Testing

### Authentication (`lib/auth/*`)

**Modules to Test:**
- `session.ts` - getCurrentUser, createSession, deleteSession
- `permissions.ts` - hasRole, canView, canCreate, canUpdate, canDelete
- `azure.ts` - Azure AD OAuth flow
- `local.ts` - Local auth with bcrypt

**Test Focus:**
- ✅ Session token hashing (SHA-256)
- ✅ Session expiration (30 days default)
- ✅ Role hierarchy (viewer < editor < admin)
- ✅ Permission inheritance
- ✅ Azure AD token validation
- ✅ Password hashing and comparison

### Webhook Processing (`lib/webhooks/*`)

**Modules to Test:**
- `parsers.ts` - Parse each webhook source format
- `validators.ts` - Signature validation, rate limiting
- `types.ts` - TypeScript type guards

**Test Focus:**
- ✅ UptimeRobot email parsing (subject + body)
- ✅ FileMaker JSON parsing
- ✅ Backup system parsing
- ✅ N8N custom format parsing
- ✅ Server name extraction
- ✅ Status determination (up/down/degraded/maintenance)
- ✅ Metadata extraction

### Polling Logic (`lib/polling/*`)

**Test Focus:**
- ✅ UptimeRobot API integration
- ✅ Monitor status fetching
- ✅ Server matching by monitor ID
- ✅ Rate limiting compliance
- ✅ Error handling for API failures

### Backup Monitoring (`lib/backup-monitoring/*`)

**Test Focus:**
- ✅ S3 bucket scanning
- ✅ Backup file age calculation
- ✅ Threshold violation detection
- ✅ Alert generation
- ✅ Email notification sending

### Crypto Utilities (`lib/crypto.ts`)

**Test Focus:**
- ✅ AES-256-GCM encryption/decryption
- ✅ IV generation
- ✅ Auth tag validation
- ✅ Key handling

## E2E Test Workflows (Cypress)

### Critical User Journeys

**1. Authentication Flow**
- Azure AD login redirect
- Local login with username/password
- Session persistence across page loads
- Logout and session termination

**2. Dashboard Management**
- View servers grouped by host
- Add new server with validation
- Edit server details
- View server event history
- Filter servers by status/host
- Real-time status updates

**3. Admin Operations**
- Access admin panel (admin role only)
- Create new user
- Assign roles
- Create incident
- Resolve incident
- Upload custom logo

**4. Events Monitoring**
- View event list with pagination
- Filter events by multiple criteria
- View event payload details
- Export events (if implemented)

**5. Status Page**
- Public access without login
- View current system status
- View active incidents
- Auto-refresh every 30 seconds

**6. Webhook Integration**
- Simulate webhook from UptimeRobot
- Verify event creation
- Verify server status update
- Check real-time UI update

## Test Data Management

### Test Database Setup
- Use Supabase local instance (port 54321)
- Reset database before each test suite
- Seed with known test data
- Isolate tests to prevent interference

### Mock Data Patterns
```typescript
// Mock user with specific role
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'admin',
  name: 'Test User'
};

// Mock server
const mockServer = {
  id: 'test-server-id',
  name: 'Test Server',
  url: 'https://example.com',
  status: 'up',
  server_type: 'web',
  host_id: 'test-host-id'
};

// Mock webhook payload
const mockWebhook = {
  monitorID: '123',
  monitorFriendlyName: 'Test Server',
  alertTypeFriendlyName: 'Down',
  monitorURL: 'https://example.com'
};
```

## Running Tests

### Unit/Integration Tests (Jest)
```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test __tests__/lib/auth/session.test.ts

# Watch mode for development
npm test -- --watch
```

### E2E Tests (Cypress)
```bash
# Open Cypress UI
npm run cypress:open

# Run headless
npm run cypress:run

# Run specific spec
npm run cypress:run -- --spec "cypress/e2e/auth/login.cy.ts"
```

### Component Tests (Cypress)
```bash
# Open component testing UI
npm run cypress:open -- --component

# Run component tests headless
npm run cypress:run -- --component
```

## Test Writing Guidelines

### Unit Test Structure
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear database, etc.
  });

  // Happy path tests
  it('should render correctly with valid props', () => {
    // Test
  });

  // Edge cases
  it('should handle missing optional props', () => {
    // Test
  });

  // Error states
  it('should display error message on API failure', () => {
    // Test
  });

  // Cleanup
  afterEach(() => {
    // Clear mocks
  });
});
```

### Integration Test Structure
```typescript
describe('API Route: /api/servers', () => {
  // Test with different roles
  describe('as admin', () => {
    it('should allow creating servers', async () => {
      // Test
    });
  });

  describe('as viewer', () => {
    it('should deny server creation', async () => {
      // Test
    });
  });

  // Test error handling
  describe('error handling', () => {
    it('should validate required fields', async () => {
      // Test
    });
  });
});
```

### E2E Test Structure
```typescript
describe('User Journey: Dashboard Management', () => {
  before(() => {
    // Seed database
    cy.task('db:seed');
  });

  beforeEach(() => {
    // Login
    cy.login('admin@example.com', 'password');
    cy.visit('/dashboard');
  });

  it('should complete full server lifecycle', () => {
    // Create server
    cy.get('[data-testid="add-server-button"]').click();
    // ... test steps
    
    // Edit server
    // ... test steps
    
    // Delete server
    // ... test steps
  });
});
```

## Testing Checklist by Component Type

### For Each Component Test
- [ ] Renders without crashing
- [ ] Renders with required props
- [ ] Handles missing optional props gracefully
- [ ] Displays loading state correctly
- [ ] Displays error state correctly
- [ ] Calls callbacks with correct arguments
- [ ] Updates on prop changes
- [ ] Cleans up on unmount (subscriptions, timers)

### For Each Form Component Test
- [ ] Displays validation errors
- [ ] Prevents submission with invalid data
- [ ] Submits with valid data
- [ ] Shows loading state during submission
- [ ] Shows success message on completion
- [ ] Shows error message on failure
- [ ] Clears form after successful submission
- [ ] Handles server-side validation errors

### For Each API Route Test
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 403 for unauthorized requests (wrong role)
- [ ] Validates required fields (returns 400)
- [ ] Handles malformed JSON (returns 400)
- [ ] Processes valid requests successfully (returns 200)
- [ ] Returns appropriate error messages
- [ ] Logs errors for debugging
- [ ] Respects rate limits

### For Each Webhook Route Test
- [ ] Rejects requests without secret (401)
- [ ] Rejects requests with invalid secret (401)
- [ ] Rate limits excessive requests (429)
- [ ] Parses payload correctly
- [ ] Creates event in database
- [ ] Updates server status if changed
- [ ] Handles unknown servers gracefully
- [ ] Returns 200 for valid requests

## Continuous Integration

### Pre-commit Hooks
- Run TypeScript type checking
- Run ESLint
- Run unit tests for changed files

### CI Pipeline (GitHub Actions)
1. **Test Suite**: Run all unit tests with coverage
2. **E2E Tests**: Run critical path Cypress tests
3. **Type Check**: Ensure no TypeScript errors
4. **Lint**: Check code style
5. **Build**: Verify production build succeeds

### Coverage Reports
- Generate coverage reports on each PR
- Block merge if coverage drops below threshold
- Track coverage trends over time

## Testing Best Practices

### DO:
✅ Test behavior, not implementation
✅ Use data-testid attributes for reliable selectors
✅ Mock external dependencies (Supabase, Azure AD)
✅ Test error boundaries and fallbacks
✅ Test accessibility (a11y) with jest-axe
✅ Keep tests focused and isolated
✅ Use descriptive test names (should/when/given)
✅ Test edge cases and boundary conditions

### DON'T:
❌ Test implementation details (state, methods)
❌ Rely on CSS selectors that may change
❌ Make real API calls in unit tests
❌ Write flaky tests that sometimes fail
❌ Test third-party library behavior
❌ Duplicate test coverage unnecessarily
❌ Ignore failing tests
❌ Test snapshots for complex components

## Next Steps

1. **Phase 1**: Set up test infrastructure and utilities
   - Create mock factories
   - Create test database helpers
   - Create custom Cypress commands
   - Configure coverage reporting

2. **Phase 2**: Implement unit tests
   - Start with utility functions (lib/)
   - Add component tests (components/)
   - Add API route integration tests

3. **Phase 3**: Implement E2E tests
   - Critical authentication flows
   - Dashboard management workflows
   - Admin operations
   - Webhook integration tests

4. **Phase 4**: Set up CI/CD
   - GitHub Actions workflow
   - Automated test runs on PR
   - Coverage reporting
   - Deploy on passing tests

## Monitoring and Maintenance

- Review and update tests when features change
- Add tests for new bugs before fixing
- Regularly review and remove obsolete tests
- Keep test dependencies up to date
- Monitor test execution time and optimize slow tests
