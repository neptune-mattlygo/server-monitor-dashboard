import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { EventsTableClient } from './components/events-table-client';
import { DashboardHeader } from '../dashboard/components/dashboard-header';
import { EventsSkeleton } from './components/events-skeleton';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface ServerEvent {
  id: string;
  server_id: string;
  event_type: string;
  event_source: string;
  status: string | null;
  message: string | null;
  old_status: ServerStatus | null;
  new_status: ServerStatus | null;
  response_time_ms: number | null;
  error_message: string | null;
  backup_database: string | null;
  backup_file_size: number | null;
  metadata: any;
  payload: any;
  created_at: string;
  server: {
    name: string;
    ip_address: string | null;
  };
}

async function getRecentEvents(page: number = 1, pageSize: number = 100) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: events, error, count } = await supabaseAdmin
      .from('server_events')
      .select(`
        *,
        server:servers (
          name,
          ip_address
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching events:', error);
      return { events: [], total: 0 };
    }

    return { events: events as ServerEvent[], total: count || 0 };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { events: [], total: 0 };
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.role === 'admin';
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = 100;
  const { events, total } = await getRecentEvents(page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader user={user} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<EventsSkeleton />}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Webhook activity and server status changes ({total.toLocaleString()} total events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <EventsTableClient 
                  events={events} 
                  currentPage={page}
                  totalPages={totalPages}
                  totalEvents={total}
                />
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
        </Suspense>
      </main>
    </div>
  );
}
