'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HostServerTable } from './host-server-table';
import { AllServersTable } from './all-servers-table';
import { AddServerDialog } from './add-server-dialog';
import { AddHostDialog } from './add-host-dialog';
import { EditHostDialog } from './edit-host-dialog';
import { Server, Plus, Database, Pencil, LayoutGrid, List, ChevronDown, ChevronRight, Search, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [versionFilter, setVersionFilter] = useState<string>('all');
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [router]);

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

  // Get unique FMS versions from all servers
  const availableVersions = Array.from(
    new Set(
      hosts
        .flatMap(h => h.servers)
        .map(s => (s as any).fm_server_version)
        .filter(Boolean)
    )
  ).sort();

  // Filter servers based on status, search, and version
  const applyFilters = (servers: any[]) => {
    return servers.filter(s => {
      const matchesStatus = statusFilter === 'all' || s.current_status === statusFilter;
      const matchesSearch = !searchTerm || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.server_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.host_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVersion = versionFilter === 'all' || (s as any).fm_server_version === versionFilter;
      return matchesStatus && matchesSearch && matchesVersion;
    });
  };

  // Export filtered servers to PDF
  const handleExportPDF = () => {
    const allServers = hosts.flatMap(h => h.servers.map(s => ({
      ...s,
      host_name: h.name
    })));
    const filteredServers = applyFilters(allServers);

    if (filteredServers.length === 0) {
      toast.error('No servers to export');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Server Monitor - FileMaker Servers Report', 14, 20);
    
    // Filters info
    doc.setFontSize(10);
    let yPos = 30;
    doc.text(`Status Filter: ${statusFilter === 'all' ? 'All' : statusFilter}`, 14, yPos);
    yPos += 6;
    doc.text(`Version Filter: ${versionFilter === 'all' ? 'All' : versionFilter}`, 14, yPos);
    yPos += 6;
    if (searchTerm) {
      doc.text(`Search: ${searchTerm}`, 14, yPos);
      yPos += 6;
    }
    doc.text(`Total Servers: ${filteredServers.length}`, 14, yPos);
    yPos += 10;

    // Table header
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Server Name', 14, yPos);
    doc.text('Host', 80, yPos);
    doc.text('FMS Version', 140, yPos);
    yPos += 7;
    
    // Table content
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    filteredServers.forEach((server: any) => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        // Re-add header on new page
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Server Name', 14, yPos);
        doc.text('Host', 80, yPos);
        doc.text('FMS Version', 140, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
      }
      
      doc.text(server.name, 14, yPos);
      doc.text(server.host_name || '-', 80, yPos);
      doc.text(server.fm_server_version || '-', 140, yPos);
      yPos += 6;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated: ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Save the PDF
    const filename = `fms-servers-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success(`Exported ${filteredServers.length} server(s) to PDF`);
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
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg ${statusFilter === 'all' ? 'ring-2 ring-gray-400 shadow-2xl scale-105' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Servers</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg">
              <Database className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.total}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All monitored servers</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg ${statusFilter === 'up' ? 'ring-2 ring-emerald-500 shadow-2xl scale-105' : ''}`}
          onClick={() => handleFilterClick('up')}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Online</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{summary.up}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Healthy & responsive</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 shadow-lg ${statusFilter === 'down' ? 'ring-2 ring-red-500 shadow-2xl scale-105' : ''}`}
          onClick={() => handleFilterClick('down')}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Offline</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{summary.down}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Needs attention</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 shadow-lg ${statusFilter === 'degraded' ? 'ring-2 ring-amber-500 shadow-2xl scale-105' : ''}`}
          onClick={() => handleFilterClick('degraded')}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Degraded</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{summary.degraded}</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Partial issues</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg ${statusFilter === 'maintenance' ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : ''}`}
          onClick={() => handleFilterClick('maintenance')}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Maintenance</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.maintenance}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Scheduled work</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter indicator */}
      {(statusFilter !== 'all' || versionFilter !== 'all') && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-700/50 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Active filters: 
              {statusFilter !== 'all' && (
                <span className="font-semibold capitalize px-2 py-1 ml-2 bg-blue-100 dark:bg-blue-800 rounded-md">{statusFilter}</span>
              )}
              {versionFilter !== 'all' && (
                <span className="font-semibold px-2 py-1 ml-2 bg-blue-100 dark:bg-blue-800 rounded-md">FMS {versionFilter}</span>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setStatusFilter('all');
              setVersionFilter('all');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* View Toggle and Action Buttons */}
      <TooltipProvider>
        <div className="flex items-center justify-between mb-8 gap-4 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-lg">
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grouped' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grouped')}
                  className={`transition-all duration-200 ${viewMode === 'grouped' ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
                  className={`transition-all duration-200 ${viewMode === 'all' ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>All servers list</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search servers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-0 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Select value={versionFilter} onValueChange={setVersionFilter}>
              <SelectTrigger className="w-[200px] border-0 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm">
                <SelectValue placeholder="Filter by FMS Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Versions</SelectItem>
                {availableVersions.map(version => (
                  <SelectItem key={version} value={version}>
                    FMS {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  className="gap-2 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <FileDown className="h-4 w-4" />
                  Export PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export filtered servers to PDF</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setAddServerDialogOpen(true)} 
                className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
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
              <Button 
                variant="outline" 
                onClick={() => setAddHostDialogOpen(true)} 
                className="gap-2 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200"
              >
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
              servers: applyFilters(host.servers.map(s => ({ ...s, host_name: host.name })))
            };

            // Skip rendering hosts with no matching servers
            if (filteredHost.servers.length === 0) {
              return null;
            }

            const isDragOver = dragOverHostId === host.id;
            const isCollapsed = collapsedHosts.has(host.id);

            return (
              <Card 
                key={host.id}
                className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm ${isDragOver ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 shadow-2xl' : ''}`}
                onDragOver={(e) => handleDragOver(e, host.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, host.id)}
              >
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleHostCollapse(host.id)}
                        className="h-8 w-8 shrink-0 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                          <Server className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-3 text-lg">
                            {host.name}
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-gray-700/80 rounded-full shadow-sm border border-gray-200/50 dark:border-gray-600/50">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {filteredHost.servers.length} {filteredHost.servers.length === 1 ? 'server' : 'servers'}
                              </span>
                            </div>
                          </CardTitle>
                          {host.regions?.name && (
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              {host.regions.name}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditHost(host)}
                          className="h-8 w-8 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200"
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
        <Card className="border-0 shadow-lg hover:shadow-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200/50 dark:border-gray-600/50">
            <CardTitle>All Servers</CardTitle>
            <CardDescription>
              Complete list of all monitored servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllServersTable 
              servers={applyFilters(hosts.flatMap(h => h.servers.map(s => ({
                ...s,
                host_name: h.name,
                host_region: h.regions?.name || null
              }))))}
              statusFilter={statusFilter}
              versionFilter={versionFilter}
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
