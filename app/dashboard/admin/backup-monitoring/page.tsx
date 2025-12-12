import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import { AdminHeader } from '../components/admin-header';
import { BackupMonitoringSettings } from '@/app/admin/components/backup-monitoring-settings';

export const dynamic = 'force-dynamic';

export default async function BackupMonitoringPage() {
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AdminHeader
        title="Backup Monitoring"
        description="Configure automated backup checks and email alerts for overdue backups"
      />
      <div className="container mx-auto px-6 py-6 max-w-4xl">
        <BackupMonitoringSettings />
      </div>
    </div>
  );
}
