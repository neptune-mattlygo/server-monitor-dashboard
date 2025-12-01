import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role for server-side operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types
export type Profile = {
  id: string;
  azure_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  role: 'admin' | 'editor' | 'viewer';
  auth_provider: 'azure' | 'local';
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export type AzureSession = {
  id: string;
  user_id: string;
  access_token_hash: string;
  refresh_token_hash: string | null;
  expires_at: string;
  created_at: string;
};

export type Host = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Server = {
  id: string;
  name: string;
  host_id: string | null;
  server_type: string | null;
  ip_address: string | null;
  current_status: 'up' | 'down' | 'degraded' | 'maintenance';
  last_status_change: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type ServerEvent = {
  id: string;
  server_id: string;
  event_type: 'status_change' | 'backup' | 's3_restore' | 'filemaker_event';
  event_source: 'uptimerobot' | 'filemaker' | 'backup_system' | 'aws_s3' | 'manual';
  status: string | null;
  message: string | null;
  payload: Record<string, any>;
  created_at: string;
};

export type WebhookSecret = {
  id: string;
  source: 'uptimerobot' | 'filemaker' | 'backup_system' | 'aws_s3';
  secret_key: string;
  is_active: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'sync';
  resource_type: 'server' | 'host' | 'user' | 'webhook' | 'session' | null;
  resource_id: string | null;
  details: Record<string, any>;
  created_at: string;
};
