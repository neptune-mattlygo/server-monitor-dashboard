# Test Infrastructure

This directory contains unit tests and integration tests for the Server Monitor application.

## Directory Structure

```
__tests__/
├── components/          # UI component unit tests
│   ├── ui/             # shadcn/ui components
│   └── dashboard/      # Dashboard-specific components
├── lib/                # Library/utility function tests
│   ├── auth/          # Authentication logic
│   ├── webhooks/      # Webhook processing
│   └── crypto/        # Encryption utilities
├── api/                # API route integration tests
│   ├── auth/          # Auth endpoints
│   ├── servers/       # Server CRUD
│   └── webhooks/      # Webhook handlers
└── utils/              # Test utilities and helpers
    ├── mocks/         # Mock data factories
    ├── helpers/       # Test helper functions
    └── setup/         # Test setup utilities
```

## Running Tests

See [TESTING_QUICK_REFERENCE.md](../docs/TESTING_QUICK_REFERENCE.md) for detailed commands.

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test
npm test -- ComponentName
```

## Test Naming Convention

- Component tests: `ComponentName.test.tsx`
- Utility tests: `functionName.test.ts`
- API tests: `route.test.ts`

## Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/path/to/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    // Test implementation
  });

  it('should display error states', () => {
    // Test implementation
  });
});
```

## Mock Utilities

Reusable mocks are available in `__tests__/utils/mocks/`:

```typescript
import { mockUser, mockServer, mockWebhook } from '@/__tests__/utils/mocks';
```

## Coverage Requirements

- Authentication/Authorization: 100%
- API Routes: 90%+
- Webhook Handlers: 95%+
- UI Components: 70%+
- Utilities: 90%+

## CI/CD Integration

Tests automatically run on:
- Every push to feature branches
- Pull requests to main
- Pre-commit hooks (for changed files)

## Next Steps

1. Implement mock factories in `utils/mocks/`
2. Create test helpers in `utils/helpers/`
3. Write unit tests for auth module
4. Write integration tests for API routes
5. Add component tests for dashboard
