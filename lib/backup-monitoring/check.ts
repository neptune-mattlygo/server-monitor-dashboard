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
  backup_file_size: number | null;
  backup_file_size_alert_suppressed: boolean | null;
}

interface OverdueServer extends Server {
  last_backup_at: string | null;
  last_backup_database: string | null;
  hours_since_backup: number | null;
  file_size: number | null;
  file_size_mb: number | null;
  is_small_file: boolean;
}

interface ServerDueForReview {
  id: string;
  name: string;
  host?: {
    name: string;
  } | null;
  backup_monitoring_disabled_reason: string;
  backup_monitoring_review_date: string;
  days_until_review: number;
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

  // Get all servers that are not excluded from backup monitoring
  const { data: servers, error: serversError} = await supabaseAdmin
    .from('servers')
    .select(`
      id,
      name,
      ip_address,
      host_id,
      host:hosts(name)
    `)
    .eq('backup_monitoring_excluded', false)
    .order('name');

  if (serversError) {
    console.error('Failed to fetch servers:', serversError);
    throw new Error('Failed to fetch servers');
  }

  // Get servers that are excluded but due for review (within 7 days or overdue)
  const reviewDateThreshold = new Date();
  reviewDateThreshold.setDate(reviewDateThreshold.getDate() + 7); // Check 7 days ahead
  
  const { data: serversDueForReview, error: reviewError } = await supabaseAdmin
    .from('servers')
    .select(`
      id,
      name,
      backup_monitoring_disabled_reason,
      backup_monitoring_review_date,
      host:hosts(name)
    `)
    .eq('backup_monitoring_excluded', true)
    .not('backup_monitoring_review_date', 'is', null)
    .lte('backup_monitoring_review_date', reviewDateThreshold.toISOString().split('T')[0])
    .order('backup_monitoring_review_date');

  if (reviewError) {
    console.error('Failed to fetch servers due for review:', reviewError);
  }

