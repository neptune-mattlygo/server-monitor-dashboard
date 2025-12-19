# Server Monitor - AI Coding Agent Instructions

## Project Overview
Enterprise server monitoring dashboard with Azure AD/local auth, multi-source webhook processing (UptimeRobot, FileMaker, Backup systems, AWS S3), and role-based access control. Built on Next.js 15 App Router + Supabase PostgreSQL with Row Level Security.

## Essential Architecture

### Dual Authentication System
- **Azure AD**: OAuth 2.0 via `@azure/msal-node` for enterprise SSO
- **Local Auth**: Username/password stored in Supabase `profiles` table
- Both use **unified session management** via `azure_sessions` table (despite naming, serves both auth methods)
- Sessions stored as SHA-256 hashed tokens in HTTP-only cookies (`server_monitor_session`)
- All auth logic in [lib/auth/](apps/client-server/server-monitor/lib/auth/) - never duplicate session handling

### API Route Protection Pattern
Every authenticated API route follows this exact pattern (see [app/api/servers/route.ts](apps/client-server/server-monitor/app/api/servers/route.ts)):
```typescript
import { getCurrentUser } from '@/lib/auth/session';
import { canCreate, canView } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canView(user, 'server')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of logic
}
```
Never bypass permission checks. Use `supabaseAdmin` for server-side queries to bypass RLS.

### Webhook Security Architecture
- All webhook endpoints in [app/api/webhooks/](apps/client-server/server-monitor/app/api/webhooks/) use **signature validation**
- Secrets stored in `.env.local` as `WEBHOOK_SECRET_<SOURCE>` (e.g., `WEBHOOK_SECRET_UPTIMEROBOT`)
- Rate limiting via `isRateLimited()` from [lib/webhooks/validators.ts](apps/client-server/server-monitor/lib/webhooks/validators.ts)
- Each webhook has dedicated parser in [lib/webhooks/parsers.ts](apps/client-server/server-monitor/lib/webhooks/parsers.ts) to normalize payloads
- Webhook routes are **public** (excluded from middleware) but internally secured

### Database Patterns
- **Two Supabase clients**: `supabase` (client, respects RLS) vs `supabaseAdmin` (server, bypasses RLS)
- Always use `supabaseAdmin` in API routes for server-side operations
- Type definitions in [lib/supabase.ts](apps/client-server/server-monitor/lib/supabase.ts) - import types, don't redefine
- Critical columns: `servers.metadata` (JSONB), `server_events.payload` (JSONB), `profiles.role` (enum: admin/editor/viewer)
- Schema in [supabase/migrations/20241201000000_server_monitoring.sql](apps/client-server/server-monitor/supabase/migrations/20241201000000_server_monitoring.sql)

### Role Hierarchy & Permissions
Roles (lowest to highest): `viewer` → `editor` → `admin`
- **Viewer**: Read-only access to servers/events/dashboard
- **Editor**: Create/update servers and hosts
- **Admin**: Full access including user management
- Use hierarchical checks: `hasRole(user, 'editor')` returns true for editors AND admins
- Defined in [lib/auth/permissions.ts](apps/client-server/server-monitor/lib/auth/permissions.ts)

## Critical Workflows

### Development Setup
```bash
cd apps/client-server/server-monitor
npm install
npm run supabase:start  # Starts local Supabase on port 54321
npm run dev             # Next.js on port 3000
```
First signup becomes admin automatically (see migration seed data logic).

### Testing Webhooks Locally
Use [scripts/test-webhook.sh](apps/client-server/server-monitor/scripts/test-webhook.sh) or:
```bash
curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"emailSubject":"[Down] Server XYZ","emailBody":"..."}'
```

### Adding New Webhook Sources
1. Add secret to `.env.local` as `WEBHOOK_SECRET_NEWSOURCE`
2. Define types in [lib/webhooks/types.ts](apps/client-server/server-monitor/lib/webhooks/types.ts)
3. Create parser in [lib/webhooks/parsers.ts](apps/client-server/server-monitor/lib/webhooks/parsers.ts)
4. Add validator to [lib/webhooks/validators.ts](apps/client-server/server-monitor/lib/webhooks/validators.ts)
5. Create route in `app/api/webhooks/newsource/route.ts` following UptimeRobot pattern
6. Update `event_source` enum in migration (requires new migration file)

### Deploying to Vercel
- Set all env vars from `.env.local` in Vercel dashboard
- Use production Supabase URLs (not localhost)
- Add production callback URL to Azure AD app registration: `https://yourdomain.com/api/auth/azure/callback`
- Cron jobs via Vercel Cron (see [vercel.json](apps/client-server/server-monitor/vercel.json))

## Project-Specific Conventions

### Middleware Exclusions
[middleware.ts](apps/client-server/server-monitor/middleware.ts) excludes:
- `/api/auth/*` (auth endpoints)
- `/api/webhooks/*` (validated internally)
- `/api/cron/*` (Vercel cron jobs)
- `/status` (public status page)

### Credential Encryption
- Server admin passwords encrypted via [lib/crypto.ts](apps/client-server/server-monitor/lib/crypto.ts) using AES-256-GCM
- Requires `ENCRYPTION_KEY` (64 hex chars) in `.env.local`
- Never log or return decrypted credentials in API responses

### shadcn/ui Components
- Use existing components from [components/ui/](apps/client-server/server-monitor/components/ui/)
- Install new ones via `npx shadcn@latest add <component>`
- Already configured in [components.json](apps/client-server/server-monitor/components.json)

### Event Logging Pattern
Every server status change creates `server_events` record:
```typescript
await supabaseAdmin.from('server_events').insert({
  server_id: serverId,
  event_type: 'status_change',
  event_source: 'uptimerobot',
  status: 'down',
  message: 'Server went down',
  payload: { /* original webhook data */ }
});
```

## Key Documentation
- [docs/QUICKSTART.md](apps/client-server/server-monitor/docs/QUICKSTART.md) - Commands reference
- [docs/PROJECT_SUMMARY.md](apps/client-server/server-monitor/docs/PROJECT_SUMMARY.md) - Feature status
- [docs/N8N_WEBHOOK_SETUP.md](apps/client-server/server-monitor/docs/N8N_WEBHOOK_SETUP.md) - Webhook integration with n8n
- [docs/BACKUP_MONITORING.md](apps/client-server/server-monitor/docs/BACKUP_MONITORING.md) - Backup monitoring system
- [docs/DIRECTORY.md](apps/client-server/server-monitor/docs/DIRECTORY.md) - Complete file structure

## Common Pitfalls
- ❌ Don't use `supabase` client in API routes - use `supabaseAdmin`
- ❌ Don't skip permission checks - every authenticated route needs `getCurrentUser()` + `canXXX()`
- ❌ Don't add auth to webhook routes in middleware - they're internally secured
- ❌ Don't store plaintext passwords - use `encrypt()` from crypto.ts
- ❌ Don't hardcode role checks - use `hasRole()` for hierarchy awareness
