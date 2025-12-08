import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { ConfigForm } from './components/config-form';
import { AdminHeader } from '../components/admin-header';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  const { data: config } = await supabaseAdmin
    .from('status_page_config')
    .select('*')
    .single();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader
        title="Status Page Configuration"
        description="Customize the appearance and settings of your public status page"
      />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <ConfigForm initialConfig={config} />
      </div>
    </div>
  );
}
