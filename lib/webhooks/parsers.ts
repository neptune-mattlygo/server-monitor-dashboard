import type {
  UptimeRobotPayload,
  FileMakerPayload,
  BackupPayload,
  AWSS3Payload,
  ParsedWebhookData,
} from './types';

// Parse UptimeRobot webhook
export function parseUptimeRobotWebhook(payload: UptimeRobotPayload): ParsedWebhookData {
  const status = payload.alertTypeFriendlyName.toLowerCase();
  
  return {
    serverName: payload.monitorFriendlyName,
    eventType: 'status_change',
    status: status === 'up' ? 'up' : 'down',
    message: `${payload.alertTypeFriendlyName}: ${payload.alertDetails || payload.monitorURL}`,
    metadata: {
      monitorId: payload.monitorID,
      url: payload.monitorURL,
      sslExpiryDate: payload.sslExpiryDate,
      sslExpiryDaysLeft: payload.sslExpiryDaysLeft,
    },
  };
}

// Parse FileMaker Server webhook
export function parseFileMakerWebhook(payload: FileMakerPayload): ParsedWebhookData {
  return {
    serverName: payload.server,
    eventType: 'filemaker_event',
    status: payload.severity.toLowerCase(),
    message: payload.details,
    metadata: {
      event: payload.event,
      severity: payload.severity,
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
  // Handle SNS notification format
  if (payload.Records && payload.Records.length > 0) {
    const record = payload.Records[0];
    const objectKey = record.s3.object.key;
    const eventName = record.eventName;
    
    return {
      serverName: record.s3.bucket.name,
      eventType: 's3_restore',
      status: eventName.includes('ObjectCreated') ? 'started' : 'expired',
      message: `S3 ${eventName}: ${objectKey}`,
      metadata: {
        bucket: record.s3.bucket.name,
        objectKey,
        eventName,
      },
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
