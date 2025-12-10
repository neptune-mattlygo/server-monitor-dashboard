-- Backup Monitoring Configuration
-- Enables automated checks for backup freshness and email notifications

-- Backup monitoring configuration table
CREATE TABLE IF NOT EXISTS backup_monitoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT TRUE,
  threshold_hours INTEGER DEFAULT 24 CHECK (threshold_hours > 0),
  email_recipients TEXT[] DEFAULT '{}',
  check_schedule TEXT DEFAULT '0 9 * * *', -- Daily at 9 AM (cron format)
  last_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE backup_monitoring_config IS 'Global configuration for automated backup monitoring';
COMMENT ON COLUMN backup_monitoring_config.is_enabled IS 'Enable/disable backup monitoring globally';
COMMENT ON COLUMN backup_monitoring_config.threshold_hours IS 'Maximum hours since last backup before alerting';
COMMENT ON COLUMN backup_monitoring_config.email_recipients IS 'Array of email addresses to receive alerts';
COMMENT ON COLUMN backup_monitoring_config.check_schedule IS 'Cron schedule for running checks (not enforced by DB)';
COMMENT ON COLUMN backup_monitoring_config.last_check_at IS 'Timestamp of last monitoring check execution';

-- Insert default configuration (single row)
INSERT INTO backup_monitoring_config (is_enabled, threshold_hours, email_recipients, check_schedule)
VALUES (false, 24, '{}', '0 9 * * *')
ON CONFLICT DO NOTHING;

-- Backup monitoring results/history table
CREATE TABLE IF NOT EXISTS backup_monitoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  servers_checked INTEGER NOT NULL DEFAULT 0,
  servers_overdue INTEGER NOT NULL DEFAULT 0,
  overdue_server_ids UUID[] DEFAULT '{}',
  threshold_hours INTEGER NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_recipients TEXT[] DEFAULT '{}',
  notification_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE backup_monitoring_results IS 'Historical log of backup monitoring check results';
COMMENT ON COLUMN backup_monitoring_results.servers_checked IS 'Total number of servers checked';
COMMENT ON COLUMN backup_monitoring_results.servers_overdue IS 'Number of servers with overdue backups';
COMMENT ON COLUMN backup_monitoring_results.overdue_server_ids IS 'Array of server IDs that were overdue';
COMMENT ON COLUMN backup_monitoring_results.notification_sent IS 'Whether email notification was sent successfully';
COMMENT ON COLUMN backup_monitoring_results.notification_error IS 'Error message if notification failed';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_monitoring_results_check_run ON backup_monitoring_results(check_run_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_monitoring_results_overdue ON backup_monitoring_results(servers_overdue) WHERE servers_overdue > 0;

-- RLS policies for backup_monitoring_config
ALTER TABLE backup_monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON backup_monitoring_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for admins"
  ON backup_monitoring_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS policies for backup_monitoring_results
ALTER TABLE backup_monitoring_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON backup_monitoring_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for service role"
  ON backup_monitoring_results FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON backup_monitoring_config TO authenticated;
GRANT UPDATE ON backup_monitoring_config TO authenticated;
GRANT SELECT ON backup_monitoring_results TO authenticated;
GRANT INSERT ON backup_monitoring_results TO service_role;
