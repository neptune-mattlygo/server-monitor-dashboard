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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Database, Server, TrendingUp, TrendingDown, Cloud, ChevronLeft, ChevronRight } from 'lucide-react';

interface EventData {
  id: string;
  event_type: string;
  event_source: string;
  status?: string;
  message?: string;
  created_at: string;
  old_status?: string;
  new_status?: string;
  payload?: any;
  backup_event_type?: string;
  backup_database?: string;
  backup_file_key?: string;
  backup_file_size?: number;
}

interface ServerEventHistoryDialogProps {
  serverId: string | null;
  serverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServerEventHistoryDialog({
  serverId,
  serverName,
  open,
  onOpenChange,
}: ServerEventHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState<any>(null);
  const [statusPage, setStatusPage] = useState(1);
  const [s3Page, setS3Page] = useState(1);
  const [filemakerPage, setFilemakerPage] = useState(1);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    if (open && serverId) {
      // Reset pages when dialog opens
      setStatusPage(1);
      setS3Page(1);
      setFilemakerPage(1);
      setData(null);
      fetchEventHistory(true);
    }
  }, [open, serverId]);

  const fetchEventHistory = async (isInitial = false) => {
    if (!serverId) return;

    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        statusPage: statusPage.toString(),
        s3Page: s3Page.toString(),
        filemakerPage: filemakerPage.toString(),
      });
      const response = await fetch(`/api/servers/${serverId}/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch event history');
      const result = await response.json();
      
      if (isInitial || !data) {
        setData(result);
      } else {
        // Append new data to existing data
        setData({
          ...result,
          events: {
            status: [...(data.events.status || []), ...(result.events.status || [])],
            s3: [...(data.events.s3 || []), ...(result.events.s3 || [])],
            filemaker: [...(data.events.filemaker || []), ...(result.events.filemaker || [])],
            backups: result.events.backups,
          },
          pagination: result.pagination,
        });
      }
    } catch (error) {
      console.error('Error fetching event history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };LoadMoreButton = ({ 
    tab,
    page, 
    totalPages, 
  }: { 
    tab: 'status' | 's3' | 'filemaker';
    page: number; 
    totalPages: number; 
  }) => {
    if (page >= totalPages) return null;

    return (
      <div className="flex items-center justify-center pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadMore(tab)}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100 mr-2" />
              Loading...
            </>
          ) : (
            <>
              Load More
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
          Page {page} of {totalPages}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Event History: {serverName}</DialogTitle>
          <DialogDescription>
            View uptime, backup history, and FileMaker Server events
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : data ? (
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status"> onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">
                <TrendingUp className="h-4 w-4 mr-2" />
                Status History
              </TabsTrigger>
              <TabsTrigger value="s3">
                <Cloud className="h-4 w-4 mr-2" />
                S3 Events
              </TabsTrigger>
              <TabsTrigger value="filemaker">
                <Server className="h-4 w-4 mr-2" />
                FileMaker Events
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4" key={activeTab}e="space-y-4">
                {data.uptime && data.server.current_status === 'up' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Current Uptime
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {data.uptime.display || 'Unknown'}
                    </p>
                    {data.uptime.lastUpEvent && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Up since {formatDateTime(data.uptime.lastUpEvent.created_at)}
                      </p>
                    )}
                  </div>
                )}

                {data.events.status.length > 0 ? (
                  <div className="space-y-3">
                    {data.events.status.map((event: EventData) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {event.new_status === 'down' || event.status === 'down' ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              )}
                              {event.old_status && event.new_status ? (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(event.old_status)}
                                  >
                                    {event.old_status}
                                  </Badge>
                                  <span>→</span>
                                  <Badge
                                    variant="outline"
                                    className={getStatusColor(event.new_status)}
                                  >
                                    {event.new_status}
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="outline" className={getStatusColor(event.status || 'unknown')}>
                                  {event.status || event.new_status || 'Status Change'}
                                </Badge>
                              )}
                            </div>
                            {event.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.message}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {formatDateTime(event.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No status change events recorded
                  </p>
                )}
                {data.pagination?.status && (
                  <PaginationControls
                    page={data.pagination.status.page}
                   LoadMoreButton
                    tab="status"
                    page={data.pagination.status.page}
                    totalPages={data.pagination.status.totalPages
              </TabsContent>

              {/* S3 Events Tab */}
              <TabsContent value="s3" className="space-y-4">
                {data.lastS3Event && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                        Latest S3 Event
                      </h3>
                    </div>
                    <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                      {formatDateTime(data.lastS3Event.created_at)}
                    </p>
                    {data.lastS3Event.backup_event_type && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {data.lastS3Event.backup_event_type}
                      </p>
                    )}
                    {data.lastS3Event.backup_database && (
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {data.lastS3Event.backup_database}
                      </p>
                    )}
                    {data.lastS3Event.backup_file_size && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Size:{' '}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {data.lastS3Event.backup_file_size < 1024 
                            ? `${data.lastS3Event.backup_file_size} B`
                            : data.lastS3Event.backup_file_size < 1024 * 1024
                            ? `${(data.lastS3Event.backup_file_size / 1024).toFixed(2)} KB`
                            : data.lastS3Event.backup_file_size < 1024 * 1024 * 1024
                            ? `${(data.lastS3Event.backup_file_size / (1024 * 1024)).toFixed(2)} MB`
                            : `${(data.lastS3Event.backup_file_size / (1024 * 1024 * 1024)).toFixed(2)} GB`}
                          {data.lastS3Event.backup_file_size < 1024 * 1024 && (
                            <span className="text-yellow-600 dark:text-yellow-500 ml-1">⚠️</span>
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {data.events.s3 && data.events.s3.length > 0 ? (
                  <div className="space-y-3">
                    {data.events.s3.map((event: EventData) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Cloud className="h-4 w-4 text-orange-500" />
                              <Badge variant="outline">
                                {event.backup_event_type || event.event_type}
                              </Badge>
                              {event.status && (
                                <Badge variant="secondary">
                                  {event.status}
                                </Badge>
                              )}
                            </div>
                            {event.backup_database && (
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                📁 {event.backup_database}
                              </p>
                            )}
                            {event.backup_file_size && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Size:{' '}
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {event.backup_file_size < 1024 
                                    ? `${event.backup_file_size} B`
                                    : event.backup_file_size < 1024 * 1024
                                    ? `${(event.backup_file_size / 1024).toFixed(2)} KB`
                                    : event.backup_file_size < 1024 * 1024 * 1024
                                    ? `${(event.backup_file_size / (1024 * 1024)).toFixed(2)} MB`
                                    : `${(event.backup_file_size / (1024 * 1024 * 1024)).toFixed(2)} GB`}
                                  {event.backup_file_size < 1024 * 1024 && (
                                    <span className="text-yellow-600 dark:text-yellow-500 ml-1">⚠️</span>
                                  )}
                                </span>
                              </p>
                            )}
                            {event.backup_file_key && (
                              <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mb-2 break-all">
                                {event.backup_file_key}
                              </p>
                            )}
                            {event.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.message}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 ml-4 text-right">
                            {formatDateTime(event.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No S3 events recorded
                  </p>
                )}
                {data.pagination?.s3 && (
                  <LoadMoreButton
                    tab="s3"
                    page={data.pagination.s3.page}
                    totalPages={data.pagination.s3.totalPages}
                  />
                )}
              </TabsContent>

              {/* FileMaker Events Tab */}
              <TabsContent value="filemaker" className="space-y-4">
                {data.lastFilemakerEvent && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                        Latest FileMaker Event
                      </h3>
                    </div>
                    {data.lastFilemakerEvent.event_type && (
                      <p className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        {data.lastFilemakerEvent.event_type}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(data.lastFilemakerEvent.created_at)}
                    </p>
                    {data.lastFilemakerEvent.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {data.lastFilemakerEvent.message}
                      </p>
                    )}
                  </div>
                )}

                {data.events.filemaker.length > 0 ? (
                  <div className="space-y-3">
                    {data.events.filemaker.map((event: EventData) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Server className="h-4 w-4 text-purple-500" />
                              {event.event_type && (
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {event.event_type}
                                </span>
                              )}
                              <Badge variant="outline">
                                {event.status || 'FileMaker Event'}
                              </Badge>
                            </div>
                            {event.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.message}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {formatDateTime(event.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No FileMaker Server events recorded
                  </p>
                )}
                {data.pagination?.filemaker && (
                  <LoadMoreButton
                    tab="filemaker"
                    page={data.pagination.filemaker.page}
                    totalPages={data.pagination.filemaker.totalPages}
                  />
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <p className="text-center text-gray-500 py-8">No data available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
