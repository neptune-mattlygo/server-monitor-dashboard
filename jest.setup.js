import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.AZURE_AD_CLIENT_ID = 'test-client-id';
process.env.AZURE_AD_CLIENT_SECRET = 'test-client-secret';
process.env.AZURE_AD_TENANT_ID = 'test-tenant-id';
process.env.AZURE_AD_REDIRECT_URI = 'http://localhost:3000/api/auth/azure/callback';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.SESSION_COOKIE_NAME = 'test_session';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock DOMRect
global.DOMRect = class DOMRect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
    this.left = x;
  }
  
  static fromRect(rect) {
    return new DOMRect(rect?.x, rect?.y, rect?.width, rect?.height);
  }
  
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left,
    };
  }
};

// Mock Element.prototype.getBoundingClientRect
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = jest.fn(function() {
    return new DOMRect(0, 0, 0, 0);
  });
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn();
}
