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

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Polling not configured' },
        { status: 503 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize poller
    const poller = createUptimeRobotPoller();
    const monitors = await poller.fetchMonitors();

    console.log(`[UptimeRobot] Fetched ${monitors.length} monitors`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Get default host for UptimeRobot servers
    const { data: defaultHost } = await supabaseAdmin
      .from('hosts')
      .select('id')
      .eq('name', 'UptimeRobot')
      .single();

    let hostId = defaultHost?.id;

    // Create default host if it doesn't exist
    if (!hostId) {
      const { data: newHost, error: hostError } = await supabaseAdmin
        .from('hosts')
        .insert({
          name: 'UptimeRobot',
          location: 'Cloud Monitoring',
          provider: 'UptimeRobot',
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

      hostId = newHost.id;
      console.log(`[UptimeRobot] Created default host with ID: ${hostId}`);
    }

    // Process each monitor
    for (const monitor of monitors) {
      try {
        const transformed = poller.transformMonitor(monitor);

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
