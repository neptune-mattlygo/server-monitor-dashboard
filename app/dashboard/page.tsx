import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Activity, AlertCircle, AlertTriangle } from 'lucide-react';
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
  description: string | null;
  servers: Server[];
}

async function getDashboardData() {
  try {
    // Fetch hosts with their servers and regions
    const { data: hosts, error: hostsError } = await supabaseAdmin
      .from('hosts')
      .select(`
        *,
        servers (*),
        regions (
          id,
          name
        )
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

    // Get active incidents
    const { data: activeIncidents } = await supabaseAdmin
      .from('status_incidents')
      .select('id, title, severity, status, started_at')
      .neq('status', 'resolved')
      .order('started_at', { ascending: false });

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

    // Get last backup events (including backup_added from S3, only .fmp12 files)
    const { data: lastBackupEvents } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, message, status, backup_event_type, backup_database, backup_file_key, backup_file_size')
      .in('server_id', serverIds)
      .or('event_type.eq.backup,event_type.eq.backup_added')
      .ilike('backup_database', '%.fmp12')
      .order('created_at', { ascending: false });

    // Get last FileMaker events
    const { data: lastFilemakerEvents } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, message, status, event_type')
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
      }).sort((a: any, b: any) => a.name.localeCompare(b.name)), // Sort servers alphabetically by name
    }));

    return {
      hosts: enrichedHosts,
      summary,
      recentEventCount: recentEventCount || 0,
      activeIncidents: activeIncidents || [],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader user={user} isAdmin={userIsAdmin} />

      <main className="container mx-auto px-6 py-8">
        {/* Active Incidents Alert */}
        {dashboardData?.activeIncidents && dashboardData.activeIncidents.length > 0 && (
          <Link href="/events" className="block mb-6">
            <Alert className="border-2 border-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <strong className="font-semibold">
                      {dashboardData.activeIncidents.length} Active Incident{dashboardData.activeIncidents.length !== 1 ? 's' : ''}
                    </strong>
                    <span>
                      {dashboardData.activeIncidents[0].title}
                      {dashboardData.activeIncidents.length > 1 && ` and ${dashboardData.activeIncidents.length - 1} more`}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-red-600 dark:text-red-400 flex-shrink-0 ml-4">Click to view details →</span>
              </div>
            </Alert>
          </Link>
        )}

        <Suspense fallback={<DashboardSkeleton />}>
          {dashboardData && (
            <DashboardClient 
              hosts={dashboardData.hosts} 
              summary={dashboardData.summary}
            />
          )}

          {/* Recent Events */}
          {dashboardData?.recentEventCount !== undefined && dashboardData.recentEventCount > 0 && (
            <Card className="mt-8 border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-b border-emerald-200/50 dark:border-emerald-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-700 dark:text-emerald-300">Recent Activity</CardTitle>
                    <CardDescription className="text-emerald-600 dark:text-emerald-400">
                      {dashboardData.recentEventCount} events in the last 24 hours
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </Suspense>
      </main>
    </div>
  );
}
