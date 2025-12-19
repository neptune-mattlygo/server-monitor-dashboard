import { Resend } from 'resend';

// Lazy-load Resend client
let resend: Resend | null = null;

const getResendClient = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

const FROM_EMAIL = process.env.STATUS_PAGE_FROM_EMAIL || 'status@example.com';
const FROM_NAME = process.env.STATUS_PAGE_FROM_NAME || 'Server Monitor';
const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface OverdueServer {
  id: string;
  name: string;
  ip_address: string | null;
  host?: {
    name: string;
  } | null;
  last_backup_at: string | null;
  last_backup_database: string | null;
  hours_since_backup: number | null;
  file_size: number | null;
  file_size_mb: number | null;
  is_small_file: boolean;
}

export interface ServerDueForReview {
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
 * Send backup alert email to distribution list
 * Aggregates all overdue servers into a single email per recipient
 */
export async function sendBackupAlertEmail(
  recipients: string[],
  overdueServers: OverdueServer[],
  thresholdHours: number,
  serversDueForReview: ServerDueForReview[] = []
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recipients || recipients.length === 0) {
      throw new Error('No email recipients provided');
    }

    if ((!overdueServers || overdueServers.length === 0) && (!serversDueForReview || serversDueForReview.length === 0)) {
      throw new Error('No overdue servers provided');
    }

    const severityClass = overdueServers.length >= 5 ? 'critical' : 'warning';
    const severityEmoji = overdueServers.length >= 5 ? '🔴' : '⚠️';

    // Group servers by host name and sort by server name
    const serversByHost = overdueServers.reduce((acc, server) => {
      const hostName = server.host?.name || 'Unknown Host';
      if (!acc[hostName]) {
        acc[hostName] = [];
      }
      acc[hostName].push(server);
      return acc;
    }, {} as Record<string, OverdueServer[]>);

    // Sort hosts alphabetically, and servers within each host by name
    const sortedHosts = Object.keys(serversByHost).sort();
    sortedHosts.forEach(host => {
      serversByHost[host].sort((a, b) => a.name.localeCompare(b.name));
    });

    const client = getResendClient();
    Build subject line
    const subjectParts = [];
    if (overdueServers.length > 0) {
      subjectParts.push(`${overdueServers.length} Server(s) Overdue`);
    }
    if (serversDueForReview.length > 0) {
      subjectParts.push(`${serversDueForReview.length} Review(s) Due`);
    }
    const subject = `${severityEmoji} Backup Alert: ${subjectParts.join(', ')}`;
    
