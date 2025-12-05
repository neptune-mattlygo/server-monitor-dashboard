'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface NotificationLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  error_message: string | null;
  sent_at: string;
}

interface Props {
  incidentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationHistoryDialog({ incidentId, open, onOpenChange }: Props) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, incidentId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/incidents/${incidentId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const stats = {
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    total: logs.length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notification History</DialogTitle>
          <DialogDescription>
            Email notifications sent for this incident
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            {stats.sent} Sent
          </Badge>
          {stats.failed > 0 && (
            <Badge variant="outline" className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-red-600" />
              {stats.failed} Failed
            </Badge>
          )}
          <Badge variant="secondary">{stats.total} Total</Badge>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications have been sent for this incident yet.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {log.recipient_name || log.recipient_email}
                        </p>
                        {log.recipient_name && (
                          <p className="text-xs text-gray-500">{log.recipient_email}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString()}
                      </p>
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