  const serversForReview: ServerDueForReview[] = (serversDueForReview || []).map(server => {
    const reviewDate = new Date(server.backup_monitoring_review_date);
    const today = new Date();
    const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: server.id,
      name: server.name,
      host: server.host,
      backup_monitoring_disabled_reason: server.backup_monitoring_disabled_reason,
      backup_monitoring_review_date: server.backup_monitoring_review_date,
      days_until_review: daysUntilReview,
    };
  });

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

  // Get latest backup event for each server (only .fmp12 files, include both direct backup events and S3 backup_added events)
  const { data: backupEvents, error: backupEventsError } = await supabaseAdmin
    .from('server_events')
    .select('server_id, created_at, backup_database, backup_event_type, backup_file_size, backup_file_size_alert_suppressed')
    .or('event_type.eq.backup,event_type.eq.backup_added')
    .ilike('backup_database', '%.fmp12')
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

  // Also track small files that need alerts
  const smallFileServers: OverdueServer[] = [];
  const SMALL_FILE_THRESHOLD = 1 * 1024 * 1024; // 1MB in bytes

  // Track servers with no backup history
  const serversWithNoBackups: OverdueServer[] = [];

  for (const server of servers) {
    const latestBackup = latestBackupMap.get(server.id);
    
    if (!latestBackup) {
      // Server has NEVER had a backup recorded
      const neverBackedUpServer: OverdueServer = {
        id: server.id,
        name: server.name,
        ip_address: server.ip_address,
        host_id: server.host_id,
        host: Array.isArray(server.host) ? server.host[0] : server.host,
        last_backup_at: null,
        last_backup_database: null,
        hours_since_backup: null,
        file_size: null,
        file_size_mb: null,
        is_small_file: false,
      };
      
      serversWithNoBackups.push(neverBackedUpServer);
      
      // Also add to overdue list if configured to alert on never-backed-up servers
      if (config.alert_on_never_backed_up) {
        overdueServers.push(neverBackedUpServer);
      }
    } else if (new Date(latestBackup.created_at) < thresholdDate) {
      // Server HAS backup history but it's overdue
      const hoursSince = Math.floor((Date.now() - new Date(latestBackup.created_at).getTime()) / (1000 * 60 * 60));
      const fileSize = latestBackup.backup_file_size || null;
      const fileSizeMB = fileSize ? fileSize / (1024 * 1024) : null;
      const isSmallFile = fileSize ? fileSize < SMALL_FILE_THRESHOLD : false;

      overdueServers.push({
        id: server.id,
        name: server.name,
        ip_address: server.ip_address,
        host_id: server.host_id,
        host: Array.isArray(server.host) ? server.host[0] : server.host,
        last_backup_at: latestBackup.created_at,
        last_backup_database: latestBackup.backup_database,
        hours_since_backup: hoursSince,
        file_size: fileSize,
        file_size_mb: fileSizeMB,
        is_small_file: isSmallFile,
      });
    } else if (latestBackup.backup_file_size && 
               latestBackup.backup_file_size < SMALL_FILE_THRESHOLD && 
               !latestBackup.backup_file_size_alert_suppressed) {
      // File is up to date but suspiciously small and alerts not suppressed
      const fileSizeMB = latestBackup.backup_file_size / (1024 * 1024);
      
      smallFileServers.push({
        id: server.id, OR servers due for review
  let notificationSent = false;
  let notificationError = null;

  if (serversNeedingAlert.length > 0 || serversForReview.length > 0) {
    try {
      await sendBackupAlertEmail(
        config.email_recipients,
        serversNeedingAlert,
        config.threshold_hours,
        serversForReview
      );
      notificationSent = true;
      console.log(`Backup alert email sent to ${config.email_recipients.length} recipients (${overdueServers.length} overdue, ${smallFileServers.length} small files, ${serversForReview.length} due for review
  }

  // Log servers with no backup history for debugging
  if (serversWithNoBackups.length > 0) {
    const alertingOn = config.alert_on_never_backed_up ? ' (ALERTING)' : ' (not alerting)';
    console.log(`⚠️  ${serversWithNoBackups.length} servers have no backup history yet${alertingOn}:`, 
      serversWithNoBackups.map(s => s.name).join(', '));
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

  // Combine overdue servers and small file servers for email alerts
  const serversNeedingAlert = [...overdueServers, ...smallFileServers];
  
  // Send email if there are servers needing alerts
  let notificationSent = false;
  let notificationError = null;

  if (serversNeedingAlert.length > 0) {
    try {
      await sendBackupAlertEmail(
        config.email_recipients,
        serversNeedingAlert,
        config.threshold_hours
      );
      notificationSent = true;
      console.log(`Backup alert email sent to ${config.email_recipients.length} recipients (${overdueServers.length} overdue, ${smallFileServers.length} small files)`);
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

  const message = [];
  if (overdueServers.length > 0) {
    message.push(`${overdueServers.length} overdue backup(s)`);
  }
  if (smallFileServers.length > 0) {
    message.push(`${smallFileServers.length} small file(s) detected`);
  }
  
  return {
    success: true,
    message: message.length > 0 ? `Found: ${message.join(', ')}` : 'All servers have recent backups',
    data: {
      servers_checked: servers.length,
      servers_overdue: overdueServers.length,
      servers_with_small_files: smallFileServers.length,
      threshold_hours: config.threshold_hours,
      notification_sent: notificationSent,
      notification_error: notificationError,
      overdue_servers: serversNeedingAlert.map(s => ({
        id: s.id,
        name: s.name,
        host: s.host?.name,
        last_backup_at: s.last_backup_at,
        last_backup_database: s.last_backup_database,
        hours_since_backup: s.hours_since_backup,
        file_size_mb: s.file_size_mb,
        is_small_file: s.is_small_file,
      })),
    },
  };
}
