-- Server Monitoring Dashboard Migration
-- Creates all necessary tables, RLS policies, functions, and seed data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (modified from base template for Azure AD and local auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  azure_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  auth_provider TEXT DEFAULT 'azure' CHECK (auth_provider IN ('azure', 'local')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_azure_id ON profiles(azure_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Azure sessions table
CREATE TABLE IF NOT EXISTS azure_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_azure_sessions_user_id ON azure_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_azure_sessions_expires_at ON azure_sessions(expires_at);

-- Hosts table
CREATE TABLE IF NOT EXISTS hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  host_id UUID REFERENCES hosts(id) ON DELETE SET NULL,
  server_type TEXT,
  ip_address TEXT,
  current_status TEXT DEFAULT 'up' CHECK (current_status IN ('up', 'down', 'degraded', 'maintenance')),
  last_status_change TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servers_host_id ON servers(host_id);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(current_status);

-- Server events table
CREATE TABLE IF NOT EXISTS server_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'backup', 's3_restore', 'filemaker_event')),
  event_source TEXT NOT NULL CHECK (event_source IN ('uptimerobot', 'filemaker', 'backup_system', 'aws_s3', 'manual')),
  status TEXT,
  message TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_events_server_id_created_at ON server_events(server_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_events_type ON server_events(event_type);
CREATE INDEX IF NOT EXISTS idx_server_events_source ON server_events(event_source);
CREATE INDEX IF NOT EXISTS idx_server_events_created_at ON server_events(created_at DESC);

-- Webhook secrets table
CREATE TABLE IF NOT EXISTS webhook_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT UNIQUE NOT NULL CHECK (source IN ('uptimerobot', 'filemaker', 'backup_system', 'aws_s3')),
  secret_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'sync')),
  resource_type TEXT CHECK (resource_type IN ('server', 'host', 'user', 'webhook', 'session')),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check user role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin has all permissions
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Editor has editor and viewer permissions
  IF user_role = 'editor' AND required_role IN ('editor', 'viewer') THEN
    RETURN TRUE;
  END IF;
  
  -- Exact match
  RETURN user_role = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_details)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update last_login on session creation
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_login = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_login
  AFTER INSERT ON azure_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();

-- Update updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosts_updated_at
  BEFORE UPDATE ON hosts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE azure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (has_role('admin'));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (has_role('admin'));

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Azure sessions policies
CREATE POLICY "Users can read their own sessions"
  ON azure_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON azure_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON azure_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Hosts policies
CREATE POLICY "Authenticated users can read hosts"
  ON hosts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create hosts"
  ON hosts FOR INSERT
  WITH CHECK (has_role('editor'));

CREATE POLICY "Editors can update hosts"
  ON hosts FOR UPDATE
  USING (has_role('editor'));

CREATE POLICY "Admins can delete hosts"
  ON hosts FOR DELETE
  USING (has_role('admin'));

-- Servers policies
CREATE POLICY "Authenticated users can read servers"
  ON servers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create servers"
  ON servers FOR INSERT
  WITH CHECK (has_role('editor'));

CREATE POLICY "Editors can update servers"
  ON servers FOR UPDATE
  USING (has_role('editor'));

CREATE POLICY "Admins can delete servers"
  ON servers FOR DELETE
  USING (has_role('admin'));

-- Server events policies
CREATE POLICY "Authenticated users can read events"
  ON server_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert events"
  ON server_events FOR INSERT
  WITH CHECK (true);

-- Webhook secrets policies
CREATE POLICY "Admins can read webhook secrets"
  ON webhook_secrets FOR SELECT
  USING (has_role('admin'));

CREATE POLICY "Admins can manage webhook secrets"
  ON webhook_secrets FOR ALL
  USING (has_role('admin'));

-- Audit logs policies
CREATE POLICY "Users can read their own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all audit logs"
  ON audit_logs FOR SELECT
  USING (has_role('admin'));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert sample hosts
INSERT INTO hosts (id, name, location, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'AWS US-East', 'Virginia, USA', 'Primary AWS data center for US operations'),
  ('22222222-2222-2222-2222-222222222222', 'DigitalOcean London', 'London, UK', 'European data center for GDPR compliance'),
  ('33333333-3333-3333-3333-333333333333', 'OVH Frankfurt', 'Frankfurt, Germany', 'Backup and DR site')
ON CONFLICT (id) DO NOTHING;

