# Backup Monitoring System

Automated backup monitoring with email alerts for overdue or missing backups.

## Overview

The backup monitoring system automatically checks all servers for backup freshness and sends aggregated email notifications to a distribution list when backups are overdue.

### Key Features

- **Configurable Threshold**: Set maximum hours since last backup before alerting
- **Distribution List**: Email all recipients in a single aggregated message
- **Automated Checks**: Scheduled cron job runs daily (default: 9 AM)
- **Manual Testing**: Test the monitoring system on-demand
- **History Tracking**: View past check results and notification status
- **Enable/Disable**: Turn monitoring on/off without losing configuration

## Architecture

### Database Schema

**`backup_monitoring_config`** - Configuration table (single row)
- `is_enabled` - Enable/disable monitoring globally
- `threshold_hours` - Maximum hours since last backup before alerting
- `email_recipients` - Array of email addresses
- `check_schedule` - Cron schedule (informational, not enforced by DB)
- `last_check_at` - Timestamp of last check execution

**`backup_monitoring_results`** - Historical log of check results
- `check_run_at` - When the check was executed
- `servers_checked` - Total servers checked
- `servers_overdue` - Number of servers with overdue backups
- `overdue_server_ids` - Array of server IDs that were overdue
- `threshold_hours` - Threshold used for this check
- `notification_sent` - Whether email was sent successfully
- `notification_recipients` - Recipients list used
- `notification_error` - Error message if notification failed

### Check Logic

1. **Fetch Configuration**: Load enabled status, threshold, and email list
2. **Query Servers**: Get all servers from database
3. **Query Backup Events**: Get most recent backup event per server (types: `backup`, `backup_added`)
4. **Calculate Threshold**: `threshold_date = now - (threshold_hours * 3600000)`
5. **Identify Overdue Servers**:
   - No backup events recorded → overdue
   - Last backup older than threshold → overdue
6. **Send Aggregated Email**: If overdue servers exist, send single email to all recipients
7. **Log Result**: Save check result to `backup_monitoring_results`
8. **Update Config**: Set `last_check_at` timestamp

### Email Notification

**Format**: Single HTML email sent to all recipients
- Lists all overdue servers in a table
- Shows server name, host, last backup database, hours since backup
- Color-coded severity (warning for threshold, critical for 2x threshold)
- Includes dashboard link
- Displays threshold and check time in footer

**Subject**: `⚠️ Backup Alert: N Server(s) Overdue`

**Severity Levels**:
- **Warning** (🟡): Less than 5 servers overdue
- **Critical** (🔴): 5 or more servers overdue

## Setup

### 1. Apply Migration

Apply the migration to create the configuration and results tables:

```bash
# Via Supabase Dashboard SQL Editor (recommended)
# Copy and run: supabase/migrations/20241210190000_backup_monitoring_config.sql

# Or via Docker (local)
docker exec -i supabase-db-server-monitor psql -U postgres -d postgres < supabase/migrations/20241210190000_backup_monitoring_config.sql
```

### 2. Configure Email Service

Ensure Resend is configured (already in place):

```env
RESEND_API_KEY=your_resend_api_key
STATUS_PAGE_FROM_EMAIL=status@yourdomain.com
STATUS_PAGE_FROM_NAME=Server Monitor
```

### 3. Set Cron Secret

Add a cron secret to environment variables for security:

```env
CRON_SECRET=your_random_secret_key
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 4. Deploy Cron Job

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule**: Daily at 9:00 AM UTC (customize as needed)

For Vercel deployment, this is automatically configured. For other platforms, you'll need to set up a cron job that calls:

```bash
curl -X GET https://your-domain.com/api/cron/backup-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Configuration

### Admin UI

1. Log in as an admin user
2. Navigate to **Dashboard** → **Admin** → **Backup Monitoring**
3. Configure settings:
   - **Enable Monitoring**: Toggle on/off
   - **Alert Threshold**: Set hours (1-168)
   - **Email Distribution List**: Add recipient emails
4. Click **Save Configuration**

### Test the System

Use the **Run Test Check** button to manually trigger a backup check:
- Bypasses schedule, runs immediately
- Shows results: servers checked, servers overdue
- Sends actual email if servers are overdue
- Useful for testing configuration before going live

### Configuration API

For programmatic configuration:

**GET** `/api/admin/backup-monitoring`
- Returns current configuration
- Requires admin authentication

**PUT** `/api/admin/backup-monitoring`
- Updates configuration
- Requires admin authentication
- Body:
  ```json
  {
    "is_enabled": true,
    "threshold_hours": 24,
    "email_recipients": ["admin@example.com", "ops@example.com"]
  }
  ```

**GET** `/api/admin/backup-monitoring/results`
- Returns recent check results (last 10)
- Requires authentication

**POST** `/api/admin/backup-monitoring/test`
- Triggers manual test run
- Requires admin authentication
- Returns check results

## Cron Endpoint

**GET** `/api/cron/backup-check`

Called by Vercel Cron or external scheduler.

**Authentication**: Requires `Authorization: Bearer CRON_SECRET` header

**Response**:
```json
{
  "success": true,
  "message": "Found 2 server(s) with overdue backups",
  "data": {
    "servers_checked": 10,
    "servers_overdue": 2,
    "threshold_hours": 24,
    "notification_sent": true,
    "notification_error": null,
    "overdue_servers": [
      {
        "id": "uuid",
        "name": "FileMaker Server",
        "host": "Production Host",
        "last_backup_at": "2024-12-09T10:00:00Z",
        "hours_since_backup": 30
      }
    ]
  }
}
```

