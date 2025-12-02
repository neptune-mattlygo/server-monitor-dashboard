'use client';

import { useState, useMemo } from 'react';
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

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface ServerEvent {
  id: string;
  server_id: string;
  event_type: string;
  old_status: ServerStatus | null;
  new_status: ServerStatus | null;
  response_time_ms: number | null;
  error_message: string | null;
  metadata: any;
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

export function EventsTableClient({ events }: { events: ServerEvent[] }) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(event => {
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

      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'server_name':
          aValue = a.server?.name || '';
          bValue = b.server?.name || '';
          break;
        case 'event_type':
          aValue = a.event_type;
          bValue = b.event_type;
          break;
        case 'response_time_ms':
          aValue = a.response_time_ms ?? -1;
          bValue = b.response_time_ms ?? -1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [events, searchTerm, eventTypeFilter, statusFilter, sortField, sortDirection]);

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
            {filteredAndSortedEvents.map((event) => (
              <TableRow key={event.id}>
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
                  <Badge variant={getEventBadgeVariant(event.event_type)} className="capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </Badge>
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
            ))}
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
    </div>
  );
}
