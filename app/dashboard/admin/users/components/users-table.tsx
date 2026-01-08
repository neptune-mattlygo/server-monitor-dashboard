'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, KeyRound } from 'lucide-react';
import { UserEditDialog } from './user-edit-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import { getRoleBadgeColor } from '@/lib/auth/permissions';

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
  users: User[];
  onUserUpdated: () => void;
}

export function UsersTable({ users, onUserUpdated }: Props) {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  const validUsers = (users || []).filter(u => u != null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (validUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Auth Provider</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.display_name || user.first_name || user.email.split('@')[0]}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.auth_provider === 'azure' ? 'default' : 'secondary'}>
                    {user.auth_provider === 'azure' ? 'Azure AD' : 'Local'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(user.last_login)}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditUser(user)}
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.auth_provider === 'local' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResetPasswordUser(user)}
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserEditDialog
        open={!!editUser}
        onOpenChange={(open: boolean) => !open && setEditUser(null)}
        user={editUser}
        onSuccess={() => {
          setEditUser(null);
          onUserUpdated();
        }}
      />

      <ResetPasswordDialog
        open={!!resetPasswordUser}
        onOpenChange={(open: boolean) => !open && setResetPasswordUser(null)}
        user={resetPasswordUser}
        onSuccess={() => {
          setResetPasswordUser(null);
        }}
      />
    </>
  );
}