-- Insert sample servers
INSERT INTO servers (id, name, host_id, server_type, ip_address, current_status, metadata) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FileMaker Server Primary', '11111111-1111-1111-1111-111111111111', 'filemaker', '10.0.1.10', 'up', '{"version": "20.3.2", "databases": 12}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Web Server 01', '11111111-1111-1111-1111-111111111111', 'web', '10.0.1.20', 'up', '{"software": "nginx", "version": "1.24.0"}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Database Primary', '11111111-1111-1111-1111-111111111111', 'database', '10.0.1.30', 'up', '{"engine": "postgresql", "version": "16.1"}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'API Server', '11111111-1111-1111-1111-111111111111', 'api', '10.0.1.40', 'up', '{"runtime": "node", "version": "20.10.0"}'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Web Server 02', '22222222-2222-2222-2222-222222222222', 'web', '10.1.1.10', 'up', '{"software": "nginx", "version": "1.24.0"}'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Database Replica', '22222222-2222-2222-2222-222222222222', 'database', '10.1.1.20', 'up', '{"engine": "postgresql", "version": "16.1"}'),
  ('00000000-0000-0000-0000-000000000001', 'Backup Server', '22222222-2222-2222-2222-222222222222', 'backup', '10.1.1.30', 'up', '{"capacity": "10TB", "used": "6.5TB"}'),
  ('00000000-0000-0000-0000-000000000002', 'FileMaker Backup', '33333333-3333-3333-3333-333333333333', 'filemaker', '10.2.1.10', 'up', '{"version": "20.3.2", "role": "backup"}'),
  ('00000000-0000-0000-0000-000000000003', 'Archive Storage', '33333333-3333-3333-3333-333333333333', 'storage', '10.2.1.20', 'up', '{"capacity": "50TB", "type": "cold storage"}'),
  ('00000000-0000-0000-0000-000000000004', 'Monitoring Server', '11111111-1111-1111-1111-111111111111', 'monitoring', '10.0.1.50', 'up', '{"software": "prometheus", "version": "2.45.0"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO server_events (server_id, event_type, event_source, status, message, payload) VALUES
  -- FileMaker Server Primary events
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'status_change', 'uptimerobot', 'up', 'Server is responding normally', '{"response_time": 45, "monitor_id": "12345"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'backup', 'filemaker', 'success', 'Daily backup completed successfully', '{"duration": 180, "size_mb": 2048}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'filemaker_event', 'filemaker', 'info', 'Client connected: user@domain.com', '{"client_ip": "192.168.1.100", "database": "customers.fmp12"}'),
  
  -- Web Server 01 events
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'status_change', 'uptimerobot', 'up', 'HTTP 200 OK', '{"response_time": 28, "ssl_valid": true}'),
  
  -- Database Primary events
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'backup', 'backup_system', 'success', 'Database backup completed', '{"duration": 420, "size_gb": 15.2}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'status_change', 'uptimerobot', 'up', 'Database responding to health checks', '{"response_time": 12}'),
  
  -- Archive Storage events
  ('00000000-0000-0000-0000-000000000003', 's3_restore', 'aws_s3', 'started', 'Glacier restore initiated', '{"object_key": "backup-2024-11-28.tar.gz", "tier": "Standard"}'),
  ('00000000-0000-0000-0000-000000000003', 's3_restore', 'aws_s3', 'expired', 'Restored object expired', '{"object_key": "backup-2024-11-21.tar.gz"}'),
  
  -- Backup Server events
  ('00000000-0000-0000-0000-000000000001', 'backup', 'backup_system', 'success', 'Incremental backup completed', '{"duration": 120, "size_gb": 2.1}'),
  ('00000000-0000-0000-0000-000000000001', 'status_change', 'manual', 'maintenance', 'Scheduled maintenance window', '{"scheduled_by": "admin", "duration_hours": 2}')
ON CONFLICT DO NOTHING;

-- Insert webhook secrets (development secrets)
INSERT INTO webhook_secrets (source, secret_key, is_active) VALUES
  ('uptimerobot', 'development_secret_uptimerobot', true),
  ('filemaker', 'development_secret_filemaker', true),
  ('backup_system', 'development_secret_backup', true),
  ('aws_s3', 'development_secret_aws_s3', true)
ON CONFLICT (source) DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES
  (NULL, 'create', 'server', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"server_name": "FileMaker Server Primary", "created_by": "system"}'),
  (NULL, 'create', 'host', '11111111-1111-1111-1111-111111111111', '{"host_name": "AWS US-East", "created_by": "system"}')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
