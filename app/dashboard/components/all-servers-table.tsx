'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ServerEditDialog } from './server-edit-dialog';
import { ServerEventHistoryDialog } from './server-event-history-dialog';
import { RelativeTime } from './relative-time';
import { useRouter } from 'next/navigation';
import { Server as ServerIcon, MapPin, Globe, ChevronUp, ChevronDown, History, Edit, AlertTriangle } from 'lucide-react';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';
type SortField = 'current_status' | 'name' | 'host_name';
type SortDirection = 'asc' | 'desc';

interface Server {
  id: string;
  name: string;
  host_id: string | null;
  current_status: ServerStatus;
  bucket?: string | null;
  fmserver_name?: string | null;
  backup_monitoring_excluded?: boolean;
  admin_url?: string | null;
  admin_username?: string | null;
  admin_password?: string | null;
  host_name?: string;
  host_region?: string | null;
  uptime_display?: string | null;
  last_backup?: {
    created_at: string;
    message?: string;
    status?: string;
    backup_event_type?: string;
    backup_database?: string;
    backup_file_key?: string;
    backup_file_size?: number;
  } | null;
  last_filemaker_event?: {
    created_at: string;
    message?: string;
    status?: string;
    event_type?: string;
  } | null;
}

interface AllServersTableProps {
  servers: Server[];
  statusFilter: ServerStatus | 'all';
  hosts: Array<{ id: string; name: string }>;
}

