# Backup Monitoring Feature - Quick Start

## What Was Built

A complete automated backup monitoring system that:
- ✅ Checks all servers for backup freshness on a schedule
- ✅ Sends aggregated email alerts when backups are overdue
- ✅ Provides admin UI for configuration
- ✅ Tracks monitoring history
- ✅ Allows manual test runs

## Files Created

### Database Migration
- `supabase/migrations/20241210190000_backup_monitoring_config.sql`
  - Creates `backup_monitoring_config` table (settings)
  - Creates `backup_monitoring_results` table (history)
  - Sets up RLS policies

### Backend API
- `app/api/cron/backup-check/route.ts` - Automated check endpoint (called by cron)
- `app/api/admin/backup-monitoring/route.ts` - GET/PUT configuration
- `app/api/admin/backup-monitoring/results/route.ts` - GET check history
- `app/api/admin/backup-monitoring/test/route.ts` - POST manual test run

### Email Service
- `lib/email/backup-alerts.ts` - Email template and sending logic

### Frontend UI
- `app/dashboard/admin/backup-monitoring/page.tsx` - Admin page
- `app/admin/components/backup-monitoring-settings.tsx` - Settings component

### Configuration
- Updated `vercel.json` - Added cron job schedule
- Updated `app/dashboard/components/dashboard-header.tsx` - Added menu link
- Updated `.env.example` - Added required environment variables

### Documentation
- `docs/BACKUP_MONITORING.md` - Complete feature documentation

## Setup Steps

### 1. Apply Migration

**Via Supabase Dashboard (Recommended)**:
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20241210190000_backup_monitoring_config.sql`
3. Copy and paste the SQL
4. Run the query

**Via Docker (Local)**:
```bash
docker exec -i supabase-db-server-monitor psql -U postgres -d postgres < supabase/migrations/20241210190000_backup_monitoring_config.sql
```

### 2. Set Environment Variables

Add to your `.env.local` (or Vercel environment variables):

```env
# Required for cron job security
CRON_SECRET=your_random_secret_key

# Required for email notifications (should already exist)
RESEND_API_KEY=your_resend_api_key
STATUS_PAGE_FROM_EMAIL=status@yourdomain.com
STATUS_PAGE_FROM_NAME=Server Monitor
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Generate a secure CRON_SECRET:
```bash
openssl rand -base64 32
```

### 3. Deploy

```bash
git add .
git commit -m "feat: Add automated backup monitoring system"
git push origin main
```

Vercel will automatically:
- Deploy the new API endpoints
- Configure the cron job (daily at 9 AM UTC)
- Apply environment variables

### 4. Configure via UI

1. Log in as admin user
2. Navigate to: **Dashboard** → **Admin** → **Backup Monitoring**
3. Configure:
   - Toggle **Enable Monitoring** ON
   - Set **Alert Threshold** (hours, e.g., 24)
   - Add **Email Recipients**
4. Click **Save Configuration**
5. Click **Run Test Check** to verify setup

## How It Works

### Daily Automated Check (9 AM UTC)

1. Cron job triggers `/api/cron/backup-check`
2. System queries all servers and their backup events
3. Compares last backup timestamp to threshold
4. If servers are overdue:
   - Sends single email to all recipients
   - Lists all overdue servers in table format
   - Logs result to database
5. If all servers current:
   - No email sent
   - Logs "all clear" result

### Email Format

Subject: `⚠️ Backup Alert: N Server(s) Overdue`

Contains:
- Summary of overdue count
- Table with: Server name, Host, Last database, Hours since backup
- Color-coded severity indicators
- Dashboard link
- Threshold and check time

### Manual Test Run

From admin UI:
1. Click **Run Test Check** button
2. System performs same check as cron job
3. Sends real email if servers are overdue
4. Shows results immediately in browser
5. Useful for testing configuration

## Customization

### Change Check Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup-check",
      "schedule": "0 9 * * *"  // Daily at 9 AM UTC
    }
  ]
}
```

Examples:
- `0 */6 * * *` - Every 6 hours
- `0 9,15 * * *` - 9 AM and 3 PM daily
- `0 9 * * 1-5` - 9 AM on weekdays only

### Adjust Threshold

Best practice: Set to 1.5x backup frequency
- Daily backups → 36 hours
- Every 6 hours → 9 hours
- Twice daily → 18 hours

## Troubleshooting

### Cron Not Running

**Check Vercel Dashboard**:
- Project → Settings → Cron Jobs
- Verify job is listed and active

**Test manually**:
```bash
curl -X GET https://your-domain.com/api/cron/backup-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### No Emails Sent

1. Verify Resend API key is valid
2. Check `STATUS_PAGE_FROM_EMAIL` is verified in Resend
3. Ensure monitoring is enabled in UI
4. Confirm email recipients are configured
5. Check `backup_monitoring_results` table for `notification_error`

### False Positives

If servers show as overdue but have backups:
1. Check backup events have correct `event_type`:
   - Must be `backup` or `backup_added`
2. Verify `server_id` matches in `server_events`
3. Check S3 webhook parsing is working

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Environment variables set
- [ ] Can access admin page: `/dashboard/admin/backup-monitoring`
- [ ] Can enable monitoring and save config
- [ ] Can add/remove email recipients
- [ ] **Run Test Check** button works
- [ ] Test email received (if servers are overdue)
- [ ] Check history shows in "Recent Check Results"
- [ ] Cron job appears in Vercel dashboard
- [ ] Manual curl to cron endpoint returns 200

## Next Steps

1. **Monitor for 1 week**: Review check history
2. **Adjust threshold**: Based on actual backup patterns
3. **Refine recipients**: Add/remove as needed
4. **Consider schedule**: Change if 9 AM doesn't work

## Support

See full documentation: `docs/BACKUP_MONITORING.md`

For issues:
1. Check server logs in Vercel
2. Review `backup_monitoring_results` table
3. Test with manual **Run Test Check**
4. Verify Resend email delivery logs
