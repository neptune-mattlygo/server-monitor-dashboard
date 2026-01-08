'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UsersTable } from './users-table';
import { CreateUserDialog } from './create-user-dialog';

interface User {
  id: string;
  azure_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  role: 'admin' | 'editor' | 'viewer';
  auth_provider: 'azure' | 'local';
  last_login: string | null;
  created_at: string;
}

interface Props {
  initialUsers: User[];
}

export function UsersManager({ initialUsers }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const refreshUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to refresh users:', error);
    }
  };

  const handleUserUpdated = async () => {
    await refreshUsers();
    router.refresh();
  };

  const handleUserCreated = async () => {
    setShowCreateDialog(false);
    await refreshUsers();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {users.length} {users.length === 1 ? 'user' : 'users'} registered
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            onUserUpdated={handleUserUpdated}
          />
        </CardContent>
      </Card>

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleUserCreated}
      />
    </div>
  );
}
