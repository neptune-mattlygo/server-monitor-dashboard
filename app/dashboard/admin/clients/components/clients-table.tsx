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
import { Trash2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

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
  clients: Client[];
  onClientUpdated: () => void;
}

export function ClientsTable({ clients, onClientUpdated }: Props) {
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteClient) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/clients/${deleteClient.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete client');
      }

      toast.success('Client deleted');
      setDeleteClient(null);
      onClientUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleVerify = async (clientId: string) => {
    setVerifying(clientId);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify client');
      }

      toast.success('Client verified');
      onClientUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setVerifying(null);
    }
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No clients found
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscriptions</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.company || '-'}</TableCell>
              <TableCell>
                {client.unsubscribed_at ? (
                  <Badge variant="secondary">Unsubscribed</Badge>
                ) : client.is_verified ? (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Mail className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {client.client_subscriptions?.[0]?.count || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(client.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {!client.is_verified && !client.unsubscribed_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerify(client.id)}
                      disabled={verifying === client.id}
                      title="Manually verify"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteClient(client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteClient?.name} ({deleteClient?.email})?
              This will also remove all their subscriptions.
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
