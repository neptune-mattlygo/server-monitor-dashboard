-- Add file size and alert suppression columns to server_events
ALTER TABLE server_events
ADD COLUMN IF NOT EXISTS backup_file_size BIGINT,
ADD COLUMN IF NOT EXISTS backup_file_size_alert_suppressed BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN server_events.backup_file_size IS 'Size of the backup file in bytes';
COMMENT ON COLUMN server_events.backup_file_size_alert_suppressed IS 'Whether size alerts are suppressed for this backup file';

-- Create index for efficient querying of small backup files
CREATE INDEX IF NOT EXISTS idx_server_events_backup_file_size 
ON server_events(backup_file_size) 
WHERE event_type = 'backup' AND backup_file_size IS NOT NULL;
