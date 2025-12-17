# Apply Bucket Migration

The database migration to add the `bucket` column needs to be applied manually.

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Open the SQL Editor
3. Copy and paste the following SQL:

```sql
-- Add bucket column to servers table for S3/storage matching
ALTER TABLE servers ADD COLUMN IF NOT EXISTS bucket TEXT;

-- Create index for faster bucket lookups
CREATE INDEX IF NOT EXISTS idx_servers_bucket ON servers(bucket) WHERE bucket IS NOT NULL;

-- Add comment
COMMENT ON COLUMN servers.bucket IS 'S3 bucket name or storage identifier for webhook matching';
```

4. Click "Run" to execute the migration
5. Verify by running: `SELECT bucket FROM servers LIMIT 1;`

## Option 2: Via Supabase CLI (If local setup works)

```bash
npx supabase db push
```

## Option 3: Via psql (If you have direct database access)

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" -f supabase/migrations/20241210000000_add_bucket_to_servers.sql
```

## Verification

After applying the migration, test the webhook to confirm:

1. **Test Notifications**: The webhook will now log SNS test/confirmation notifications to `server_events` with:
   - `server_id`: NULL
   - `event_type`: 'sns_test'
   - `event_source`: 'aws_s3'
   - `message`: 'SNS subscription confirmation or test notification received'
   - `payload`: Full raw payload for review

2. **Query Test Notifications**:
```sql
SELECT * FROM server_events 
WHERE event_type = 'sns_test' 
ORDER BY created_at DESC 
LIMIT 10;
```

3. **Real S3 Events**: Once you have a real S3 event with a valid bucket name:
   - It will match existing servers by the `bucket` field
   - Or create a new server with the bucket name stored
   - Log the event with the associated `server_id`

## SNS Subscription Setup

Configure your SNS HTTP/HTTPS subscription with:
- **Endpoint**: `https://your-domain.com/api/webhooks/aws-s3?token=YOUR_WEBHOOK_SECRET`
- **Protocol**: HTTPS
- **Raw message delivery**: Enabled (optional, but recommended)

The confirmation notification will be logged and you can verify the subscription is working by checking the `server_events` table.
