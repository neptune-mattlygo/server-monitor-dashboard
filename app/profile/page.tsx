import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ProfileForm } from './components/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold dark:text-gray-100">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account information and password</p>
        </div>
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
