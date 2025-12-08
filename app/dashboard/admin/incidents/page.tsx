import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { IncidentsManager } from './components/incidents-manager';
import { AdminHeader } from '../components/admin-header';

export const dynamic = 'force-dynamic';

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; offset?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const limit = 20;
  const offset = parseInt(params.offset || '0');
  const statusFilter = params.status || 'all';

  let query = supabaseAdmin
    .from('status_incidents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: incidents, count, error } = await query;

  if (error) {
    console.error('Error fetching incidents:', error);
    return <div>Error loading incidents</div>;
  }

  // Fetch update counts for each incident
  const incidentsWithCounts = await Promise.all(
    (incidents || []).map(async (incident) => {
      const { count: updateCount } = await supabaseAdmin
        .from('incident_updates')
        .select('*', { count: 'exact', head: true })
        .eq('incident_id', incident.id);
      return { ...incident, update_count: updateCount || 0 };
    })
  );

  // Fetch servers, regions, and hosts for the form
  const { data: servers } = await supabaseAdmin
    .from('servers')
    .select('id, name, region_id, host_id')
    .order('name');

  const { data: regions } = await supabaseAdmin
    .from('regions')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const { data: hosts } = await supabaseAdmin
    .from('hosts')
    .select('id, name, region_id')
    .order('name');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Incidents Management"
        description="Create and manage service incidents and status updates"
      />
      <div className="container mx-auto px-4 py-6">
        <IncidentsManager
        initialIncidents={incidentsWithCounts || []}
        total={count || 0}
        limit={limit}
        offset={offset}
        servers={servers || []}
        regions={regions || []}
        hosts={hosts || []}
      />
      </div>
    </div>
  );
}
