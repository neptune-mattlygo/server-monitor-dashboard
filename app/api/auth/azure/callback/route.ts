import { NextRequest, NextResponse } from 'next/server';
import {
  acquireTokenByCode,
  extractUserProfile,
} from '@/lib/auth/azure-client';
import {
  createSession,
  upsertUserProfile,
  setSessionCookie,
  logAuditEvent,
} from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[Azure Callback] Received callback with:', {
      hasCode: !!code,
      error,
      errorDescription,
      fullUrl: request.url,
    });

    // Handle OAuth errors
    if (error) {
      console.error('Azure AD OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL('/auth/error?error=' + encodeURIComponent(error) + '&description=' + encodeURIComponent(errorDescription || ''), request.url)
      );
    }

    if (!code) {
      console.error('[Azure Callback] No authorization code received');
      return NextResponse.redirect(
        new URL('/auth/error?error=no_code', request.url)
      );
    }

    console.log('[Azure Callback] Exchanging code for tokens...');
    console.log('[Azure Callback] Exchanging code for tokens...');
    // Exchange authorization code for tokens
    const tokenResponse = await acquireTokenByCode(code);

    console.log('[Azure Callback] Token response received:', {
      hasAccessToken: !!tokenResponse?.accessToken,
      hasIdToken: !!tokenResponse?.idToken,
      expiresOn: tokenResponse?.expiresOn,
    });

    if (!tokenResponse || !tokenResponse.idToken) {
      console.error('[Azure Callback] Missing tokens in response');
      throw new Error('Failed to acquire tokens from Azure AD');
    }

    console.log('[Azure Callback] Extracting user profile...');
    // Extract user profile from ID token
    const userProfile = extractUserProfile(tokenResponse.idToken);

    console.log('[Azure Callback] User profile extracted:', {
      hasProfile: !!userProfile,
      email: userProfile?.email,
      oid: userProfile?.oid,
    });

    if (!userProfile) {
      console.error('[Azure Callback] Failed to extract user profile');
      throw new Error('Failed to extract user profile from token');
    }

    console.log('[Azure Callback] Upserting user profile in database...');
    // Create or update user profile in database
    const profile = await upsertUserProfile(
      userProfile.oid,
      userProfile.email,
      userProfile.given_name || null,
      userProfile.family_name || null,
      userProfile.name
    );

    console.log('[Azure Callback] User profile saved, creating session...');
    // Calculate token expiration
    const expiresAt = tokenResponse.expiresOn 
      ? new Date(tokenResponse.expiresOn)
      : new Date(Date.now() + 3600 * 1000);

    // Create session
    // Note: MSAL doesn't expose refresh tokens directly for security
    // We'll rely on session extension in getCurrentUser instead
    const session = await createSession(
      profile.id,
      tokenResponse.accessToken,
      '', // Refresh tokens are managed internally by MSAL
      expiresAt
    );

    console.log('[Azure Callback] Session created, setting cookie...');
    // Set session cookie
    await setSessionCookie(session.id);

    console.log('[Azure Callback] Logging audit event...');
    // Log audit event
    await logAuditEvent(profile.id, 'login', 'session', session.id, {
      email: profile.email,
      azure_id: userProfile.oid,
    });

    console.log('[Azure Callback] Login successful, redirecting to dashboard');
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Azure AD callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=callback_failed&details=' + encodeURIComponent(String(error)), request.url)
    );
  }
}
