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
    
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const statusPage = parseInt(searchParams.get('statusPage') || '1');
    const s3Page = parseInt(searchParams.get('s3Page') || '1');
    const filemakerPage = parseInt(searchParams.get('filemakerPage') || '1');
    const pageSize = 20;

    // Fetch server to ensure it exists
    const { data: server, error: serverError } = await supabaseAdmin
      .from('servers')
      .select('id, name, current_status')
      .eq('id', serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Fetch total counts for pagination
    const { count: statusCount } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true })
      .eq('server_id', serverId)
      .in('event_type', ['status_change', 'created']);

    const { count: filemakerCount } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true })
      .eq('server_id', serverId)
      .eq('event_type', 'filemaker_event');

    const { count: s3Count } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true })
      .eq('server_id', serverId)
      .eq('event_source', 'aws_s3');

    // Fetch recent events categorized by type with pagination
    const { data: statusEvents } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', serverId)
      .in('event_type', ['status_change', 'created'])
      .order('created_at', { ascending: false })
      .range((statusPage - 1) * pageSize, statusPage * pageSize - 1);

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
      .range((filemakerPage - 1) * pageSize, filemakerPage * pageSize - 1);

    const { data: s3Events } = await supabaseAdmin
      .from('server_events')
      .select('*')
      .eq('server_id', serverId)
      .eq('event_source', 'aws_s3')
      .order('created_at', { ascending: false })
      .range((s3Page - 1) * pageSize, s3Page * pageSize - 1);

    // Filter out backup.config files from display
    const filteredS3Events = s3Events?.filter(event => 
      event.backup_database !== 'backup.config'
    ) || [];

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

    // Get most recent S3 event (excluding backup.config)
    const lastS3Event = filteredS3Events[0] || null;

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
        status: statusEvents || [],
        backups: backupEvents || [],
        filemaker: filemakerEvents || [],
        s3: filteredS3Events,
      },
      pagination: {
        status: {
          page: statusPage,
          pageSize,
          total: statusCount || 0,
          totalPages: Math.ceil((statusCount || 0) / pageSize),
        },
        s3: {
          page: s3Page,
          pageSize,
          total: s3Count || 0,
          totalPages: Math.ceil((s3Count || 0) / pageSize),
        },
        filemaker: {
          page: filemakerPage,
          pageSize,
          total: filemakerCount || 0,
          totalPages: Math.ceil((filemakerCount || 0) / pageSize),
        },
      },
      lastBackup,
      lastFilemakerEvent,
      lastS3Event,
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
