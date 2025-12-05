import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.STATUS_PAGE_FROM_EMAIL || 'status@example.com';
const FROM_NAME = process.env.STATUS_PAGE_FROM_NAME || 'Server Monitor Status';

export interface IncidentEmailData {
  incidentTitle: string;
  incidentDescription: string;
  incidentType: string;
  severity: string;
  status: string;
  startedAt: string;
  statusPageUrl: string;
  companyName: string;
  unsubscribeUrl: string;
}

export interface VerificationEmailData {
  recipientName: string;
  verificationUrl: string;
  companyName: string;
}

export interface StatusChangeEmailData {
  serverName: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  statusPageUrl: string;
  companyName: string;
  unsubscribeUrl: string;
}

/**
 * Send incident notification email to subscriber
 */
export async function sendIncidentNotification(
  to: string,
  data: IncidentEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const severityEmoji = {
      critical: '🔴',
      major: '🟠',
      minor: '🟡',
      info: '🔵'
    }[data.severity] || '⚪';

    const statusText = {
      investigating: 'Investigating',
      identified: 'Identified',
      monitoring: 'Monitoring',
      resolved: '✅ Resolved'
    }[data.status] || data.status;

    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `${severityEmoji} ${data.incidentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .incident-type { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 15px; }
            .incident-type.critical { background: #fee; color: #c00; }
            .incident-type.major { background: #fff3cd; color: #856404; }
            .incident-type.minor { background: #fff; color: #666; border: 1px solid #ddd; }
            .incident-type.info { background: #e7f3ff; color: #0066cc; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 15px 0; }
            .status-badge.investigating { background: #fff3cd; color: #856404; }
            .status-badge.identified { background: #fee; color: #c00; }
            .status-badge.monitoring { background: #e7f3ff; color: #0066cc; }
            .status-badge.resolved { background: #d4edda; color: #155724; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .footer a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.companyName}</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Status Update</p>
            </div>
            <div class="content">
              <div class="incident-type ${data.severity}">${severityEmoji} ${data.severity.toUpperCase()} - ${data.incidentType.toUpperCase()}</div>
              <h2 style="margin: 0 0 10px 0; color: #333;">${data.incidentTitle}</h2>
              <div class="status-badge ${data.status}">${statusText}</div>
              <p style="color: #666; margin: 15px 0;">${data.incidentDescription}</p>
              <p style="font-size: 14px; color: #888;">Started: ${new Date(data.startedAt).toLocaleString()}</p>
              <a href="${data.statusPageUrl}" class="button">View Status Page</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you subscribed to ${data.companyName} status updates.</p>
              <p><a href="${data.unsubscribeUrl}">Unsubscribe</a> from these notifications</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
${severityEmoji} ${data.incidentTitle}

Status: ${statusText}
Severity: ${data.severity.toUpperCase()}
Type: ${data.incidentType.toUpperCase()}

${data.incidentDescription}

Started: ${new Date(data.startedAt).toLocaleString()}

View full status page: ${data.statusPageUrl}

---
You're receiving this because you subscribed to ${data.companyName} status updates.
Unsubscribe: ${data.unsubscribeUrl}
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send incident notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send email verification to new subscriber
 */
export async function sendVerificationEmail(
  to: string,
  data: VerificationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Verify your subscription to ${data.companyName} status updates`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; text-align: center; }
            .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${data.recipientName},</p>
              <p>Thanks for subscribing to ${data.companyName} status updates!</p>
              <p>Please verify your email address to start receiving notifications about service incidents and maintenance.</p>
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
              <p style="font-size: 12px; color: #888; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>This verification link will expire in 24 hours.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Verify Your Email

Hi ${data.recipientName},

Thanks for subscribing to ${data.companyName} status updates!

Please verify your email address to start receiving notifications about service incidents and maintenance.

Verify your email: ${data.verificationUrl}

If you didn't request this, you can safely ignore this email.

This verification link will expire in 24 hours.
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  to: string,
  companyName: string,
  statusPageUrl: string,
  unsubscribeUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `You're subscribed to ${companyName} status updates`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .footer a { color: #10b981; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Subscription Confirmed</h1>
            </div>
            <div class="content">
              <p>Your email has been verified successfully!</p>
              <p>You'll now receive notifications about:</p>
              <ul style="text-align: left; color: #666;">
                <li>Service outages and degradations</li>
                <li>Scheduled maintenance windows</li>
                <li>Incident resolutions</li>
              </ul>
              <p>You can view our current status anytime:</p>
              <a href="${statusPageUrl}" class="button">View Status Page</a>
            </div>
            <div class="footer">
              <p>Want to stop receiving these emails?</p>
              <p><a href="${unsubscribeUrl}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Subscription Confirmed

Your email has been verified successfully!

You'll now receive notifications about:
- Service outages and degradations
- Scheduled maintenance windows
- Incident resolutions

View status page: ${statusPageUrl}

Want to stop receiving these emails?
Unsubscribe: ${unsubscribeUrl}
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send subscription confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Batch send emails with throttling (100 emails per batch, 1 second delay)
 */
export async function sendBatchEmails(
  emails: Array<{ to: string; data: IncidentEmailData }>,
  onProgress?: (sent: number, total: number) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  const BATCH_SIZE = 100;
  const DELAY_MS = 1000;
  
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.allSettled(
      batch.map(({ to, data }) => sendIncidentNotification(to, data))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++;
      } else {
        failedCount++;
        const email = batch[index].to;
        const error = result.status === 'fulfilled' 
          ? result.value.error 
          : result.reason?.message || 'Unknown error';
        errors.push(`${email}: ${error}`);
      }
    });

    if (onProgress) {
      onProgress(successCount + failedCount, emails.length);
    }

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return { success: successCount, failed: failedCount, errors };
}
