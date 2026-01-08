import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { decrypt } from '@/lib/crypto';

/**
 * GET /api/servers/[id]/fm-settings/smtp-password
 * Get decrypted SMTP password for FileMaker email settings
 * Admin-only endpoint
 * 
 * Follows pattern from app/api/servers/[id]/credentials/route.ts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: serverId } = await params;

    // Get server with SMTP password
    const { data: server, error: serverError } = await supabaseAdmin
      .from('servers')
      .select('id, name, fm_smtp_password')
      .eq('id', serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!server.fm_smtp_password) {
      return NextResponse.json({ 
        password: '',
        hasPassword: false,
      });
    }

    // Decrypt SMTP password
    try {
      const password = decrypt(server.fm_smtp_password);
      return NextResponse.json({ 
        password,
        hasPassword: true,
      });
    } catch (error) {
      console.error('Failed to decrypt SMTP password:', error);
      return NextResponse.json({ 
        error: 'Failed to decrypt SMTP password',
        hasPassword: true,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in GET /api/servers/[id]/fm-settings/smtp-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
