import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { DashboardClient } from './components/dashboard-client';
import { DashboardHeader } from './components/dashboard-header';
import { DashboardSkeleton } from './components/dashboard-skeleton';
import { Suspense } from 'react';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface Server {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  ip_address: string | null;
  status: ServerStatus;
  last_check_at: string | null;
  response_time_ms: number | null;
}

interface Host {
  id: string;
  name: string;
  location: string | null;
  provider: string | null;
  servers: Server[];
}

async function getDashboardData() {
  try {
    // Fetch hosts with their servers
    const { data: hosts, error: hostsError } = await supabaseAdmin
      .from('hosts')
      .select(`
        *,
        servers (*)
      `)
      .order('name');

    if (hostsError) {
      console.error('Error fetching hosts:', hostsError);
      return null;
    }

    // Calculate summary
    const allServers = hosts?.flatMap(h => h.servers) || [];
    const summary = {
      total: allServers.length,
      up: allServers.filter(s => s.current_status === 'up').length,
      down: allServers.filter(s => s.current_status === 'down').length,
      degraded: allServers.filter(s => s.current_status === 'degraded').length,
      maintenance: allServers.filter(s => s.current_status === 'maintenance').length,
    };

    // Get recent events count (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: recentEventCount } = await supabaseAdmin
      .from('server_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    // Fetch last down event, last backup, and last FileMaker event for each server
    const serverIds = allServers.map(s => s.id);
    
    // Get last down events for uptime calculation
    const { data: lastDownEvents } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, new_status, status')
      .in('server_id', serverIds)
      .or('new_status.eq.down,status.eq.down')
      .order('created_at', { ascending: false });

    // Get last up events
    const { data: lastUpEvents } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, new_status, status')
      .in('server_id', serverIds)
      .or('new_status.eq.up,status.eq.up')
      .order('created_at', { ascending: false });

    // Get last backup events
    const { data: lastBackupEvents } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, message, status')
      .in('server_id', serverIds)
      .eq('event_type', 'backup')
      .order('created_at', { ascending: false });

    // Get last FileMaker events
    const { data: lastFilemakerEvents } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, message, status')
      .in('server_id', serverIds)
      .eq('event_type', 'filemaker_event')
      .order('created_at', { ascending: false });

    // Build lookup maps
    const downEventMap = new Map<string, any>();
    const upEventMap = new Map<string, any>();
    const backupEventMap = new Map<string, any>();
    const filemakerEventMap = new Map<string, any>();

    lastDownEvents?.forEach(evt => {
      if (!downEventMap.has(evt.server_id)) {
        downEventMap.set(evt.server_id, evt);
      }
    });

    lastUpEvents?.forEach(evt => {
      if (!upEventMap.has(evt.server_id)) {
        upEventMap.set(evt.server_id, evt);
      }
    });

    lastBackupEvents?.forEach(evt => {
      if (!backupEventMap.has(evt.server_id)) {
        backupEventMap.set(evt.server_id, evt);
      }
    });

    lastFilemakerEvents?.forEach(evt => {
      if (!filemakerEventMap.has(evt.server_id)) {
        filemakerEventMap.set(evt.server_id, evt);
      }
    });

    // Enrich servers with event data
    const enrichedHosts = hosts?.map(host => ({
      ...host,
      servers: host.servers.map((server: any) => {
        const lastDown = downEventMap.get(server.id);
        const lastUp = upEventMap.get(server.id);
        const lastBackup = backupEventMap.get(server.id);
        const lastFilemaker = filemakerEventMap.get(server.id);

        // Calculate uptime if server is up
        let uptimeMs: number | null = null;
        let uptimeDisplay: string | null = null;

        if (server.current_status === 'up') {
          if (lastUp && (!lastDown || new Date(lastUp.created_at) > new Date(lastDown.created_at))) {
            uptimeMs = Date.now() - new Date(lastUp.created_at).getTime();
            uptimeDisplay = formatUptime(uptimeMs);
          }
        }

        return {
          ...server,
          uptime_ms: uptimeMs,
          uptime_display: uptimeDisplay,
          last_backup: lastBackup,
          last_filemaker_event: lastFilemaker,
        };
      }),
    }));

    return {
      hosts: enrichedHosts,
      summary,
      recentEventCount: recentEventCount || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
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

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userIsAdmin = isAdmin(user);
  const dashboardData = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader user={user} isAdmin={userIsAdmin} />

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          {dashboardData && (
            <DashboardClient 
              hosts={dashboardData.hosts} 
              summary={dashboardData.summary}
            />
          )}

          {/* Recent Events */}
          {dashboardData?.recentEventCount !== undefined && dashboardData.recentEventCount > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  {dashboardData.recentEventCount} events in the last 24 hours
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </Suspense>
      </main>
    </div>
  );
}
