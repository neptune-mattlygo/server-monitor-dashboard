import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { emailService } from '@/lib/email';
import { decrypt } from '@/lib/crypto';

interface ServerWithCredentials {
  id: string;
  name: string;
  admin_url: string;
  admin_username: string;
  admin_password: string;
  last_metadata_refresh_at: string | null;
}

interface FailedServer {
  name: string;
  error: string;
  lastSuccess?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized cron job or admin request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Check if it's a cron job or manual admin trigger
    const isValidCronJob = authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isManualTrigger = authHeader === 'Bearer manual-trigger';
    
    if (!isValidCronJob && !isManualTrigger) {
      // For manual triggers, verify admin session
      if (isManualTrigger) {
        const { getCurrentUser } = await import('@/lib/auth/session');
        const { isAdmin } = await import('@/lib/auth/permissions');
        const user = await getCurrentUser();
        
        if (!user || !isAdmin(user)) {
          return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Starting scheduled metadata refresh...');

    // Get refresh settings
    const { data: settings } = await supabaseAdmin
      .from('metadata_refresh_settings')
      .select('*')
      .single();

    if (!settings || !settings.enabled) {
      console.log('Metadata refresh is disabled');
      return NextResponse.json({ message: 'Metadata refresh is disabled' });
    }

    // Get servers that need metadata refresh
    const refreshIntervalMs = settings.refresh_interval_days * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - refreshIntervalMs).toISOString();

    const { data: servers, error: serversError } = await supabaseAdmin
      .from('servers')
      .select('id, name, admin_url, admin_username, admin_password, last_metadata_refresh_at')
      .not('admin_url', 'is', null)
      .not('admin_username', 'is', null)
      .not('admin_password', 'is', null)
      .or(`last_metadata_refresh_at.is.null,last_metadata_refresh_at.lt.${cutoffDate}`);

    if (serversError) {
      console.error('Error fetching servers for refresh:', serversError);
      return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
    }

    if (!servers || servers.length === 0) {
      console.log('No servers need metadata refresh');
      return NextResponse.json({ message: 'No servers need refresh' });
    }

    console.log(`Found ${servers.length} servers that need metadata refresh`);

    const failedServers: FailedServer[] = [];
    const successfulServers: string[] = [];

    // Process each server
    for (const server of servers as ServerWithCredentials[]) {
      try {
        console.log(`Refreshing metadata for server: ${server.name}`);
        
        // Decrypt password
        let password: string;
        try {
          password = decrypt(server.admin_password);
        } catch (err) {
          console.error(`Failed to decrypt password for ${server.name}:`, err);
          failedServers.push({
            name: server.name,
            error: 'Failed to decrypt credentials',
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        // Extract base URL for API
        let adminUrl = server.admin_url.trim();
        if (!adminUrl.startsWith('http://') && !adminUrl.startsWith('https://')) {
          adminUrl = `https://${adminUrl}`;
        }
        const url = new URL(adminUrl);
        const baseUrl = `${url.protocol}//${url.host}`;

        // Authenticate with FileMaker Server
        const authUrl = `${baseUrl}/fmi/admin/api/v2/user/auth`;
        const authHeader = Buffer.from(`${server.admin_username}:${password}`).toString('base64');

        const authResponse = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
        });

        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          console.error(`Auth failed for ${server.name}:`, authResponse.status, errorText);
          failedServers.push({
            name: server.name,
            error: `Authentication failed: ${authResponse.status} ${authResponse.statusText}`,
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        const authText = await authResponse.text();
        let authData: any;
        try {
          authData = JSON.parse(authText);
        } catch (jsonError) {
          console.error(`Invalid JSON response from ${server.name}:`, jsonError);
          failedServers.push({
            name: server.name,
            error: 'Server returned invalid JSON response',
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        const token = authData.token || authData.response?.token || authData.data?.token;
        if (!token) {
          console.error(`No token returned from ${server.name}`);
          failedServers.push({
            name: server.name,
            error: 'No authentication token received',
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        // Fetch metadata
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
          console.error(`Metadata fetch failed for ${server.name}:`, metadataResponse.status);
          failedServers.push({
            name: server.name,
            error: `Metadata fetch failed: ${metadataResponse.status} ${metadataResponse.statusText}`,
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        const metadataText = await metadataResponse.text();
        let metadata: any;
        try {
          metadata = JSON.parse(metadataText);
        } catch (jsonError) {
          console.error(`Invalid metadata JSON from ${server.name}:`, jsonError);
          failedServers.push({
            name: server.name,
            error: 'Server returned invalid metadata JSON',
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        // Update server with new metadata
        const updateData: any = {
          fm_metadata: metadata,
          fm_metadata_updated_at: new Date().toISOString(),
          last_metadata_refresh_at: new Date().toISOString(),
          metadata_refresh_status: 'success',
          last_metadata_error: null,
        };

        // Extract common fields
        const metaData = metadata.response || metadata;
        const serverVersion = metaData.ServerVersion || metaData.serverVersion || metaData.version;
        const serverName = metaData.ServerName || metaData.serverName || metaData.name;
        const hostName = metaData.HostName || metaData.hostName || metaData.hostname || metaData.ServerIPAddress;

        if (serverVersion) updateData.fm_server_version = serverVersion;
        if (serverName) updateData.fmserver_name = serverName;
        if (hostName) updateData.fm_host_name = hostName;

        const { error: updateError } = await supabaseAdmin
          .from('servers')
          .update(updateData)
          .eq('id', server.id);

        if (updateError) {
          console.error(`Failed to update server ${server.name}:`, updateError);
          failedServers.push({
            name: server.name,
            error: 'Failed to save metadata to database',
            lastSuccess: server.last_metadata_refresh_at || undefined,
          });
          continue;
        }

        successfulServers.push(server.name);
        console.log(`Successfully refreshed metadata for: ${server.name}`);

      } catch (error) {
        console.error(`Error refreshing ${server.name}:`, error);
        failedServers.push({
          name: server.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastSuccess: server.last_metadata_refresh_at || undefined,
        });
      }
    }

    // Update failed servers with error status
    for (const failedServer of failedServers) {
      const server = servers.find(s => s.name === failedServer.name);
      if (server) {
        await supabaseAdmin
          .from('servers')
          .update({
            metadata_refresh_status: 'failed',
            last_metadata_error: failedServer.error,
          })
          .eq('id', server.id);
      }
    }

    // Send email notifications if there are failures
    if (failedServers.length > 0 && settings.notification_emails && settings.notification_emails.length > 0) {
      console.log(`Sending failure notification for ${failedServers.length} servers`);
      const emailSent = await emailService.sendMetadataRefreshAlert(
        settings.notification_emails,
        failedServers
      );
      console.log(`Email notification sent: ${emailSent}`);
    }

    // Update last refresh time in settings
    await supabaseAdmin
      .from('metadata_refresh_settings')
      .update({ last_refresh_at: new Date().toISOString() })
      .single();

    console.log(`Metadata refresh completed. Success: ${successfulServers.length}, Failed: ${failedServers.length}`);

    return NextResponse.json({
      success: true,
      message: `Metadata refresh completed`,
      results: {
        successful: successfulServers.length,
        failed: failedServers.length,
        successfulServers,
        failedServers,
      },
    });

  } catch (error) {
    console.error('Scheduled metadata refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh metadata' }, { status: 500 });
  }
}