# Testing Quick Reference

## Test Commands

```bash
# Unit Tests (Jest)
npm test                          # Run all unit tests
npm run test:watch               # Run in watch mode
npm run test:coverage            # Generate coverage report
npm test -- ComponentName        # Run specific test

# E2E Tests (Cypress)
npm run cypress:open             # Open Cypress UI
npm run cypress:run              # Run headless
npm run cypress:run:chrome       # Run in Chrome
npm run cypress:run:firefox      # Run in Firefox

# Component Tests (Cypress)
npm run cypress:open -- --component    # Open component testing
npm run cypress:run -- --component     # Run component tests headless

# All Tests
npm run test:all                 # Run unit + E2E tests
```

## Test File Naming

- Unit tests: `ComponentName.test.tsx` or `functionName.test.ts`
- E2E tests: `feature-name.cy.ts`
- Component tests: `ComponentName.cy.tsx`

## Test File Locations

```
__tests__/
├── components/       # Component unit tests
├── lib/             # Utility function tests
├── api/             # API route integration tests
└── ...

cypress/
├── e2e/             # End-to-end tests
├── component/       # Component tests
├── fixtures/        # Test data
└── support/         # Helper functions
```

## Common Test Patterns

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing API Routes

```typescript
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('API Route: /api/servers', () => {
  it('should return servers for authenticated users', async () => {
    const request = new NextRequest('http://localhost/api/servers');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('servers');
  });
});
```

### Testing with Cypress (E2E)

```typescript
describe('Login Flow', () => {
  it('should log in successfully', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="submit-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Test Data-TestID Convention

Add `data-testid` attributes to elements for reliable testing:

```tsx
// Forms
<input data-testid="server-name-input" />
<button data-testid="submit-button" />

// Tables
<table data-testid="servers-table" />
<tr data-testid={`server-row-${server.id}`} />

// Dialogs
<Dialog data-testid="add-server-dialog" />
<DialogTrigger data-testid="open-dialog-button" />

// Status badges
<Badge data-testid={`status-badge-${status}`} />
```

## Mocking Patterns

### Mock Supabase Client

```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));
```

### Mock Authentication

```typescript
jest.mock('@/lib/auth/session', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'test-user',
    email: 'test@example.com',
    role: 'admin',
  }),
}));
```

### Mock Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));
```

## Custom Cypress Commands

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="submit-button"]').click();
});

// Usage
cy.login('admin@example.com', 'password123');
```

## Testing Checklist

### Before Writing Tests
- [ ] Identify component responsibilities
- [ ] List expected behaviors
- [ ] Determine edge cases
- [ ] Plan mock data needs

### During Testing
- [ ] Write descriptive test names
- [ ] Test one thing per test
- [ ] Use appropriate assertions
- [ ] Clean up after tests

### After Writing Tests
- [ ] Verify tests pass
- [ ] Check coverage report
- [ ] Remove unused code
- [ ] Document complex test scenarios

## Coverage Thresholds

```json
{
  "coverageThresholds": {
    "global": {
      "statements": 70,
      "branches": 70,
      "functions": 70,
      "lines": 70
    },
    "lib/auth/**": {
      "statements": 100,
      "branches": 100,
      "functions": 100,
      "lines": 100
    },
    "lib/webhooks/**": {
      "statements": 95,
      "branches": 95,
      "functions": 95,
      "lines": 95
    }
  }
}
```

## Debugging Tests

### Jest
```bash
# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand ComponentName.test.tsx

# Use console.log (appears in terminal)
console.log('Debug:', value);

# Use debug from testing-library
import { screen } from '@testing-library/react';
screen.debug(); // Prints DOM tree
```

### Cypress
```bash
# Open Cypress with debugging
DEBUG=cypress:* npm run cypress:open

# Use cy.debug() in tests
cy.get('.element').debug();

# Use cy.pause() to pause execution
cy.pause();

# Check application state
cy.window().then((win) => console.log(win));
```

## Common Issues & Solutions

### Issue: "Cannot find module '@/...'"
**Solution:** Update `jest.config.js` moduleNameMapper:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Issue: "React is not defined"
**Solution:** Ensure React Testing Library is set up in `jest.setup.js`:
```javascript
import '@testing-library/jest-dom';
```

### Issue: Cypress test fails intermittently
**Solution:** Add proper waits:
```typescript
// Bad
cy.get('.element').click();

// Good
cy.get('.element').should('be.visible').click();
```

### Issue: Test timeout
**Solution:** Increase timeout for specific test:
```typescript
it('slow test', () => {
  // Test code
}, 10000); // 10 second timeout
```

## Performance Tips

- Use `beforeAll` instead of `beforeEach` when possible
- Mock heavy dependencies
- Run tests in parallel (Jest default)
- Skip unnecessary renders in component tests
- Use Cypress `cy.intercept()` to mock API calls
- Clear test database efficiently

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
