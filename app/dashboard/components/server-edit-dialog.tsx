'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface Host {
  id: string;
  name: string;
}

interface Server {
  id: string;
  name: string;
  host_id: string | null;
  server_type: string | null;
  ip_address: string | null;
  current_status: ServerStatus;
  bucket?: string | null;
  backup_monitoring_excluded?: boolean;
}

interface ServerEditDialogProps {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (server: Server) => Promise<void>;
  hosts: Host[];
}

function getStatusBadgeVariant(status: ServerStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'up':
      return 'success';
    case 'down':
      return 'destructive';
    case 'degraded':
      return 'warning';
    case 'maintenance':
      return 'info';
    default:
      return 'secondary';
  }
}

export function ServerEditDialog({ server, open, onOpenChange, onSave, hosts }: ServerEditDialogProps) {
  const [editedServer, setEditedServer] = useState<Server | null>(server);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update editedServer when server prop changes
  if (server && editedServer?.id !== server.id) {
    setEditedServer(server);
  }

  const handleSave = async () => {
    if (!editedServer) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedServer);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editedServer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Server</DialogTitle>
          <DialogDescription>
            Update server details and monitoring configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <div className="flex gap-2 flex-wrap">
              {(['up', 'down', 'degraded', 'maintenance'] as const).map((status) => (
                <Badge
                  key={status}
                  variant={editedServer.current_status === status ? getStatusBadgeVariant(status) : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => setEditedServer({ ...editedServer, current_status: status })}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              value={editedServer.name}
              onChange={(e) => setEditedServer({ ...editedServer, name: e.target.value })}
              placeholder="Production Web Server"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="host">Host</Label>
            <Select
              value={editedServer.host_id || ''}
              onValueChange={(value) => setEditedServer({ ...editedServer, host_id: value })}
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
            <Label htmlFor="server_type">Server Type</Label>
            <Input
              id="server_type"
              value={editedServer.server_type || ''}
              onChange={(e) => setEditedServer({ ...editedServer, server_type: e.target.value })}
              placeholder="Web Server, Database, API"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ip_address">IP Address</Label>
            <Input
              id="ip_address"
              value={editedServer.ip_address || ''}
              onChange={(e) => setEditedServer({ ...editedServer, ip_address: e.target.value })}
              placeholder="192.168.1.100"
              className="font-mono"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bucket">Backup Bucket Name</Label>
            <Input
              id="bucket"
              value={editedServer.bucket || ''}
              onChange={(e) => setEditedServer({ ...editedServer, bucket: e.target.value })}
              placeholder="e.g., backup-ncdv"
            />
            <p className="text-xs text-muted-foreground">
              AWS S3 bucket name for linking backup events
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="backup-monitoring">Exclude from Backup Monitoring</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, this server will not trigger backup alerts
              </p>
            </div>
            <Switch
              id="backup-monitoring"
              checked={editedServer.backup_monitoring_excluded || false}
              onCheckedChange={(checked) => setEditedServer({ ...editedServer, backup_monitoring_excluded: checked })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Server ID</Label>
            <div className="text-sm text-muted-foreground font-mono">
              {editedServer.id}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
