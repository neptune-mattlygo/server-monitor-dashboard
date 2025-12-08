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
import { Server as ServerIcon, MapPin, Globe, History } from 'lucide-react';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';
type SortField = 'current_status' | 'name' | 'server_type' | 'ip_address';
type SortDirection = 'asc' | 'desc';

interface Server {
  id: string;
  name: string;
  host_id: string | null;
  server_type: string | null;
  ip_address: string | null;
  current_status: ServerStatus;
  uptime_display?: string | null;
  last_backup?: {
    created_at: string;
    message?: string;
    status?: string;
  } | null;
  last_filemaker_event?: {
    created_at: string;
    message?: string;
    status?: string;
  } | null;
}

interface Host {
  id: string;
  name: string;
  region_id: string | null;
  servers: Server[];
}

function getStatusBadgeVariant(status: ServerStatus): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'up':
      return 'success';
    case 'down':
      return 'destructive';
    case 'degraded':
      return 'warning';
    case 'maintenance':
      return 'info';
    default:
      return 'secondary';
  }
}

function getStatusIcon(status: ServerStatus): string {
  switch (status) {
    case 'up':
      return '●';
    case 'down':
      return '●';
    case 'degraded':
      return '●';
    case 'maintenance':
      return '●';
    default:
      return '○';
  }
}

function getStatusOrder(status: ServerStatus): number {
  switch (status) {
    case 'down': return 0;
    case 'degraded': return 1;
    case 'maintenance': return 2;
    case 'up': return 3;
    default: return 4;
  }
}

export function HostServerTable({ host, allHosts, onDragStart, onDragEnd, selectedServerIds, onServerSelect }: { 
  host: Host; 
  allHosts: Host[];
  onDragStart?: (serverId: string) => void;
  onDragEnd?: () => void;
  selectedServerIds?: Set<string>;
  onServerSelect?: (serverId: string, isCtrlOrCmd: boolean) => void;
}) {
  const [sortField, setSortField] = useState<SortField>('current_status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventHistoryServerId, setEventHistoryServerId] = useState<string | null>(null);
  const [eventHistoryServerName, setEventHistoryServerName] = useState<string>('');
  const [eventHistoryOpen, setEventHistoryOpen] = useState(false);
  const router = useRouter();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedServers = useMemo(() => {
    if (!host.servers || host.servers.length === 0) return [];

    return [...host.servers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'current_status':
          aValue = getStatusOrder(a.current_status);
          bValue = getStatusOrder(b.current_status);
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'server_type':
          aValue = a.server_type?.toLowerCase() || '';
          bValue = b.server_type?.toLowerCase() || '';
          break;
        case 'ip_address':
          aValue = a.ip_address || '';
          bValue = b.ip_address || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [host.servers, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleRowClick = (server: Server) => {
    setSelectedServer(server);
    setDialogOpen(true);
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
          server_type: updatedServer.server_type,
          ip_address: updatedServer.ip_address,
          current_status: updatedServer.current_status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update server');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating server:', error);
      throw error;
    }
  };

  if (!host.servers || host.servers.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No servers in this host</p>;
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
              onClick={() => handleSort('server_type')}
            >
              Server Type <SortIcon field="server_type" />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleSort('ip_address')}
            >
              IP Address <SortIcon field="ip_address" />
            </TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Last Backup</TableHead>
            <TableHead>Last FileMaker Event</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedServers.map((server) => {
            const isSelected = selectedServerIds?.has(server.id) || false;
            
            return (
              <TableRow 
                key={server.id}
                draggable
                onDragStart={() => onDragStart?.(server.id)}
                onDragEnd={() => onDragEnd?.()}
                onClick={(e) => {
                  // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
                  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
                  
                  if (isCtrlOrCmd && onServerSelect) {
                    // Multi-select mode
                    e.stopPropagation();
                    onServerSelect(server.id, true);
                  } else if (onServerSelect && !e.defaultPrevented) {
                    // Single select or toggle
                    onServerSelect(server.id, false);
                  } else {
                    // Fallback to edit dialog
                    handleRowClick(server);
                  }
                }}
                className={`cursor-move hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500 ring-inset' : ''
                }`}
              >
              <TableCell>
                <Badge variant={getStatusBadgeVariant(server.current_status)} style={{ minWidth: '100px' }}>
                  {getStatusIcon(server.current_status)} {server.current_status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
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
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Host: {host.name}
                          </span>
                        </div>
                        <div className="pt-1">
                          <Badge variant={getStatusBadgeVariant(server.current_status)}>
                            {server.current_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell>{server.server_type || '-'}</TableCell>
              <TableCell className="font-mono text-sm">
                {server.ip_address || '-'}
              </TableCell>
              <TableCell className="text-sm">
                {server.current_status === 'up' ? (
                  server.uptime_display || '-'
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {server.last_backup ? (
                  <RelativeTime dateString={server.last_backup.created_at} />
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {server.last_filemaker_event ? (
                  <RelativeTime dateString={server.last_filemaker_event.created_at} />
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ServerEditDialog
        server={selectedServer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        hosts={allHosts}
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
