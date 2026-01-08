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

// Track ongoing authentication requests to prevent concurrent auth attempts
const authPromises = new Map<string, Promise<string>>();

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

  console.log(`[FileMaker Auth] URL: ${authUrl}`);
  console.log(`[FileMaker Auth] Username: ${username}`);
  console.log(`[FileMaker Auth] Password length: ${password.length}`);
  console.log(`[FileMaker Auth] Password starts with: ${password.substring(0, 3)}...`);

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`[FileMaker Auth] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[FileMaker Auth] Error response:`, errorText.substring(0, 500));
      
      if (response.status === 401) {
        throw new FileMakerApiError('Authentication failed. Check admin username/password.', 401);
      }
      throw new FileMakerApiError(
        `Authentication failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    console.log(`[FileMaker Auth] Success! Token received`);
    
    if (!data.response || !data.response.token) {
      console.log(`[FileMaker Auth] Invalid response structure:`, JSON.stringify(data, null, 2));
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
 * Logout from FileMaker Admin API and close session
 * 
 * @param adminUrl - Base URL of FileMaker Server
 * @param token - JWT token to invalidate
 */
export async function logout(adminUrl: string, token: string): Promise<void> {
  const baseUrl = adminUrl.replace(/\/$/, '');
  const logoutUrl = `${baseUrl}/fmi/admin/api/v2/user/auth/${token}`;

  try {
    await fetch(logoutUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(`[FileMaker Auth] Session logged out successfully`);
  } catch (error) {
    console.error(`[FileMaker Auth] Logout failed (non-critical):`, error);
    // Don't throw - logout failures are non-critical
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

  console.log(`[FileMaker API] Making request to: ${url}`);

  // Get or create token (with deduplication for concurrent requests)
  let token = getCachedToken(serverId);
  if (!token) {
    console.log(`[FileMaker API] No cached token, authenticating...`);
    
    // Check if there's already an ongoing authentication request
    let authPromise = authPromises.get(serverId);
    
    if (!authPromise) {
      // Create new authentication request
      authPromise = authenticate(adminUrl, username, password)
        .then(newToken => {
          cacheToken(serverId, newToken);
          authPromises.delete(serverId); // Clean up
          console.log(`[FileMaker API] Authentication successful`);
          return newToken;
        })
        .catch(authError => {
          authPromises.delete(serverId); // Clean up on error
          console.error(`[FileMaker API] Authentication failed:`, authError);
          throw authError;
        });
      
      authPromises.set(serverId, authPromise);
    } else {
      console.log(`[FileMaker API] Waiting for existing authentication request...`);
    }
    
    token = await authPromise;
  } else {
    console.log(`[FileMaker API] Using cached token`);
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
      console.log(`[FileMaker API] Token expired, re-authenticating...`);
      clearToken(serverId);
      authPromises.delete(serverId); // Clear any stale auth promises
      
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
      
      console.error(`[FileMaker API] Request failed: ${url}`, {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      });
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.messages && errorData.messages.length > 0) {
          errorMessage = errorData.messages[0].message || errorMessage;
        }
      } catch {
        // If not JSON, use the raw error text
        if (errorText && errorText.length > 0) {
          errorMessage = errorText.substring(0, 200); // Limit length
        }
      }

      if (response.status === 403) {
        throw new FileMakerApiError('FileMaker admin account lacks required privileges.', 403);
      }
      if (response.status === 404) {
        throw new FileMakerApiError(`Setting not available: ${errorMessage}`, 404);
      }
      if (response.status >= 500) {
        throw new FileMakerApiError(`FileMaker Server error: ${errorMessage}`, response.status);
      }

      throw new FileMakerApiError(errorMessage, response.status, errorText);
    }

    const data = await response.json();
    console.log(`[FileMaker API] Success: ${url}`);
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
 * @returns Complete FileMaker settings and list of failures
 */
export async function fetchAllSettings(
  serverId: string,
  adminUrl: string,
  username: string,
  password: string
): Promise<{ settings: FileMakerSettings; failures: { endpoint: string; reason: string }[] }> {
  let token: string | null = null;
  
  try {
    // Fetch all settings in parallel, handling individual failures gracefully
    const results = await Promise.allSettled([
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/server/config/general', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/server/config/security', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/php/config', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/xml/config', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/xdbc/config', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/fmdapi/config', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/fmodata/config', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/webdirect/config', { method: 'GET' }),
      makeAuthenticatedRequest<any>(serverId, adminUrl, username, password, '/api/v2/server/notifications/email', { method: 'GET' }),
    ]);

    // Get token for logout
    token = getCachedToken(serverId);

    // Extract successful results, null for failures
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
    ] = results.map(result => result.status === 'fulfilled' ? result.value : null);

    // Log raw API responses for debugging
    const failedRequests = results.map((r, i) => r.status === 'rejected' ? { index: i, reason: r.reason?.message || 'Unknown error' } : null).filter(Boolean);
    
    console.log('FileMaker API Responses:');
    console.log('General Config:', JSON.stringify(generalData, null, 2));
    console.log('Security Config:', JSON.stringify(securityData, null, 2));
    console.log('PHP Config:', JSON.stringify(phpData, null, 2));
    console.log('XML Config:', JSON.stringify(xmlData, null, 2));
    console.log('XDBC Config:', JSON.stringify(xdbcData, null, 2));
    console.log('Data API Config:', JSON.stringify(dataApiData, null, 2));
    console.log('OData Config:', JSON.stringify(odataData, null, 2));
    console.log('WebDirect Config:', JSON.stringify(webDirectData, null, 2));
    console.log('Email Settings:', JSON.stringify(emailData, null, 2));
    console.log('Failed requests:', failedRequests);

    // If all requests failed, throw an error
    if (results.every(r => r.status === 'rejected')) {
      const firstError = results[0].status === 'rejected' ? results[0].reason : new Error('All settings requests failed');
      throw firstError;
    }

    // Track which endpoints failed for warnings
    const failures: { endpoint: string; reason: string }[] = [];
    
    if (results[0].status === 'rejected') failures.push({ endpoint: 'General Config', reason: results[0].reason?.message });
    if (results[1].status === 'rejected') failures.push({ endpoint: 'Security Config', reason: results[1].reason?.message });
    if (results[2].status === 'rejected') failures.push({ endpoint: 'PHP', reason: results[2].reason?.message });
    if (results[3].status === 'rejected') failures.push({ endpoint: 'XML', reason: results[3].reason?.message });
    if (results[4].status === 'rejected') failures.push({ endpoint: 'XDBC', reason: results[4].reason?.message });
    if (results[5].status === 'rejected') failures.push({ endpoint: 'Data API', reason: results[5].reason?.message });
    if (results[6].status === 'rejected') failures.push({ endpoint: 'OData', reason: results[6].reason?.message });
    if (results[7].status === 'rejected') failures.push({ endpoint: 'WebDirect', reason: results[7].reason?.message });
    if (results[8].status === 'rejected') failures.push({ endpoint: 'Email Settings', reason: results[8].reason?.message });

    // Normalize to FileMakerSettings structure
    const settings: FileMakerSettings = {
      general: {
        cacheSize: generalData?.cacheSize ?? 100,
        maxFiles: generalData?.maxFiles ?? 20,
        maxProConnections: generalData?.maxProConnections ?? 200,
        maxPSOS: generalData?.maxPSOS ?? 30,
        useSchedules: generalData?.useSchedules ?? true,
      },
      webPublishing: {
        phpEnabled: phpData?.enabled ?? false,
        xmlEnabled: xmlData?.enabled ?? false,
        xdbcEnabled: xdbcData?.enabled ?? false,
        dataApiEnabled: dataApiData?.enabled ?? false,
        odataEnabled: odataData?.enabled ?? false,
        webDirectEnabled: webDirectData?.enabled ?? false,
      },
      security: {
        requireSecureDB: securityData?.requireSecureDB ?? false,
      },
      email: {
        customHostName: emailData?.customHostName ?? '',
        emailNotification: emailData?.emailNotification ?? 0,
        smtpServerAddress: emailData?.smtpServerAddress ?? '',
        smtpServerPort: emailData?.smtpServerPort ?? 25,
        smtpAccount: emailData?.smtpAccount ?? '',
        emailSenderAddress: emailData?.emailSenderAddress ?? '',
        emailReplyAddress: emailData?.emailReplyAddress ?? '',
        emailRecipients: emailData?.emailRecipients ?? '',
        smtpAuthType: emailData?.smtpAuthType ?? 0,
        smtpOAuthType: emailData?.smtpOAuthType ?? 0,
        smtpSecurity: emailData?.smtpSecurity ?? 0,
        notifyLevel: emailData?.notifyLevel ?? 0,
        emailGoogleServiceAccount: emailData?.emailGoogleServiceAccount ?? '',
        emailGooglePrivateKey: emailData?.emailGooglePrivateKey ?? '',
        emailGoogleUserId: emailData?.emailGoogleUserId ?? '',
        emailMicrosoftClientId: emailData?.emailMicrosoftClientId ?? '',
        emailMicrosoftClientSecret: emailData?.emailMicrosoftClientSecret ?? '',
        emailMicrosoftTenantId: emailData?.emailMicrosoftTenantId ?? '',
        emailMicrosoftPrincipalName: emailData?.emailMicrosoftPrincipalName ?? '',
      },
    };

    console.log('[FileMaker API] Normalized settings:', JSON.stringify(settings, null, 2));

    return { settings, failures };
  } finally {
    // Always logout to free up the session
    if (token) {
      await logout(adminUrl, token);
      clearToken(serverId);
    }
  }
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
  let token: string | null = null;
  
  try {
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
        endpoint = '/api/v2/server/notifications/email';
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
    
    token = getCachedToken(serverId);
  } finally {
    // Always logout to free up the session
    if (token) {
      await logout(adminUrl, token);
      clearToken(serverId);
    }
  }
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
  let token: string | null = null;
  
  try {
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
      '/api/v2/server/notifications/email',
      {
        method: 'POST', // Email settings uses POST, not PATCH
        body: JSON.stringify(payload),
      }
    );
    
    token = getCachedToken(serverId);
  } finally {
    // Always logout to free up the session
    if (token) {
      await logout(adminUrl, token);
      clearToken(serverId);
    }
  }
}
