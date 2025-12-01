# Server Monitoring Dashboard with Azure AD Authentication

A real-time server monitoring dashboard built with Next.js 15, Azure AD authentication, and Supabase. Monitor servers across multiple data centers, receive webhooks from various sources, and manage user access with role-based permissions.

## Features

- **Azure AD Authentication**: Enterprise-grade SSO with Microsoft accounts
- **Real-time Monitoring**: Track server status across multiple hosts/data centers
- **Webhook Integration**: Process webhooks from UptimeRobot, FileMaker Server, backup systems, and AWS S3
- **Event Logging**: Comprehensive event tracking with filtering and search
- **Role-Based Access Control**: Admin, Editor, and Viewer roles with granular permissions
- **Audit Trail**: Complete logging of all user actions
- **Responsive UI**: Built with shadcn/ui and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Azure AD (MSAL Node)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Testing**: Jest + Cypress

## Prerequisites

- Node.js 20.x or higher
- Azure AD tenant and application registration
- Supabase account (or local Supabase setup)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd apps/client-server/server-monitor
npm install
```

### 2. Set Up Azure AD Application

#### Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Server Monitor
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**: 
     - Platform: Web
     - URI: `http://localhost:3000/api/auth/azure/callback`
5. Click **Register**

#### Configure Application Settings

1. **Copy credentials**:
   - Application (client) ID → `AZURE_AD_CLIENT_ID`
   - Directory (tenant) ID → `AZURE_AD_TENANT_ID`

2. **Create client secret**:
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Copy the secret value → `AZURE_AD_CLIENT_SECRET` (shown only once!)

3. **Add API permissions**:
   - Go to **API permissions**
   - Add **Microsoft Graph** > **Delegated permissions**:
     - `User.Read`
     - `email`
     - `profile`
   - Grant admin consent if required

4. **Add production redirect URI**:
   - Go to **Authentication**
   - Add: `https://your-domain.com/api/auth/azure/callback`
   - Enable **Access tokens** and **ID tokens**

### 3. Configure Environment Variables

Update `.env.local` with your Azure AD credentials:

```bash
# Azure AD Configuration
AZURE_AD_CLIENT_ID=your_client_id_from_azure
AZURE_AD_CLIENT_SECRET=your_client_secret_from_azure
AZURE_AD_TENANT_ID=your_tenant_id_from_azure
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/azure/callback

# Supabase Local (default for local development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

Generate secure webhook secrets:

```bash
# Generate random secrets (run 4 times for each webhook source)
openssl rand -base64 32

# Add to .env.local:
WEBHOOK_SECRET_UPTIMEROBOT=your_generated_secret_1
WEBHOOK_SECRET_FILEMAKER=your_generated_secret_2
WEBHOOK_SECRET_BACKUP=your_generated_secret_3
WEBHOOK_SECRET_AWS_S3=your_generated_secret_4

# Generate session secret
SESSION_SECRET=your_generated_session_secret
SESSION_COOKIE_NAME=server_monitor_session
```

### 4. Set Up Local Supabase

```bash
# Start Supabase locally
npm run supabase:start

# This will output your local credentials (already in .env.local)
# The database migration will run automatically
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 6. First Login & Admin Setup

1. Click "Sign in with Microsoft"
2. Authenticate with your Azure AD account
3. You'll be created as a user with 'viewer' role by default
4. Manually update your role to 'admin' in Supabase:

```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@domain.com';
```

5. Refresh the page - you now have admin access!

## Application Structure

```
apps/client-server/server-monitor/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Azure AD authentication
│   │   ├── webhooks/             # Webhook receivers
│   │   ├── servers/              # Server CRUD
│   │   ├── users/                # User management
│   │   └── dashboard/            # Dashboard data
│   ├── dashboard/                # Main dashboard page
│   ├── auth/                     # Auth error pages
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── auth/                     # Authentication logic
│   ├── webhooks/                 # Webhook processing
│   ├── supabase.ts               # Supabase client
│   └── utils.ts                  # Utilities
├── supabase/
│   └── migrations/               # Database migrations
├── middleware.ts                 # Next.js middleware
└── package.json                  # Dependencies
```

## User Roles

### Admin
- Full system access
- Manage users and roles
- Configure webhook secrets
- View all audit logs
- Create/edit/delete servers and hosts

### Editor
- Create and update servers/hosts
- View all monitoring data
- Cannot manage users or webhooks

### Viewer
- Read-only access to dashboard
- View server details and event logs
- Cannot modify any data

