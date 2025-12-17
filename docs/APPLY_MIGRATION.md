# Quick Migration Guide - Apply Backup Details Migration

Since the Supabase CLI has config issues with PostgreSQL 17, apply the migration directly to production.

## Apply to Production

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

```sql
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
```

6. Click **Run** (or press Cmd+Enter)
7. Verify success - you should see "Success. No rows returned"

### Option 2: Using psql (if installed)

If you have `psql` installed:

```bash
# Install if needed
brew install postgresql

# Connect and apply
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres" \
  -f supabase/migrations/20241210180000_add_backup_details.sql
```

## Verify Migration

After applying, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'server_events' 
  AND column_name IN ('backup_event_type', 'backup_database', 'backup_file_key');
```

You should see all 3 columns listed.

## Test

Once applied, send a new S3 backup notification and check:
1. The server card should show the database name
2. Event history S3 tab should show backup details
3. Hover over backup info should show full details

## For Future Migrations

Until the Supabase CLI config issue is fixed, use the Dashboard SQL Editor for all migrations. The workflow is:

1. Create migration file locally
2. Test SQL in Dashboard SQL Editor
3. Once verified, commit the migration file to git
4. Document that it was applied to production

The migration files in git serve as your migration history even if applied manually.
