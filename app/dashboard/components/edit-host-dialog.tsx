'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Host {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  region_id: string | null;
}

interface Region {
  id: string;
  name: string;
}

interface EditHostDialogProps {
  host: Host | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHostDialog({ host, open, onOpenChange }: EditHostDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    region_id: '',
  });

  // Fetch regions when dialog opens
  useEffect(() => {
    if (open) {
      fetch('/api/admin/regions')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRegions(data);
          }
        })
        .catch(err => console.error('Failed to fetch regions:', err));
    }
  }, [open]);

  useEffect(() => {
    if (host) {
      setFormData({
        name: host.name,
        location: host.location || '',
        description: host.description || '',
        region_id: host.region_id || '',
      });
    }
  }, [host]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hosts/${host.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update host');
      }

      // Reset form and close dialog
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update host');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!host) return;
    if (!confirm('Are you sure you want to delete this host? This will not delete the servers associated with it.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hosts/${host.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete host');
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete host');
    } finally {
      setLoading(false);
    }
  };

  if (!host) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Host</DialogTitle>
          <DialogDescription>
            Update host information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Host Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., US East"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Virginia, USA"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-region">Region</Label>
              <Select
                value={formData.region_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, region_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a region (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Region</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Primary production environment"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Host
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
