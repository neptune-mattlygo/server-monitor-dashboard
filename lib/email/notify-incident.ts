import { supabaseAdmin } from '@/lib/supabase';
import { sendBatchEmails } from './service';

export async function sendIncidentNotifications(incidentId: string): Promise<number> {
  // Get incident details
  const { data: incident, error: incidentError } = await supabaseAdmin
    .from('status_incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  if (incidentError || !incident) {
    throw new Error('Incident not found');
  }

  // Check if already notified
  if (incident.notified_at) {
    throw new Error('Notifications already sent for this incident');
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

  console.log('Total verified clients:', clients?.length || 0);

  if (clientsError || !clients) {
    console.error('Error fetching clients:', clientsError);
    throw new Error('Failed to fetch subscribers');
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

      // Specific server subscription
      if (sub.subscription_type === 'server' && sub.server_id) {
        return incident.affected_servers.includes(sub.server_id);
      }

      // Region subscription
      if (sub.subscription_type === 'region' && sub.region_id) {
        return incident.affected_regions.includes(sub.region_id);
      }

      // Host subscription
      if (sub.subscription_type === 'host' && sub.host_id) {
        // Would need to check if affected servers belong to this host
        return false;
      }

      return false;
    });
  });

  if (eligibleClients.length === 0) {
    console.log('No eligible clients found for incident notifications');
    // Mark as notified even if no one to notify
    await supabaseAdmin
      .from('status_incidents')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', incidentId);

    return 0;
  }

  console.log('Eligible clients for notifications:', eligibleClients.length);
  console.log('Eligible client emails:', eligibleClients.map(c => c.email).join(', '));

  // Get status page config for company name
  const { data: config } = await supabaseAdmin
    .from('status_page_config')
    .select('company_name, custom_domain')
    .single();

  const companyName = config?.company_name || 'Server Monitor';
  const statusPageUrl = config?.custom_domain
    ? `https://${config.custom_domain}/status`
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/status`;

  // Prepare emails
  const emails = eligibleClients.map((client) => ({
    to: client.email,
    data: {
      incidentTitle: incident.title,
      incidentDescription: incident.description,
      incidentType: incident.incident_type,
      severity: incident.severity,
      status: incident.status,
      startedAt: incident.started_at || incident.created_at,
      statusPageUrl,
      companyName,
      unsubscribeUrl: `${statusPageUrl}/unsubscribe?token=${client.unsubscribe_token}`,
    },
  }));

  // Send emails in batches and log results
  console.log('Sending', emails.length, 'notification emails...');
  console.log('FROM_EMAIL:', process.env.STATUS_PAGE_FROM_EMAIL);
  console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
  
  const result = await sendBatchEmails(emails);
  
  console.log('Email send results:', result);

  // Log all notification attempts
  const notificationLogs = eligibleClients.map((client, index) => {
    // Check if this email failed by looking for the email in the errors array
    const failedEmail = result.errors.find(err => err.includes(client.email));
    
    return {
      incident_id: incidentId,
      recipient_email: client.email,
      recipient_name: client.name,
      status: failedEmail ? 'failed' : 'sent',
      error_message: failedEmail || null,
      sent_at: new Date().toISOString(),
    };
  });

  console.log('Logging notification history:', notificationLogs.length, 'entries');

  if (notificationLogs.length > 0) {
    const { error: logError } = await supabaseAdmin
      .from('notification_history')
      .insert(notificationLogs);
    
    if (logError) {
      console.error('Failed to log notification history:', logError);
    }
  }

  // Mark incident as notified
  await supabaseAdmin
    .from('status_incidents')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', incidentId);

  return result.success;
}
