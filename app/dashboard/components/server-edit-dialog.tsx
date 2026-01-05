'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface Host {
  id: string;
  name: string;
}

interface Server {
  id: string;
  name: string;
  host_id: string | null;
  current_status: ServerStatus;
  bucket?: string | null;
  backup_monitoring_excluded?: boolean;
  backup_monitoring_disabled_reason?: string | null;
  backup_monitoring_review_date?: string | null;
  fmserver_name?: string | null;
  admin_url?: string | null;
  admin_username?: string | null;
  admin_password?: string | null;
  fm_server_version?: string | null;
  fm_host_name?: string | null;
  fm_metadata_updated_at?: string | null;
  fm_metadata?: any;
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
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Update editedServer when server prop changes or dialog opens
  useEffect(() => {
    if (server) {
      setEditedServer(server);
      setError(null);
    }
  }, [server?.id, open]);

  // Fetch decrypted credentials when dialog opens
  useEffect(() => {
    if (open && server?.id) {
      setActiveTab('general'); // Reset to general tab
      setLoadingCredentials(true);
      fetch(`/api/servers/${server.id}/credentials`)
        .then(res => res.json())
        .then(data => {
          if (data.credentials) {
            setEditedServer(prev => prev ? {
              ...prev,
              admin_url: data.credentials.admin_url,
              admin_username: data.credentials.admin_username,
              admin_password: data.credentials.admin_password,
            } : null);
          }
        })
        .catch(err => console.error('Failed to load credentials:', err))
        .finally(() => setLoadingCredentials(false));
    }
  }, [open, server?.id]);

