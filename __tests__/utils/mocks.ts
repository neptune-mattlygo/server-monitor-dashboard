// Mock data factories for testing
import { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Server = Database['public']['Tables']['servers']['Row'];
type ServerEvent = Database['public']['Tables']['server_events']['Row'];
type Host = Database['public']['Tables']['hosts']['Row'];

/**
 * Create a mock user with customizable properties
 */
export const mockUser = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'viewer',
  name: 'Test User',
  auth_type: 'local',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  password_hash: null,
  ...overrides,
});

/**
 * Create a mock admin user
 */
export const mockAdmin = (overrides: Partial<Profile> = {}): Profile =>
  mockUser({ role: 'admin', email: 'admin@example.com', name: 'Admin User', ...overrides });

/**
 * Create a mock editor user
 */
export const mockEditor = (overrides: Partial<Profile> = {}): Profile =>
  mockUser({ role: 'editor', email: 'editor@example.com', name: 'Editor User', ...overrides });

/**
 * Create a mock host
 */
export const mockHost = (overrides: Partial<Host> = {}): Host => ({
  id: 'test-host-id',
  name: 'Test Host',
  region: 'us-east-1',
  description: 'Test host description',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock server
 */
export const mockServer = (overrides: Partial<Server> = {}): Server => ({
  id: 'test-server-id',
  name: 'Test Server',
  url: 'https://example.com',
  status: 'up',
  server_type: 'web',
  host_id: 'test-host-id',
  uptimerobot_monitor_id: null,
  admin_username: null,
  admin_password_encrypted: null,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_checked_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock server event
 */
export const mockServerEvent = (overrides: Partial<ServerEvent> = {}): ServerEvent => ({
  id: 'test-event-id',
  server_id: 'test-server-id',
  event_type: 'status_change',
  event_source: 'uptimerobot',
  status: 'down',
  message: 'Server went down',
  payload: {},
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock UptimeRobot webhook payload
 */
export const mockUptimeRobotWebhook = (overrides: any = {}) => ({
  monitorID: '123456',
  monitorFriendlyName: 'Test Server',
  monitorURL: 'https://example.com',
  alertTypeFriendlyName: 'Down',
  alertDetails: 'Connection timeout',
  alertDateTime: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock FileMaker webhook payload
 */
export const mockFileMakerWebhook = (overrides: any = {}) => ({
  serverName: 'Test FileMaker Server',
  status: 'offline',
  timestamp: new Date().toISOString(),
  errorMessage: 'Database connection failed',
  ...overrides,
});

/**
 * Create a mock backup webhook payload
 */
export const mockBackupWebhook = (overrides: any = {}) => ({
  serverName: 'Test Backup Server',
  backupStatus: 'failed',
  lastBackupTime: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
  errorMessage: 'Backup quota exceeded',
  ...overrides,
});

/**
 * Create a mock n8n webhook payload
 */
export const mockN8nWebhook = (overrides: any = {}) => ({
  server: 'Test Server',
  status: 'down',
  message: 'Health check failed',
  timestamp: new Date().toISOString(),
  metadata: {
    responseTime: 5000,
    statusCode: 500,
  },
  ...overrides,
});

/**
 * Create mock session data
 */
export const mockSession = (overrides: any = {}) => ({
  id: 'test-session-id',
  user_id: 'test-user-id',
  session_token_hash: 'hashed-token',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a batch of mock servers
 */
export const mockServerList = (count: number = 5): Server[] =>
  Array.from({ length: count }, (_, i) =>
    mockServer({
      id: `server-${i}`,
      name: `Server ${i}`,
      url: `https://server${i}.example.com`,
      status: i % 3 === 0 ? 'down' : i % 3 === 1 ? 'up' : 'degraded',
    })
  );

/**
 * Create a batch of mock events
 */
export const mockEventList = (count: number = 10, serverId: string = 'test-server-id'): ServerEvent[] =>
  Array.from({ length: count }, (_, i) =>
    mockServerEvent({
      id: `event-${i}`,
      server_id: serverId,
      status: i % 2 === 0 ? 'down' : 'up',
      created_at: new Date(Date.now() - i * 3600000).toISOString(), // Hours ago
    })
  );
