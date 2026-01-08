import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { UsersManager } from './components/users-manager';
import { AdminHeader } from '../components/admin-header';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  // Fetch all users
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, azure_id, email, first_name, last_name, display_name, role, auth_provider, last_login, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader 
        title="User Management" 
        description="Manage user accounts and permissions"
      />
      <div className="container mx-auto px-4 py-8">
        <UsersManager initialUsers={users || []} />
      </div>
    </div>
  );
}
