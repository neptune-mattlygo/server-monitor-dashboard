// Email notification utility for metadata refresh alerts using Resend
import { Resend } from 'resend';

interface FailedServer {
  name: string;
  error: string;
  lastSuccess?: string;
}

export class EmailNotificationService {
  private resend: Resend | null = null;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not found. Email notifications disabled.');
      return;
    }

    this.resend = new Resend(apiKey);
  }

  private getFromEmail() {
    return process.env.STATUS_PAGE_FROM_EMAIL || 'admin@yourdomain.com';
  }

  private getFromName() {
    return process.env.STATUS_PAGE_FROM_NAME || 'Server Monitor';
  }

  async sendMetadataRefreshAlert(
    recipientEmails: string[],
    failedServers: FailedServer[]
  ): Promise<boolean> {
    if (!this.resend || recipientEmails.length === 0 || failedServers.length === 0) {
      return false;
    }

    const subject = `FileMaker Server Metadata Refresh Alert - ${failedServers.length} Server(s) Unreachable`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px 20px; }
          .alert-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 15px 0; background: #fee; color: #c00; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f8f9fa; padding: 12px; text-align: left; border: 1px solid #dee2e6; font-weight: 600; }
          td { padding: 12px; border: 1px solid #dee2e6; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .action-list { background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .action-list ul { margin: 0; padding-left: 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔴 FileMaker Metadata Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Server Status Monitor</p>
          </div>
          <div class="content">
            <div class="alert-badge">⚠️ ${failedServers.length} Server${failedServers.length !== 1 ? 's' : ''} Unreachable</div>
            <p>The following servers were unreachable during the scheduled metadata refresh:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Server Name</th>
                  <th>Error</th>
                  <th>Last Successful Refresh</th>
                </tr>
              </thead>
              <tbody>
                ${failedServers.map(server => `
                  <tr>
                    <td><strong>${server.name}</strong></td>
                    <td>${server.error}</td>
                    <td>${server.lastSuccess ? new Date(server.lastSuccess).toLocaleString() : 'Never'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="action-list">
              <h3 style="margin-top: 0; color: #0066cc;">📋 Action Required:</h3>
              <ul>
                <li>Check server connectivity and network access</li>
                <li>Verify FileMaker Admin Console credentials</li>
                <li>Confirm FileMaker Admin API is enabled</li>
                <li>Review IP restrictions if applicable</li>
                <li>Manually update metadata if needed</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              <strong>Next automatic refresh:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
          <div class="footer">
            <p>This is an automated alert from your Server Status Dashboard.</p>
            <p><em>Generated: ${new Date().toLocaleString()}</em></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
🔴 FileMaker Server Metadata Refresh Alert

⚠️  ${failedServers.length} Server${failedServers.length !== 1 ? 's' : ''} Unreachable

The following servers were unreachable during the scheduled metadata refresh:

${failedServers.map(server => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: ${server.name}
❌ Error: ${server.error}
🕒 Last Success: ${server.lastSuccess ? new Date(server.lastSuccess).toLocaleString() : 'Never'}
`).join('')}

📋 ACTION REQUIRED:
• Check server connectivity and network access
• Verify FileMaker Admin Console credentials  
• Confirm FileMaker Admin API is enabled
• Review IP restrictions if applicable
• Manually update metadata if needed

Next automatic refresh: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

This is an automated alert from your Server Status Dashboard.
Generated: ${new Date().toLocaleString()}
    `;

    try {
      // Send to all recipients
      for (const email of recipientEmails) {
        await this.resend.emails.send({
          from: `${this.getFromName()} <${this.getFromEmail()}>`,
          to: email,
          subject,
          text: textBody,
          html: htmlBody,
        });
      }

      console.log(`Metadata refresh alert sent to: ${recipientEmails.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to send metadata refresh alert:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.resend) {
      return false;
    }

    try {
      // Test by sending a test email to verify API key is valid
      // Since Resend doesn't have a direct verify method, we'll check if API key exists
      return !!process.env.RESEND_API_KEY;
    } catch (error) {
      console.error('Resend connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailNotificationService();