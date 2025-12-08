'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { RegionFormDialog } from './region-form-dialog';
import { RegionsTable } from './regions-table';

interface Region {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  server_count?: number;
}

interface Props {
  initialRegions: Region[];
}

export function RegionsManager({ initialRegions }: Props) {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const refreshRegions = async () => {
    try {
      const response = await fetch('/api/admin/regions');
      const data = await response.json();
      if (data.regions) {
        setRegions(data.regions);
      }
    } catch (error) {
      console.error('Failed to refresh regions:', error);
    }
  };

  const handleRegionCreated = async () => {
    setShowCreateDialog(false);
    await refreshRegions();
    router.refresh();
  };

  const handleRegionUpdated = async () => {
    await refreshRegions();
    router.refresh();
  };

  const handleRegionDeleted = async () => {
    await refreshRegions();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regions</CardTitle>
              <CardDescription>
                {regions.length} {regions.length === 1 ? 'region' : 'regions'} configured
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Region
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RegionsTable
            regions={regions}
            onRegionUpdated={handleRegionUpdated}
            onRegionDeleted={handleRegionDeleted}
          />
        </CardContent>
      </Card>

      <RegionFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleRegionCreated}
      />
    </div>
  );
}
