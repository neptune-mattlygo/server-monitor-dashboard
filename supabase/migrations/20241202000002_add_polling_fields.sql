-- Add polling-related fields to servers table
ALTER TABLE servers
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS last_check_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- Add index for last_check_at
CREATE INDEX IF NOT EXISTS idx_servers_last_check_at ON servers(last_check_at);

-- Update server_events to support old_status and new_status
ALTER TABLE server_events
ADD COLUMN IF NOT EXISTS old_status TEXT,
ADD COLUMN IF NOT EXISTS new_status TEXT,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- Update the event_type check constraint to include 'created'
ALTER TABLE server_events DROP CONSTRAINT IF EXISTS server_events_event_type_check;
ALTER TABLE server_events ADD CONSTRAINT server_events_event_type_check 
  CHECK (event_type IN ('status_change', 'backup', 's3_restore', 'filemaker_event', 'created'));

-- Update the event_source check constraint to include 'uptimerobot_poll'
ALTER TABLE server_events DROP CONSTRAINT IF EXISTS server_events_event_source_check;
ALTER TABLE server_events ADD CONSTRAINT server_events_event_source_check 
  CHECK (event_source IN ('uptimerobot', 'filemaker', 'backup_system', 'aws_s3', 'manual', 'uptimerobot_poll'));
