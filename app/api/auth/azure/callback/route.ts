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

    // Handle OAuth errors
    if (error) {
      console.error('Azure AD OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL('/auth/error?error=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/error?error=no_code', request.url)
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await acquireTokenByCode(code);

    if (!tokenResponse || !tokenResponse.idToken) {
      throw new Error('Failed to acquire tokens from Azure AD');
    }

    // Extract user profile from ID token
    const userProfile = extractUserProfile(tokenResponse.idToken);

    if (!userProfile) {
      throw new Error('Failed to extract user profile from token');
    }

    // Create or update user profile in database
    const profile = await upsertUserProfile(
      userProfile.oid,
      userProfile.email,
      userProfile.given_name || null,
      userProfile.family_name || null,
      userProfile.name
    );

    // Calculate token expiration
    const expiresAt = new Date(
      Date.now() + (tokenResponse.expiresIn || 3600) * 1000
    );

    // Create session
    const session = await createSession(
      profile.id,
      tokenResponse.accessToken,
      tokenResponse.refreshToken || '',
      expiresAt
    );

    // Set session cookie
    await setSessionCookie(session.id);

    // Log audit event
    await logAuditEvent(profile.id, 'login', 'session', session.id, {
      email: profile.email,
      azure_id: userProfile.oid,
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Azure AD callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=callback_failed', request.url)
    );
  }
}
