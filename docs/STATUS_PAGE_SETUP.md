# Status Page System - Setup Guide

## Overview
A complete status page system with incident management, email notifications, and subscriber management.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Resend Email Service (Get API key from https://resend.com)
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
STATUS_PAGE_FROM_EMAIL=status@yourdomain.com
STATUS_PAGE_FROM_NAME="Your Company Status"

# Site URL (for email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production domain
```

## Database Migration

The database migration has been applied successfully. It created the following tables:

- `regions` - Geographic/logical regions for servers
- `clients` - Email subscribers
- `client_subscriptions` - Subscription preferences
- `status_incidents` - Service incidents
- `incident_updates` - Incident timeline updates
- `email_notifications` - Email delivery logs
- `status_page_config` - Branding and configuration

## Admin Features

Access admin features via the "Admin" dropdown in the dashboard header (admins only):

### 1. Regions Management (`/dashboard/admin/regions`)
- Create, edit, and delete regions
- Set display order
- Activate/deactivate regions
- Cannot delete regions with assigned servers

### 2. Incidents Management (`/dashboard/admin/incidents`)
- Create new incidents with:
  - Title, description, type (outage/degraded/maintenance)
  - Severity (critical/major/minor/info)
  - Status (investigating/identified/monitoring/resolved)
  - Affected servers (multi-select)
  - Affected regions (multi-select)
- Add timeline updates to incidents
- Manual notification trigger (Bell icon)
- Filter by status
- Load more pagination

### 3. Clients & Subscribers (`/dashboard/admin/clients`)
- View all email subscribers
- Filter by verified/unverified/unsubscribed
- Manually verify clients
- Delete subscribers
- View subscription counts

### 4. Status Page Configuration (`/dashboard/admin/config`)
- Company name and branding
- Logo and favicon URLs
- Primary color (with color picker)
- Custom domain
- Support contact info
- Display settings (uptime percentage)

## Public Status Page

The public status page is accessible at `/status`:

- Shows overall system status (operational/degraded/outage/maintenance)
- Displays active incidents
- Server statistics
- Email subscription form
- No authentication required

## Email Notification System

### How It Works

1. **Subscription Flow**:
   - User submits email on `/status` page
   - Receives verification email
   - Clicks verification link
   - Gets confirmation email
   - Default subscription: all servers, notify on down/degraded

2. **Incident Notifications**:
   - Admin creates incident and optionally checks "Notify subscribers"
   - Or admin clicks Bell icon on existing incident
   - System fetches verified subscribers
   - Filters based on subscription preferences:
     - All servers
     - Specific affected servers
     - Affected regions
   - Sends batch emails (100 per batch, 1 second delay)
   - Logs to `email_notifications` table
   - Sets `notified_at` on incident (prevents duplicate sends)

3. **Unsubscribe**:
   - One-click unsubscribe link in every email
   - Sets `unsubscribed_at` timestamp
   - Can be manually resubscribed by admin if needed

## Multi-Select Component

The `MultiSelect` component (`components/ui/multi-select.tsx`) uses Command + Popover pattern:

```tsx
<MultiSelect
  options={[{ value: 'id', label: 'Name' }]}
  selected={selectedIds}
  onChange={setSelectedIds}
  placeholder="Select items..."
  emptyMessage="No items found"
/>
```

Features:
- Search/filter
- Selected items shown as badges
- Remove individual selections
- Used in incident form for servers/regions

## API Endpoints

### Admin Endpoints (require admin role)

**Regions:**
- `GET /api/admin/regions` - List all regions
- `POST /api/admin/regions` - Create region
- `PATCH /api/admin/regions/[id]` - Update region
- `DELETE /api/admin/regions/[id]` - Delete region (checks for servers)

**Incidents:**
- `GET /api/admin/incidents?status=all&limit=20&offset=0` - List incidents
- `POST /api/admin/incidents` - Create incident
- `GET /api/admin/incidents/[id]` - Get incident details
- `PATCH /api/admin/incidents/[id]` - Update incident
- `DELETE /api/admin/incidents/[id]` - Delete incident
- `POST /api/admin/incidents/[id]/updates` - Add timeline update
- `POST /api/admin/incidents/[id]/notify` - Send email notifications

**Clients:**
- `GET /api/admin/clients?filter=all&limit=50&offset=0` - List subscribers
- `PATCH /api/admin/clients/[id]` - Update client (verify, edit info)
- `DELETE /api/admin/clients/[id]` - Delete client

**Configuration:**
- `GET /api/admin/config` - Get status page config
- `PATCH /api/admin/config` - Update config

### Public Endpoints (no auth required)

- `GET /api/status` - Get system status and incidents
- `POST /api/status/subscribe` - Subscribe to notifications
- `GET /api/status/verify?token=...` - Verify email subscription
- `GET /api/status/unsubscribe?token=...` - Unsubscribe from notifications

## Usage Examples

### Creating an Incident

1. Navigate to `/dashboard/admin/incidents`
2. Click "Create Incident"
3. Fill in details:
   - Title: "Database Performance Issues"
   - Description: "Experiencing slow query response times"
   - Type: Degraded Performance
   - Severity: Major
   - Select affected servers/regions
   - Check "Notify subscribers" if ready to send emails
4. Click "Create"

### Adding an Update

1. Find incident in incidents table
2. Click message icon (MessageSquare)
3. Select update type (investigating/update/resolved)
4. Enter message
5. Click "Add Update"

### Sending Notifications

Option 1: Check "Notify subscribers" when creating incident
Option 2: Click Bell icon on incident row to manually trigger notifications

## Throttling & Rate Limits

- Email batches: 100 emails per batch
- Delay between batches: 1 second
- Prevents overwhelming email service
- Progress logged to console

## Security

- All admin endpoints require authentication
- RLS policies on database tables:
  - Public read for status/incidents
  - Admin-only write access
- Email verification required for subscriptions
- Unique unsubscribe tokens per subscriber
- Cascade deletes configured for cleanup

## Next Steps

1. Set up Resend account and get API key
2. Configure environment variables
3. Create initial regions via admin UI
4. Test incident creation and notifications
5. Customize branding in configuration
6. Optionally set up custom domain DNS

## Troubleshooting

**Emails not sending:**
- Check `RESEND_API_KEY` is set correctly
- Verify `STATUS_PAGE_FROM_EMAIL` matches verified domain in Resend
- Check console for error logs

**Import errors in IDE:**
- TypeScript server needs reload
- Files exist, just resolution timing issue
- Restart TypeScript server or wait for auto-reload

**Migration issues:**
- Migration has been applied successfully
- Tables created: regions, clients, status_incidents, etc.
- Check Supabase Studio to verify tables

**Admin menu not showing:**
- User must have 'admin' role in profiles table
- Check `isAdmin()` function in `lib/auth/permissions.ts`
- Verify role assignment in database
