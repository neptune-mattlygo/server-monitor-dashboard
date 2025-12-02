import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { EventsTableClient } from './components/events-table-client';

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
    ip_address: string | null;
  };
}

async function getRecentEvents() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('server_events')
      .select(`
        *,
        server:servers (
          name,
          ip_address
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
              <EventsTableClient events={events} />
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
