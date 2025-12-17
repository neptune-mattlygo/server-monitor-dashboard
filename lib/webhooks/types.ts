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
  // Email body support for n8n forwarding
  emailBody?: string;
  emailSubject?: string;
}

export interface FileMakerPayload {
  event: string;
  server: string;
  message: string;
  timestamp: string;
  error?: string;
  database?: string;
  client?: string;
}

export interface BackupPayload {
  job_name: string;
  server_name?: string; // Optional: server to associate event with
  status: 'success' | 'fail';
  duration: number; // seconds
  size?: string; // e.g., "1.5GB"
  error?: string;
  timestamp: string;
}

export interface AWSS3Payload {
  // SNS notification wrapper
  Type?: string;
  Message?: string; // JSON string containing S3Records
  Subject?: string;
  // SNS subscription confirmation fields
  TopicArn?: string;
  SubscribeURL?: string;
  Token?: string;
  // Direct S3 event format
  Records?: Array<{
    eventName: string;
    s3: {
      s3SchemaVersion?: string;
      configurationId?: string;
      bucket: { name: string };
      object: { 
        key: string;
        size?: number;
        eTag?: string;
      };
    };
  }>;
  operation?: string;
  status?: string;
  object_key?: string;
  bucket?: string;
}

export interface ParsedWebhookData {
  serverName: string;
  eventType: 'status_change' | 'backup' | 's3_restore' | 'filemaker_event' | 'sns_test' | 'backup_added' | 's3_other';
  status: string;
  message: string;
  metadata?: Record<string, any>;
  backupEventType?: string;
  backupDatabase?: string;
  backupFileKey?: string;
  backupFileSize?: number;
}
