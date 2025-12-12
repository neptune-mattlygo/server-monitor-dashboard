# Server Monitor - Quick Reference

## 🚀 Quick Commands

```bash
# Install
npm install

# Start Development
npm run dev

# Start Supabase
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Reset Database
npm run supabase:reset

# Run Tests
npm test
npm run e2e

# Build for Production
npm run build

# Type Check
npm run type-check
```

## 🔑 First Time Setup Checklist

- [ ] Run `npm install`
- [ ] (Optional) Register Azure AD application if using Azure SSO
- [ ] Copy Azure credentials to `.env.local` (or skip for local auth only)
- [ ] Webhook secrets already configured in `.env.local`
- [ ] Run `npm run supabase:start`
- [ ] Start dev server with `npm run dev`
- [ ] Visit http://localhost:3000 and create account (first user = admin)
- [ ] View sample servers on dashboard
- [ ] Test webhook with curl (optional)

## 🔐 Default Credentials

### Local Supabase
- **URL**: http://127.0.0.1:54321
- **Studio**: http://localhost:54323
- **API Docs**: http://localhost:54323/project/default/api
- **Anon Key**: Already in `.env.local`
- **Service Role Key**: Already in `.env.local`

### Database
- **Host**: localhost:54322
- **Database**: postgres
- **Username**: postgres
- **Password**: postgres

## 📁 Key Files

### Must Configure
- `.env.local` - Environment variables
- Azure AD app registration

### Core Application
- `app/api/auth/azure/` - Authentication
- `app/api/webhooks/` - Webhook receivers
- `app/api/servers/` - Server management
- `app/dashboard/page.tsx` - Main UI
- `middleware.ts` - Route protection

### Database
- `supabase/migrations/` - Schema
- `lib/supabase.ts` - Client

### Authentication
- `lib/auth/azure-client.ts` - MSAL
- `lib/auth/session.ts` - Sessions
- `lib/auth/permissions.ts` - RBAC

## 🌐 Local URLs

- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **API**: http://localhost:3000/api/*

## 🧪 Test Webhook

```bash
# UptimeRobot (use actual secret from .env.local)
curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=" \
  -d '{"monitorID":"123","monitorFriendlyName":"Test Server","alertTypeFriendlyName":"Up","monitorURL":"https://example.com","alertDetails":"Server online"}'

# FileMaker (server name must match a server's "FileMaker Server Name" field or regular name)
curl -X POST http://localhost:3000/api/webhooks/filemaker \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: dMQyVLS1iJbShBRwpScdJSs0rkDd1Wne78jsJ/b3Vbc=" \
  -d '{"event":"SECURITY","server":"FM Server","error":"1064","message":"Admin account locked due to too many incorrect sign-in attempts","timestamp":"2024-12-01 10:00:00.000 +0000"}'

# Backup (server_name should match a server in your database)
curl -X POST http://localhost:3000/api/webhooks/backup \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: kbWcVfbHgdzL4lO5oBeJ/4h5YZNw/+/FQbbZerQjgbI=" \
  -d '{"job_name":"Daily Backup","server_name":"Backup Server","status":"success","duration":300,"size":"1.5GB","timestamp":"2024-12-01T10:00:00Z"}'

# AWS S3 (token in URL instead of header - SNS compatible)
curl -X POST "http://localhost:3000/api/webhooks/aws-s3?token=hWdh7o6LNUPUR29cX2vwLKMUb8pDN4mveN1krMzYw/4=" \
  -H "Content-Type: application/json" \
  -d '{"operation":"restore","status":"started","object_key":"backup.tar.gz","bucket":"my-bucket"}'
```

## 📊 View Server Dashboard

1. Visit http://localhost:3000
2. Sign up/login (first user = admin)
3. Dashboard shows:
   - **Summary cards**: Total, Up, Down, Degraded, Maintenance counts
   - **Server list**: Grouped by host/data center
   - **Sample data**: 3 hosts, 10 servers (pre-seeded)

**Server Status Colors:**
- 🟢 Green = Up (operational)
- 🔴 Red = Down (offline)  
- 🟡 Yellow = Degraded (issues)
- 🔵 Blue = Maintenance (planned)
- ⚫ Gray = Unknown

## 👤 User Management

### First User (You)
First signup automatically gets **admin** role.

### Promote Other Users to Admin

```sql
-- In Supabase Studio SQL Editor (http://localhost:54323)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Role Capabilities
- **Admin**: Full access (create, update, delete all resources)
- **Editor**: Create and update servers/events
- **Viewer**: Read-only access

## 🎨 Add shadcn/ui Component

```bash
npx shadcn-ui@latest add [component-name]

# Examples:
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
```

## 🐛 Troubleshooting

### Can't see servers on dashboard
- Check Supabase is running: `npm run supabase:status`
- View data in Studio: http://localhost:54323
- Sample data should show 10 servers in 3 hosts
- Refresh browser page

### Auth not working
- For local auth: Just create account at /login
- For Azure: Check credentials in `.env.local`
- Verify redirect URI matches exactly
- Check browser console for errors

### Database errors
- Run `npm run supabase:status`
- Reset: `npm run supabase:stop && npm run supabase:start`
- Check migrations in `supabase/migrations/`

### Webhooks failing (401 error)
- Verify secret matches exactly in `.env.local`
- Check header name: `X-Webhook-Secret`
- Use exact secrets from `.env.local` file
- Review server logs

### Backup webhook "Server not found" error
- Add `server_name` field to payload matching an existing server
- Or create a server with name matching the `server_name` value
- Example: `{"job_name":"Daily Backup","server_name":"Backup Server",...}`

### TypeScript errors
- Run `npm install`
- Restart TypeScript server in VS Code

## 📊 Database Tables

- `profiles` - Users
- `azure_sessions` - Sessions
- `hosts` - Data centers
- `servers` - Servers
- `server_events` - Events
- `webhook_secrets` - Secrets
- `audit_logs` - Audit trail

## 🔒 User Roles

- **Admin**: Everything
- **Editor**: Create/edit servers & hosts
- **Viewer**: Read only

## 🚢 Deploy to Production

1. Create Supabase cloud project
2. Run `supabase db push`
3. Add production redirect URI to Azure AD
4. Deploy to Vercel
5. Add environment variables
6. Update webhook URLs in external services

## 📚 Docs

- `README.md` - Full documentation
- `SETUP.md` - Setup guide
- `PROJECT_SUMMARY.md` - Project overview

## 🆘 Need Help?

1. Read SETUP.md
2. Check browser console
3. Check server logs: `npm run dev`
4. Test APIs with curl
5. Inspect database in Supabase Studio

---

**Quick start**: `npm install` → Configure `.env.local` → `npm run supabase:start` → `npm run dev` → Login → Promote to admin → Done! 🎉
