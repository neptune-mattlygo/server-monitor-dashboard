import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createLocalUserProfile, createLocalSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, displayName } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for local auth
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile
    const profile = await createLocalUserProfile(
      authData.user.id,
      email,
      firstName || null,
      lastName || null,
      displayName || `${firstName || ''} ${lastName || ''}`.trim() || email
    );

    // Generate session token
    const sessionToken = crypto.randomUUID();
    
    // Create session in database
    const session = await createLocalSession(profile.id, sessionToken);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        displayName: profile.display_name,
        role: profile.role,
        authProvider: profile.auth_provider,
      },
    });

    await setSessionCookie(response, session.id);

    // Log signup audit event
    await supabaseAdmin.from('audit_logs').insert({
      user_id: profile.id,
      action: 'user_signup',
      resource_type: 'user',
      resource_id: profile.id,
      metadata: { email, auth_provider: 'local' },
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
