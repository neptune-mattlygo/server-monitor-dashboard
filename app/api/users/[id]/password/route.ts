import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

// Admin resets user password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Get user profile to check auth provider
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, auth_provider')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (profile.auth_provider !== 'local') {
      return NextResponse.json(
        { error: 'Cannot reset password for Azure AD users' },
        { status: 400 }
      );
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password }
    );

    if (updateError) {
      throw updateError;
    }

    // Log audit event
    await logAuditEvent(user.id, 'update', 'user', id, {
      action: 'password_reset',
      reset_by: user.email,
      target_email: profile.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
