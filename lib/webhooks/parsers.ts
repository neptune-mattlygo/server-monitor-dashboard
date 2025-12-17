import type {
  UptimeRobotPayload,
  FileMakerPayload,
  BackupPayload,
  AWSS3Payload,
  ParsedWebhookData,
} from './types';

// Parse UptimeRobot email body (from n8n forwarding)
export function parseUptimeRobotEmail(emailBody: string, emailSubject?: string): ParsedWebhookData {
  // Extract monitor name from subject line: "Monitor is DOWN: server-name" or "Monitor is UP: server-name"
  let monitorName = 'Unknown Monitor';
  let status: 'up' | 'down' = 'down';
  let alertType = 'down';
  
  if (emailSubject) {
    const subjectMatch = emailSubject.match(/Monitor is\s+(UP|DOWN):\s*(.+)/i);
    if (subjectMatch) {
      alertType = subjectMatch[1].toUpperCase();
      status = alertType === 'UP' ? 'up' : 'down';
      monitorName = subjectMatch[2].trim();
    }
  }
  
  // Also try to extract from body if subject parsing failed
  if (monitorName === 'Unknown Monitor') {
    // Look for "Monitor name" followed by the name
    const nameMatch = emailBody.match(/Monitor name[\s\n]*([^\n<]+)/i);
    if (nameMatch) {
      monitorName = nameMatch[1].trim();
    }
    
    // Try to extract from "[name] is down" or "[name] is up" in body
    const bodyStatusMatch = emailBody.match(/([^\s]+(?:\.[^\s]+)*?)\s+is\s+(down|up)/i);
    if (bodyStatusMatch) {
      monitorName = bodyStatusMatch[1].trim();
      status = bodyStatusMatch[2].toLowerCase() as 'up' | 'down';
      alertType = status.toUpperCase();
    }
  }
  
  // Extract checked URL
  let monitorURL = '';
  const urlMatch = emailBody.match(/Checked URL[\s\n]*(?:<[^>]*>)?([^\n<]+)/i);
  if (urlMatch) {
    monitorURL = urlMatch[1].trim();
  }
  
  // Extract root cause/alert details
  let alertDetails = '';
  const rootCauseMatch = emailBody.match(/Root cause[\s\n]*(?:<[^>]*>)?([^\n<]+)/i);
  if (rootCauseMatch) {
    alertDetails = rootCauseMatch[1].trim();
  }
  
  // Extract incident timestamp
  let incidentTime = '';
  const timeMatch = emailBody.match(/Incident (?:started|resolved) at[\s\n]*(?:<[^>]*>)?([^\n<]+)/i);
  if (timeMatch) {
    incidentTime = timeMatch[1].trim();
  }
  
  // Extract region
  let region = '';
  const regionMatch = emailBody.match(/Region[\s\n]*(?:<[^>]*>)?([^\n<]+)/i);
  if (regionMatch) {
    region = regionMatch[1].trim();
  }
  
  const message = alertDetails 
    ? `${alertType}: ${alertDetails}` 
    : `${alertType}: ${monitorURL || monitorName}`;
  
  return {
    serverName: monitorName,
    eventType: 'status_change',
    status,
    message,
    metadata: {
      url: monitorURL,
      alertDetails,
      incidentTime,
      region,
      source: 'email',
    },
  };
}

// Parse UptimeRobot webhook (JSON payload or email)
export function parseUptimeRobotWebhook(payload: UptimeRobotPayload): ParsedWebhookData {
  // Check if this is an email-based payload
  if (payload.emailBody) {
    return parseUptimeRobotEmail(payload.emailBody, payload.emailSubject);
  }
  
  // Standard JSON payload parsing - validate required fields
  if (!payload.alertTypeFriendlyName || !payload.monitorFriendlyName) {
    throw new Error('Missing required fields: alertTypeFriendlyName and monitorFriendlyName are required for JSON payload');
  }
  
  const status = payload.alertTypeFriendlyName.toLowerCase();
  
  return {
    serverName: payload.monitorFriendlyName,
    eventType: 'status_change',
    status: status === 'up' ? 'up' : 'down',
    message: `${payload.alertTypeFriendlyName}: ${payload.alertDetails || payload.monitorURL || 'No details'}`,
    metadata: {
      monitorId: payload.monitorID,
      url: payload.monitorURL,
      sslExpiryDate: payload.sslExpiryDate,
      sslExpiryDaysLeft: payload.sslExpiryDaysLeft,
      source: 'json',
    },
  };
}