## Webhook Configuration

### UptimeRobot

1. Login to UptimeRobot dashboard
2. Go to **Settings** > **Alert Contacts**
3. Add Webhook contact:
   - URL: `https://your-domain.com/api/webhooks/uptimerobot`
   - HTTP Header: `X-Webhook-Secret: your_webhook_secret`
4. Test the integration

### FileMaker Server

1. Open FileMaker Server Admin Console
2. Go to **Configuration** > **Webhooks**
3. Add webhook:
   - URL: `https://your-domain.com/api/webhooks/filemaker`
   - Authentication: `X-Webhook-Secret: your_webhook_secret`
4. Configure events to monitor

### Backup System

Configure your backup software to send notifications to:
- URL: `https://your-domain.com/api/webhooks/backup`
- Header: `X-Webhook-Secret: your_webhook_secret`

### AWS S3

1. Go to AWS S3 Console
2. Configure Event Notifications for your bucket
3. Add webhook endpoint: `https://your-domain.com/api/webhooks/aws-s3`
4. Add authentication via query parameter or header

## Testing Webhooks Locally

```bash
# Test UptimeRobot webhook
curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret_here" \
  -d '{
    "monitorID": "123",
    "monitorFriendlyName": "Test Server",
    "alertTypeFriendlyName": "Up",
    "monitorURL": "https://example.com"
  }'

# Test FileMaker webhook
curl -X POST http://localhost:3000/api/webhooks/filemaker \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret_here" \
  -d '{
    "event": "backup_completed",
    "server": "FileMaker Server Primary",
    "status": "success",
    "severity": "info",
    "timestamp": "2024-12-01T10:30:00Z",
    "details": "Backup completed successfully"
  }'
```

## Database Schema

### Key Tables

- **profiles**: User profiles synced from Azure AD
- **azure_sessions**: Active session tracking
- **hosts**: Data center/host groupings
- **servers**: Individual servers to monitor
- **server_events**: All server events and status changes
- **webhook_secrets**: Secure webhook authentication
- **audit_logs**: Complete audit trail

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables from `.env.example`
4. Deploy!

### Set Up Production Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Copy Project URL and API keys
3. Update production environment variables
4. Run migrations: `supabase db push`

### Update Azure AD Redirect URIs

Add production redirect URI in Azure Portal:
- `https://your-domain.vercel.app/api/auth/azure/callback`

## Development

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Type checking
npm run type-check
```

### Database Management

```bash
# Reset database
npm run supabase:reset

# Check Supabase status
npm run supabase:status

# Stop Supabase
npm run supabase:stop
```

## API Endpoints

### Authentication
- `POST /api/auth/azure/login` - Initiate Azure AD login
- `GET /api/auth/azure/callback` - Azure AD callback
- `POST /api/auth/azure/logout` - Logout
- `GET /api/auth/session` - Get current session

### Servers
- `GET /api/servers` - List all servers
- `POST /api/servers` - Create server (editor+)
- `GET /api/servers/[id]` - Get server details
- `PATCH /api/servers/[id]` - Update server (editor+)
- `DELETE /api/servers/[id]` - Delete server (admin)
- `GET /api/servers/[id]/events` - Get server events

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user role

### Webhooks (Public with validation)
- `POST /api/webhooks/uptimerobot` - UptimeRobot webhooks
- `POST /api/webhooks/filemaker` - FileMaker webhooks
- `POST /api/webhooks/backup` - Backup notifications
- `POST /api/webhooks/aws-s3` - AWS S3 notifications

## Security Features

- Azure AD OAuth 2.0 authentication
- Secure HTTP-only session cookies
- Token hashing in database
- Row Level Security (RLS) policies
- Webhook signature validation
- Rate limiting on webhooks
- Complete audit logging
- Role-based access control

## Troubleshooting

### Authentication Issues

- Verify Azure AD credentials are correct
- Check redirect URI matches exactly
- Ensure API permissions are granted
- Check browser console for errors

### Database Issues

- Run `npm run supabase:status` to check if Supabase is running
- Reset database with `npm run supabase:reset`
- Check migration files in `supabase/migrations/`

### Webhook Issues

- Verify webhook secrets match
- Check request headers and format
- Test locally with curl commands
- Review server logs for errors

## Contributing

This is a custom application. For issues or enhancements, contact the development team.

## License

Proprietary - All rights reserved

## Support

For support, contact your system administrator or development team.
