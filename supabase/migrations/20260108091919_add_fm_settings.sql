-- Add FileMaker settings storage columns to servers table
ALTER TABLE servers ADD COLUMN IF NOT EXISTS fm_settings JSONB;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS fm_settings_updated_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS fm_settings_error TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS fm_smtp_password TEXT; -- Encrypted separately like admin_password
ALTER TABLE servers ADD COLUMN IF NOT EXISTS fm_settings_updated_by UUID REFERENCES profiles(id);

-- Add setting_change to event_type check constraint
ALTER TABLE server_events DROP CONSTRAINT IF EXISTS server_events_event_type_check;
ALTER TABLE server_events ADD CONSTRAINT server_events_event_type_check 
  CHECK (event_type IN ('status_change', 'backup', 's3_restore', 'filemaker_event', 'sns_test', 'backup_added', 'created', 'setting_change'));

-- Add admin_console to event_source check constraint
ALTER TABLE server_events DROP CONSTRAINT IF EXISTS server_events_event_source_check;
ALTER TABLE server_events ADD CONSTRAINT server_events_event_source_check 
  CHECK (event_source IN ('uptimerobot', 'filemaker', 'backup_system', 'aws_s3', 'manual', 'admin_console'));

-- Create index for faster settings queries
CREATE INDEX IF NOT EXISTS idx_servers_fm_settings_updated_at ON servers(fm_settings_updated_at);

-- Add comment for documentation
COMMENT ON COLUMN servers.fm_settings IS 'FileMaker Server admin settings (general, webPublishing, security, email)';
COMMENT ON COLUMN servers.fm_smtp_password IS 'Encrypted SMTP password for email notifications, stored separately from fm_settings JSONB';
COMMENT ON COLUMN servers.fm_settings_updated_by IS 'Profile ID of admin user who last updated settings';
