import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createLocalSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Only allow local auth users to login via this endpoint
    if (profile.auth_provider !== 'local') {
      return NextResponse.json(
        { error: 'Please use Azure AD login for this account' },
        { status: 403 }
      );
    }

    // Update last login
    await supabaseAdmin
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', profile.id);

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

    // Log login audit event
    await supabaseAdmin.from('audit_logs').insert({
      user_id: profile.id,
      action: 'user_login',
      resource_type: 'user',
      resource_id: profile.id,
      metadata: { email, auth_provider: 'local' },
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
