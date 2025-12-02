import { NextRequest, NextResponse } from 'next/server';
import { createUptimeRobotPoller } from '@/lib/polling/uptimerobot';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Poll UptimeRobot API and update server statuses
 * This endpoint should be called by a cron job every 5 minutes
 * 
 * Security: Protected by POLLING_SECRET in Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.POLLING_SECRET;
    const cronSecret = request.headers.get('x-vercel-cron-secret');

    console.log('[UptimeRobot] Debug:', {
      authHeader,
      expectedToken,
      expectedTokenLength: expectedToken?.length,
      authHeaderLength: authHeader?.length,
      match: authHeader === `Bearer ${expectedToken}`,
    });

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Polling not configured', message: 'POLLING_SECRET environment variable not set' },
        { status: 503 }
      );
    }

    // Allow requests from Vercel Cron (they include x-vercel-cron-secret)
    const isVercelCron = cronSecret === process.env.CRON_SECRET;
    const isBearerAuth = authHeader === `Bearer ${expectedToken}`;

    if (!isVercelCron && !isBearerAuth) {
      console.log('[UptimeRobot] Unauthorized request:', {
        hasAuthHeader: !!authHeader,
        hasCronSecret: !!cronSecret,
        isVercelCron,
        isBearerAuth,
      });
      
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing authorization' },
        { status: 401 }
      );
    }

    // Initialize poller
    const poller = createUptimeRobotPoller();
    const [monitors, mwindows] = await Promise.all([
      poller.fetchMonitors(),
      poller.fetchMWindows(),
    ]);

    console.log(`[UptimeRobot] Fetched ${monitors.length} monitors and ${mwindows.length} groups`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Create a map of mwindow ID to host ID
    const mwindowToHostId = new Map<number, string>();

    // Create or get hosts for each monitor group
    for (const mwindow of mwindows) {
      const { data: existingHost } = await supabaseAdmin
        .from('hosts')
        .select('id')
        .eq('name', mwindow.friendly_name)
        .single();

      if (existingHost) {
        mwindowToHostId.set(mwindow.id, existingHost.id);
      } else {
        const { data: newHost, error: hostError } = await supabaseAdmin
          .from('hosts')
          .insert({
            name: mwindow.friendly_name,
            location: 'UptimeRobot Group',
            description: `Monitor group from UptimeRobot`,
          })
          .select()
          .single();

        if (!hostError && newHost) {
          mwindowToHostId.set(mwindow.id, newHost.id);
          console.log(`[UptimeRobot] Created host: ${mwindow.friendly_name}`);
        }
      }
    }

    // Get or create default host for monitors without groups
    const { data: defaultHost } = await supabaseAdmin
      .from('hosts')
      .select('id')
      .eq('name', 'UptimeRobot (Ungrouped)')
      .single();

    let defaultHostId = defaultHost?.id;

    if (!defaultHostId) {
      const { data: newHost, error: hostError } = await supabaseAdmin
        .from('hosts')
        .insert({
          name: 'UptimeRobot (Ungrouped)',
          location: 'Cloud Monitoring',
          description: 'Monitors not assigned to any group',
        })
        .select()
        .single();

      if (hostError) {
        console.error('[UptimeRobot] Failed to create default host:', hostError);
        return NextResponse.json(
          { error: 'Failed to create default host' },
          { status: 500 }
        );
      }

      defaultHostId = newHost.id;
      console.log(`[UptimeRobot] Created default host with ID: ${defaultHostId}`);
    }

    // Process each monitor
    for (const monitor of monitors) {
      try {
        const transformed = poller.transformMonitor(monitor, monitor.mwindows);

        // Determine which host to use (first group, or default if no groups)
        let hostId = defaultHostId;
        if (monitor.mwindows && monitor.mwindows.length > 0) {
          const firstMWindowId = monitor.mwindows[0];
          hostId = mwindowToHostId.get(firstMWindowId) || defaultHostId;
        }

        // Check if server exists
        const { data: existingServer } = await supabaseAdmin
          .from('servers')
          .select('id, current_status')
          .eq('external_id', transformed.external_id)
          .single();

        if (existingServer) {
          // Update existing server
          const statusChanged = existingServer.current_status !== transformed.current_status;

          const { error: updateError } = await supabaseAdmin
            .from('servers')
            .update({
              name: transformed.name,
              host_id: hostId,
              url: transformed.url,
              server_type: transformed.server_type,
              current_status: transformed.current_status,
              last_check_at: transformed.last_check_at,
              response_time_ms: transformed.response_time_ms,
              metadata: transformed.metadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingServer.id);

          if (updateError) {
            console.error(`[UptimeRobot] Failed to update server ${transformed.name}:`, updateError);
            errors++;
            continue;
          }

          // Create event if status changed
          if (statusChanged) {
            await supabaseAdmin.from('server_events').insert({
              server_id: existingServer.id,
              event_type: 'status_change',
              old_status: existingServer.current_status,
              new_status: transformed.current_status,
              response_time_ms: transformed.response_time_ms,
              metadata: {
                source: 'uptimerobot_poll',
                monitor_id: monitor.id,
                reason: transformed.metadata.last_down_reason,
              },
            });

            console.log(`[UptimeRobot] Status changed for ${transformed.name}: ${existingServer.current_status} → ${transformed.current_status}`);
          }

          updated++;
        } else {
          // Create new server
          const { data: newServer, error: insertError } = await supabaseAdmin
            .from('servers')
            .insert({
              external_id: transformed.external_id,
              name: transformed.name,
              host_id: hostId,
              url: transformed.url,
              server_type: transformed.server_type,
              current_status: transformed.current_status,
              last_check_at: transformed.last_check_at,
              response_time_ms: transformed.response_time_ms,
              metadata: transformed.metadata,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[UptimeRobot] Failed to create server ${transformed.name}:`, insertError);
            errors++;
            continue;
          }

          // Create initial event
          await supabaseAdmin.from('server_events').insert({
            server_id: newServer.id,
            event_type: 'created',
            new_status: transformed.current_status,
            response_time_ms: transformed.response_time_ms,
            metadata: {
              source: 'uptimerobot_poll',
              monitor_id: monitor.id,
            },
          });

          console.log(`[UptimeRobot] Created new server: ${transformed.name}`);
          created++;
        }
      } catch (error) {
        console.error(`[UptimeRobot] Error processing monitor ${monitor.id}:`, error);
        errors++;
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total_monitors: monitors.length,
      created,
      updated,
      errors,
    };

    console.log('[UptimeRobot] Poll completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[UptimeRobot] Polling failed:', error);
    return NextResponse.json(
      { 
        error: 'Polling failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check polling status (no auth required for health check)
 */
export async function GET() {
  const configured = !!(process.env.UPTIMEROBOT_API_KEY && process.env.POLLING_SECRET);
  
  return NextResponse.json({
    service: 'UptimeRobot Polling',
    configured,
    interval: '5 minutes',
    endpoint: '/api/polling/uptimerobot',
  });
}
