-- Add backup monitoring exclusion field to servers table
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS backup_monitoring_excluded BOOLEAN DEFAULT FALSE;

-- Add alert_on_never_backed_up option to backup_monitoring_config
ALTER TABLE backup_monitoring_config 
ADD COLUMN IF NOT EXISTS alert_on_never_backed_up BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN servers.backup_monitoring_excluded IS 'When true, this server will be excluded from backup monitoring alerts';
COMMENT ON COLUMN backup_monitoring_config.alert_on_never_backed_up IS 'When true, send alerts for servers that have never had a backup recorded';
