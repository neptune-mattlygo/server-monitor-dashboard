// Webhook payload type definitions

export interface UptimeRobotPayload {
  monitorID: string;
  monitorURL: string;
  monitorFriendlyName: string;
  alertType: string;
  alertTypeFriendlyName: string;
  alertDetails: string;
  monitorAlertContacts: string;
  sslExpiryDate?: string;
  sslExpiryDaysLeft?: string;
}

export interface FileMakerPayload {
  event: string;
  severity: string;
  timestamp: string;
  server: string;
  details: string;
  database?: string;
  client?: string;
}

export interface BackupPayload {
  job_name: string;
  status: 'success' | 'fail';
  duration: number; // seconds
  size?: string; // e.g., "1.5GB"
  error?: string;
  timestamp: string;
}

export interface AWSS3Payload {
  Records?: Array<{
    eventName: string;
    s3: {
      bucket: { name: string };
      object: { key: string };
    };
  }>;
  operation?: string;
  status?: string;
  object_key?: string;
  bucket?: string;
}

export interface ParsedWebhookData {
  serverName: string;
  eventType: 'status_change' | 'backup' | 's3_restore' | 'filemaker_event';
  status: string;
  message: string;
  metadata?: Record<string, any>;
}
