/**
 * FileMaker Server Admin API Client
 * 
 * Handles authentication, token caching, and communication with FileMaker Server Admin API.
 * Supports fetching and updating server settings across multiple categories.
 * 
 * @see https://dev.neptunecloud.co.uk/fmi/admin/apidoc/
 */

import { FileMakerSettings, GeneralConfig, WebPublishing, SecurityConfig, EmailNotifications } from '@/lib/supabase';

// Token cache entry
interface TokenCacheEntry {
  token: string;
  expiresAt: Date;
}

// In-memory token cache (Map<serverId, TokenCacheEntry>)
const tokenCache = new Map<string, TokenCacheEntry>();

// Cache TTL: 15 minutes (FileMaker tokens typically valid for 15 min)
const TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Custom error for FileMaker API failures
 */
export class FileMakerApiError extends Error {
  code: number;
  details?: unknown;

  constructor(message: string, code: number, details?: unknown) {
    super(message);
    this.name = 'FileMakerApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Clean expired tokens from cache
 */
function purgeExpiredTokens(): void {
  const now = new Date();
  for (const [serverId, entry] of tokenCache.entries()) {
    if (entry.expiresAt < now) {
      tokenCache.delete(serverId);
    }
  }
}

/**
 * Get cached token for server, or null if not cached/expired
 */
function getCachedToken(serverId: string): string | null {
  purgeExpiredTokens();
  const entry = tokenCache.get(serverId);
  if (entry && entry.expiresAt > new Date()) {
    return entry.token;
  }
  return null;
}

/**
 * Cache token for server
 */
function cacheToken(serverId: string, token: string): void {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  tokenCache.set(serverId, { token, expiresAt });
}

/**
 * Clear cached token for server (used on auth failures)
 */
function clearToken(serverId: string): void {
  tokenCache.delete(serverId);
}

/**
 * Authenticate to FileMaker Admin API and get JWT token
 * 
 * @param adminUrl - Base URL of FileMaker Server (e.g., https://dev.neptunecloud.co.uk)
 * @param username - Admin console username
 * @param password - Admin console password
 * @returns JWT token
 */
export async function authenticate(
  adminUrl: string,
  username: string,
  password: string
): Promise<string> {
  // Remove trailing slash
  const baseUrl = adminUrl.replace(/\/$/, '');
  const authUrl = `${baseUrl}/fmi/admin/api/v2/user/auth`;

  // Basic Auth header
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new FileMakerApiError('Authentication failed. Check admin username/password.', 401);
      }
      throw new FileMakerApiError(
        `Authentication failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.response || !data.response.token) {
      throw new FileMakerApiError('No token in authentication response', 500, data);
    }

    return data.response.token;
  } catch (error) {
    if (error instanceof FileMakerApiError) {
      throw error;
    }
    throw new FileMakerApiError(
      `Unable to connect to FileMaker Server: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Make authenticated request to FileMaker Admin API
 * Auto-retries once on 401 (token expired)
 * 
 * @param serverId - Server ID (for token caching)
 * @param adminUrl - Base URL of FileMaker Server
 * @param username - Admin console username
 * @param password - Admin console password
 * @param endpoint - API endpoint path (e.g., /api/v2/server/config/general)
 * @param options - Fetch options
 * @returns Response data
 */
async function makeAuthenticatedRequest<T>(
  serverId: string,
  adminUrl: string,
  username: string,
  password: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = adminUrl.replace(/\/$/, '');
  const url = `${baseUrl}/fmi/admin${endpoint}`;

  // Get or create token
  let token = getCachedToken(serverId);
  if (!token) {
    token = await authenticate(adminUrl, username, password);
    cacheToken(serverId, token);
  }

  // Make request
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle 401 - token expired, retry once
    if (response.status === 401) {
      clearToken(serverId);
      token = await authenticate(adminUrl, username, password);
      cacheToken(serverId, token);

      // Retry request
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!retryResponse.ok) {
        throw new FileMakerApiError(
          `Request failed after retry with status ${retryResponse.status}`,
          retryResponse.status
        );
      }

      const data = await retryResponse.json();
      return data.response as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `FileMaker API error (${response.status})`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.messages && errorData.messages.length > 0) {
          errorMessage = errorData.messages[0].message || errorMessage;
        }
      } catch {
        // Ignore JSON parse errors
      }

      if (response.status === 403) {
        throw new FileMakerApiError('FileMaker admin account lacks required privileges.', 403);
      }
      if (response.status === 404) {
        throw new FileMakerApiError('Setting not available on this FileMaker version.', 404);
      }
      if (response.status >= 500) {
        throw new FileMakerApiError('FileMaker Server error. Check server logs.', response.status);
      }

      throw new FileMakerApiError(errorMessage, response.status, errorText);
    }

