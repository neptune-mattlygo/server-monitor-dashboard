import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { HostServerTable } from './components/host-server-table';

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
          <h1 className="text-2xl font-bold">Server Monitor Dashboard</h1>
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
        {/* Summary Stats */}
        {dashboardData?.summary && (
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.up}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.down}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Degraded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.degraded}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.maintenance}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Servers by Host */}
        {dashboardData?.hosts && dashboardData.hosts.length > 0 ? (
          <div className="space-y-6">
            {dashboardData.hosts.map((host) => (
              <Card key={host.id}>
                <CardHeader>
                  <CardTitle>{host.name}</CardTitle>
                  {host.location && (
                    <CardDescription>{host.location}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <HostServerTable host={host} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Servers Found</CardTitle>
              <CardDescription>
                Add servers by configuring webhooks from monitoring services like UptimeRobot, or create them manually via the API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Quick Start:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>Configure a webhook in UptimeRobot or another monitoring service</li>
                    <li>Point it to: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000/api/webhooks/uptimerobot</code></li>
                    <li>Add header: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">X-Webhook-Secret: your_secret</code></li>
                    <li>Servers will appear here automatically when webhooks are received</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Or view sample data:</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    The database was seeded with sample servers. Check Supabase Studio at{' '}
                    <a href="http://localhost:54323" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                      http://localhost:54323
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
