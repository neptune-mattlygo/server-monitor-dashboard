import { createClient } from '@supabase/supabase-js';
import { sendBackupAlertEmail } from '@/lib/email/backup-alerts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface Server {
  id: string;
  name: string;
  ip_address: string | null;
  host_id: string | null;
  host?: {
    name: string;
  } | null;
}

interface BackupEvent {
  server_id: string;
  created_at: string;
  backup_database: string | null;
  backup_event_type: string | null;
}

interface OverdueServer extends Server {
  last_backup_at: string | null;
  last_backup_database: string | null;
  hours_since_backup: number | null;
}

/**
 * Shared backup monitoring check logic
 * Called by both the cron endpoint and the test endpoint
 */
export async function performBackupCheck() {
  // Get backup monitoring configuration
  const { data: config, error: configError } = await supabaseAdmin
    .from('backup_monitoring_config')
    .select('*')
    .single();

  if (configError || !config) {
    console.error('Failed to fetch backup monitoring config:', configError);
    throw new Error('Configuration not found');
  }

  // Check if monitoring is enabled
  if (!config.is_enabled) {
    console.log('Backup monitoring is disabled, skipping check');
    return {
      success: true,
      message: 'Backup monitoring is disabled',
      skipped: true,
      data: null
    };
  }

  // Validate email recipients
  if (!config.email_recipients || config.email_recipients.length === 0) {
    console.warn('No email recipients configured for backup monitoring');
    return {
      success: true,
      message: 'No email recipients configured',
      warning: true,
      data: null
    };
  }

  // Get all servers
  const { data: servers, error: serversError } = await supabaseAdmin
    .from('servers')
    .select(`
      id,
      name,
      ip_address,
      host_id,
      host:hosts(name)
    `)
    .order('name');

  if (serversError) {
    console.error('Failed to fetch servers:', serversError);
    throw new Error('Failed to fetch servers');
  }

  if (!servers || servers.length === 0) {
    console.log('No servers found to monitor');
    return {
      success: true,
      message: 'No servers found to monitor',
      data: {
        servers_checked: 0,
        servers_overdue: 0,
        threshold_hours: config.threshold_hours,
        notification_sent: false,
        notification_error: null,
        overdue_servers: [],
      }
    };
  }

  // Get latest backup event for each server
  const { data: backupEvents, error: backupEventsError } = await supabaseAdmin
    .from('server_events')
    .select('server_id, created_at, backup_database, backup_event_type')
    .eq('event_type', 'backup')
    .order('created_at', { ascending: false });

  if (backupEventsError) {
    console.error('Failed to fetch backup events:', backupEventsError);
    throw new Error('Failed to fetch backup events');
  }

  // Create a map of latest backup per server
  const latestBackupMap = new Map<string, BackupEvent>();
  if (backupEvents) {
    for (const event of backupEvents) {
      if (!latestBackupMap.has(event.server_id)) {
        latestBackupMap.set(event.server_id, event);
      }
    }
  }

  // Check which servers have overdue backups
  const thresholdMs = config.threshold_hours * 60 * 60 * 1000;
  const thresholdDate = new Date(Date.now() - thresholdMs);
  const overdueServers: OverdueServer[] = [];

  for (const server of servers) {
    const latestBackup = latestBackupMap.get(server.id);
    
    if (!latestBackup || new Date(latestBackup.created_at) < thresholdDate) {
      const hoursSince = latestBackup 
        ? Math.floor((Date.now() - new Date(latestBackup.created_at).getTime()) / (1000 * 60 * 60))
        : null;

      overdueServers.push({
        id: server.id,
        name: server.name,
        ip_address: server.ip_address,
        host_id: server.host_id,
        host: Array.isArray(server.host) ? server.host[0] : server.host,
        last_backup_at: latestBackup?.created_at || null,
        last_backup_database: latestBackup?.backup_database || null,
        hours_since_backup: hoursSince,
      });
    }
  }

  // Log the check result
  const resultData = {
    check_run_at: new Date().toISOString(),
    servers_checked: servers.length,
    servers_overdue: overdueServers.length,
    overdue_server_ids: overdueServers.map(s => s.id),
    threshold_hours: config.threshold_hours,
    notification_sent: false,
    notification_recipients: config.email_recipients,
    notification_error: null,
  };

  // Send email if there are overdue servers
  let notificationSent = false;
  let notificationError = null;

  if (overdueServers.length > 0) {
    try {
      await sendBackupAlertEmail(
        config.email_recipients,
        overdueServers,
        config.threshold_hours
      );
      notificationSent = true;
      console.log(`Backup alert email sent to ${config.email_recipients.length} recipients`);
    } catch (emailError: any) {
      notificationError = emailError.message || 'Failed to send email';
      console.error('Failed to send backup alert email:', emailError);
    }
  }

  // Update result with notification status
  resultData.notification_sent = notificationSent;
  resultData.notification_error = notificationError;

  // Save result to database
  const { error: resultError } = await supabaseAdmin
    .from('backup_monitoring_results')
    .insert(resultData);

  if (resultError) {
    console.error('Failed to save monitoring result:', resultError);
  }

  // Update last check timestamp in config
  await supabaseAdmin
    .from('backup_monitoring_config')
    .update({ last_check_at: new Date().toISOString() })
    .eq('id', config.id);

  return {
    success: true,
    message: overdueServers.length > 0 
      ? `Found ${overdueServers.length} server(s) with overdue backups`
      : 'All servers have recent backups',
    data: {
      servers_checked: servers.length,
      servers_overdue: overdueServers.length,
      threshold_hours: config.threshold_hours,
      notification_sent: notificationSent,
      notification_error: notificationError,
      overdue_servers: overdueServers.map(s => ({
        id: s.id,
        name: s.name,
        host: s.host?.name,
        last_backup_at: s.last_backup_at,
        hours_since_backup: s.hours_since_backup,
      })),
    },
  };
}
