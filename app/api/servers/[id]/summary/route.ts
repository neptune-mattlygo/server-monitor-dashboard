import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const serverId = params.id;

    // Fetch server to ensure it exists
    const { data: server, error: serverError } = await supabaseAdmin
      .from('servers')
      .select('id, name, current_status')
      .eq('id', serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Fetch recent events categorized by type
    const { data: statusEvents } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', serverId)
      .in('event_type', ['status_change', 'created'])
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: backupEvents } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', serverId)
      .eq('event_type', 'backup')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: filemakerEvents } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', serverId)
      .eq('event_type', 'filemaker_event')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate uptime (time since last 'down' event)
    const lastDownEvent = statusEvents?.find(e => 
      e.new_status === 'down' || 
      (e.status === 'down' && !e.new_status)
    );
    
    const lastUpEvent = statusEvents?.find(e => 
      e.new_status === 'up' || 
      (e.status === 'up' && !e.new_status)
    );

    let uptimeMs: number | null = null;
    let uptimeDisplay: string | null = null;
    
    // Only calculate uptime if server is currently up
    if (server.current_status === 'up') {
      if (lastUpEvent && (!lastDownEvent || new Date(lastUpEvent.created_at) > new Date(lastDownEvent.created_at))) {
        // Currently up - calculate time since last up event
        uptimeMs = Date.now() - new Date(lastUpEvent.created_at).getTime();
        uptimeDisplay = formatUptime(uptimeMs);
      } else if (!lastDownEvent) {
        // No down events ever recorded - uptime unknown
        uptimeDisplay = 'Unknown';
      }
    }

    // Get most recent backup
    const lastBackup = backupEvents?.[0] || null;

    // Get most recent FileMaker event
    const lastFilemakerEvent = filemakerEvents?.[0] || null;

    return NextResponse.json({
      server: {
        id: server.id,
        name: server.name,
        current_status: server.current_status,
      },
      uptime: {
        ms: uptimeMs,
        display: uptimeDisplay,
        lastDownEvent: lastDownEvent || null,
        lastUpEvent: lastUpEvent || null,
      },
      events: {
        status: statusEvents?.slice(0, 20) || [],
        backups: backupEvents || [],
        filemaker: filemakerEvents || [],
      },
      lastBackup,
      lastFilemakerEvent,
    });
  } catch (error) {
    console.error('Error fetching server summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
