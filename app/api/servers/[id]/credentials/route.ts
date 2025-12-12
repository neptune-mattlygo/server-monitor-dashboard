import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { decrypt } from '@/lib/crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    // Only admins can view decrypted credentials
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const { data: server, error } = await supabaseAdmin
      .from('servers')
      .select('id, name, admin_url, admin_username, admin_password, fm_metadata, fm_metadata_updated_at, fm_server_version, fm_host_name, fmserver_name')
      .eq('id', id)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Decrypt password if it exists
    let decryptedPassword = null;
    if (server.admin_password) {
      try {
        decryptedPassword = decrypt(server.admin_password);
      } catch (err) {
        console.error('Failed to decrypt password:', err);
        decryptedPassword = '[Decryption Failed]';
      }
    }

    return NextResponse.json({
      credentials: {
        id: server.id,
        name: server.name,
        admin_url: server.admin_url,
        admin_username: server.admin_username,
        admin_password: decryptedPassword,
      },
      server: {
        fm_metadata: server.fm_metadata,
        fm_metadata_updated_at: server.fm_metadata_updated_at,
        fm_server_version: server.fm_server_version,
        fm_host_name: server.fm_host_name,
        fmserver_name: server.fmserver_name,
      },
    });
  } catch (error) {
    console.error('Get server credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
