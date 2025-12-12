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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    current_status: 'up' as ServerStatus,
    bucket: '',
    fmserver_name: '',
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
        current_status: 'up',
        bucket: '',
        fmserver_name: '',
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
              <Label htmlFor="host">Host *</Label>
              <Select
                value={formData.host_id}
                onValueChange={(value) => setFormData({ ...formData, host_id: value })}
                required
              >
                <SelectTrigger id="host">
                  <SelectValue placeholder="Select a host" />
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
              <Label htmlFor="bucket">S3 Backup Bucket Name</Label>
              <Input
                id="bucket"
                value={formData.bucket}
                onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                placeholder="e.g., backup-ncdv"
              />
              <p className="text-xs text-muted-foreground">
                AWS S3 bucket name for linking backup events
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fmserver_name">FileMaker Server Name</Label>
              <Input
                id="fmserver_name"
                value={formData.fmserver_name}
                onChange={(e) => setFormData({ ...formData, fmserver_name: e.target.value })}
                placeholder="e.g., FM Server Production"
              />
              <p className="text-xs text-muted-foreground">
                Server name used in FileMaker webhook payloads (if different from server name)
              </p>
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
