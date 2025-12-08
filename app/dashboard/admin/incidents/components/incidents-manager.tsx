'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { IncidentFormDialog } from './incident-form-dialog';
import { IncidentsTable } from './incidents-table';

interface Incident {
  id: string;
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  status: string;
  affected_servers: string[];
  affected_regions: string[];
  started_at: string;
  resolved_at: string | null;
  notify_subscribers: boolean;
  notified_at: string | null;
  created_at: string;
  update_count?: number;
  profiles?: { email: string; full_name: string | null };
}

interface Props {
  initialIncidents: Incident[];
  total: number;
  limit: number;
  offset: number;
  servers: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  hosts: { id: string; name: string }[];
}

export function IncidentsManager({ initialIncidents, total, limit, offset, servers, regions, hosts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const statusFilter = searchParams.get('status') || 'all';

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    params.delete('offset');
    router.push(`?${params.toString()}`);
  };

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', (offset + limit).toString());
    router.push(`?${params.toString()}`);
  };

  const hasMore = offset + limit < total;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>
                {total} {total === 1 ? 'incident' : 'incidents'} total
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="investigating">Investigating</TabsTrigger>
              <TabsTrigger value="identified">Identified</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            <TabsContent value={statusFilter} className="mt-4">
              <IncidentsTable
                incidents={initialIncidents}
                servers={servers}
                regions={regions}
                hosts={hosts}
                onIncidentUpdated={() => router.refresh()}
              />
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={handleLoadMore}>
                    Load More ({total - offset - limit} remaining)
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <IncidentFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          router.refresh();
        }}
        servers={servers}
        regions={regions}
        hosts={hosts}
      />
    </div>
  );
}