## Monitoring Workflow

### Daily Check (Automated)

1. Cron job triggers at scheduled time (default: 9 AM UTC)
2. System checks all servers for backup freshness
3. If overdue servers found:
   - Email sent to all recipients
   - Result logged with `notification_sent: true`
4. If no overdue servers:
   - No email sent
   - Result logged with `servers_overdue: 0`
5. Configuration updated with `last_check_at` timestamp

### Manual Check (On-Demand)

1. Admin clicks **Run Test Check** in UI
2. Same logic as automated check
3. Immediate feedback in browser
4. Real email sent if servers are overdue

## Backup Detection

The system looks for these event types in `server_events`:
- `event_type = 'backup'` - Legacy backup events
- `event_type = 'backup_added'` - S3 backup events

For each server, the most recent event of either type is used to determine last backup time.

### Overdue Criteria

A server is considered **overdue** if:
- No backup events exist for the server, OR
- Most recent backup event is older than `threshold_hours`

**Example**:
- Threshold: 24 hours
- Current time: 2024-12-10 10:00 AM
- Last backup: 2024-12-09 8:00 AM (26 hours ago)
- **Result**: Server is overdue (26h > 24h)

## Email Template

The notification email includes:

**Header**: Warning/Critical banner with emoji
**Summary**: Count of overdue servers
**Table**: All overdue servers with:
- Server name and host
- Last database backed up
- Hours since last backup
- Last backup timestamp

**Footer**: Threshold setting, check time, dashboard link

**Color Coding**:
- 🟡 Yellow: Server is overdue but less than 2x threshold
- 🔴 Red: Server is overdue more than 2x threshold or no backup recorded

## Troubleshooting

### No Emails Being Sent

1. Check Resend configuration:
   - `RESEND_API_KEY` set?
   - API key valid?
   - `STATUS_PAGE_FROM_EMAIL` is verified domain?

2. Check monitoring enabled:
   - Navigate to Backup Monitoring page
   - Ensure toggle is ON

3. Check email list:
   - At least one recipient configured?
   - Emails valid format?

4. Check for overdue servers:
   - Are there actually servers without recent backups?
   - Use **Run Test Check** to see results

5. Review error logs:
   - Check `backup_monitoring_results.notification_error`
   - Check server logs for email sending errors

### Cron Not Running

1. **Vercel**: Check Cron dashboard
   - Go to Vercel project → Settings → Cron
   - Verify job is active

2. **Other platforms**: Set up manual cron
   ```bash
   # crontab entry
   0 9 * * * curl -X GET https://your-domain.com/api/cron/backup-check \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Test manually**:
   ```bash
   curl -X GET https://your-domain.com/api/cron/backup-check \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### False Positives

If a server is marked as overdue but has backups:

1. Check backup event types:
   - Only `backup` and `backup_added` types are tracked
   - Verify webhook is sending correct `event_type`

2. Check S3 parsing:
   - Verify S3 events are being parsed correctly
   - Check `backup_database` field is populated

3. Verify server ID matches:
   - Backup events must have correct `server_id`
   - Check webhook is mapping to correct server

### Threshold Too Aggressive

If you're getting too many alerts:

1. Increase threshold hours (e.g., 24 → 48)
2. Check backup frequency:
   - Are backups actually running daily?
   - Adjust threshold to match backup schedule

### Test Run Fails

If **Run Test Check** button fails:

1. Check browser console for errors
2. Verify admin role:
   - Only admins can run test checks
   - Check `profiles.role = 'admin'`

3. Check `CRON_SECRET` is set:
   - Test endpoint uses cron endpoint internally
   - Requires `CRON_SECRET` environment variable

## Best Practices

1. **Threshold Setting**:
   - Set to 1.5x your backup frequency
   - Example: Daily backups → 36 hour threshold
   - Allows missed backups without false alarms

2. **Distribution List**:
   - Include ops team, not entire organization
   - Use team aliases (e.g., `ops@company.com`)
   - Keep list focused on actionable recipients

3. **Schedule**:
   - Run checks after expected backup window
   - Example: Backups at 2 AM → Check at 9 AM
   - Gives time for backup completion

4. **Testing**:
   - Use **Run Test Check** before enabling
   - Verify email formatting and recipients
   - Confirm threshold is appropriate

5. **Monitoring**:
   - Review check history weekly
   - Look for patterns in overdue servers
   - Adjust threshold if needed

## Future Enhancements

Potential improvements:

- [ ] Per-server threshold configuration
- [ ] Exclude specific servers from monitoring
- [ ] Multiple notification channels (Slack, SMS)
- [ ] Dashboard widget showing backup status
- [ ] Backup size/duration tracking
- [ ] Backup success rate metrics
- [ ] Historical backup charts

## Migration Rollback

If you need to remove the backup monitoring system:

```sql
-- Drop tables
DROP TABLE IF EXISTS backup_monitoring_results;
DROP TABLE IF EXISTS backup_monitoring_config;

-- Remove cron job from vercel.json
-- Remove admin menu item from dashboard-header.tsx
```

## Support

For issues or questions:
1. Check server logs: `/api/cron/backup-check` endpoint
2. Review `backup_monitoring_results` table for error details
3. Test with **Run Test Check** button
4. Verify Resend email delivery logs
