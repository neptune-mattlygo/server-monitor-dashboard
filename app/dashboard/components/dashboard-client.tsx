'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HostServerTable } from './host-server-table';
import { AddServerDialog } from './add-server-dialog';
import { AddHostDialog } from './add-host-dialog';
import { EditHostDialog } from './edit-host-dialog';
import { Server, Plus, Database, Pencil } from 'lucide-react';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface Server {
  id: string;
  name: string;
  host_id: string | null;
  server_type: string | null;
  ip_address: string | null;
  current_status: ServerStatus;
}

interface Host {
  id: string;
  name: string;
  location: string | null;
  provider: string | null;
  servers: Server[];
}

interface DashboardClientProps {
  hosts: Host[];
  summary: {
    total: number;
    up: number;
    down: number;
    degraded: number;
    maintenance: number;
  };
}

export function DashboardClient({ hosts, summary }: DashboardClientProps) {
  const [statusFilter, setStatusFilter] = useState<ServerStatus | 'all'>('all');
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);
  const [addHostDialogOpen, setAddHostDialogOpen] = useState(false);
  const [editHostDialogOpen, setEditHostDialogOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);

  const handleFilterClick = (status: ServerStatus | 'all') => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  const handleEditHost = (host: Host) => {
    setSelectedHost(host);
    setEditHostDialogOpen(true);
  };

  return (
    <>
      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'all' ? 'ring-2 ring-gray-400' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'up' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => handleFilterClick('up')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.up}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'down' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => handleFilterClick('down')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.down}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'degraded' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => handleFilterClick('degraded')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Degraded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.degraded}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'maintenance' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleFilterClick('maintenance')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Filtering by: <span className="font-semibold capitalize">{statusFilter}</span>
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <TooltipProvider>
        <div className="flex gap-3 mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setAddServerDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Server
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new server to monitor</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => setAddHostDialogOpen(true)} className="gap-2">
                <Database className="h-4 w-4" />
                Add Host
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new host to group servers</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Separator className="my-6" />

      {/* Servers by Host */}
      {hosts && hosts.length > 0 ? (
        <div className="space-y-6">
          {hosts.map((host) => {
            const filteredHost = {
              ...host,
              servers: statusFilter === 'all' 
                ? host.servers 
                : host.servers.filter(s => s.current_status === statusFilter)
            };

            // Skip hosts with no servers after filtering
            if (filteredHost.servers.length === 0) return null;

            return (
              <Card key={host.id}>
                <CardHeader>
                  <CardTitle>{host.name}</CardTitle>
                  {host.location && (
                    <CardDescription>{host.location}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <HostServerTable host={filteredHost} allHosts={hosts} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Servers Found</CardTitle>
            <CardDescription>
              Add servers by configuring webhooks from monitoring services like UptimeRobot, or create them manually via the API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Quick Start:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Configure a webhook in UptimeRobot or another monitoring service</li>
                  <li>Point it to: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000/api/webhooks/uptimerobot</code></li>
                  <li>Add header: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">X-Webhook-Secret: your_secret</code></li>
                  <li>Servers will appear here automatically when webhooks are received</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Or view sample data:</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The database was seeded with sample servers. Check Supabase Studio at{' '}
                  <a href="http://localhost:54323" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                    http://localhost:54323
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddServerDialog 
        open={addServerDialogOpen} 
        onOpenChange={setAddServerDialogOpen}
        hosts={hosts}
      />
      <AddHostDialog 
        open={addHostDialogOpen} 
        onOpenChange={setAddHostDialogOpen}
      />
      <EditHostDialog
        host={selectedHost}
        open={editHostDialogOpen}
        onOpenChange={setEditHostDialogOpen}
      />
    </>
  );
}
