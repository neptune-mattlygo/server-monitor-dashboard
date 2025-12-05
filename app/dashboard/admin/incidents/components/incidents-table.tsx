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
import { Edit, Trash2, MessageSquare, Bell, Mail } from 'lucide-react';
import { IncidentFormDialog } from './incident-form-dialog';
import { AddUpdateDialog } from './add-update-dialog';
import { NotificationHistoryDialog } from './notification-history-dialog';
import { toast } from 'sonner';

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  incident_type: string;
  created_at: string;
  notified_at: string | null;
  update_count?: number;
}

interface Props {
  incidents: Incident[];
  servers: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  onIncidentUpdated: () => void;
}

export function IncidentsTable({ incidents, servers, regions, onIncidentUpdated }: Props) {
  const [editIncident, setEditIncident] = useState<any>(null);
  const [addUpdateIncident, setAddUpdateIncident] = useState<any>(null);
  const [deleteIncident, setDeleteIncident] = useState<any>(null);
  const [notificationHistoryIncident, setNotificationHistoryIncident] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteIncident) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/incidents/${deleteIncident.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete incident');
      }

      toast.success('Incident deleted');
      setDeleteIncident(null);
      onIncidentUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleNotify = async (incidentId: string) => {
    setNotifying(incidentId);
    try {
      const response = await fetch(`/api/admin/incidents/${incidentId}/notify`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send notifications');
      }

      const result = await response.json();
      toast.success(`Sent ${result.sent} notification(s)`);
      onIncidentUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setNotifying(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'major': return 'default';
      case 'minor': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'outline';
      case 'monitoring': return 'secondary';
      default: return 'default';
    }
  };

  const validIncidents = (incidents || []).filter(i => i != null);

  if (validIncidents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No incidents found. Click &quot;Create Incident&quot; to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Updates</TableHead>
            <TableHead>Notifications</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validIncidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell className="font-medium max-w-xs truncate">
                {incident.title}
              </TableCell>
              <TableCell>
                <Badge variant={getSeverityColor(incident.severity) as any}>
                  {incident.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(incident.status) as any}>
                  {incident.status}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">{incident.incident_type}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {incident.update_count || 0}
                </Badge>
              </TableCell>
              <TableCell>
                {incident.notified_at ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotificationHistoryIncident(incident.id)}
                    className="h-6 px-2"
                  >
                    <Badge variant="outline" className="cursor-pointer">
                      <Mail className="h-3 w-3 mr-1" />
                      View
                    </Badge>
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400">Not sent</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(incident.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddUpdateIncident(incident)}
                    title="Add update"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {!incident.notified_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNotify(incident.id)}
                      disabled={notifying === incident.id}
                      title="Send notifications"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditIncident(incident)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteIncident(incident)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <IncidentFormDialog
        open={!!editIncident}
        onOpenChange={(open) => !open && setEditIncident(null)}
        onSuccess={() => {
          setEditIncident(null);
          onIncidentUpdated();
        }}
        servers={servers}
        regions={regions}
        incident={editIncident}
      />

      <AddUpdateDialog
        open={!!addUpdateIncident}
        onOpenChange={(open: boolean) => !open && setAddUpdateIncident(null)}
        onSuccess={() => {
          setAddUpdateIncident(null);
          onIncidentUpdated();
        }}
        incidentId={addUpdateIncident?.id}
      />

      {notificationHistoryIncident && (
        <NotificationHistoryDialog
          incidentId={notificationHistoryIncident}
          open={!!notificationHistoryIncident}
          onOpenChange={(open) => !open && setNotificationHistoryIncident(null)}
        />
      )}

      <AlertDialog open={!!deleteIncident} onOpenChange={() => setDeleteIncident(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this incident? This action cannot be undone.
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
