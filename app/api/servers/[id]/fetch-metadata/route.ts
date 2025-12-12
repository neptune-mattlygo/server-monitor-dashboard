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
      console.log(`Missing credentials for server ${server.name}:`, {
        admin_url: !!server.admin_url,
        admin_username: !!server.admin_username,  
        admin_password: !!server.admin_password
      });
      return NextResponse.json({ 
        error: 'Server credentials not configured. Please add admin URL, username, and password first.',
        details: `Missing: ${[
          !server.admin_url ? 'admin URL' : null,
          !server.admin_username ? 'username' : null, 
          !server.admin_password ? 'password' : null
        ].filter(Boolean).join(', ')}`
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

    // Ensure URL has protocol
    let adminUrl = server.admin_url.trim();
    if (!adminUrl.startsWith('http://') && !adminUrl.startsWith('https://')) {
      adminUrl = `https://${adminUrl}`;
    }
    
    // Extract base server URL for API calls (remove admin-console path)
    const url = new URL(adminUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Step 1: Get authentication token
    const authUrl = `${baseUrl}/fmi/admin/api/v2/user/auth`;
    const authHeader = Buffer.from(`${server.admin_username}:${password}`).toString('base64');
    
    console.log(`Admin console URL: ${adminUrl}`);
    console.log(`Base server URL for API: ${baseUrl}`);
    console.log(`Fetching FileMaker auth token from ${authUrl}...`);
    
    let authResponse;
    try {
      authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      console.error('Network error during FileMaker auth:', fetchError);
      return NextResponse.json({ 
        error: 'Network error connecting to FileMaker Server',
        details: fetchError instanceof Error ? fetchError.message : 'Connection failed'
      }, { status: 503 });
    }

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('FileMaker auth failed:', authResponse.status, errorText);
      return NextResponse.json({ 
        error: `FileMaker authentication failed: ${authResponse.status} ${authResponse.statusText}`,
        details: errorText
      }, { status: 401 });
    }

    const authData: any = await authResponse.json();
    
    console.log('FileMaker auth response:', JSON.stringify(authData, null, 2));
    
    // Try different possible token field names
    const token = authData.token || authData.response?.token || authData.data?.token;
    
    if (!token) {
      console.error('No token found in response. Full response:', authData);
      return NextResponse.json({ 
        error: 'No token returned from FileMaker Server',
        details: 'Response structure: ' + JSON.stringify(Object.keys(authData))
      }, { status: 500 });
    }

    console.log('FileMaker auth successful, fetching metadata...');

    // Step 2: Get server metadata
    const metadataUrl = `${baseUrl}/fmi/admin/api/v2/server/metadata`;
    
    const metadataResponse = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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

    const metadata: any = await metadataResponse.json();
    
    console.log('FileMaker metadata received:', JSON.stringify(metadata, null, 2));

    // Step 3: Update server record with metadata
    const updateData: any = {
      fm_metadata: metadata,
      fm_metadata_updated_at: new Date().toISOString(),
    };

    // Extract common fields - try different possible structures
    // Check if data is nested under 'response' or directly in root
    const metaData = metadata.response || metadata;
    
    // Try various field name variations (FileMaker uses PascalCase: ServerName, ServerVersion, etc.)
    const serverVersion = metaData.ServerVersion || metaData.serverVersion || metaData.version || metaData.productVersion;
    const serverName = metaData.ServerName || metaData.serverName || metaData.name;
    const hostName = metaData.HostName || metaData.hostName || metaData.hostname || metaData.ServerIPAddress;
    
    if (serverVersion) {
      updateData.fm_server_version = serverVersion;
      console.log('Extracted server version:', serverVersion);
    }
    if (serverName) {
      updateData.fmserver_name = serverName;
      console.log('Extracted server name:', serverName);
    }
    if (hostName) {
      updateData.fm_host_name = hostName;
      console.log('Extracted host name:', hostName);
    }
    
    console.log('Update data to be saved:', updateData);

    const { error: updateError } = await supabaseAdmin
      .from('servers')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update server with metadata:', updateError);
      return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
    }

    console.log('Successfully stored metadata, returning response');
    
    return NextResponse.json({ 
      success: true, 
      metadata,
      message: 'FileMaker metadata fetched and stored successfully'
    });

  } catch (error) {
    console.error('Fetch FileMaker metadata error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch FileMaker metadata', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
