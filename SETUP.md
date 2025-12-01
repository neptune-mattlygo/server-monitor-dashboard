# Server Monitor Setup Guide

## Overview

This guide will walk you through setting up the Server Monitor application from scratch. The application is now fully scaffolded with:

✅ Complete database schema with RLS policies
✅ Azure AD authentication system
✅ Webhook processing for 4 sources
✅ REST API with role-based access control
✅ Basic UI structure and pages

## What's Been Created

### Database (`supabase/migrations/`)
- **profiles**: User management with Azure AD and local auth
- **azure_sessions**: Secure session tracking (used for both Azure and local auth)
- **hosts**: Data center groupings
- **servers**: Server monitoring
- **server_events**: Event logging
- **webhook_secrets**: Secure webhook auth
- **audit_logs**: Audit trail
- Includes RLS policies, functions, triggers, and seed data

### Authentication (`lib/auth/`, `app/api/auth/`)
- **Azure AD**: MSAL integration with OAuth 2.0
- **Local Auth**: Username/password with Supabase Auth
- Session management with secure cookies
- Token hashing and refresh
- Permission system (admin/editor/viewer)
- Login/signup/callback/logout endpoints

### Webhook System (`lib/webhooks/`, `app/api/webhooks/`)
- UptimeRobot parser and endpoint
- FileMaker Server parser and endpoint
- Backup system parser and endpoint
- AWS S3 parser and endpoint
- Signature validation and rate limiting

### API Routes (`app/api/`)
- **Servers**: CRUD operations with permissions
- **Events**: Filtering, sorting, pagination
- **Dashboard**: Aggregated monitoring data
- **Users**: Admin user management

### UI Components (`components/ui/`)
- Button, Card, Badge, Table
- Avatar, Dropdown Menu
- Ready for shadcn/ui installation

### Pages (`app/`)
- Root layout with global styles
- Landing page with auto-redirect
- Dashboard page (authenticated)
- Auth error page
- Middleware for route protection

## Installation Steps

### 1. Navigate to Project

```bash
cd apps/client-server/server-monitor
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15
- Azure MSAL Node
- Supabase JS Client
- shadcn/ui components
- Testing libraries

### 3. Choose Authentication Method

The application supports **two authentication methods**:

#### Option A: Local Username/Password Authentication (Recommended for Quick Start)

No additional setup required! You can:
- Create accounts directly in the app
- Sign in with email and password
- Skip Azure AD configuration entirely

**This is the easiest way to get started.** The first user to sign up automatically becomes an admin.

#### Option B: Azure AD Enterprise Authentication

For enterprise environments using Azure Active Directory:

##### A. Register Application

1. Visit [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in details:
   - Name: `Server Monitor`
   - Account types: Single or multi-tenant
   - Redirect URI: `http://localhost:3000/api/auth/azure/callback`
5. Click **Register**

##### B. Configure Credentials

