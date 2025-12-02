import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface ServerEvent {
  id: string;
  server_id: string;
  event_type: string;
  old_status: ServerStatus | null;
  new_status: ServerStatus | null;
  response_time_ms: number | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
  server: {
    name: string;
    url: string | null;
  };
}

function getEventBadgeVariant(eventType: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (eventType) {
    case 'status_change':
    case 'server_up':
    case 'monitor_up':
      return 'success';
    case 'server_down':
    case 'monitor_down':
      return 'destructive';
    case 'degraded':
    case 'slow_response':
      return 'warning';
    case 'maintenance_start':
    case 'maintenance_end':
      return 'info';
    default:
      return 'secondary';
  }
}

function getStatusBadgeVariant(status: ServerStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'up':
      return 'success';
    case 'down':
      return 'destructive';
    case 'degraded':
      return 'warning';
    case 'maintenance':
      return 'info';
    default:
      return 'secondary';
  }
}

async function getRecentEvents() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('server_events')
      .select(`
        *,
        server:servers (
          name,
          url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return events as ServerEvent[];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const events = await getRecentEvents();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">Server Monitor</h1>
            <nav className="flex gap-4">
              <a 
                href="/dashboard" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Dashboard
              </a>
              <a 
                href="/events" 
                className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b-2 border-blue-600 pb-1"
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Webhook activity and server status changes (last 100 events)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Status Change</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.server?.name || 'Unknown Server'}</span>
                          {event.server?.url && (
                            <a
                              href={event.server.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {event.server.url}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEventBadgeVariant(event.event_type)} className="capitalize">
                          {event.event_type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.old_status && event.new_status ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(event.old_status)} className="capitalize">
                              {event.old_status}
                            </Badge>
                            <span className="text-gray-400">→</span>
                            <Badge variant={getStatusBadgeVariant(event.new_status)} className="capitalize">
                              {event.new_status}
                            </Badge>
                          </div>
                        ) : event.new_status ? (
                          <Badge variant={getStatusBadgeVariant(event.new_status)} className="capitalize">
                            {event.new_status}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {event.response_time_ms !== null ? `${event.response_time_ms}ms` : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {event.error_message && (
                          <span className="text-sm text-red-600 dark:text-red-400">
                            {event.error_message}
                          </span>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <details className="text-xs text-gray-600 dark:text-gray-400">
                            <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                              View metadata
                            </summary>
                            <pre className="mt-2 overflow-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No events recorded yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Events will appear here when webhooks are received or server status changes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
