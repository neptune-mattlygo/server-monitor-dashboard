import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import type { Profile, AzureSession } from '@/lib/supabase';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'server_monitor_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// Hash token for secure storage
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Create new session for Azure AD
export async function createSession(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<AzureSession> {
  const { data: session, error } = await supabaseAdmin
    .from('azure_sessions')
    .insert({
      user_id: userId,
      access_token_hash: hashToken(accessToken),
      refresh_token_hash: refreshToken ? hashToken(refreshToken) : null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  
  return session;
}

// Create new session for local auth (simpler - just stores session ID)
export async function createLocalSession(
  userId: string,
  sessionToken: string
): Promise<AzureSession> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const { data: session, error } = await supabaseAdmin
    .from('azure_sessions')
    .insert({
      user_id: userId,
      access_token_hash: hashToken(sessionToken),
      refresh_token_hash: null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  
  return session;
}

// Get session by ID
export async function getSession(sessionId: string): Promise<AzureSession | null> {
  const { data: session, error } = await supabaseAdmin
    .from('azure_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) return null;
  return session;
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return profile;
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  await supabaseAdmin
    .from('azure_sessions')
    .delete()
    .eq('id', sessionId);
}

// Set session cookie (accepts sessionId or NextResponse for flexibility)
export async function setSessionCookie(sessionIdOrResponse: string | any, sessionId?: string): Promise<void> {
  const cookieStore = await cookies();
  
  // If called with NextResponse, set cookie on response object
  if (sessionId && typeof sessionIdOrResponse === 'object' && 'cookies' in sessionIdOrResponse) {
    sessionIdOrResponse.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  } else {
    // Otherwise set cookie on server
    cookieStore.set(SESSION_COOKIE_NAME, sessionIdOrResponse as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  }
}

// Get session cookie
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get current user from session
export async function getCurrentUser(): Promise<Profile | null> {
  const sessionId = await getSessionCookie();
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  // Check if session is expired
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  
  // If session is expired, try to refresh if we have a refresh token
  if (expiresAt <= now) {
    if (session.refresh_token_hash) {
      // Try to refresh the session
      const refreshed = await refreshSession(sessionId);
      if (refreshed) {
        return await getUserProfile(session.user_id);
      }
    }
    
    // If refresh failed or no refresh token, clear session
    await deleteSession(sessionId);
    await clearSessionCookie();
    return null;
  }
  
  // Implement sliding session: extend session if it's past halfway to expiration
  // This keeps active users logged in without requiring manual re-authentication
  const halfwayPoint = new Date(now.getTime() + (SESSION_MAX_AGE * 1000) / 2);
  if (expiresAt <= halfwayPoint) {
    // Extend session by another full period (7 days)
    const newExpiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000);
    
    await supabaseAdmin
      .from('azure_sessions')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', sessionId);
    
    // Also extend the cookie
    await setSessionCookie(sessionId);
  }

  return await getUserProfile(session.user_id);
}

// Refresh session using refresh token
async function refreshSession(sessionId: string): Promise<boolean> {
  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    // Extend session by full SESSION_MAX_AGE (7 days)
    const newExpiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
    
    await supabaseAdmin
      .from('azure_sessions')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', sessionId);
    
    // Also refresh the cookie
    await setSessionCookie(sessionId);
    
    return true;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return false;
  }
}

// Create or update user profile from Azure AD
export async function upsertUserProfile(
  azureId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  displayName: string | null
): Promise<Profile> {
  // Check if user exists by azure_id
  let { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('azure_id', azureId)
    .single();

  // If not found by azure_id, check by email (for accounts created with failed attempts)
  if (!existing) {
    const { data: existingByEmail } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingByEmail) {
      existing = existingByEmail;
    }
  }

  if (existing) {
    // Update existing profile
    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({
        azure_id: azureId, // Ensure azure_id is set
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        auth_provider: 'azure',
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return updated;
  }

  // Create new profile (all Azure-authenticated users are editors)
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const role = 'editor';

  // Generate UUID for the profile
  const { data: uuidResult } = await supabaseAdmin.rpc('gen_random_uuid');
  const profileId = uuidResult || crypto.randomUUID();

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: profileId,
      azure_id: azureId,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      role,
      auth_provider: 'azure',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  
  return profile;
}

// Create user profile from local auth
export async function createLocalUserProfile(
  userId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  displayName: string | null
): Promise<Profile> {
  // Count existing users
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // First user becomes admin, others are viewers
  const role = count === 0 ? 'admin' : 'viewer';

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      role,
      auth_provider: 'local',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  
  return profile;
}

// Log audit event
export async function logAuditEvent(
  userId: string | null,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  details: Record<string, any>
): Promise<void> {
  await supabaseAdmin.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  });
}
