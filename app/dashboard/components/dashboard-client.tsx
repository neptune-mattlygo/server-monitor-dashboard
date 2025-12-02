'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HostServerTable } from './host-server-table';

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

interface Host {
  id: string;
  name: string;
  location: string | null;
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

  const handleFilterClick = (status: ServerStatus | 'all') => {
    setStatusFilter(statusFilter === status ? 'all' : status);
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

      {/* Servers by Host */}
      {hosts && hosts.length > 0 ? (
        <div className="space-y-6">
          {hosts.map((host) => {
            const filteredHost = {
              ...host,
              servers: statusFilter === 'all' 
                ? host.servers 
                : host.servers.filter(s => s.status === statusFilter)
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
                  <HostServerTable host={filteredHost} />
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
    </>
  );
}
