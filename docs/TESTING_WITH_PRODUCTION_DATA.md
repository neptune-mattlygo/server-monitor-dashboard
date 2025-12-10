# Testing with Production Data Locally

This guide explains how to safely test database migrations and changes against production data in your local environment.

## Quick Start

### 1. Export Production Database

```bash
./scripts/export-production-to-seed.sh
```

This will prompt you for:
- Your Supabase project ID (found in your dashboard URL)
- Your database password

The script exports all data from these tables:
- servers
- hosts
- regions
- server_events
- webhook_secrets

### 2. Start Local Supabase (if not running)

```bash
npx supabase start
```

(Ignore config warnings - it still works)

### 3. Apply to Local Database

```bash
./scripts/apply-seed-to-local.sh
```

This will:
1. Clear existing local data
2. Apply the production seed file
3. Keep all migrations intact

### 4. Test Your Changes

Your local database now contains a copy of production data. Test away!

- View data: http://localhost:54323 (Supabase Studio)
- Run app: `npm run dev`

## Manual Method

If you prefer manual control or the script doesn't work:

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on "Database" → "Backups"
3. Download a backup
4. Extract and save as `supabase/seed.sql`

### Option B: Using pg_dump directly

```bash
# Set your connection details
export PROJECT_ID="your-project-id"
export DB_PASSWORD="your-password"

# Export specific tables
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "${PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  --data-only \
  --no-owner \
  --no-acl \
  -t public.servers \
  -t public.hosts \
  -t public.regions \
  -t public.server_events \
  -t public.webhook_secrets \
  > supabase/seed.sql
```

## Testing Migrations

### Before Applying to Production

1. **Export production data** (see above)
2. **Apply locally**: `npx supabase db reset`
3. **Create your migration**: Make changes and test
4. **Verify everything works** with real data
5. **Commit and push** to main
6. **Apply to production**: Run migration via Supabase Dashboard SQL Editor

### Workflow Example

```bash
# 1. Make sure local Supabase is running
npx supabase start  # ignore config warnings

# 2. Get production data
./scripts/export-production-to-seed.sh

# 3. Load production data to local DB
./scripts/apply-seed-to-local.sh

# 4. Create new migration file manually
# Create: supabase/migrations/YYYYMMDDHHMMSS_my_feature.sql

# 5. Write your SQL in the new migration file

# 6. Apply it locally via Supabase Studio
# Open http://localhost:54323 → SQL Editor → paste migration SQL

# 7. Test thoroughly with production data

# 8. If all looks good, commit
git add supabase/migrations/
git commit -m "feat: add my feature"
git push origin main

# 9. Apply to production via Supabase Dashboard
# Dashboard → SQL Editor → paste migration SQL
```

## Important Notes

### Security ⚠️

- **DO NOT commit `supabase/seed.sql` if it contains sensitive production data**
- The file is already in `.gitignore` for safety
- If you need to share seed data, sanitize it first:
  - Remove webhook secrets
  - Anonymize IP addresses
  - Remove any sensitive server names or URLs

### Data Freshness

- The seed file is a point-in-time snapshot
- Re-export periodically if you need fresh data
- Consider exporting before each major migration test

### Local vs Production

Remember that your local Supabase uses:
- Different auth settings
- Different storage settings
- Different API URLs

Test webhooks and integrations carefully before deploying.

## Troubleshooting

### "connection refused" error

Make sure `pg_dump` is installed:
```bash
brew install postgresql
```

### "authentication failed" error

Double-check your:
- Project ID (from dashboard URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`)
- Database password (found in Settings → Database)

### Supabase CLI config errors

The CLI has known config issues with PostgreSQL 17. The `npx supabase db reset` command will fail with "Invalid db.major_version: 17".

**Workaround**: Use the provided scripts instead:
- Use `./scripts/apply-seed-to-local.sh` to load production data
- Apply migrations via Supabase Studio (http://localhost:54323) → SQL Editor
- Or use Docker directly:
  ```bash
  docker exec -i supabase-db-server-monitor psql -U postgres -d postgres < supabase/migrations/YOUR_MIGRATION.sql
  ```

## Alternative: Snapshot Testing

If you don't want to use production data, you can create realistic test data:

```sql
-- supabase/seed.sql
INSERT INTO regions (id, name, code) VALUES
  ('uuid-1', 'EU West', 'eu-west'),
  ('uuid-2', 'US East', 'us-east');

INSERT INTO hosts (id, name, region_id) VALUES
  ('uuid-3', 'Production Host 1', 'uuid-1');

INSERT INTO servers (id, name, host_id, current_status, bucket) VALUES
  ('uuid-4', 'Test Server', 'uuid-3', 'up', 'test-backup-bucket');

-- Add sample events
INSERT INTO server_events (server_id, event_type, event_source, status, message, backup_event_type, backup_database, backup_file_key)
VALUES 
  ('uuid-4', 'backup_added', 'aws_s3', 'success', 'backup added: TestDB.fmp12', 'backup added', 'TestDB.fmp12', 'dbs/Daily_2025-12-10/TestDB.fmp12');
```

Then apply with `npx supabase db reset`.
