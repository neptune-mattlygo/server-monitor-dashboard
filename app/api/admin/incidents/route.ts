import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

// GET /api/admin/incidents - List incidents with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('status_incidents')
      .select(`
        *,
        incident_updates (
          id,
          message,
          update_type,
          created_at,
          created_by
        ),
        profiles!status_incidents_created_by_fkey (
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: incidents, error, count } = await query;

    if (error) {
      console.error('Error fetching incidents:', error);
      return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
    }

    return NextResponse.json({ incidents, total: count, limit, offset });
  } catch (error) {
    console.error('Error in GET /api/admin/incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/incidents - Create new incident
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
      notify_subscribers,
    } = body;

    if (!title || !description || !incident_type || !severity) {
      return NextResponse.json(
        { error: 'Title, description, incident_type, and severity are required' },
        { status: 400 }
      );
    }

    // Collect all affected server IDs
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

    const { data: incident, error } = await supabaseAdmin
      .from('status_incidents')
      .insert({
        title,
        description,
        incident_type,
        severity,
        affected_servers: allAffectedServers,
        affected_regions: affected_regions || [],
        affected_hosts: affected_hosts || [],
        status: status || 'investigating',
        notify_subscribers: notify_subscribers ?? false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating incident:', error);
      return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
    }

    // Create initial incident update
    await supabaseAdmin.from('incident_updates').insert({
      incident_id: incident.id,
      message: description,
      update_type: 'investigating',
      created_by: user.id,
    });

    // Log event for each affected server
    if (allAffectedServers.length > 0) {
      const createdAt = new Date().toISOString();
      const serverEvents = allAffectedServers.map(serverId => ({
        server_id: serverId,
        event_type: 'status_change',
        event_source: 'manual',
        status: 'incident',
        message: `Incident created: ${title}`,
        payload: {
          incident_id: incident.id,
          incident_url: `/dashboard/admin/incidents`,
          incident_type,
          severity,
          description,
          created_by: user.id,
          created_by_email: user.email,
          created_at: createdAt,
        },
      }));

      await supabaseAdmin.from('server_events').insert(serverEvents);
    }

    // Trigger notifications if requested
    if (notify_subscribers) {
      try {
        // Import dynamically to avoid circular dependencies
        const { sendIncidentNotifications } = await import('@/lib/email/notify-incident');
        await sendIncidentNotifications(incident.id);
        console.log('Notifications triggered for incident:', incident.id);
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
