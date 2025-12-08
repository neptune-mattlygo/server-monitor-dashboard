# Production Database Setup

## Problem
Production Vercel deployment connects to a separate Supabase instance that doesn't have the schema or data from local development.

## Solution

### 1. Apply All Migrations to Production

Go to your **Supabase Dashboard** → **SQL Editor** and run each migration file:

1. `20241201000000_server_monitoring.sql` - Base tables
2. `20241202000001_add_external_id.sql` - External ID field
3. `20241202000002_add_polling_fields.sql` - Polling fields
4. `20241205000000_status_page_system.sql` - Status page system
5. `20241205000001_notification_history.sql` - Notifications
6. `20241208000000_add_region_to_hosts.sql` - Regions support
7. `20241208000001_add_affected_hosts_to_incidents.sql` - Incident hosts

Or run the combined file: `supabase/migrations/` (all files concatenated)

### 2. Import Your Data

#### Option A: Manual Entry (Recommended for small datasets)
1. Log into your production deployment
2. Go to Dashboard → Admin → Regions
3. Add your regions (Europe, USA East Coast, Manchester, London)
4. Add your hosts with their region assignments
5. Servers will sync automatically from UptimeRobot

#### Option B: SQL Import (For bulk data)

Run these SQL commands in your production Supabase SQL Editor:

**Import Regions:**
```sql
INSERT INTO regions (id, name, slug, description, display_order, is_active, created_at, updated_at) VALUES
('9d7317c7-ee46-40ee-bc0b-fea6dadd00f9', 'Europe', 'europe', '', 0, true, NOW(), NOW()),
('298004d3-6175-4466-a1a7-9c112b420a90', 'USA East Coast', 'usa-east-coast', '', 0, true, NOW(), NOW()),
('97a7e11f-c5e5-4a26-b510-8ac43deb459c', 'Manchester', 'manchester', '', 0, true, NOW(), NOW()),
('4e8ff958-58f1-4b96-af8a-c4597f421800', 'London', 'london', '', 0, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

**Import Hosts:**
```sql
INSERT INTO hosts (id, name, description, region_id, created_at, updated_at) VALUES
('0c42bc98-cdc2-4c8d-a74c-83a3a572c33d', 'UptimeRobot (Ungrouped)', 'Monitors not assigned to any group', NULL, NOW(), NOW()),
('ab68e7df-3131-4b6c-9163-928ddfce77c7', 'fmcloud neptune-1', NULL, '9d7317c7-ee46-40ee-bc0b-fea6dadd00f9', NOW(), NOW()),
('70b8f615-2009-4aa7-ac63-bf12f77dbfaa', 'fmcloud neptune-2', NULL, '9d7317c7-ee46-40ee-bc0b-fea6dadd00f9', NOW(), NOW()),
('f0a6327a-5003-450a-a914-b0179839effc', 'fmcloud neptune-3', 'Travel Places', '9d7317c7-ee46-40ee-bc0b-fea6dadd00f9', NOW(), NOW()),
('62bfef65-37a2-44ca-826d-983634ceb2d0', 'fmcloud neptune-4', 'Time Harvest', '9d7317c7-ee46-40ee-bc0b-fea6dadd00f9', NOW(), NOW()),
('e0ce5f67-9258-49d6-82fe-e5be89e7f50e', 'fmcloud neptune-5', 'Bascule', '298004d3-6175-4466-a1a7-9c112b420a90', NOW(), NOW()),
('016d17df-e451-4849-a6d9-27ad0592fa93', 'ottomatic London', '', '4e8ff958-58f1-4b96-af8a-c4597f421800', NOW(), NOW()),
('9fc2350a-678a-4c75-af1c-a3e0518e4304', 'ottomatic Manchester', '', '97a7e11f-c5e5-4a26-b510-8ac43deb459c', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

**Note:** Servers will be automatically synced from UptimeRobot via the polling endpoint. You don't need to manually import server data.

### 3. Verify in Production

1. Go to your production URL
2. Check Dashboard → should see hosts and servers
3. Check Status Page → should display server statuses
4. Test incident creation with region selection

## Important Notes

- **Two Separate Databases**: Local uses Docker Supabase (port 54321), Production uses cloud Supabase
- **Data Not Shared**: Changes in local don't affect production and vice versa
- **UptimeRobot Sync**: Make sure your production has the correct `UPTIMEROBOT_API_KEY` environment variable
- **Webhook Configuration**: Update UptimeRobot webhooks to point to your production URL

## Environment Variables Checklist

Make sure these are set in **Vercel Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL` - Your production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
- `UPTIMEROBOT_API_KEY` - Your UptimeRobot API key
- `WEBHOOK_SECRET_UPTIMEROBOT` - Webhook validation secret
- `SESSION_SECRET` - Session encryption secret
- `POLLING_SECRET` - Polling endpoint security secret
- All other webhook secrets and API keys
