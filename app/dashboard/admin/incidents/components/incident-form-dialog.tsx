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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MultiSelect } from '@/components/ui/multi-select';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  servers: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  hosts: { id: string; name: string }[];
  incident?: any;
}

export function IncidentFormDialog({ open, onOpenChange, onSuccess, servers, regions, hosts, incident }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'outage',
    severity: 'major',
    affected_servers: [] as string[],
    affected_regions: [] as string[],
    affected_hosts: [] as string[],
    status: 'investigating',
    notify_subscribers: false,
  });

  // Auto-select hosts and servers when regions change
  const handleRegionChange = (selectedRegions: string[]) => {
    // Find all hosts in selected regions
    const hostsInRegions = hosts.filter(h => 
      selectedRegions.some(regionId => {
        const host = hosts.find(host => host.id === h.id);
        return (host as any)?.region_id === regionId;
      })
    ).map(h => h.id);

    // Find all servers in selected regions
    const serversInRegions = servers.filter(s =>
      selectedRegions.some(regionId => {
        const server = servers.find(srv => srv.id === s.id);
        return (server as any)?.region_id === regionId;
      })
    ).map(s => s.id);

    // Merge with existing selections (don't remove manually selected items)
    const newHosts = [...new Set([...formData.affected_hosts, ...hostsInRegions])];
    const newServers = [...new Set([...formData.affected_servers, ...serversInRegions])];

    setFormData({
      ...formData,
      affected_regions: selectedRegions,
      affected_hosts: newHosts,
      affected_servers: newServers,
    });
  };

  // Auto-select servers when hosts change
  const handleHostChange = (selectedHosts: string[]) => {
    // Find all servers in selected hosts
    const serversInHosts = servers.filter(s =>
      selectedHosts.some(hostId => {
        const server = servers.find(srv => srv.id === s.id);
        return (server as any)?.host_id === hostId;
      })
    ).map(s => s.id);

    // Merge with existing selections
    const newServers = [...new Set([...formData.affected_servers, ...serversInHosts])];

    setFormData({
      ...formData,
      affected_hosts: selectedHosts,
      affected_servers: newServers,
    });
  };

  useEffect(() => {
    if (incident) {
      setFormData({
        title: incident.title,
        description: incident.description,
        incident_type: incident.incident_type,
        severity: incident.severity,
        affected_servers: incident.affected_servers || [],
        affected_regions: incident.affected_regions || [],
        affected_hosts: incident.affected_hosts || [],
        status: incident.status,
        notify_subscribers: incident.notify_subscribers ?? false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        incident_type: 'outage',
        severity: 'major',
        affected_servers: [],
        affected_regions: [],
        affected_hosts: [],
        status: 'investigating',
        notify_subscribers: false,
      });
    }
    setError('');
  }, [incident, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.affected_servers.length === 0 && formData.affected_regions.length === 0 && formData.affected_hosts.length === 0) {
      setError('Please select at least one affected server, region, or host');
      setLoading(false);
      return;
    }

    try {
      const url = incident
        ? `/api/admin/incidents/${incident.id}`
        : '/api/admin/incidents';
      const method = incident ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save incident');
      }

      toast.success(incident ? 'Incident updated' : 'Incident created');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const serverOptions = servers.map(s => ({ value: s.id, label: s.name }));
  const regionOptions = regions.map(r => ({ value: r.id, label: r.name }));
  const hostOptions = hosts.map(h => ({ value: h.id, label: h.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{incident ? 'Edit Incident' : 'Create Incident'}</DialogTitle>
          <DialogDescription>
            {incident
              ? 'Update incident details'
              : 'Create a new status page incident'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the incident"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the incident and impact"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incident_type">Incident Type *</Label>
              <Select
                value={formData.incident_type}
                onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outage">Outage</SelectItem>
                  <SelectItem value="degraded">Degraded Performance</SelectItem>
                  <SelectItem value="maintenance">Scheduled Maintenance</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Affected Regions</Label>
            <MultiSelect
              options={regionOptions}
              selected={formData.affected_regions}
              onChange={handleRegionChange}
              placeholder="Select affected regions"
              emptyMessage="No regions found"
            />
          </div>

          <div>
            <Label>Affected Hosts</Label>
            <MultiSelect
              options={hostOptions}
              selected={formData.affected_hosts}
              onChange={handleHostChange}
              placeholder="Select affected hosts"
              emptyMessage="No hosts found"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hosts from selected regions are automatically included
            </p>
          </div>

          <div>
            <Label>Affected Servers</Label>
            <MultiSelect
              options={serverOptions}
              selected={formData.affected_servers}
              onChange={(selected) => setFormData({ ...formData, affected_servers: selected })}
              placeholder="Select individual servers"
              emptyMessage="No servers found"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Servers from selected regions and hosts are automatically included
            </p>
          </div>

          {!incident && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notify_subscribers"
                  checked={formData.notify_subscribers}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_subscribers: checked })
                  }
                />
                <Label htmlFor="notify_subscribers">Notify subscribers (manual trigger)</Label>
              </div>
              
              {!formData.notify_subscribers && (
                <Alert>
                  <AlertDescription>
                    ⚠️ Subscribers will NOT be notified about this incident. You can manually trigger notifications later from the incidents list.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {incident && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notify_subscribers"
                  checked={formData.notify_subscribers}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_subscribers: checked })
                  }
                />
                <Label htmlFor="notify_subscribers">Notify subscribers of status change</Label>
              </div>
              
              {formData.notify_subscribers && (
                <Alert>
                  <AlertDescription>
                    ✉️ Subscribers will be notified about this status update when you save.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : incident ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
