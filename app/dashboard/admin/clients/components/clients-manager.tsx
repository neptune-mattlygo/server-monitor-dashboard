'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClientsTable } from './clients-table';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  is_verified: boolean;
  verified_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  client_subscriptions?: { count: number }[];
}

interface Props {
  initialClients: Client[];
  total: number;
  limit: number;
  offset: number;
}

export function ClientsManager({ initialClients, total, limit, offset }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';

  const handleFilterChange = (newFilter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', newFilter);
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
          <div>
            <CardTitle>Subscribers</CardTitle>
            <CardDescription>
              {total} {total === 1 ? 'subscriber' : 'subscribers'} total
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
              <TabsTrigger value="unsubscribed">Unsubscribed</TabsTrigger>
            </TabsList>
            <TabsContent value={filter} className="mt-4">
              <ClientsTable
                clients={initialClients}
                onClientUpdated={() => router.refresh()}
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
    </div>
  );
}