    // Send email to all recipients
    await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipients,
      subject,
      html: generateBackupAlertHTML(serversByHost, sortedHosts, thresholdHours, severityClass, overdueServers.length, serversDueForReview
      html: generateBackupAlertHTML(serversByHost, sortedHosts, thresholdHours, severityClass, overdueServers.length),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send backup alert email:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function generateBackupAlertHTML(
  serversByHost: Record<string, OverdueServer[]>,
  sortedHosts: string[],
  thresholdHours: number,
  severity: string,
  totalServerCount: number,
  serversDueForReview: ServerDueForReview[] = []
): string {
  const serversHTML = sortedHosts.map(hostName => {
    const hostServers = serversByHost[hostName];
    const hostHeaderRow = `
      <tr class="host-header-row">
        <td colspan="4" class="host-header">
          <strong>${hostName}</strong> <span class="host-server-count">(${hostServers.length} server${hostServers.length !== 1 ? 's' : ''})</span>
        </td>
      </tr>
    `;

    const serverRows = hostServers.map(server => {
      const lastBackup = server.last_backup_at 
        ? new Date(server.last_backup_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Never';
      
      const hoursSince = server.hours_since_backup !== null
        ? `${server.hours_since_backup}h ago`
        : 'No backup recorded';

      const statusClass = server.hours_since_backup === null 
        ? 'status-critical'
        : server.hours_since_backup > thresholdHours * 2
        ? 'status-critical'
        : 'status-warning';
      
      const fileSizeDisplay = formatFileSize(server.file_size);
      const fileSizeClass = server.is_small_file ? 'status-warning' : '';
      const fileSizeWarning = server.is_small_file ? ' ⚠️' : '';

      return `
        <tr class="server-row">
          <td class="server-name">
            <strong>${server.name}</strong>
            ${server.ip_address ? `<div class="server-ip">${server.ip_address}</div>` : ''}
          </td>
          <td class="server-backup">
            ${server.last_backup_database || '-'}
          </td>
          <td class="server-time ${statusClass}">
            <strong>${hoursSince}</strong>
            <div class="last-backup-date">${lastBackup}</div>
          </td>
          <td class="server-size ${fileSizeClass}">
            <strong>${fileSizeDisplay}${fileSizeWarning}</strong>
          </td>
        </tr>
      `;
    }).join('');

    return hostHeaderRow + serverRows;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5; 
        }
        .container { 
          max-width: 700px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 8px; 
          overflow: hidden; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
        }
        .header { 
          background: ${severity === 'critical' ? 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)' : 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'}; 
          padding: 30px 20px; 
          text-align: center; 
          color: white; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content { 
          padding: 30px 20px; 
        }
        .summary { 
          background: ${severity === 'critical' ? '#fee' : '#fff3cd'}; 
          border-left: 4px solid ${severity === 'critical' ? '#e74c3c' : '#f39c12'}; 
          padding: 15px 20px; 
          margin-bottom: 25px; 
          border-radius: 4px;
        }
        .summary p { 
          margin: 0; 
          font-size: 15px;
          color: ${severity === 'critical' ? '#721c24' : '#856404'};
        }
        .servers-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        .servers-table th { 
          background: #f8f9fa; 
          padding: 12px; 
          text-align: left; 
          font-weight: 600; 
          font-size: 13px; 
          text-transform: uppercase; 
          color: #666;
          border-bottom: 2px solid #dee2e6;
        }
        .host-header-row {
          background: #f8f9fa;
        }
        .host-header {
          padding: 12px;
          font-size: 14px;
          color: #333;
          border-top: 2px solid #dee2e6;
          border-bottom: 1px solid #dee2e6;
        }
        .host-server-count {
          font-weight: normal;
          font-size: 13px;
          color: #666;
        }
        .server-row td { 
          padding: 15px 12px; 
          border-bottom: 1px solid #e9ecef; 
        }
        .server-name { 
          font-size: 15px;
        }
        .server-ip { 
          font-size: 11px; 
          color: #999; 
          font-family: 'Courier New', monospace;
          margin-top: 3px;
        }
        .server-backup {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #333;
        }
        .server-time { 
          text-align: right;
          font-size: 14px;
        }
        .status-warning { 
          color: #f39c12; 
        }
        .status-critical { 
          color: #e74c3c; 
        }
        .last-backup-date {
          font-size: 11px;
          color: #999;
          margin-top: 3px;
          font-weight: normal;
        }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #667eea; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
          font-weight: 600; 
        }
        .footer { 
          background: #f8f9fa; 
          padding: 20px; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Backup Monitoring Alert</h1>
          <p>Servers with overdue or missing backups detected</p>
        </div>
        <div class="content">
          <div class="summary">
            <p>
              <strong>${totalServerCount} server${totalServerCount !== 1 ? 's have' : ' has'} not been backed up within the last ${thresholdHours} hours.</strong>
              Immediate action may be required to ensure data protection.
            </p>
          </div>

          ${totalServerCount > 0 ? `
          <table class="servers-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Last Database</th>
                <th style="text-align: right;">Time Since Backup</th>
                <th style="text-align: right;">File Size</th>
              </tr>
            </thead>
            <tbody>
              ${serversHTML}
            </tbody>
          </table>
          ` : ''}

          ${serversDueForReview.length > 0 ? `
          <div style="margin-top: 40px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              📋 Servers Due for Review
            </h2>
            <div class="summary" style="background: #e3f2fd; border-left-color: #2196f3;">
              <p style="color: #0d47a1;">
                <strong>${serversDueForReview.length} server${serversDueForReview.length !== 1 ? 's are' : ' is'} due for backup monitoring review.</strong>
                Please review whether backup monitoring should be re-enabled.
              </p>
            </div>
            <table class="servers-table">
              <thead>
                <tr>
                  <th>Server</th>
                  <th>Reason</th>
                  <th style="text-align: center;">Review Date</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${serversDueForReview.map(server => {
                  const reviewDate = new Date(server.backup_monitoring_review_date);
                  const statusClass = server.days_until_review < 0 ? 'status-critical' : 
                                     server.days_until_review <= 3 ? 'status-warning' : '';
                  const statusText = server.days_until_review < 0 
                    ? `${Math.abs(server.days_until_review)} day${Math.abs(server.days_until_review) !== 1 ? 's' : ''} overdue`
                    : server.days_until_review === 0 
                    ? 'Due today' 
                    : `Due in ${server.days_until_review} day${server.days_until_review !== 1 ? 's' : ''}`;
                  
                  return `
                    <tr class="host-header-row">
                      <td colspan="4" class="host-header">
                        <strong>${server.host?.name || 'No Host'}</strong>
                      </td>
                    </tr>
                    <tr class="server-row">
                      <td class="server-name">
                        <strong>${server.name}</strong>
                      </td>
                      <td style="font-size: 13px; color: #666; max-width: 300px;">
                        ${server.backup_monitoring_disabled_reason}
                      </td>
                      <td style="text-align: center; font-size: 14px;">
                        ${reviewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td class="${statusClass}" style="text-align: center; font-size: 14px; font-weight: 600;">
                        ${statusText}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${DASHBOARD_URL}/dashboard" class="button">View Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Server Monitor - Backup Alert System</strong></p>
          <p>This is an automated alert from your backup monitoring system.</p>
          <p>Threshold: ${thresholdHours} hours | Check time: ${new Date().toLocaleString('en-US')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
