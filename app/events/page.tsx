import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { EventsPageClient } from './components/events-page-client';
import { DashboardHeader } from '../dashboard/components/dashboard-header';

export default async function EventsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader user={user} isAdmin={isAdmin} />
      <EventsPageClient />
    </div>
  );
}
