'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface ServerEvent {
  id: string;
  server_id: string;
  event_type: string;
  event_source: string;
  status: string | null;
  message: string | null;
  old_status: ServerStatus | null;
  new_status: ServerStatus | null;
  response_time_ms: number | null;
  error_message: string | null;
  backup_database: string | null;
  backup_file_size: number | null;
  metadata: any;
  payload: any;
  created_at: string;
  server: {
    name: string;
    ip_address: string | null;
  };
}

type SortField = 'created_at' | 'server_name' | 'event_type' | 'response_time_ms';
type SortDirection = 'asc' | 'desc';

function getEventBadgeVariant(eventType: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (eventType) {
    case 'status_change':
    case 'server_up':
    case 'monitor_up':
      return 'success';
    case 'server_down':
    case 'monitor_down':
      return 'destructive';
    case 'degraded':
    case 'slow_response':
      return 'warning';
    case 'maintenance_start':
    case 'maintenance_end':
      return 'info';
    default:
      return 'secondary';
  }
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

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) {
    return <span className="ml-1 text-gray-400">↕</span>;
  }
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

interface EventsTableClientProps {
  events: ServerEvent[];
  currentPage: number;
  totalPages: number;
  totalEvents: number;
}

export function EventsTableClient({ events, currentPage, totalPages, totalEvents }: EventsTableClientProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<ServerEvent | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get unique event types and statuses for filters
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach(event => types.add(event.event_type));
    return Array.from(types).sort();
  }, [events]);

  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    events.forEach(event => {
      if (event.new_status) statusSet.add(event.new_status);
      if (event.old_status) statusSet.add(event.old_status);
    });
    return Array.from(statusSet).sort();
  }, [events]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Group backup events from the same server within 5 minutes
  const groupedEvents = useMemo(() => {
    type EventGroup = {
      id: string;
      isGroup: boolean;
      events: ServerEvent[];
      representativeEvent: ServerEvent;
      count: number;
    };

    const groups: EventGroup[] = [];
    const backupGroups = new Map<string, ServerEvent[]>();
    const GROUPING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

    // First pass: group backup events
    for (const event of events) {
      if (event.event_type === 'backup_added') {
        const timeKey = Math.floor(new Date(event.created_at).getTime() / GROUPING_WINDOW_MS);
        const groupKey = `${event.server_id}-${timeKey}`;
        
        if (!backupGroups.has(groupKey)) {
          backupGroups.set(groupKey, []);
        }
        backupGroups.get(groupKey)!.push(event);
      }
    }

    // Second pass: create groups and individual events
    const processedEventIds = new Set<string>();
    
    for (const event of events) {
      if (processedEventIds.has(event.id)) continue;

      if (event.event_type === 'backup_added') {
        const timeKey = Math.floor(new Date(event.created_at).getTime() / GROUPING_WINDOW_MS);
        const groupKey = `${event.server_id}-${timeKey}`;
        const groupEvents = backupGroups.get(groupKey) || [];

        if (groupEvents.length > 1) {
          // Create a group
          groups.push({
            id: groupKey,
            isGroup: true,
            events: groupEvents,
            representativeEvent: groupEvents[0],
            count: groupEvents.length,
          });
          groupEvents.forEach(e => processedEventIds.add(e.id));
        } else {
          // Single event, not grouped
          groups.push({
            id: event.id,
            isGroup: false,
            events: [event],
            representativeEvent: event,
            count: 1,
          });
          processedEventIds.add(event.id);
        }
      } else {
        // Non-backup event, never grouped
        groups.push({
          id: event.id,
          isGroup: false,
          events: [event],
          representativeEvent: event,
          count: 1,
        });
        processedEventIds.add(event.id);
      }
    }

    return groups;
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = groupedEvents.filter(group => {
      const event = group.representativeEvent;
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        event.server?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.error_message?.toLowerCase().includes(searchTerm.toLowerCase());

      // Event type filter
      const matchesEventType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        event.new_status === statusFilter || 
        event.old_status === statusFilter;

      return matchesSearch && matchesEventType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      const eventA = a.representativeEvent;
      const eventB = b.representativeEvent;

      switch (sortField) {
        case 'created_at':
          aValue = new Date(eventA.created_at).getTime();
          bValue = new Date(eventB.created_at).getTime();
          break;
        case 'server_name':
          aValue = eventA.server?.name || '';
          bValue = eventB.server?.name || '';
          break;
        case 'event_type':
          aValue = eventA.event_type;
          bValue = eventB.event_type;
          break;
        case 'response_time_ms':
          aValue = eventA.response_time_ms ?? -1;
          bValue = eventB.response_time_ms ?? -1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [groupedEvents, searchTerm, eventTypeFilter, statusFilter, sortField, sortDirection]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEventTypeFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || eventTypeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search by server name, event type, or error..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="min-w-[180px]">
          <Label htmlFor="event-type" className="text-sm font-medium mb-2 block">
            Event Type
          </Label>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger id="event-type">
              <SelectValue placeholder="All event types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[180px]">
          <Label htmlFor="status" className="text-sm font-medium mb-2 block">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedEvents.length} of {events.length} events
      </div>

      {/* Table */}
      {filteredAndSortedEvents.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('created_at')}
              >
                Timestamp
                <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('server_name')}
              >
                Server
                <SortIcon field="server_name" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('event_type')}
              >
                Event Type
                <SortIcon field="event_type" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead>Status Change</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => handleSort('response_time_ms')}
              >
                Response Time
                <SortIcon field="response_time_ms" currentField={sortField} direction={sortDirection} />
              </TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedEvents.map((group) => {
              const event = group.representativeEvent;
              const isExpanded = expandedGroups.has(group.id);
              
              return (
                <React.Fragment key={group.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => group.isGroup ? toggleGroup(group.id) : setSelectedEvent(event)}
                  >
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(event.created_at).toLocaleString('en-US', { 
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{event.server?.name || 'Unknown Server'}</span>
                        {event.server?.ip_address && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {event.server.ip_address}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getEventBadgeVariant(event.event_type)} className="capitalize">
                          {event.event_type.replace(/_/g, ' ')}
                        </Badge>
                        {group.isGroup && (
                          <Badge variant="outline" className="text-xs">
                            {group.count} files {isExpanded ? '▼' : '▶'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.old_status && event.new_status ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(event.old_status)} className="capitalize">
                            {event.old_status}
                          </Badge>
                          <span className="text-gray-400">→</span>
                          <Badge variant={getStatusBadgeVariant(event.new_status)} className="capitalize">
                            {event.new_status}
                          </Badge>
                        </div>
                      ) : event.new_status ? (
                        <Badge variant={getStatusBadgeVariant(event.new_status)} className="capitalize">
                          {event.new_status}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.response_time_ms !== null ? `${event.response_time_ms}ms` : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {event.error_message && (
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {event.error_message}
                        </span>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <details className="text-xs text-gray-600 dark:text-gray-400">
                          <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                            View metadata
                          </summary>
                          <pre className="mt-2 overflow-auto bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                  {/* Expanded group rows */}
                  {group.isGroup && isExpanded && group.events.map((groupEvent, idx) => (
                    <TableRow 
                      key={`${group.id}-${idx}`}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                      onClick={() => setSelectedEvent(groupEvent)}
                    >
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400 pl-8">
                        {new Date(groupEvent.created_at).toLocaleString('en-US', { 
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </TableCell>
                      <TableCell className="pl-8 text-sm text-gray-600 dark:text-gray-400">
                        {groupEvent.payload?.backup_database || groupEvent.backup_database || '-'}
                      </TableCell>
                      <TableCell colSpan={4} className="text-sm text-gray-600 dark:text-gray-400">
                        {groupEvent.payload?.backup_file_size && (
                          <span className="text-xs">
                            {(groupEvent.payload.backup_file_size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No events match your filters</p>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({totalEvents.toLocaleString()} total events)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('page', String(currentPage - 1));
                window.location.href = url.toString();
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('page', String(currentPage + 1));
                window.location.href = url.toString();
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Event Details Dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Complete information about this event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedEvent.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Type</Label>
                  <div className="mt-1">
                    <Badge variant={getEventBadgeVariant(selectedEvent.event_type)} className="capitalize">
                      {selectedEvent.event_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Server Info */}
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Server</Label>
                <div className="mt-1">
                  <p className="text-sm font-medium">{selectedEvent.server?.name || 'Unknown Server'}</p>
                  {selectedEvent.server?.ip_address && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedEvent.server.ip_address}</p>
                  )}
                </div>
              </div>

              {/* Event Source & Status */}
              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.event_source && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Source</Label>
                    <p className="mt-1 text-sm capitalize">{selectedEvent.event_source}</p>
                  </div>
                )}
                {selectedEvent.status && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {selectedEvent.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Change */}
              {(selectedEvent.old_status || selectedEvent.new_status) && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Change</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedEvent.old_status && (
                      <Badge variant={getStatusBadgeVariant(selectedEvent.old_status)} className="capitalize">
                        {selectedEvent.old_status}
                      </Badge>
                    )}
                    {selectedEvent.old_status && selectedEvent.new_status && (
                      <span className="text-gray-400">→</span>
                    )}
                    {selectedEvent.new_status && (
                      <Badge variant={getStatusBadgeVariant(selectedEvent.new_status)} className="capitalize">
                        {selectedEvent.new_status}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedEvent.message && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</Label>
                  <p className="mt-1 text-sm">{selectedEvent.message}</p>
                </div>
              )}

              {/* Response Time */}
              {selectedEvent.response_time_ms !== null && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Time</Label>
                  <p className="mt-1 text-sm">{selectedEvent.response_time_ms}ms</p>
                </div>
              )}

              {/* Error Message */}
              {selectedEvent.error_message && (
                <div>
                  <Label className="text-sm font-medium text-red-600 dark:text-red-400">Error Message</Label>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded">
                    {selectedEvent.error_message}
                  </p>
                </div>
              )}

              {/* Payload (incident details, etc.) */}
              {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payload Details</Label>
                  <div className="mt-2 space-y-2">
                    {selectedEvent.payload.incident_id && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Incident ID</span>
                        <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded">
                          {selectedEvent.payload.incident_id}
                        </code>
                      </div>
                    )}
                    {selectedEvent.payload.incident_url && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Incident Link</span>
                        <a 
                          href={selectedEvent.payload.incident_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Incidents <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedEvent.payload.created_by_email && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Created By</span>
                        <span className="text-sm font-medium">{selectedEvent.payload.created_by_email}</span>
                      </div>
                    )}
                    {selectedEvent.payload.updated_by_email && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Updated By</span>
                        <span className="text-sm font-medium">{selectedEvent.payload.updated_by_email}</span>
                      </div>
                    )}
                    {selectedEvent.payload.deleted_by_email && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Deleted By</span>
                        <span className="text-sm font-medium">{selectedEvent.payload.deleted_by_email}</span>
                      </div>
                    )}
                    {selectedEvent.payload.added_by_email && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Added By</span>
                        <span className="text-sm font-medium">{selectedEvent.payload.added_by_email}</span>
                      </div>
                    )}
                    {selectedEvent.payload.created_at && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Action Time</span>
                        <span className="text-sm">
                          {new Date(selectedEvent.payload.created_at || selectedEvent.payload.updated_at || selectedEvent.payload.deleted_at || selectedEvent.payload.added_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedEvent.payload.severity && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Severity</span>
                        <Badge variant={selectedEvent.payload.severity === 'critical' ? 'destructive' : 'default'} className="capitalize">
                          {selectedEvent.payload.severity}
                        </Badge>
                      </div>
                    )}
                    {selectedEvent.payload.incident_type && (
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">Incident Type</span>
                        <span className="text-sm capitalize">{selectedEvent.payload.incident_type}</span>
                      </div>
                    )}
                    {selectedEvent.payload.description && (
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm font-medium">Description</span>
                        <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{selectedEvent.payload.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Metadata</Label>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Raw Payload (if different from metadata) */}
              {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Payload (JSON)</Label>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
