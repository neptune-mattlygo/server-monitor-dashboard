import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { decrypt } from '@/lib/crypto';

interface FileMakerAuthResponse {
  token: string;
}

interface FileMakerMetadata {
  serverVersion?: string;
  serverName?: string;
  hostName?: string;
  [key: string]: any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    // Only admins can fetch metadata
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Get server with credentials
    const { data: server, error: serverError } = await supabaseAdmin
      .from('servers')
      .select('id, name, admin_url, admin_username, admin_password')
      .eq('id', id)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!server.admin_url || !server.admin_username || !server.admin_password) {
      return NextResponse.json({ 
        error: 'Server credentials not configured. Please add admin URL, username, and password first.' 
      }, { status: 400 });
    }

    // Decrypt password
    let password: string;
    try {
      password = decrypt(server.admin_password);
    } catch (err) {
      console.error('Failed to decrypt password:', err);
      return NextResponse.json({ error: 'Failed to decrypt credentials' }, { status: 500 });
    }

    const baseUrl = server.admin_url.replace(/\/$/, '');
    
    // Step 1: Get authentication token
    const authUrl = `${baseUrl}/fmi/admin/api/v2/user/auth`;
    const authHeader = Buffer.from(`${server.admin_username}:${password}`).toString('base64');
    
    console.log(`Fetching FileMaker auth token from ${authUrl}...`);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('FileMaker auth failed:', authResponse.status, errorText);
      return NextResponse.json({ 
        error: `FileMaker authentication failed: ${authResponse.status} ${authResponse.statusText}`,
        details: errorText
      }, { status: 401 });
    }

    const authData: FileMakerAuthResponse = await authResponse.json();
    
    if (!authData.token) {
      return NextResponse.json({ error: 'No token returned from FileMaker Server' }, { status: 500 });
    }

    console.log('FileMaker auth successful, fetching metadata...');

    // Step 2: Get server metadata
    const metadataUrl = `${baseUrl}/fmi/admin/api/v2/server/metadata`;
    
    const metadataResponse = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('FileMaker metadata fetch failed:', metadataResponse.status, errorText);
      return NextResponse.json({ 
        error: `Failed to fetch metadata: ${metadataResponse.status} ${metadataResponse.statusText}`,
        details: errorText
      }, { status: metadataResponse.status });
    }

    const metadata: FileMakerMetadata = await metadataResponse.json();
    
    console.log('FileMaker metadata received:', metadata);

    // Step 3: Update server record with metadata
    const updateData: any = {
      fm_metadata: metadata,
      fm_metadata_updated_at: new Date().toISOString(),
    };

    // Extract common fields if available
    if (metadata.serverVersion) {
      updateData.fm_server_version = metadata.serverVersion;
    }
    if (metadata.serverName) {
      updateData.fmserver_name = metadata.serverName;
    }
    if (metadata.hostName) {
      updateData.fm_host_name = metadata.hostName;
    }

    const { error: updateError } = await supabaseAdmin
      .from('servers')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update server with metadata:', updateError);
      return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      metadata,
      message: 'FileMaker metadata fetched and stored successfully'
    });

  } catch (error) {
    console.error('Fetch FileMaker metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FileMaker metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