  const handleSave = async () => {
    if (!editedServer) return;

    // Validate backup monitoring exclusion fields
    if (editedServer.backup_monitoring_excluded) {
      if (!editedServer.backup_monitoring_disabled_reason?.trim()) {
        setError('Reason for disabling backup monitoring is required');
        return;
      }
      if (!editedServer.backup_monitoring_review_date) {
        setError('Review date is required when backup monitoring is disabled');
        return;
      }
    }

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="backup">Backup Monitoring</TabsTrigger>
            <TabsTrigger value="metadata">FileMaker Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
        <div className="grid gap-4">
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

          <div className="grid gap-2">
            <Label htmlFor="fmserver_name">FileMaker Server Name</Label>
            <div className="flex gap-2">
              <Input
                id="fmserver_name"
                value={editedServer.fmserver_name || ''}
                onChange={(e) => setEditedServer({ ...editedServer, fmserver_name: e.target.value })}
                placeholder="e.g., FM Server Production"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!editedServer.id) return;
                  try {
                    const response = await fetch(`/api/servers/${editedServer.id}/fetch-metadata`, {
                      method: 'POST',
                    });
                    
                    console.log('Response status:', response.status);
                    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                    
                    const responseText = await response.text();
                    console.log('Raw response:', responseText);
                    
                    let data;
                    try {
                      data = responseText ? JSON.parse(responseText) : {};
                    } catch (parseErr) {
                      console.error('Failed to parse JSON:', parseErr);
                      data = { error: 'Invalid JSON response', details: responseText };
                    }
                    
                    if (response.ok) {
                      if (data.success) {
                        // Refetch server data to show updated metadata
                        if (editedServer.id) {
                          fetch(`/api/servers/${editedServer.id}/credentials`)
                            .then(res => res.json())
                            .then(credData => {
                              if (credData.credentials) {
                                setEditedServer(prev => prev ? {
                                  ...prev,
                                  ...credData.server, // Include any updated metadata fields
                                  admin_url: credData.credentials.admin_url,
                                  admin_username: credData.credentials.admin_username,
                                  admin_password: credData.credentials.admin_password,
                                } : null);
                              }
                              // Switch to metadata tab to show the results
                              setActiveTab('metadata');
                            })
                            .catch(err => {
                              console.error('Failed to refresh server data:', err);
                              // Still switch to metadata tab even if refresh fails
                              setActiveTab('metadata');
                            });
                        }
                      } else {
                        alert('Unexpected response format. Check console for details.');
                        console.error('Unexpected successful response:', data);
                      }
                    } else {
                      console.error('Failed to fetch metadata:', data);
                      const errorMsg = data.error || 'Unknown error';
                      const details = data.details ? '\n\nDetails: ' + data.details : '';
                      alert(`Failed to fetch metadata: ${errorMsg}${details}`);
                    }
                  } catch (err) {
                    console.error('Network error fetching metadata:', err);
                    alert(`Failed to fetch metadata: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  }
                }}
                disabled={!editedServer.admin_url || !editedServer.admin_username || !editedServer.admin_password}
                title={!editedServer.admin_url || !editedServer.admin_username || !editedServer.admin_password ? 'Configure admin credentials first' : 'Fetch metadata from FileMaker Server'}
              >
                Fetch Metadata
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Server name used in FileMaker webhook payloads. Click "Fetch Metadata" to auto-populate from FileMaker Server.
            </p>
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="font-semibold mb-3 text-sm">Admin Console Credentials</h4>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="admin_url">Admin Console URL</Label>
                <Input
                  id="admin_url"
                  type="url"
                  value={editedServer.admin_url || ''}
                  onChange={(e) => setEditedServer({ ...editedServer, admin_url: e.target.value })}
                  placeholder="https://admin.example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="admin_username">Admin Username</Label>
                <Input
                  id="admin_username"
                  type="text"
                  autoComplete="username"
                  value={editedServer.admin_username || ''}
                  onChange={(e) => setEditedServer({ ...editedServer, admin_username: e.target.value })}
                  placeholder="admin"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="admin_password">Admin Password</Label>
                <Input
                  id="admin_password"
                  type="password"
                  autoComplete="current-password"
                  value={editedServer.admin_password || ''}
                  onChange={(e) => setEditedServer({ ...editedServer, admin_password: e.target.value })}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Password is encrypted and stored securely
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Server ID</Label>
            <div className="text-sm text-muted-foreground font-mono">
              {editedServer.id}
            </div>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="backup-monitoring">Exclude from Backup Monitoring</Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, this server will not trigger backup alerts
                    </p>
                  </div>
                  <Switch
                    id="backup-monitoring"
                    checked={editedServer.backup_monitoring_excluded || false}
                    onCheckedChange={(checked) => {
                      setEditedServer({ 
                        ...editedServer, 
                        backup_monitoring_excluded: checked,
                        // Clear fields when unchecking
                        backup_monitoring_disabled_reason: checked ? editedServer.backup_monitoring_disabled_reason : null,
                        backup_monitoring_review_date: checked ? editedServer.backup_monitoring_review_date : null,
                      });
                    }}
                  />
                </div>

                {editedServer.backup_monitoring_excluded && (
                  <div className="space-y-4 pt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="disabled-reason" className="flex items-center gap-1">
                        Reason for Disabling <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="disabled-reason"
                        value={editedServer.backup_monitoring_disabled_reason || ''}
                        onChange={(e) => setEditedServer({ 
                          ...editedServer, 
                          backup_monitoring_disabled_reason: e.target.value 
                        })}
                        placeholder="e.g., Server is being decommissioned, no backups needed"
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required: Explain why backup monitoring is disabled
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="review-date" className="flex items-center gap-1">
                        Review Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="review-date"
                        type="date"
                        value={editedServer.backup_monitoring_review_date || ''}
                        onChange={(e) => setEditedServer({ 
                          ...editedServer, 
                          backup_monitoring_review_date: e.target.value 
                        })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        Required: Date to review if backup monitoring should be re-enabled
                      </p>
                    </div>
                  </div>
                )}

                {!editedServer.backup_monitoring_excluded && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Backup Monitoring Active</p>
                    <p>This server is included in automated backup monitoring checks. You will receive alerts if backups become overdue.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {editedServer.fm_metadata_updated_at ? (
                <>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="text-sm text-green-800 dark:text-green-200">
                      Last updated: {new Date(editedServer.fm_metadata_updated_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>FileMaker Server Name</Label>
                    <div className="text-sm font-mono p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {editedServer.fmserver_name || '-'}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Server Version</Label>
                    <div className="text-sm font-mono p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {editedServer.fm_server_version || '-'}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Host Name / IP Address</Label>
                    <div className="text-sm font-mono p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {editedServer.fm_host_name || '-'}
                    </div>
                  </div>

                  {editedServer.fm_metadata && (
                    <div className="grid gap-2">
                      <Label>Full Metadata (JSON)</Label>
                      <pre className="text-xs font-mono p-3 bg-gray-50 dark:bg-gray-800 rounded overflow-auto max-h-64">
                        {JSON.stringify(editedServer.fm_metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No metadata available</p>
                  <p className="text-sm">Configure admin credentials on the General tab and click "Fetch Metadata" to retrieve FileMaker Server information.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
