import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { DashboardClient } from './components/dashboard-client';

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
      up: allServers.filter(s => s.status === 'up').length,
      down: allServers.filter(s => s.status === 'down').length,
      degraded: allServers.filter(s => s.status === 'degraded').length,
      maintenance: allServers.filter(s => s.status === 'maintenance').length,
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
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">Server Monitor Dashboard</h1>
            <nav className="flex gap-4">
              <a 
                href="/dashboard" 
                className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b-2 border-blue-600 pb-1"
              >
                Dashboard
              </a>
              <a 
                href="/events" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Events
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.display_name || user.email}
            </span>
            <Badge variant="outline" className="capitalize">
              {user.role}
            </Badge>
            <form action="/api/auth/local/logout" method="POST">
              <button
                type="submit"
                className="rounded-md bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
      </main>
    </div>
  );
}