    const data = await response.json();
    return data.response as T;
  } catch (error) {
    if (error instanceof FileMakerApiError) {
      throw error;
    }
    throw new FileMakerApiError(
      `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

/**
 * Fetch all settings from FileMaker Server
 * 
 * @param serverId - Server ID
 * @param adminUrl - Base URL of FileMaker Server
 * @param username - Admin console username
 * @param password - Admin console password
 * @returns Complete FileMaker settings
 */
export async function fetchAllSettings(
  serverId: string,
  adminUrl: string,
  username: string,
  password: string
): Promise<FileMakerSettings> {
  // Fetch all settings in parallel
  const [
    generalData,
    securityData,
    phpData,
    xmlData,
    xdbcData,
    dataApiData,
    odataData,
    webDirectData,
    emailData,
  ] = await Promise.all([
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/server/config/general', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/server/config/security', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/php/config', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/xml/config', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/xdbc/config', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/fmdapi/config', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/fmodata/config', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/webdirect/config', { method: 'GET' }),
    makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/server/emailsettings', { method: 'GET' }),
  ]);

  // Normalize to FileMakerSettings structure
  const settings: FileMakerSettings = {
    general: {
      cacheSize: generalData.cacheSize || 100,
      maxFiles: generalData.maxFiles || 20,
      maxProConnections: generalData.maxProConnections || 200,
      maxPSOS: generalData.maxPSOS || 30,
      useSchedules: generalData.useSchedules !== false,
    },
    webPublishing: {
      phpEnabled: phpData.enabled === true,
      xmlEnabled: xmlData.enabled === true,
      xdbcEnabled: xdbcData.enabled === true,
      dataApiEnabled: dataApiData.enabled === true,
      odataEnabled: odataData.enabled === true,
      webDirectEnabled: webDirectData.enabled === true,
    },
    security: {
      requireSecureDB: securityData.requireSecureDB === true,
    },
    email: {
      smtpServerAddress: emailData.smtpServerAddress || '',
      smtpServerPort: emailData.smtpServerPort || 25,
      smtpUsername: emailData.smtpUsername || '',
      emailSenderAddress: emailData.emailSenderAddress || '',
      emailRecipients: emailData.emailRecipients || '',
      smtpAuthType: emailData.smtpAuthType || 0,
      smtpSecurity: emailData.smtpSecurity || 0,
      notifyLevel: emailData.notifyLevel || 0,
    },
  };

  return settings;
}

/**
 * Update a single setting on FileMaker Server
 * 
 * @param serverId - Server ID
 * @param adminUrl - Base URL of FileMaker Server
 * @param username - Admin console username
 * @param password - Admin console password
 * @param category - Setting category
 * @param settingKey - Setting key within category
 * @param value - New value
 */
export async function updateSetting(
  serverId: string,
  adminUrl: string,
  username: string,
  password: string,
  category: 'general' | 'webPublishing' | 'security' | 'email',
  settingKey: string,
  value: unknown
): Promise<void> {
  // Map category to endpoint and payload structure
  let endpoint: string;
  let payload: any;

  switch (category) {
    case 'general':
      endpoint = '/api/v2/server/config/general';
      payload = { [settingKey]: value };
      break;

    case 'security':
      endpoint = '/api/v2/server/config/security';
      payload = { [settingKey]: value };
      break;

    case 'webPublishing':
      // Map to specific endpoints for each web publishing technology
      const webPublishingEndpoints: Record<string, string> = {
        phpEnabled: '/api/v2/php/config',
        xmlEnabled: '/api/v2/xml/config',
        xdbcEnabled: '/api/v2/xdbc/config',
        dataApiEnabled: '/api/v2/fmdapi/config',
        odataEnabled: '/api/v2/fmodata/config',
        webDirectEnabled: '/api/v2/webdirect/config',
      };
      endpoint = webPublishingEndpoints[settingKey];
      if (!endpoint) {
        throw new FileMakerApiError(`Unknown web publishing setting: ${settingKey}`, 400);
      }
      payload = { enabled: value };
      break;

    case 'email':
      endpoint = '/api/v2/server/emailsettings';
      // Email settings require all fields in PATCH
      // For single field update, we need to send all current fields plus the updated one
      // This should be handled by the caller (fetch current, merge, send all)
      payload = { [settingKey]: value };
      break;

    default:
      throw new FileMakerApiError(`Unknown category: ${category}`, 400);
  }

  await makeAuthenticatedRequest(
    serverId,
    adminUrl,
    username,
    password,
    endpoint,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Update email settings (requires all fields)
 * 
 * @param serverId - Server ID
 * @param adminUrl - Base URL of FileMaker Server
 * @param username - Admin console username
 * @param password - Admin console password
 * @param emailSettings - Complete email settings object
 * @param smtpPassword - SMTP password (decrypted)
 */
export async function updateEmailSettings(
  serverId: string,
  adminUrl: string,
  username: string,
  password: string,
  emailSettings: EmailNotifications,
  smtpPassword: string
): Promise<void> {
  const payload = {
    smtpServerAddress: emailSettings.smtpServerAddress,
    smtpServerPort: emailSettings.smtpServerPort,
    smtpUsername: emailSettings.smtpUsername,
    smtpPassword: smtpPassword,
    emailSenderAddress: emailSettings.emailSenderAddress,
    emailRecipients: emailSettings.emailRecipients,
    smtpAuthType: emailSettings.smtpAuthType,
    smtpSecurity: emailSettings.smtpSecurity,
    notifyLevel: emailSettings.notifyLevel,
  };

  await makeAuthenticatedRequest(
    serverId,
    adminUrl,
    username,
    password,
    '/api/v2/server/emailsettings',
    {
      method: 'POST', // Email settings uses POST, not PATCH
      body: JSON.stringify(payload),
    }
  );
}
