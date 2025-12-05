import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/permissions';
import { sendBatchEmails } from '@/lib/email/service';

export const dynamic = 'force-dynamic';

// POST /api/admin/incidents/[id]/notify - Send email notifications for incident
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Get incident details
    const { data: incident, error: incidentError } = await supabaseAdmin
      .from('status_incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check if already notified
    if (incident.notified_at) {
      return NextResponse.json(
        { error: 'Notifications already sent for this incident' },
        { status: 400 }
      );
    }

    // Get verified subscribers
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        email,
        name,
        unsubscribe_token,
        client_subscriptions (
          subscription_type,
          server_id,
          region_id,
          host_id,
          notify_on_status
        )
      `)
      .eq('is_verified', true)
      .is('unsubscribed_at', null);

    if (clientsError || !clients) {
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // Filter clients based on affected servers/regions
    const eligibleClients = clients.filter((client) => {
      if (!client.client_subscriptions || client.client_subscriptions.length === 0) {
        return false;
      }

      return client.client_subscriptions.some((sub: any) => {
        // Check if they want notifications for this status
        const statusMap: Record<string, string> = {
          outage: 'down',
          degraded: 'degraded',
          maintenance: 'maintenance',
        };
        const notifyStatus = statusMap[incident.incident_type] || 'down';
        if (!sub.notify_on_status.includes(notifyStatus)) {
          return false;
        }

        // All servers subscription
        if (sub.subscription_type === 'all_servers') {
          return true;
        }

        // Specific servers subscription
        if (sub.subscription_type === 'specific_servers' && sub.server_id) {
          return incident.affected_servers.includes(sub.server_id);
        }

        // Region subscription
        if (sub.subscription_type === 'region' && sub.region_id) {
          return incident.affected_regions.includes(sub.region_id);
        }

        return false;
      });
    });

    if (eligibleClients.length === 0) {
      return NextResponse.json(
        { message: 'No eligible subscribers found', sent: 0 },
        { status: 200 }
      );
    }

    // Get status page config
    const { data: config } = await supabaseAdmin
      .from('status_page_config')
      .select('*')
      .single();

    const statusPageUrl = config?.custom_domain
      ? `https://${config.custom_domain}`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/status`;

    // Prepare email data
    const emails = eligibleClients.map((client) => ({
      to: client.email,
      data: {
        incidentTitle: incident.title,
        incidentDescription: incident.description,
        incidentType: incident.incident_type,
        severity: incident.severity,
        status: incident.status,
        startedAt: incident.started_at,
        statusPageUrl,
        companyName: config?.company_name || 'Server Monitor',
        unsubscribeUrl: `${statusPageUrl}/api/status/unsubscribe?token=${client.unsubscribe_token}`,
      },
    }));

    // Send emails in batches
    const result = await sendBatchEmails(emails);

    // Log notifications
    const notifications = eligibleClients.map((client) => ({
      client_id: client.id,
      incident_id: incident.id,
      email_type: 'incident_alert',
      sent_at: new Date().toISOString(),
      delivery_status: 'sent', // Assuming success for now
    }));

    await supabaseAdmin.from('email_notifications').insert(notifications);

    // Update incident
    await supabaseAdmin
      .from('status_incidents')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', incident.id);

    return NextResponse.json({
      message: 'Notifications sent successfully',
      sent: result.success,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/incidents/[id]/notify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
