// Test helper utilities
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create mock NextRequest for API route testing
 */
export function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookies?: Record<string, string>;
}) {
  const {
    url = 'http://localhost:3000/api/test',
    method = 'GET',
    headers = {},
    body,
    cookies = {},
  } = options;

  const headerObj = new Headers(headers);
  
  // Add cookies to headers
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headerObj.set('cookie', cookieString);
  }

  const request: any = {
    url,
    method,
    headers: headerObj,
    nextUrl: new URL(url),
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  };

  if (body) {
    request.json = async () => body;
  }

  return request;
}

/**
 * Create mock NextResponse for testing
 */
export function createMockResponse(data: any, status: number = 200) {
  return {
    status,
    data,
    json: async () => data,
  };
}

/**
 * Mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    from: jest.fn().mockReturnValue(mockQuery),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } }),
      }),
    },
  };
}

/**
 * Mock current user for authentication tests
 */
export function mockCurrentUser(user: any = null) {
  return jest.fn().mockResolvedValue(user);
}

/**
 * Generate random test data
 */
export const randomString = (length: number = 10) =>
  Math.random().toString(36).substring(2, length + 2);

export const randomEmail = () => `${randomString()}@test.com`;

export const randomUrl = () => `https://${randomString()}.example.com`;

/**
 * Suppress console errors/warnings in tests
 */
export function suppressConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
}

/**
 * Create a test timeout promise
 */
export const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Assert that a function throws with specific message
 */
export async function expectToThrow(fn: () => Promise<any>, message?: string) {
  let error: Error | null = null;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).not.toBeNull();
  if (message) {
    expect(error?.message).toContain(message);
  }
}

/**
 * Create mock file for upload tests
 */
export function createMockFile(
  name: string = 'test.png',
  size: number = 1024,
  type: string = 'image/png'
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

/**
 * Flush all pending promises
 */
export async function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}
