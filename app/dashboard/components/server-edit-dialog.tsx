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

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface Server {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  ip_address: string | null;
  status: ServerStatus;
  last_check_at: string | null;
  response_time_ms: number | null;
}

interface ServerEditDialogProps {
  server: Server | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (server: Server) => Promise<void>;
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

export function ServerEditDialog({ server, open, onOpenChange, onSave }: ServerEditDialogProps) {
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
              {(['up', 'down', 'degraded', 'maintenance', 'unknown'] as const).map((status) => (
                <Badge
                  key={status}
                  variant={editedServer.status === status ? getStatusBadgeVariant(status) : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => setEditedServer({ ...editedServer, status })}
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editedServer.description || ''}
              onChange={(e) => setEditedServer({ ...editedServer, description: e.target.value })}
              placeholder="Main application server"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={editedServer.url || ''}
              onChange={(e) => setEditedServer({ ...editedServer, url: e.target.value })}
              placeholder="https://example.com"
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
            <Label htmlFor="response_time">Response Time (ms)</Label>
            <Input
              id="response_time"
              type="number"
              value={editedServer.response_time_ms || ''}
              onChange={(e) => setEditedServer({ 
                ...editedServer, 
                response_time_ms: e.target.value ? parseInt(e.target.value) : null 
              })}
              placeholder="150"
            />
          </div>

          <div className="grid gap-2">
            <Label>Last Check</Label>
            <div className="text-sm text-muted-foreground">
              {editedServer.last_check_at
                ? new Date(editedServer.last_check_at).toLocaleString()
                : 'Never checked'}
            </div>
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
