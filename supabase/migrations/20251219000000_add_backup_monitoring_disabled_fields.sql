-- Add fields to track why backup monitoring is disabled and when to review
-- This ensures servers aren't forgotten when backup monitoring is disabled

ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS backup_monitoring_disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS backup_monitoring_review_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN servers.backup_monitoring_disabled_reason IS 'Required explanation for why backup monitoring is disabled for this server';
COMMENT ON COLUMN servers.backup_monitoring_review_date IS 'Required date to review whether backup monitoring should be re-enabled';

-- Add check constraint to ensure both fields are provided when backup_monitoring_excluded is true
-- or both are null when backup_monitoring_excluded is false
ALTER TABLE servers
ADD CONSTRAINT backup_monitoring_exclusion_check 
CHECK (
  (backup_monitoring_excluded = true AND backup_monitoring_disabled_reason IS NOT NULL AND backup_monitoring_review_date IS NOT NULL)
  OR
  (backup_monitoring_excluded = false AND backup_monitoring_disabled_reason IS NULL AND backup_monitoring_review_date IS NULL)
  OR
  (backup_monitoring_excluded IS NULL AND backup_monitoring_disabled_reason IS NULL AND backup_monitoring_review_date IS NULL)
);