1. Note the **Application (client) ID** and **Directory (tenant) ID**
2. Go to **Certificates & secrets** > **New client secret**
3. Copy the secret value immediately (it won't be shown again)
4. Go to **API permissions** > **Add permission**
5. Add **Microsoft Graph** delegated permissions:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`
6. Click **Grant admin consent**

##### C. Update Environment

Edit `.env.local` and add your Azure credentials:

```env
AZURE_AD_CLIENT_ID=your_application_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret_value
AZURE_AD_TENANT_ID=your_directory_tenant_id
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/azure/callback
```

**Note:** You can use both authentication methods simultaneously. Users can choose which method to use at login.

### 4. Generate Secrets

Generate secure secrets for webhooks and sessions:

```bash
# Generate 5 random secrets
for i in {1..5}; do openssl rand -base64 32; done
```

Add these to `.env.local`:

```env
WEBHOOK_SECRET_UPTIMEROBOT=<first_secret>
WEBHOOK_SECRET_FILEMAKER=<second_secret>
WEBHOOK_SECRET_BACKUP=<third_secret>
WEBHOOK_SECRET_AWS_S3=<fourth_secret>
SESSION_SECRET=<fifth_secret>
```

### 5. Start Supabase

```bash
npm run supabase:start
```

This will:
- Start local Supabase instance
- Run database migrations
- Seed with sample data
- Output connection details

The `.env.local` file already has the default local Supabase credentials.

### 6. Start Development Server

```bash
npm run dev
```

Application will be available at http://localhost:3000

### 7. First Login

1. Open http://localhost:3000
2. Click "Don't have an account? Sign up"
3. Create an account with email and password
4. First user automatically becomes **admin**
5. You'll be redirected to the dashboard

### 8. View Server Status Dashboard

The dashboard displays real-time server monitoring:

**Summary Cards (Top Row):**
- Total Servers count
- Online servers (green)
- Offline servers (red)
- Degraded servers (yellow)
- Maintenance servers (blue)

**Server List (Grouped by Host):**
- Servers organized by data center/host location
- Each server card shows:
  - Name and description
  - Status badge (color-coded)
  - URL (clickable link)
  - IP address
  - Last check time

**Sample Data:**
The database was seeded with:
- 3 Hosts (AWS US-East-1, AWS EU-West-1, On-Premises DC)
- 10 Servers (6 up, 2 down, 1 degraded, 1 maintenance)

These will appear immediately on the dashboard!

## Verify Installation

### Check Database

```bash
npm run supabase:status
```

Should show all services running.

### Check Authentication

1. Visit http://localhost:3000
2. Should redirect to /login page
3. Sign up or sign in
4. After authentication, should land on /dashboard showing server status
5. Check browser console for no errors
6. Verify you see the sample servers displayed

### Test API Endpoints

```bash
# Get session (should return your user)
curl http://localhost:3000/api/auth/session \
  -b "server_monitor_session=<your_cookie_value>"

# Get dashboard data
curl http://localhost:3000/api/dashboard \
  -b "server_monitor_session=<your_cookie_value>"
```

### Test Webhooks

```bash
# Test UptimeRobot webhook
curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $(grep WEBHOOK_SECRET_UPTIMEROBOT .env.local | cut -d '=' -f2)" \
  -d '{
    "monitorID": "999",
    "monitorFriendlyName": "Test Monitor",
    "alertTypeFriendlyName": "Up",
    "monitorURL": "https://test.example.com",
    "alertDetails": "Test webhook"
  }'

# Should return: {"success":true,"serverId":"..."}
```

## Working with Server Status

### Viewing Servers

The dashboard at http://localhost:3000 displays all servers grouped by host:

- **Status Colors:**
  - Green badge = Up (operational)
  - Red badge = Down (offline)
  - Yellow badge = Degraded (issues)
  - Blue badge = Maintenance (planned)
  - Gray badge = Unknown

### Adding Servers

**Option 1: Via Webhooks (Automatic)**

Send a webhook to automatically create/update servers:

```bash
curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=" \
  -d '{
    "monitorID": "12345",
    "monitorFriendlyName": "My Production Server",
    "alertTypeFriendlyName": "Up",
    "monitorURL": "https://myserver.com",
    "alertDetails": "Server is online"
  }'
```

**Option 2: Via API (Manual)**

```bash
# Create a server (requires admin/editor role)
curl -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -b "server_monitor_session=<your_cookie>" \
  -d '{
    "name": "My Custom Server",
    "description": "Production web server",
    "url": "https://example.com",
    "ip_address": "192.168.1.100",
    "status": "up",
    "host_id": "<host_uuid_from_database>"
  }'
