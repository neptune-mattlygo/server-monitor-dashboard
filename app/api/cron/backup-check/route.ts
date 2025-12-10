import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBackupAlertEmail } from '@/lib/email/backup-alerts';

export const dynamic = 'force-dynamic';

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
 * Cron job endpoint for checking backup freshness
 * Called via Vercel Cron or manual trigger
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    console.log('Cron endpoint - Auth header present:', !!authHeader);
    console.log('Cron endpoint - Auth header value (first 20 chars):', authHeader?.substring(0, 20));
    console.log('Cron endpoint - CRON_SECRET available:', !!process.env.CRON_SECRET);
    console.log('Cron endpoint - Expected auth (first 20 chars):', expectedAuth?.substring(0, 20));
    console.log('Cron endpoint - Auth match:', authHeader === expectedAuth);
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: process.env.NODE_ENV === 'development' ? {
          hasAuthHeader: !!authHeader,
          hasSecret: !!process.env.CRON_SECRET,
          authHeaderLength: authHeader?.length,
          expectedAuthLength: expectedAuth?.length
        } : undefined
      }, { status: 401 });
    }

    // Get backup monitoring configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('backup_monitoring_config')
      .select('*')
      .single();

    if (configError || !config) {
      console.error('Failed to fetch backup monitoring config:', configError);
      return NextResponse.json({ 
        error: 'Configuration not found',
        details: configError 
      }, { status: 500 });
    }

    // Check if monitoring is enabled
    if (!config.is_enabled) {
      console.log('Backup monitoring is disabled, skipping check');
      return NextResponse.json({ 
        success: true, 
        message: 'Backup monitoring is disabled',
        skipped: true 
      });
    }

    // Validate email recipients
    if (!config.email_recipients || config.email_recipients.length === 0) {
      console.warn('No email recipients configured for backup monitoring');
      return NextResponse.json({ 
        success: true, 
        message: 'No email recipients configured',
        warning: true 
      });
    }

    // Get all servers
    const { data: serversData, error: serversError } = await supabaseAdmin
      .from('servers')
      .select('id, name, ip_address, host_id, host:hosts(name)');

    if (serversError || !serversData) {
      console.error('Failed to fetch servers:', serversError);
      return NextResponse.json({ 
        error: 'Failed to fetch servers',
        details: serversError 
      }, { status: 500 });
    }

    // Map the data to our Server type
    const servers: Server[] = serversData.map(s => ({
      id: s.id,
      name: s.name,
      ip_address: s.ip_address,
      host_id: s.host_id,
      host: Array.isArray(s.host) && s.host.length > 0 ? s.host[0] : null,
    }));

    // Get the most recent backup event for each server
    const { data: backupEvents, error: backupError } = await supabaseAdmin
      .from('server_events')
      .select('server_id, created_at, backup_database, backup_event_type')
      .or('event_type.eq.backup,event_type.eq.backup_added')
      .order('created_at', { ascending: false });

    if (backupError) {
      console.error('Failed to fetch backup events:', backupError);
      return NextResponse.json({ 
        error: 'Failed to fetch backup events',
        details: backupError 
      }, { status: 500 });
    }

    // Build map of latest backup per server
    const latestBackupMap = new Map<string, BackupEvent>();
    backupEvents?.forEach((event: BackupEvent) => {
      if (!latestBackupMap.has(event.server_id)) {
        latestBackupMap.set(event.server_id, event);
      }
    });

    // Calculate threshold timestamp
    const thresholdMs = config.threshold_hours * 60 * 60 * 1000;
    const thresholdDate = new Date(Date.now() - thresholdMs);

    // Check each server for overdue backups
    const overdueServers: OverdueServer[] = [];
    const now = Date.now();

    for (const server of servers) {
      const latestBackup = latestBackupMap.get(server.id);
      
      if (!latestBackup) {
        // No backup recorded
        overdueServers.push({
          ...server,
          last_backup_at: null,
          last_backup_database: null,
          hours_since_backup: null,
        });
      } else {
        const backupDate = new Date(latestBackup.created_at);
        
        if (backupDate < thresholdDate) {
          // Backup is older than threshold
          const hoursSince = Math.floor((now - backupDate.getTime()) / (1000 * 60 * 60));
          overdueServers.push({
            ...server,
            last_backup_at: latestBackup.created_at,
            last_backup_database: latestBackup.backup_database,
            hours_since_backup: hoursSince,
          });
        }
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

    return NextResponse.json({
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
    });

  } catch (error: any) {
    console.error('Backup monitoring check failed:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
