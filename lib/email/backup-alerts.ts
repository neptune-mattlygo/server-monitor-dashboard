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
  };
  last_backup_at: string | null;
  last_backup_database: string | null;
  hours_since_backup: number | null;
}

/**
 * Send backup alert email to distribution list
 * Aggregates all overdue servers into a single email per recipient
 */
export async function sendBackupAlertEmail(
  recipients: string[],
  overdueServers: OverdueServer[],
  thresholdHours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recipients || recipients.length === 0) {
      throw new Error('No email recipients provided');
    }

    if (!overdueServers || overdueServers.length === 0) {
      throw new Error('No overdue servers provided');
    }

    const severityClass = overdueServers.length >= 5 ? 'critical' : 'warning';
    const severityEmoji = overdueServers.length >= 5 ? '🔴' : '⚠️';

    // Sort servers by hours since backup (descending)
    const sortedServers = [...overdueServers].sort((a, b) => {
      if (a.hours_since_backup === null) return -1;
      if (b.hours_since_backup === null) return 1;
      return b.hours_since_backup - a.hours_since_backup;
    });

    const client = getResendClient();
    
    // Send email to all recipients
    await client.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipients,
      subject: `${severityEmoji} Backup Alert: ${overdueServers.length} Server(s) Overdue`,
      html: generateBackupAlertHTML(sortedServers, thresholdHours, severityClass),
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

function generateBackupAlertHTML(
  servers: OverdueServer[],
  thresholdHours: number,
  severity: string
): string {
  const serversHTML = servers.map(server => {
    const hostName = server.host?.name || 'Unknown Host';
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

    return `
      <tr class="server-row">
        <td class="server-name">
          <strong>${server.name}</strong>
          <div class="server-host">${hostName}</div>
          ${server.ip_address ? `<div class="server-ip">${server.ip_address}</div>` : ''}
        </td>
        <td class="server-backup">
          ${server.last_backup_database || '-'}
        </td>
        <td class="server-time ${statusClass}">
          <strong>${hoursSince}</strong>
          <div class="last-backup-date">${lastBackup}</div>
        </td>
      </tr>
    `;
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
        .server-row td { 
          padding: 15px 12px; 
          border-bottom: 1px solid #e9ecef; 
        }
        .server-name { 
          font-size: 15px;
        }
        .server-host { 
          font-size: 12px; 
          color: #666; 
          margin-top: 3px;
        }
        .server-ip { 
          font-size: 11px; 
          color: #999; 
          font-family: 'Courier New', monospace;
          margin-top: 2px;
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
              <strong>${servers.length} server${servers.length !== 1 ? 's have' : ' has'} not been backed up within the last ${thresholdHours} hours.</strong>
              Immediate action may be required to ensure data protection.
            </p>
          </div>

          <table class="servers-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Last Database</th>
                <th style="text-align: right;">Time Since Backup</th>
              </tr>
            </thead>
            <tbody>
              ${serversHTML}
            </tbody>
          </table>

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
