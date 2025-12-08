'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HostServerTable } from './host-server-table';
import { AllServersTable } from './all-servers-table';
import { AddServerDialog } from './add-server-dialog';
import { AddHostDialog } from './add-host-dialog';
import { EditHostDialog } from './edit-host-dialog';
import { Server, Plus, Database, Pencil, LayoutGrid, List, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type ServerStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';

interface Server {
  id: string;
  name: string;
  host_id: string | null;
  server_type: string | null;
  ip_address: string | null;
  current_status: ServerStatus;
}

interface Host {
  id: string;
  name: string;
  description: string | null;
  region_id: string | null;
  regions?: {
    id: string;
    name: string;
  } | null;
  servers: Server[];
}

interface DashboardClientProps {
  hosts: Host[];
  summary: {
    total: number;
    up: number;
    down: number;
    degraded: number;
    maintenance: number;
  };
}

export function DashboardClient({ hosts, summary }: DashboardClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<ServerStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped');
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false);
  const [addHostDialogOpen, setAddHostDialogOpen] = useState(false);
  const [editHostDialogOpen, setEditHostDialogOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [draggedServerId, setDraggedServerId] = useState<string | null>(null);
  const [selectedServerIds, setSelectedServerIds] = useState<Set<string>>(new Set());
  const [dragOverHostId, setDragOverHostId] = useState<string | null>(null);
  const [collapsedHosts, setCollapsedHosts] = useState<Set<string>>(new Set());
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, []);

  // Clear auto-scroll when drag ends
  useEffect(() => {
    if (!draggedServerId && autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, [draggedServerId]);

  const handleFilterClick = (status: ServerStatus | 'all') => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  const handleEditHost = (host: Host) => {
    setSelectedHost(host);
    setEditHostDialogOpen(true);
  };

  const handleServerSelect = (serverId: string, isCtrlOrCmd: boolean) => {
    setSelectedServerIds(prev => {
      const newSet = new Set(prev);
      if (isCtrlOrCmd) {
        // Toggle selection with Ctrl/Cmd
        if (newSet.has(serverId)) {
          newSet.delete(serverId);
        } else {
          newSet.add(serverId);
        }
      } else {
        // Single selection without Ctrl/Cmd
        if (newSet.has(serverId) && newSet.size === 1) {
          newSet.clear();
        } else {
          newSet.clear();
          newSet.add(serverId);
        }
      }
      return newSet;
    });
  };

  const handleDragStart = (serverId: string) => {
    // If dragging a selected server, drag all selected servers
    if (selectedServerIds.has(serverId)) {
      setDraggedServerId('multiple');
    } else {
      setDraggedServerId(serverId);
    }
  };

  const handleDragEnd = () => {
    setDraggedServerId(null);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent, hostId: string) => {
    e.preventDefault();
    setDragOverHostId(hostId);

    // Only auto-scroll if we're actually dragging something
    if (!draggedServerId) {
      // Make sure no scroll interval is running if we're not dragging
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    // Auto-scroll when dragging near the edges
    const scrollThreshold = 100; // pixels from edge
    const scrollSpeed = 10; // pixels per interval
    const mouseY = e.clientY;
    const windowHeight = window.innerHeight;

    const shouldScrollUp = mouseY < scrollThreshold;
    const shouldScrollDown = mouseY > windowHeight - scrollThreshold;

    // If we're in a scroll zone and don't have an interval, create one
    if ((shouldScrollUp || shouldScrollDown) && !autoScrollIntervalRef.current) {
      const direction = shouldScrollUp ? -1 : 1;
      autoScrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, scrollSpeed * direction);
      }, 16); // ~60fps
    }
    // If we're not in a scroll zone, clear any existing interval
    else if (!shouldScrollUp && !shouldScrollDown && autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleDragLeave = () => {
    setDragOverHostId(null);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleDrop = async (e: React.DragEvent, targetHostId: string) => {
    e.preventDefault();
    setDragOverHostId(null);
    
    // Immediately stop auto-scrolling
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    const currentDraggedServerId = draggedServerId;
    
    // Clear drag state immediately to restore normal scrolling
    setDraggedServerId(null);

    if (!currentDraggedServerId) return;

    try {
      // Determine which servers to move
      const serverIdsToMove = currentDraggedServerId === 'multiple' 
        ? Array.from(selectedServerIds)
        : [currentDraggedServerId];

      // Move all servers
      const movePromises = serverIdsToMove.map(serverId =>
        fetch(`/api/servers/${serverId}/host`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host_id: targetHostId }),
        })
      );

      const responses = await Promise.all(movePromises);
      const failedCount = responses.filter(r => !r.ok).length;

      if (failedCount > 0) {
        throw new Error(`Failed to move ${failedCount} server(s)`);
      }

      const count = serverIdsToMove.length;
      toast.success(`${count} server${count > 1 ? 's' : ''} moved successfully`);
      
      // Clear selection after successful move
      setSelectedServerIds(new Set());
      router.refresh();
    } catch (error) {
      console.error('Error moving server:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move server(s)');
    }
    // Don't set draggedServerId to null here - it's already cleared above
  };

  const toggleHostCollapse = (hostId: string) => {
    setCollapsedHosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hostId)) {
        newSet.delete(hostId);
      } else {
        newSet.add(hostId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Floating Selection Banner */}
      {selectedServerIds.size > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/95 rounded-lg border border-blue-200 dark:border-blue-800 shadow-lg backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedServerIds.size} server{selectedServerIds.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedServerIds(new Set())}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Drag to move
            </span>
          </div>
        </div>
      )}
      
      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'all' ? 'ring-2 ring-gray-400' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'up' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => handleFilterClick('up')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.up}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'down' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => handleFilterClick('down')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.down}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'degraded' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => handleFilterClick('degraded')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Degraded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.degraded}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'maintenance' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleFilterClick('maintenance')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Filtering by: <span className="font-semibold capitalize">{statusFilter}</span>
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* View Toggle and Action Buttons */}
      <TooltipProvider>
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grouped')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grouped by host</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('all')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>All servers list</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setAddServerDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Server
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new server to monitor</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => setAddHostDialogOpen(true)} className="gap-2">
                <Database className="h-4 w-4" />
                Add Host
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new host to group servers</p>
            </TooltipContent>
          </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      <Separator className="my-6" />
      
      {/* Multi-select hint */}
      {viewMode === 'grouped' && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tip: Hold Ctrl (⌘ on Mac) + click to select multiple servers for batch operations</span>
        </div>
      )}

      {/* Grouped View - Servers by Host */}
      {viewMode === 'grouped' && hosts && hosts.length > 0 ? (
        <TooltipProvider>
          <div className="space-y-6">
          {hosts.map((host) => {
            const filteredHost = {
              ...host,
              servers: statusFilter === 'all' 
                ? host.servers 
                : host.servers.filter(s => s.current_status === statusFilter)
            };

            const isDragOver = dragOverHostId === host.id;
            const isCollapsed = collapsedHosts.has(host.id);

            return (
              <Card 
                key={host.id}
                className={`transition-all ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
                onDragOver={(e) => handleDragOver(e, host.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, host.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleHostCollapse(host.id)}
                        className="h-8 w-8 shrink-0"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <CardTitle>{host.name}</CardTitle>
                        {host.regions?.name && (
                          <CardDescription>{host.regions.name}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditHost(host)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit host</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent>
                    <HostServerTable 
                      host={filteredHost} 
                      allHosts={hosts} 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      selectedServerIds={selectedServerIds}
                      onServerSelect={handleServerSelect}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
          </div>
        </TooltipProvider>
      ) : viewMode === 'grouped' ? (
        <Card>
          <CardHeader>
            <CardTitle>No Servers Found</CardTitle>
            <CardDescription>
              Add servers by configuring webhooks from monitoring services like UptimeRobot, or create them manually via the API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Quick Start:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Configure a webhook in UptimeRobot or another monitoring service</li>
                  <li>Point it to: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000/api/webhooks/uptimerobot</code></li>
                  <li>Add header: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">X-Webhook-Secret: your_secret</code></li>
                  <li>Servers will appear here automatically when webhooks are received</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Or view sample data:</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The database was seeded with sample servers. Check Supabase Studio at{' '}
                  <a href="http://localhost:54323" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                    http://localhost:54323
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* All Servers View */}
      {viewMode === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>All Servers</CardTitle>
            <CardDescription>
              Complete list of all monitored servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllServersTable 
              servers={hosts.flatMap(h => h.servers.map(s => ({
                ...s,
                host_name: h.name,
                host_region: h.regions?.name || null
              })))}
              statusFilter={statusFilter}
              hosts={hosts}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddServerDialog 
        open={addServerDialogOpen} 
        onOpenChange={setAddServerDialogOpen}
        hosts={hosts}
      />
      <AddHostDialog 
        open={addHostDialogOpen} 
        onOpenChange={setAddHostDialogOpen}
      />
      <EditHostDialog
        host={selectedHost}
        open={editHostDialogOpen}
        onOpenChange={setEditHostDialogOpen}
      />
    </>
  );
}