// Parse FileMaker Server webhook
export function parseFileMakerWebhook(payload: FileMakerPayload): ParsedWebhookData {
  // Determine status based on error field or event type
  let status = 'info';
  if (payload.error) {
    status = 'error';
  } else if (payload.event.toLowerCase().includes('error') || payload.event.toLowerCase().includes('security')) {
    status = 'warning';
  }

  return {
    serverName: payload.server,
    eventType: 'filemaker_event',
    status: status,
    message: payload.message,
    metadata: {
      event: payload.event,
      error: payload.error,
      timestamp: payload.timestamp,
      database: payload.database,
      client: payload.client,
    },
  };
}

// Parse Backup System webhook
export function parseBackupWebhook(payload: BackupPayload): ParsedWebhookData {
  return {
    serverName: payload.server_name || payload.job_name,
    eventType: 'backup',
    status: payload.status,
    message: payload.status === 'success'
      ? `Backup completed in ${payload.duration}s${payload.size ? ` (${payload.size})` : ''}`
      : `Backup failed: ${payload.error || 'Unknown error'}`,
    metadata: {
      duration: payload.duration,
      size: payload.size,
      error: payload.error,
      timestamp: payload.timestamp,
    },
  };
}

// Parse AWS S3 webhook
export function parseAWSS3Webhook(payload: AWSS3Payload): ParsedWebhookData {
  // Handle SNS subscription confirmation
  if (payload.Type === 'SubscriptionConfirmation') {
    return {
      serverName: 'SNS Subscription',
      eventType: 'sns_test',
      status: 'info',
      message: 'SNS subscription confirmation received',
      metadata: {
        topicArn: payload.TopicArn,
        subscribeUrl: payload.SubscribeURL,
      },
    };
  }

  // Handle SNS notification wrapper (Message is a JSON string)
  let actualPayload = payload;
  if (payload.Type === 'Notification' && payload.Message) {
    try {
      actualPayload = JSON.parse(payload.Message);
    } catch (e) {
      console.error('Failed to parse SNS Message:', e);
    }
  }

  // Handle SNS notification format with S3 Records
  if (actualPayload.Records && actualPayload.Records.length > 0) {
    const record = actualPayload.Records[0];
    const objectKey = record.s3.object.key;
    const eventName = record.eventName;
    const configurationId = record.s3.configurationId;
    const bucketName = record.s3.bucket.name;
    const fileSize = record.s3.object.size;
    
    // Extract database name from object key (filename only)
    // e.g., "dbs/Daily_2025-12-10_1731/Databases/ESPrinting.fmp12" -> "ESPrinting.fmp12"
    const filename = objectKey.split('/').pop() || objectKey;
    
    // Only process .fmp12 files for backup monitoring
    if (!filename.toLowerCase().endsWith('.fmp12')) {
      return {
        serverName: bucketName,
        eventType: 's3_other',
        status: 'info',
        message: `Skipped non-FileMaker file: ${filename}`,
        metadata: {
          bucket: bucketName,
          objectKey,
          filename,
          skipped: true,
        },
      };
    }
    
    // Convert configurationId from snake_case to space-separated
    // e.g., "backup_added" -> "backup added"
    const backupEventType = configurationId ? configurationId.replace(/_/g, ' ') : undefined;
    
    // Determine event type based on configurationId or eventName
    const eventType = configurationId ? 'backup_added' : 's3_restore';
    
    return {
      serverName: bucketName,
      eventType,
      status: eventName.includes('ObjectCreated') ? 'success' : 'info',
      message: backupEventType 
        ? `${backupEventType}: ${filename}`
        : `S3 ${eventName}: ${objectKey}`,
      metadata: {
        bucket: bucketName,
        objectKey,
        eventName,
        configurationId,
        fileSize,
      },
      backupEventType,
      backupDatabase: filename,
      backupFileKey: objectKey,
      backupFileSize: fileSize,
    };
  }
  
  // Handle direct format
  return {
    serverName: payload.bucket || 'Unknown',
    eventType: 's3_restore',
    status: payload.status || 'unknown',
    message: `${payload.operation || 'Operation'}: ${payload.object_key || 'unknown'}`,
    metadata: {
      operation: payload.operation,
      status: payload.status,
      objectKey: payload.object_key,
      bucket: payload.bucket,
    },
  };
}
