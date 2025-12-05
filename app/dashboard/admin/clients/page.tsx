import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { ClientsManager } from './components/clients-manager';
import { AdminHeader } from '../components/admin-header';

export const dynamic = 'force-dynamic';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; offset?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const limit = 50;
  const offset = parseInt(params.offset || '0');
  const filter = params.filter || 'all';

  let query = supabaseAdmin
    .from('clients')
    .select(`
      *,
      client_subscriptions (count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'verified') {
    query = query.eq('is_verified', true).is('unsubscribed_at', null);
  } else if (filter === 'unverified') {
    query = query.eq('is_verified', false);
  } else if (filter === 'unsubscribed') {
    query = query.not('unsubscribed_at', 'is', null);
  }

  const { data: clients, count } = await query;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Clients & Subscribers"
        description="Manage email subscribers and their notification preferences"
      />
      <div className="container mx-auto px-4 py-6">
        <ClientsManager
        initialClients={clients || []}
        total={count || 0}
        limit={limit}
        offset={offset}
      />
      </div>
    </div>
  );
}
