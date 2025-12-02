'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance';

interface Host {
  id: string;
  name: string;
}

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hosts: Host[];
}

export function AddServerDialog({ open, onOpenChange, hosts }: AddServerDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    host_id: '',
    server_type: '',
    ip_address: '',
    current_status: 'up' as ServerStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create server');
      }

      router.refresh();
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        host_id: '',
        server_type: '',
        ip_address: '',
        current_status: 'up',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Server</DialogTitle>
          <DialogDescription>
            Create a new server to monitor
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {error}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Web Server 1"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="host">Region / Host *</Label>
              <Select
                value={formData.host_id}
                onValueChange={(value) => setFormData({ ...formData, host_id: value })}
                required
              >
                <SelectTrigger id="host">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {hosts.map((host) => (
                    <SelectItem key={host.id} value={host.id}>
                      {host.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="server_type">Server Type</Label>
              <Input
                id="server_type"
                value={formData.server_type}
                onChange={(e) => setFormData({ ...formData, server_type: e.target.value })}
                placeholder="e.g., Web Server, Database, API"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                placeholder="e.g., 192.168.1.100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={formData.current_status}
                onValueChange={(value) => setFormData({ ...formData, current_status: value as ServerStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Up</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="down">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Down</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="degraded">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Degraded</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">Maintenance</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Server'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
