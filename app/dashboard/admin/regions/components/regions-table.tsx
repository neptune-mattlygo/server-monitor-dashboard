'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { RegionFormDialog } from './region-form-dialog';
import { toast } from 'sonner';

interface Region {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  server_count?: number;
}

interface Props {
  regions: Region[];
  onRegionUpdated: () => void;
  onRegionDeleted: () => void;
}

export function RegionsTable({ regions, onRegionUpdated, onRegionDeleted }: Props) {
  const [editRegion, setEditRegion] = useState<Region | null>(null);
  const [deleteRegion, setDeleteRegion] = useState<Region | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter out any null or undefined regions
  const validRegions = (regions || []).filter(r => r != null);

  const handleDelete = async () => {
    if (!deleteRegion) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/regions/${deleteRegion.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete region');
      }

      toast.success('Region deleted');
      setDeleteRegion(null);
      onRegionDeleted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getServerCount = (region: Region | null | undefined) => {
    if (!region) return 0;
    return region.server_count || 0;
  };

  if (validRegions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No regions created yet. Click &quot;Add Region&quot; to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Servers</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validRegions.map((region) => (
            <TableRow key={region.id}>
              <TableCell className="font-medium">{region.name}</TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {region.slug}
                </code>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {region.description || '-'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{getServerCount(region)}</Badge>
              </TableCell>
              <TableCell>{region.display_order}</TableCell>
              <TableCell>
                <Badge variant={region.is_active ? 'default' : 'secondary'}>
                  {region.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditRegion(region)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteRegion(region)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <RegionFormDialog
        open={!!editRegion}
        onOpenChange={(open) => !open && setEditRegion(null)}
        onSuccess={() => {
          setEditRegion(null);
          onRegionUpdated();
        }}
        region={editRegion}
      />

      <AlertDialog open={!!deleteRegion} onOpenChange={() => setDeleteRegion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Region</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteRegion?.name}&quot;?
              {getServerCount(deleteRegion!) > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  This region has {getServerCount(deleteRegion!)} server(s). Please reassign
                  them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
