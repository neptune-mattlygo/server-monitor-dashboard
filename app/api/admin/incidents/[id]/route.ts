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
      status,
      resolved_at,
      notify_subscribers,
    } = body;

    // Get current incident to check if status is changing
    const { data: currentIncident } = await supabaseAdmin
      .from('status_incidents')
      .select('status, notified_at')
      .eq('id', id)
      .single();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (incident_type !== undefined) updateData.incident_type = incident_type;
    if (severity !== undefined) updateData.severity = severity;
    
    // Handle affected servers - collect from both manual selection and regions
    if (affected_servers !== undefined || affected_regions !== undefined) {
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
          // Combine with manually selected servers and remove duplicates
          allAffectedServers = [...new Set([...allAffectedServers, ...regionServerIds])];
        }
      }

      updateData.affected_servers = allAffectedServers;
    }
    
    if (affected_regions !== undefined) updateData.affected_regions = affected_regions;
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

    const { error } = await supabaseAdmin
      .from('status_incidents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting incident:', error);
      return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/incidents/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
