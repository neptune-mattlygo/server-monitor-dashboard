import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (sessionToken) {
      const session = await getSession(sessionToken);
      
      if (session) {
        // Delete session from database
        await supabaseAdmin
          .from('azure_sessions')
          .delete()
          .eq('id', session.id);

        // Log logout audit event
        await supabaseAdmin.from('audit_logs').insert({
          user_id: session.user_id,
          action: 'user_logout',
          resource_type: 'user',
          resource_id: session.user_id,
          metadata: { auth_provider: 'local' },
        });
      }
    }

    // Clear cookie and redirect to logout page
    const response = NextResponse.redirect(new URL('/logout', request.url));
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
