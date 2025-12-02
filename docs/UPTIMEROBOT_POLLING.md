# UptimeRobot Polling Setup Guide

This guide explains how to set up automatic polling of UptimeRobot monitors every 5 minutes.

## Overview

The polling system:
- Fetches all monitors from UptimeRobot API every 5 minutes
- Automatically creates/updates servers in the database
- Tracks status changes and response times
- Creates events for status changes
- Works alongside webhooks for redundancy

## Prerequisites

1. **UptimeRobot Account** (Pro or higher recommended for API access)
2. **Main API Key** from UptimeRobot

## Step 1: Get Your UptimeRobot API Key

1. Login to [UptimeRobot](https://uptimerobot.com)
2. Go to **My Settings** → **API Settings**
3. Find or generate your **Main API Key**
4. Copy the key (format: `u123456-abc...`)

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```env
# UptimeRobot API Configuration
UPTIMEROBOT_API_KEY=u123456-your-api-key-here

# Polling Security Secret (generate with: openssl rand -base64 32)
POLLING_SECRET=your-random-secret-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Run Database Migration

Apply the migration to add required columns:

```bash
# If using local Supabase
npm run supabase:migration:up

# Or manually run the migration
psql -h localhost -p 54322 -U postgres -d postgres < supabase/migrations/20241202000001_add_external_id.sql
```

## Step 4: Test the Polling

### Manual Test via API

```bash
# Get polling status
curl http://localhost:3000/api/polling/uptimerobot

# Trigger polling (requires admin user logged in)
curl -X POST http://localhost:3000/api/polling/trigger \
  -H "Cookie: your-session-cookie"
```

### Test via Dashboard

1. Login as an admin user
2. Navigate to `/dashboard`
3. Look for a "Sync UptimeRobot" button (if implemented)
4. Click to trigger manual sync

### Direct Endpoint Test (Development)

```bash
curl -X POST http://localhost:3000/api/polling/uptimerobot \
  -H "Authorization: Bearer YOUR_POLLING_SECRET"
```

## Step 5: Deploy to Vercel

### Automatic Cron (Recommended)

The `vercel.json` file is already configured:

```json
{
  "crons": [{
    "path": "/api/polling/uptimerobot",
    "schedule": "*/5 * * * *"
  }]
}
```

**Deploy:**

```bash
# Push to GitHub
git push origin uptimerobot-polling

# Deploy to Vercel
vercel --prod

# Or use Vercel GitHub integration (automatic)
```

**Important:** Vercel Cron requires:
- Pro plan or higher
- Environment variables set in Vercel dashboard
- `Authorization: Bearer` header is **automatically added** by Vercel

### Alternative: External Cron Service

If not using Vercel Pro, use an external cron service:

#### Option A: cron-job.org (Free)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a new cron job
3. Configure:
   - **URL:** `https://your-app.vercel.app/api/polling/uptimerobot`
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
   - **Headers:** Add `Authorization: Bearer YOUR_POLLING_SECRET`
4. Save and enable

#### Option B: GitHub Actions

Create `.github/workflows/poll-uptimerobot.yml`:

```yaml
name: Poll UptimeRobot
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Poll UptimeRobot API
        run: |
          curl -X POST https://your-app.vercel.app/api/polling/uptimerobot \
            -H "Authorization: Bearer ${{ secrets.POLLING_SECRET }}" \
            -f
```

Add `POLLING_SECRET` to GitHub repository secrets.

## Step 6: Verify It's Working

### Check Logs

**Vercel:**
```bash
vercel logs --follow
```

Look for:
```
[UptimeRobot] Fetched X monitors
[UptimeRobot] Created new server: Example Monitor
[UptimeRobot] Status changed for Example: up → down
[UptimeRobot] Poll completed: { created: 5, updated: 10, errors: 0 }
```

### Check Database

```sql
-- View imported servers
SELECT name, external_id, current_status, last_check_at 
FROM servers 
WHERE external_id LIKE 'uptimerobot_%';

-- View recent polling events
SELECT se.*, s.name 
FROM server_events se
JOIN servers s ON s.id = se.server_id
WHERE se.metadata->>'source' = 'uptimerobot_poll'
ORDER BY se.created_at DESC
LIMIT 20;
```

### Monitor Dashboard

- New servers should appear automatically
- Status changes should be reflected within 5 minutes
- Events log should show polling activity

## How It Works

### Data Flow

```
UptimeRobot API 
    ↓ (every 5 min)
Polling Endpoint (/api/polling/uptimerobot)
    ↓
Transform Monitor Data
    ↓
Check if server exists (by external_id)
    ├→ Exists: Update status, create event if changed
    └→ New: Create server + initial event
```

### Server Matching

Servers are matched using `external_id` field:
- Format: `uptimerobot_{monitor_id}`
- Example: `uptimerobot_123456789`
- Ensures no duplicates even if name changes

### Status Mapping

| UptimeRobot | Dashboard |
|-------------|-----------|
| 2 (Up) | up |
| 9 (Down) | down |
| 8 (Seems Down) | degraded |
| 0 (Paused) | maintenance |
| 1 (Not Checked) | unknown |

### Default Host

A default host named "UptimeRobot" is automatically created:
- **Name:** UptimeRobot
- **Location:** Cloud Monitoring
- **Provider:** UptimeRobot

All imported monitors are assigned to this host.

## Troubleshooting

### Error: "UPTIMEROBOT_API_KEY not configured"

**Solution:** Add the API key to `.env.local` (local) or Vercel environment variables (production)

### Error: "Unauthorized"

**Solution:** Ensure `POLLING_SECRET` matches in:
- Environment variables
- Cron job configuration
- Manual test requests

### No monitors fetched

**Check:**
1. API key is correct (starts with `u` followed by numbers)
2. API key has not expired
3. You have monitors configured in UptimeRobot
4. Check UptimeRobot API status

### Servers not updating

**Check:**
1. Migration ran successfully (`external_id` column exists)
2. Polling logs show successful updates
3. No database errors in logs
4. RLS policies allow service role to write

### Rate Limiting

UptimeRobot API limits:
- **Pro/Enterprise:** Generous limits
- **Free:** 10 requests/minute (should be fine for 5-min polling)

If hitting limits, increase polling interval to 10 or 15 minutes.

## Advanced Configuration

### Change Polling Interval

Edit `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/polling/uptimerobot",
    "schedule": "*/10 * * * *"  // Every 10 minutes
  }]
}
```

Cron expressions:
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours

### Filter Monitors

Modify `lib/polling/uptimerobot.ts` to add filters:

```typescript
async fetchMonitors(): Promise<UptimeRobotMonitor[]> {
  // ... existing code ...
  body: JSON.stringify({
    api_key: this.apiKey,
    format: 'json',
    monitors: '123-456-789', // Specific monitor IDs
    types: '1-3', // Only HTTP(s) and Ping monitors
    statuses: '2-9', // Only up and down (exclude paused)
    // ... rest of config
  }),
}
```

### Custom Host Assignment

Modify the polling route to assign monitors to different hosts based on tags or names:

```typescript
// Example: Assign based on monitor name prefix
let hostId;
if (monitor.friendly_name.startsWith('[AWS]')) {
  hostId = awsHostId;
} else if (monitor.friendly_name.startsWith('[Azure]')) {
  hostId = azureHostId;
} else {
  hostId = defaultHostId;
}
```

## Security Notes

- **POLLING_SECRET** should be strong and unique
- Never commit secrets to Git
- Rotate secrets periodically
- Monitor polling endpoint logs for suspicious activity
- Consider IP whitelisting if using external cron

## Best Practices

1. **Start with longer intervals** (10-15 min) then decrease if needed
2. **Monitor your API usage** in UptimeRobot dashboard
3. **Set up alerts** for polling failures
4. **Keep webhooks enabled** for immediate down notifications
5. **Review logs regularly** to catch issues early

## Next Steps

- ✅ Configure environment variables
- ✅ Run database migration
- ✅ Test polling manually
- ✅ Deploy to Vercel
- ✅ Verify cron is running
- ✅ Monitor for 24 hours to ensure stability

## Support

- UptimeRobot API Docs: https://uptimerobot.com/api/
- Vercel Cron Docs: https://vercel.com/docs/cron-jobs
- Check application logs for detailed error messages
