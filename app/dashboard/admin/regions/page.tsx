import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { RegionsManager } from './components/regions-manager';
import { AdminHeader } from '../components/admin-header';

export const dynamic = 'force-dynamic';

export default async function RegionsPage() {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  const supabase = supabaseAdmin;
  const { data: regions } = await supabase
    .from('regions')
    .select('*')
    .order('display_order', { ascending: true });

  // Get server counts for each region
  const regionsWithCount = await Promise.all(
    (regions || []).map(async (region) => {
      const { count } = await supabase
        .from('servers')
        .select('*', { count: 'exact', head: true })
        .eq('region_id', region.id);
      return { ...region, server_count: count || 0 };
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AdminHeader
        title="Regions Management"
        description="Create and manage regions for organizing servers on the status page"
      />
      <div className="container mx-auto px-6 py-6">
        <RegionsManager initialRegions={regionsWithCount || []} />
      </div>
    </div>
  );
}
