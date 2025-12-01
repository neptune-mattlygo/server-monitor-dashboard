import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { canView } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !canView(user, 'server')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all hosts with their servers
    const { data: hosts, error: hostsError } = await supabaseAdmin
      .from('hosts')
      .select('*')
      .order('name');

    if (hostsError) {
      throw hostsError;
    }

    // Get all servers with their current status
    const { data: servers, error: serversError } = await supabaseAdmin
      .from('servers')
      .select('*')
      .order('name');

    if (serversError) {
      throw serversError;
    }

    // Group servers by host
    const hostsWithServers = hosts.map(host => ({
      ...host,
      servers: servers.filter(server => server.host_id === host.id),
    }));

    // Add servers without a host
    const unassignedServers = servers.filter(server => !server.host_id);
    if (unassignedServers.length > 0) {
      hostsWithServers.push({
        id: 'unassigned',
        name: 'Unassigned Servers',
        location: null,
        description: 'Servers without a host assignment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        servers: unassignedServers,
      });
    }

    // Calculate summary statistics
    const totalServers = servers.length;
    const upServers = servers.filter(s => s.current_status === 'up').length;
    const downServers = servers.filter(s => s.current_status === 'down').length;
    const degradedServers = servers.filter(s => s.current_status === 'degraded').length;
    const maintenanceServers = servers.filter(s => s.current_status === 'maintenance').length;

    // Get recent events count (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentEventsCount } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    return NextResponse.json({
      hosts: hostsWithServers,
      summary: {
        totalServers,
        upServers,
        downServers,
        degradedServers,
        maintenanceServers,
        recentEventsCount: recentEventsCount || 0,
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
