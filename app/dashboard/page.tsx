import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
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

    return {
      hosts,
      summary,
      recentEventCount: recentEventCount || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const dashboardData = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader user={user} />

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
