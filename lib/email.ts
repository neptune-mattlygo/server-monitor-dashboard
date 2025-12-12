// Email notification utility for metadata refresh alerts
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

interface FailedServer {
  name: string;
  error: string;
  lastSuccess?: string;
}

export class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = this.getEmailConfig();
    if (!config) {
      console.warn('Email configuration not found. Email notifications disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  private getEmailConfig(): EmailConfig | null {
    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.warn(`Missing email configuration: ${varName}`);
        return null;
      }
    }

    return {
      host: process.env.EMAIL_HOST!,
      port: parseInt(process.env.EMAIL_PORT!),
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    };
  }

  async sendMetadataRefreshAlert(
    recipientEmails: string[],
    failedServers: FailedServer[]
  ): Promise<boolean> {
    if (!this.transporter || recipientEmails.length === 0 || failedServers.length === 0) {
      return false;
    }

    const subject = `FileMaker Server Metadata Refresh Alert - ${failedServers.length} Server(s) Unreachable`;
    
    const htmlBody = `
      <h2>FileMaker Server Metadata Refresh Alert</h2>
      <p>The following servers were unreachable during the scheduled metadata refresh:</p>
      
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
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
              <td>${server.name}</td>
              <td>${server.error}</td>
              <td>${server.lastSuccess || 'Never'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Check server connectivity and credentials</li>
        <li>Verify FileMaker Admin API is enabled</li>
        <li>Review IP restrictions if applicable</li>
        <li>Manually update metadata if needed</li>
      </ul>
      
      <p>This is an automated alert from your Server Status Dashboard.</p>
      <p><em>Time: ${new Date().toLocaleString()}</em></p>
    `;

    const textBody = `
FileMaker Server Metadata Refresh Alert

The following servers were unreachable during the scheduled metadata refresh:

${failedServers.map(server => `
- Server: ${server.name}
  Error: ${server.error}
  Last Success: ${server.lastSuccess || 'Never'}
`).join('')}

Action Required:
- Check server connectivity and credentials
- Verify FileMaker Admin API is enabled
- Review IP restrictions if applicable
- Manually update metadata if needed

This is an automated alert from your Server Status Dashboard.
Time: ${new Date().toLocaleString()}
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recipientEmails.join(', '),
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`Metadata refresh alert sent to: ${recipientEmails.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to send metadata refresh alert:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailNotificationService();