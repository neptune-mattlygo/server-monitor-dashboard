import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status
 * Public endpoint - returns overall system status and active incidents
 */
export async function GET() {
  try {
    // Get status page configuration
    const { data: config } = await supabaseAdmin
      .from('status_page_config')
      .select('*')
      .single();

    // Get all servers with their status
    const { data: servers } = await supabaseAdmin
      .from('servers')
      .select(`
        id,
        name,
        current_status,
        region_id,
        host_id,
        hosts (
          id,
          name,
          location
        )
      `)
      .order('name');

    // Calculate overall system status
    const statusCounts = {
      up: servers?.filter(s => s.current_status === 'up').length || 0,
      down: servers?.filter(s => s.current_status === 'down').length || 0,
      degraded: servers?.filter(s => s.current_status === 'degraded').length || 0,
      maintenance: servers?.filter(s => s.current_status === 'maintenance').length || 0,
      unknown: servers?.filter(s => s.current_status === 'unknown').length || 0,
      total: servers?.length || 0,
    };

    // Determine overall status
    let overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance' = 'operational';
    if (statusCounts.down > 0) {
      overallStatus = 'outage';
    } else if (statusCounts.degraded > 0) {
      overallStatus = 'degraded';
    } else if (statusCounts.maintenance > 0 && statusCounts.up === 0) {
      overallStatus = 'maintenance';
    }

    // Get active incidents (not resolved)
    const { data: activeIncidents } = await supabaseAdmin
      .from('status_incidents')
      .select(`
        *,
        incident_updates (
          id,
          message,
          update_type,
          created_at
        )
      `)
      .neq('status', 'resolved')
      .order('started_at', { ascending: false });

    // Get resolved incidents (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: resolvedIncidents } = await supabaseAdmin
      .from('status_incidents')
      .select(`
        *,
        incident_updates (
          id,
          message,
          update_type,
          created_at
        )
      `)
      .eq('status', 'resolved')
      .gte('resolved_at', sevenDaysAgo.toISOString())
      .order('resolved_at', { ascending: false });

    // Get regions
    const { data: regionsData } = await supabaseAdmin
      .from('regions')
      .select('id, name, slug, description')
      .eq('is_active', true)
      .order('display_order');

    // Sort incident updates by created_at desc for each incident
    // Filter out the initial update (first update that matches incident creation)
    const processIncidents = (incidents: any[]) => {
      return incidents?.map(incident => {
        const allUpdates = incident.incident_updates || [];
        // Sort by created_at ascending to identify the first one
        const sortedAsc = [...allUpdates].sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        // Remove the first update (initial incident creation update) if there are multiple updates
        const filteredUpdates = sortedAsc.length > 1 ? sortedAsc.slice(1) : [];
        // Sort remaining updates by created_at desc for display
        const sortedDesc = filteredUpdates.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Get region names for affected regions
        const affectedRegionIds = incident.affected_regions || [];
        const affectedRegionNames = affectedRegionIds
          .map((regionId: string) => {
            const region = regionsData?.find(r => r.id === regionId);
            return region?.name;
          })
          .filter(Boolean);
        
        return {
          ...incident,
          incident_updates: sortedDesc,
          affected_region_names: affectedRegionNames
        };
      });
    };

    const activeIncidentsWithUpdates = processIncidents(activeIncidents || []);
    const resolvedIncidentsWithUpdates = processIncidents(resolvedIncidents || []);

    // Calculate uptime percentage (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: statusEvents } = await supabaseAdmin
      .from('server_events')
      .select('created_at, new_status, old_status')
      .in('event_type', ['status_change', 'created'])
      .gte('created_at', ninetyDaysAgo.toISOString());

    // Simple uptime calculation: percentage of time not down
    // This is a simplified version - could be made more sophisticated
    let uptimePercentage = 100;
    if (statusEvents && statusEvents.length > 0) {
      const downEvents = statusEvents.filter(e => e.new_status === 'down').length;
      const totalEvents = statusEvents.length;
      if (totalEvents > 0) {
        uptimePercentage = Math.max(0, ((totalEvents - downEvents) / totalEvents) * 100);
      }
    }

    return NextResponse.json({
      status: overallStatus,
      config: {
        company_name: config?.company_name || 'Server Monitor',
        logo_url: config?.logo_url,
        primary_color: config?.primary_color || '#3b82f6',
        support_email: config?.support_email,
        support_url: config?.support_url,
        show_uptime_percentage: config?.show_uptime_percentage ?? true,
      },
      servers: statusCounts,
      uptime_percentage: config?.show_uptime_percentage ? uptimePercentage.toFixed(2) : null,
      active_incidents: activeIncidentsWithUpdates || [],
      resolved_incidents: resolvedIncidentsWithUpdates || [],
      regions: regionsData || [],
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
