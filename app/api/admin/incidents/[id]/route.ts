import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// GET /api/admin/incidents/[id] - Get single incident
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const { data: incident, error } = await supabaseAdmin
      .from('status_incidents')
      .select(`
        *,
        incident_updates (
          id,
          message,
          update_type,
          created_at,
          created_by,
          profiles!incident_updates_created_by_fkey (
            email,
            full_name
          )
        ),
        profiles!status_incidents_created_by_fkey (
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching incident:', error);
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error in GET /api/admin/incidents/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/incidents/[id] - Update incident
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const {
      title,
      description,
      incident_type,
      severity,
      affected_servers,
      affected_regions,
      affected_hosts,
      status,
      resolved_at,
      notify_subscribers,
    } = body;

    // Get current incident to check if status is changing
    const { data: currentIncident } = await supabaseAdmin
      .from('status_incidents')
      .select('status, notified_at, affected_servers')
      .eq('id', id)
      .single();

    if (!currentIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (incident_type !== undefined) updateData.incident_type = incident_type;
    if (severity !== undefined) updateData.severity = severity;
    
    // Handle affected servers - collect from manual selection, regions, and hosts
    if (affected_servers !== undefined || affected_regions !== undefined || affected_hosts !== undefined) {
      let allAffectedServers = affected_servers || [];

      // If regions are selected, fetch all servers in those regions
      if (affected_regions && affected_regions.length > 0) {
        const { data: regionServers, error: regionError } = await supabaseAdmin
          .from('servers')
          .select('id')
          .in('region_id', affected_regions);

        if (regionError) {
          console.error('Error fetching servers by region:', regionError);
        } else if (regionServers) {
          const regionServerIds = regionServers.map(s => s.id);
          allAffectedServers = [...new Set([...allAffectedServers, ...regionServerIds])];
        }
      }

      // If hosts are selected, fetch all servers in those hosts
      if (affected_hosts && affected_hosts.length > 0) {
        const { data: hostServers, error: hostError } = await supabaseAdmin
          .from('servers')
          .select('id')
          .in('host_id', affected_hosts);

        if (hostError) {
          console.error('Error fetching servers by host:', hostError);
        } else if (hostServers) {
          const hostServerIds = hostServers.map(s => s.id);
          // Combine with existing servers and remove duplicates
          allAffectedServers = [...new Set([...allAffectedServers, ...hostServerIds])];
        }
      }

      updateData.affected_servers = allAffectedServers;
    }
    
    if (affected_regions !== undefined) updateData.affected_regions = affected_regions;
    if (affected_hosts !== undefined) updateData.affected_hosts = affected_hosts;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved' && !resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (resolved_at !== undefined) updateData.resolved_at = resolved_at;

    const { data: incident, error } = await supabaseAdmin
      .from('status_incidents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating incident:', error);
      return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
    }

    // Log event for affected servers if status changed
    if (status && status !== currentIncident.status && updateData.affected_servers) {
      const updatedAt = new Date().toISOString();
      const serverEvents = updateData.affected_servers.map((serverId: string) => ({
        server_id: serverId,
        event_type: 'status_change',
        event_source: 'manual',
        status: `incident_${status}`,
        message: `Incident status changed to ${status}: ${incident.title}`,
        payload: {
          incident_id: incident.id,
          incident_url: `/dashboard/admin/incidents`,
          old_status: currentIncident.status,
          new_status: status,
          incident_type: incident.incident_type,
          severity: incident.severity,
          updated_by: user.id,
          updated_by_email: user.email,
          updated_at: updatedAt,
        },
      }));

      await supabaseAdmin.from('server_events').insert(serverEvents);
    }

    // Log event for newly added servers
    if (updateData.affected_servers) {
      const oldServers = currentIncident.affected_servers || [];
      const newServers = updateData.affected_servers.filter(
        (serverId: string) => !oldServers.includes(serverId)
      );

      if (newServers.length > 0) {
        const addedAt = new Date().toISOString();
        const serverEvents = newServers.map((serverId: string) => ({
          server_id: serverId,
          event_type: 'status_change',
          event_source: 'manual',
          status: `incident_${incident.status}`,
          message: `Added to incident: ${incident.title}`,
          payload: {
            incident_id: incident.id,
            incident_url: `/dashboard/admin/incidents`,
            incident_type: incident.incident_type,
            severity: incident.severity,
            description: incident.description,
            added_by: user.id,
            added_by_email: user.email,
            added_at: addedAt,
          },
        }));

        await supabaseAdmin.from('server_events').insert(serverEvents);
      }
    }

    // If status changed and notified before, and notify_subscribers is true, send update notifications
    if (notify_subscribers && currentIncident?.notified_at && status && status !== currentIncident.status) {
      try {
        const { sendIncidentNotifications } = await import('@/lib/email/notify-incident');
        // Reset notified_at so it can be sent again
        await supabaseAdmin
          .from('status_incidents')
          .update({ notified_at: null })
          .eq('id', id);
        
        await sendIncidentNotifications(id);
        console.log('Status update notifications sent for incident:', id);
      } catch (notifyError) {
        console.error('Failed to send status update notifications:', notifyError);
      }
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error in PATCH /api/admin/incidents/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/incidents/[id] - Delete incident
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Get incident details before deleting to log events
    const { data: incident } = await supabaseAdmin
      .from('status_incidents')
      .select('title, affected_servers')
      .eq('id', id)
      .single();

    const { error } = await supabaseAdmin
      .from('status_incidents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting incident:', error);
      return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
    }

    // Log event for affected servers about incident removal
    if (incident?.affected_servers && incident.affected_servers.length > 0) {
      const deletedAt = new Date().toISOString();
      const serverEvents = incident.affected_servers.map((serverId: string) => ({
        server_id: serverId,
        event_type: 'status_change',
        event_source: 'manual',
        status: 'incident_removed',
        message: `Incident removed: ${incident.title}`,
        payload: {
          incident_id: id,
          incident_url: `/dashboard/admin/incidents`,
          action: 'deleted',
          deleted_by: user.id,
          deleted_by_email: user.email,
          deleted_at: deletedAt,
        },
      }));

      await supabaseAdmin.from('server_events').insert(serverEvents);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/incidents/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