export function AllServersTable({ servers, statusFilter, hosts }: AllServersTableProps) {
  const router = useRouter();
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [eventHistoryServerId, setEventHistoryServerId] = useState<string | null>(null);
  const [eventHistoryServerName, setEventHistoryServerName] = useState<string>('');
  const [eventHistoryOpen, setEventHistoryOpen] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="inline h-4 w-4" /> : 
      <ChevronDown className="inline h-4 w-4" />;
  };

  const filteredServers = useMemo(() => {
    if (statusFilter === 'all') return servers;
    return servers.filter(s => s.current_status === statusFilter);
  }, [servers, statusFilter]);

  const sortedServers = useMemo(() => {
    return [...filteredServers].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'current_status':
          aValue = a.current_status;
          bValue = b.current_status;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'host_name':
          aValue = a.host_name || '';
          bValue = b.host_name || '';
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredServers, sortField, sortDirection]);

  const getStatusBadgeVariant = (status: ServerStatus): 'success' | 'destructive' | 'warning' | 'secondary' | 'default' => {
    switch (status) {
      case 'up': return 'success';
      case 'down': return 'destructive';
      case 'degraded': return 'warning';
      case 'maintenance': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: ServerStatus) => {
    switch (status) {
      case 'up': return '✓';
      case 'down': return '✗';
      case 'degraded': return '⚠';
      case 'maintenance': return '🔧';
      default: return '?';
    }
  };

  const handleRowClick = (server: Server) => {
    setSelectedServer(server);
  };

  const handleSave = async (updatedServer: Server) => {
    try {
      const response = await fetch(`/api/servers/${updatedServer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedServer.name,
          host_id: updatedServer.host_id,
          current_status: updatedServer.current_status,
          bucket: updatedServer.bucket,
          fmserver_name: updatedServer.fmserver_name,
          backup_monitoring_excluded: updatedServer.backup_monitoring_excluded,
          admin_url: updatedServer.admin_url,
          admin_username: updatedServer.admin_username,
          admin_password: updatedServer.admin_password,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update server');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating server:', error);
      throw error;
    }
  };

  if (sortedServers.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No servers found</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleSort('current_status')}
            >
              Status <SortIcon field="current_status" />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleSort('name')}
            >
              Server Name <SortIcon field="name" />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleSort('host_name')}
            >
              Host <SortIcon field="host_name" />
            </TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Last Backup</TableHead>
            <TableHead>Database</TableHead>
            <TableHead>Last FileMaker Event</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedServers.map((server) => (
            <TableRow 
              key={server.id}
              onClick={() => handleRowClick(server)}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <TableCell>
                <Badge variant={getStatusBadgeVariant(server.current_status)} style={{ minWidth: '100px' }}>
                  {getStatusIcon(server.current_status)} {server.current_status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="hover:underline">{server.name}</span>
                    </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="h-4 w-4 text-gray-500" />
                        <h4 className="font-semibold">{server.name}</h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        {server.host_name && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Host: {server.host_name}
                            </span>
                          </div>
                        )}
                        {server.host_region && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Region: {server.host_region}
                            </span>
                          </div>
                        )}
                        <div className="pt-1">
                          <Badge variant={getStatusBadgeVariant(server.current_status)}>
                            {server.current_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                  {!server.bucket && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-60">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">Missing Backup Bucket</h4>
                          <p className="text-xs text-muted-foreground">
                            This server does not have a backup bucket configured. AWS S3 backup events will not be linked to this server.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </TableCell>
              <TableCell>{server.host_name || '-'}</TableCell>
              <TableCell className="text-sm">
                {server.current_status === 'up' ? (
                  server.uptime_display || '-'
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {server.last_backup ? (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="cursor-pointer">
                        <div className={`text-sm ${
                          new Date().getTime() - new Date(server.last_backup.created_at).getTime() > 24 * 60 * 60 * 1000
                            ? 'text-red-600 font-semibold'
                            : ''
                        }`}>
                          <RelativeTime dateString={server.last_backup.created_at} />
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Backup Details</h4>
                        {server.last_backup.backup_event_type && (
                          <div className="text-sm">
                            <span className="text-gray-500">Event:</span>{' '}
                            <span className="font-medium">{server.last_backup.backup_event_type}</span>
                          </div>
                        )}
                        {server.last_backup.backup_database && (
                          <div className="text-sm">
                            <span className="text-gray-500">Database:</span>{' '}
                            <span className="font-mono text-xs">{server.last_backup.backup_database}</span>
                          </div>
                        )}
                        {server.last_backup.backup_file_key && (
                          <div className="text-sm">
                            <span className="text-gray-500">Path:</span>{' '}
                            <span className="font-mono text-xs break-all">{server.last_backup.backup_file_key}</span>
                          </div>
                        )}
                        {server.last_backup.backup_file_size && (
                          <div className="text-sm">
                            <span className="text-gray-500">Size:</span>{' '}
                            <span className="font-medium">
                              {server.last_backup.backup_file_size < 1024 
                                ? `${server.last_backup.backup_file_size} B`
                                : server.last_backup.backup_file_size < 1024 * 1024
                                ? `${(server.last_backup.backup_file_size / 1024).toFixed(2)} KB`
                                : server.last_backup.backup_file_size < 1024 * 1024 * 1024
                                ? `${(server.last_backup.backup_file_size / (1024 * 1024)).toFixed(2)} MB`
                                : `${(server.last_backup.backup_file_size / (1024 * 1024 * 1024)).toFixed(2)} GB`}
                              {server.last_backup.backup_file_size < 1024 * 1024 && (
                                <span className="text-yellow-600 ml-1">⚠️</span>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-500">Time:</span>{' '}
                          <RelativeTime dateString={server.last_backup.created_at} />
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-sm font-mono text-xs">
                {server.last_backup?.backup_database || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {server.last_filemaker_event ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{server.last_filemaker_event.event_type}</span>
                    <RelativeTime dateString={server.last_filemaker_event.created_at} />
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(server);
                    }}
                    title="Edit server"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEventHistoryServerId(server.id);
                      setEventHistoryServerName(server.name);
                      setEventHistoryOpen(true);
                    }}
                    title="View event history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ServerEditDialog
        server={selectedServer}
        open={!!selectedServer}
        onOpenChange={(open) => !open && setSelectedServer(null)}
        onSave={handleSave}
        hosts={hosts}
      />
      
      <ServerEventHistoryDialog
        serverId={eventHistoryServerId}
        serverName={eventHistoryServerName}
        open={eventHistoryOpen}
        onOpenChange={setEventHistoryOpen}
      />
    </>
  );
}
