-- Add backup-specific fields to server_events table
ALTER TABLE server_events 
  ADD COLUMN IF NOT EXISTS backup_event_type TEXT,
  ADD COLUMN IF NOT EXISTS backup_database TEXT,
  ADD COLUMN IF NOT EXISTS backup_file_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN server_events.backup_event_type IS 'Extracted from S3 configurationId (e.g., "backup added" from "backup_added")';
COMMENT ON COLUMN server_events.backup_database IS 'Database name extracted from S3 object key filename';
COMMENT ON COLUMN server_events.backup_file_key IS 'Full S3 object key path for the backup file';

-- Add index for backup queries
CREATE INDEX IF NOT EXISTS idx_server_events_backup_database ON server_events(backup_database) WHERE backup_database IS NOT NULL;

-- Update event_type check constraint to include backup_added
ALTER TABLE server_events DROP CONSTRAINT IF EXISTS server_events_event_type_check;
ALTER TABLE server_events ADD CONSTRAINT server_events_event_type_check 
  CHECK (event_type IN ('status_change', 'backup', 's3_restore', 'filemaker_event', 'sns_test', 'backup_added'));