```

**Option 3: Via Supabase Studio**

1. Open http://localhost:54323
2. Go to **Table Editor** → **servers**
3. Click **Insert** → **Insert row**
4. Fill in the fields and save
5. Refresh dashboard to see changes

### Updating Server Status

```bash
# Update server status
curl -X PATCH http://localhost:3000/api/servers/<server_id> \
  -H "Content-Type: application/json" \
  -b "server_monitor_session=<your_cookie>" \
  -d '{"status": "down"}'
```

### Connecting Real Monitoring Services

**UptimeRobot Setup:**
1. Create a monitor in UptimeRobot
2. Add Alert Contact → Webhook
3. URL: `http://localhost:3000/api/webhooks/uptimerobot`
4. Add custom header: `X-Webhook-Secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=`
5. Servers will auto-create and update on alerts
6. Dashboard updates in real-time when you refresh

## Next Steps

### UI Development

The application has a basic UI. To build the full dashboard:

1. Install additional shadcn/ui components:
   ```bash
   # Example
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add dialog
   ```

2. Create custom components in `components/`:
   - `ServerCard` - Display server status
   - `EventLog` - Filterable event table
   - `UserProfile` - User dropdown menu
   - `ServerGrid` - Dashboard layout

3. Enhance pages in `app/dashboard/`, `app/servers/`, etc.

### Add Monitoring Sources

Configure external services to send webhooks:

#### UptimeRobot
- Add webhook contact in UptimeRobot settings
- Use your production URL: `https://your-domain.com/api/webhooks/uptimerobot`
- Add header: `X-Webhook-Secret: your_secret`

#### FileMaker Server
- Configure in FMS Admin Console
- Point to: `https://your-domain.com/api/webhooks/filemaker`

### Testing

```bash
# Run unit tests
npm test

# Run E2E tests (after implementing Cypress tests)
npm run e2e

# Type checking
npm run type-check
```

### Deploy to Production

1. **Set up Supabase Cloud**:
   - Create project at supabase.com
   - Run migrations: `supabase db push`
   - Get production credentials

2. **Deploy to Vercel**:
   - Push code to GitHub
   - Import in Vercel
   - Add all environment variables
   - Deploy

3. **Update Azure AD**:
   - Add production redirect URI
   - Example: `https://your-app.vercel.app/api/auth/azure/callback`

4. **Configure webhooks** to use production URL

## Troubleshooting

### Issue: Azure AD login fails

**Solution**: 
- Verify client ID, secret, and tenant ID are correct
- Check redirect URI matches exactly
- Ensure API permissions are granted

### Issue: Database migration fails

**Solution**:
```bash
# Reset database
npm run supabase:stop
npm run supabase:start
```

### Issue: Session not persisting

**Solution**:
- Check browser cookies are enabled
- Verify `SESSION_SECRET` is set
- Check for HTTPS issues in production

### Issue: Webhooks return 401

**Solution**:
- Verify webhook secret matches exactly
- Check `X-Webhook-Secret` header is being sent
- Review server logs for detailed error

### Issue: TypeScript errors in IDE

**Solution**:
```bash
# Install dependencies
npm install

# Restart TypeScript server in VSCode
# Command Palette > TypeScript: Restart TS Server
```

## Architecture Overview

```
User → Azure AD → Callback → Create Session → Dashboard
                                    ↓
                            Supabase Profile

External Service → Webhook → Validate → Create Event → Update Server
                                             ↓
                                    Supabase Database

Admin → User Management → Update Role → RLS Policy Check
```

## Security Checklist

- ✅ Azure AD authentication
- ✅ Secure HTTP-only cookies
- ✅ Token hashing in database
- ✅ Row Level Security (RLS)
- ✅ Webhook signature validation
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Role-based permissions

## Support

For issues:
1. Check this guide
2. Review `README.md`
3. Check Supabase logs: `supabase logs`
4. Check Next.js server logs
5. Contact your development team

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Setup Complete!** 🎉

You now have a fully functional server monitoring dashboard with Azure AD authentication. Start building your custom UI and configure webhook sources to begin monitoring your infrastructure.
