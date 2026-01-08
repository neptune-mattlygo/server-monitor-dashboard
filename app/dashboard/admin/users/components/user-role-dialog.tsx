'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getRoleBadgeColor } from '@/lib/auth/permissions';
import { Badge } from '@/components/ui/badge';
import { Shield, Edit3, Eye } from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'editor' | 'viewer';
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function UserRoleDialog({ open, onOpenChange, user, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      toast.success('User role updated successfully');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const roleDescriptions = {
    admin: 'Full system access including user management, webhooks, and audit logs',
    editor: 'Can create and update servers and hosts, view monitoring data',
    viewer: 'Read-only access to dashboard, servers, and event logs'
  };

  const roleIcons = {
    admin: Shield,
    editor: Edit3,
    viewer: Eye
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Change the role and permissions for {user.display_name || user.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium">
                  {user.display_name || user.email}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Badge className={getRoleBadgeColor(user.role)}>
                Current: {user.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="role">New Role</Label>
            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {(['admin', 'editor', 'viewer'] as const).map((role) => {
                  const Icon = roleIcons[role];
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize font-medium">{role}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {selectedRole && (
              <Alert className="mt-3">
                <AlertDescription className="text-sm">
                  <span className="font-semibold capitalize">{selectedRole}:</span>{' '}
                  {roleDescriptions[selectedRole]}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || selectedRole === user.role}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
