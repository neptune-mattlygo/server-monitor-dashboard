# FileMaker Server Settings Management Feature

## Overview

Implement on-demand retrieval and updating of FileMaker Server admin settings via the FileMaker Admin API. This feature allows administrators to view and modify server configuration settings directly from the Server Monitor dashboard without accessing the FileMaker Admin Console.

**Scope**: High-priority settings only (General Config, Web Publishing, Security, Email Notifications)  
**Access**: Admin users only  
**Status**: In Development

## Feature Requirements

### Functional Requirements

1. **On-Demand Settings Retrieval**
   - Fetch settings only when user clicks "Get Settings" button
   - Not fetched by default or automatically
   - Display settings organized by category
   - Show last-updated timestamp and user

2. **Individual Setting Updates**
   - Each setting independently editable
   - Appropriate UI controls (switches, inputs, selects)
   - Client-side validation before API submission
   - Immediate feedback on save success/failure

3. **Security**
   - Admin-only access (via `isAdmin()` check)
   - SMTP password encrypted separately (like admin credentials)
   - On-demand password fetching (not displayed by default)
   - Audit trail of all setting changes

4. **Error Handling**
   - Auto-retry on token expiration (401 errors)
   - Concurrent update warnings
   - Display FileMaker API errors to user
   - Validation errors shown inline per field

### Settings Categories

#### 1. General Configuration
- `cacheSize` (1-1024 MB) - Database cache size
- `maxFiles` (1-125) - Maximum hosted files
- `maxProConnections` (0-2000) - Max FileMaker Pro connections
- `maxPSOS` (0-1000) - Max concurrent server-side scripts
- `useSchedules` (boolean) - Enable/disable schedules

**FileMaker API Endpoint**: `PATCH /api/v2/server/config/general`

#### 2. Web Publishing
- `phpEnabled` (boolean) - PHP web publishing
- `xmlEnabled` (boolean) - XML web publishing
- `xdbcEnabled` (boolean) - ODBC/JDBC access
- `dataApiEnabled` (boolean) - FileMaker Data API
- `odataEnabled` (boolean) - OData publishing
- `webDirectEnabled` (boolean) - WebDirect client access

**FileMaker API Endpoints**:
- `PATCH /api/v2/php/config`
- `PATCH /api/v2/xml/config`
- `PATCH /api/v2/xdbc/config`
- `PATCH /api/v2/fmdapi/config`
- `PATCH /api/v2/fmodata/config`
- `PATCH /api/v2/webdirect/config`

#### 3. Security Configuration
- `requireSecureDB` (boolean) - Require encrypted connections

**FileMaker API Endpoint**: `PATCH /api/v2/server/config/security`

#### 4. Email Notifications
- `smtpServerAddress` (string) - SMTP server hostname/IP
- `smtpServerPort` (1-65535) - SMTP port
- `smtpUsername` (string) - SMTP authentication username
- `smtpPassword` (string, encrypted) - SMTP authentication password
- `emailSenderAddress` (email) - From address
- `emailRecipients` (comma-separated emails) - Notification recipients
- `smtpAuthType` (0-3) - Authentication type (0=None, 1=Login, 2=Plain, 3=CRAM-MD5)
- `smtpSecurity` (0-3) - Security type (0=None, 1=SSL, 2=TLS, 3=STARTTLS)
- `notifyLevel` (0-2) - Notification level (0=None, 1=Errors, 2=All)

**FileMaker API Endpoint**: `POST /api/v2/server/emailsettings`

## Technical Implementation

### Step 1: Database Schema Updates

**New Migration**: `supabase/migrations/YYYYMMDDHHMMSS_add_fm_settings.sql`

```sql
-- Add FileMaker settings storage columns
ALTER TABLE servers ADD COLUMN fm_settings JSONB;
ALTER TABLE servers ADD COLUMN fm_settings_updated_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN fm_settings_error TEXT;
ALTER TABLE servers ADD COLUMN fm_smtp_password TEXT; -- Encrypted separately
ALTER TABLE servers ADD COLUMN fm_settings_updated_by UUID REFERENCES profiles(id);

-- Add setting_change to event_type enum
ALTER TYPE event_type ADD VALUE 'setting_change';

-- Create index for faster settings queries
CREATE INDEX idx_servers_fm_settings_updated_at ON servers(fm_settings_updated_at);
```

**Type Definitions**: Update `lib/supabase.ts`

```typescript
export interface Server {
  // ... existing fields
  fm_settings: FileMakerSettings | null;
  fm_settings_updated_at: string | null;
  fm_settings_error: string | null;
  fm_smtp_password: string | null; // Encrypted
  fm_settings_updated_by: string | null;
}

export interface FileMakerSettings {
  general: GeneralConfig;
  webPublishing: WebPublishing;
  security: SecurityConfig;
  email: EmailNotifications;
}

export interface GeneralConfig {
  cacheSize: number; // 1-1024 MB
  maxFiles: number; // 1-125
  maxProConnections: number; // 0-2000
  maxPSOS: number; // 0-1000
  useSchedules: boolean;
}

export interface WebPublishing {
  phpEnabled: boolean;
  xmlEnabled: boolean;
  xdbcEnabled: boolean;
  dataApiEnabled: boolean;
  odataEnabled: boolean;
  webDirectEnabled: boolean;
}

export interface SecurityConfig {
  requireSecureDB: boolean;
}

export interface EmailNotifications {
  smtpServerAddress: string;
  smtpServerPort: number; // 1-65535
  smtpUsername: string;
  emailSenderAddress: string;
  emailRecipients: string; // Comma-separated
  smtpAuthType: 0 | 1 | 2 | 3;
  smtpSecurity: 0 | 1 | 2 | 3;
  notifyLevel: 0 | 1 | 2;
  // Note: smtpPassword stored separately in fm_smtp_password column
}
```

### Step 2: FileMaker API Client Utility

**New File**: `lib/filemaker/api-client.ts`

**Responsibilities**:
- JWT token caching with 15-minute TTL
- Token auto-refresh on 401 errors (single retry)
- Fetch settings from multiple FileMaker API endpoints
- Update individual settings via appropriate PATCH endpoints
- Normalize responses to `FileMakerSettings` interface
- Typed error handling

**Key Functions**:
```typescript
class TokenCache {
  // Map<serverId, {token: string, expiresAt: Date}>
  // Auto-purge expired tokens
}

async function authenticate(adminUrl: string, username: string, password: string): Promise<string>
// POST to /fmi/admin/api/v2/user/auth with Basic Auth
// Returns JWT token from response.token

async function makeAuthenticatedRequest<T>(
  serverId: string, 
  adminUrl: string,
  endpoint: string,
  options?: RequestInit
): Promise<T>
// Uses TokenCache, auto-retries on 401 once

async function fetchAllSettings(
  serverId: string,
  adminUrl: string, 
  username: string, 
  password: string
): Promise<FileMakerSettings>
// Parallel Promise.all to 9 endpoints
// Normalizes responses to FileMakerSettings structure

async function updateSetting(
  serverId: string,
  adminUrl: string,
  username: string,
  password: string,
  category: 'general' | 'webPublishing' | 'security' | 'email',
  settingKey: string,
  value: unknown
): Promise<void>
// Maps category to correct PATCH endpoint
// Handles field-specific transformations

class FileMakerApiError extends Error {
  code: number;
  details?: unknown;
}
```

**FileMaker API Endpoint Mapping**:
- General: `/api/v2/server/config/general`
- Security: `/api/v2/server/config/security`
- PHP: `/api/v2/php/config`
- XML: `/api/v2/xml/config`
- XDBC: `/api/v2/xdbc/config`
- Data API: `/api/v2/fmdapi/config`
- OData: `/api/v2/fmodata/config`
- WebDirect: `/api/v2/webdirect/config`
- Email: `/api/v2/server/emailsettings`

### Step 3: Settings API Routes

#### Route 1: Get/Update Settings
**File**: `app/api/servers/[id]/fm-settings/route.ts`

**GET Handler**:
1. Verify `isAdmin(user)` - return 403 if not
2. Fetch server from database
3. Decrypt admin credentials using `decrypt()` from `lib/crypto.ts`
4. Call `fetchAllSettings()` from api-client
5. Encrypt SMTP password separately using `encrypt()`
6. Store in `fm_settings`, `fm_smtp_password`, `fm_settings_updated_at`, `fm_settings_updated_by`
7. Return settings with SMTP password masked as `'***'`

**PATCH Handler**:
1. Verify `isAdmin(user)` - return 403 if not
2. Validate request body against Zod schema
3. Decrypt admin credentials
4. If SMTP password in update, encrypt it separately
5. Call `updateSetting()` with auto-retry
6. Refetch settings to get latest state
7. Check if `fm_settings_updated_by !== user.id` - include `concurrentUpdateWarning: true`
8. Create `server_events` record with `event_type: 'setting_change'`
9. Return updated settings

**Payload Schema** (Zod):
```typescript
{
  category: z.enum(['general', 'webPublishing', 'security', 'email']),
  settingKey: z.string(),
  value: z.unknown() // Validated per setting type
}
```

**Event Payload** (audit trail):
```typescript
{
  category: string,
  settingKey: string,
  oldValue: unknown,
  newValue: unknown,
  changedByEmail: string
}
```

#### Route 2: Get SMTP Password
**File**: `app/api/servers/[id]/fm-settings/smtp-password/route.ts`

**GET Handler**:
1. Verify `isAdmin(user)` - return 403 if not
2. Fetch server `fm_smtp_password` column
3. Decrypt using `decrypt()` from `lib/crypto.ts`
4. Return `{ password: decryptedPassword }`

**Pattern**: Follows existing `app/api/servers/[id]/credentials/route.ts`

### Step 4: Settings UI Components

#### Main Settings Panel
**File**: `app/dashboard/components/fm-settings/settings-panel.tsx`

**Structure**:
```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex justify-between items-center">
    <div>
      <h3>FileMaker Server Settings</h3>
      {lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {timestamp} by {user.email}
        </p>
      )}
    </div>
    <Button onClick={fetchSettings} disabled={loading}>
      {loading ? 'Fetching...' : 'Fetch Settings'}
    </Button>
  </div>

  {/* Concurrent Update Warning */}
  {concurrentWarning && (
    <Alert variant="warning">
      Another admin updated settings. Click "Fetch Settings" to refresh.
    </Alert>
  )}

  {/* Error Display */}
  {error && <Alert variant="destructive">{error}</Alert>}

  {/* Recent Changes (collapsible) */}
  <Accordion type="single" collapsible>
    <AccordionItem value="recent-changes">
      <AccordionTrigger>Recent Changes</AccordionTrigger>
      <AccordionContent>
        {/* List of last 10 setting_change events */}
      </AccordionContent>
    </AccordionItem>
  </Accordion>

  {/* Settings Sections */}
  {settings && (
    <>
      <GeneralConfigSection settings={settings.general} onSave={handleSave} />
      <WebPublishingSection settings={settings.webPublishing} onSave={handleSave} />
      <SecuritySection settings={settings.security} onSave={handleSave} />
      <EmailSection settings={settings.email} onSave={handleSave} />
    </>
  )}
</div>
```

**State Management**:
- Fetch settings via GET `/api/servers/[id]/fm-settings`
- Individual saves via PATCH to same endpoint
- Poll events via GET `/api/servers/[id]/events?type=setting_change&limit=10`
- Handle concurrent update warnings from PATCH response

#### Section Components

**File**: `app/dashboard/components/fm-settings/general-config-section.tsx`

**Validation Schema** (Zod):
```typescript
const generalConfigSchema = z.object({
  cacheSize: z.number().int().min(1).max(1024), // FM19 limit
  maxFiles: z.number().int().min(1).max(125), // FM19 limit
  maxProConnections: z.number().int().min(0).max(2000),
  maxPSOS: z.number().int().min(0).max(1000),
  useSchedules: z.boolean()
});
```

**UI Structure**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>General Configuration</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Cache Size */}
    <div className="grid grid-cols-3 gap-4 items-center">
      <Label>Cache Size (MB)</Label>
      <Input 
        type="number" 
        min={1} 
        max={1024}
        value={cacheSize}
        onChange={handleChange}
      />
      <Button onClick={() => saveSetting('cacheSize', cacheSize)}>
        Save
      </Button>
      {/* Show validation error if invalid */}
    </div>
    {/* Repeat for other fields */}
  </CardContent>
</Card>
```

**Similar Files**:
- `web-publishing-section.tsx` - Switch components for boolean toggles
- `security-section.tsx` - Single switch for requireSecureDB
- `email-section.tsx` - Inputs + Selects for enums + password reveal

#### Email Section Special Handling

**File**: `app/dashboard/components/fm-settings/email-section.tsx`

**SMTP Password Field**:
```tsx
<div className="grid grid-cols-3 gap-4 items-center">
  <Label>SMTP Password</Label>
  <div className="relative">
    <Input 
      type={showPassword ? 'text' : 'password'}
      value={password || '***'}
      disabled={!showPassword}
    />
    {!showPassword && (
      <Button 
        variant="ghost" 
        onClick={fetchSmtpPassword}
      >
        Show Password
      </Button>
    )}
  </div>
  <Button onClick={() => saveSetting('smtpPassword', password)}>
    Save
  </Button>
</div>
```

**Fetch Password**:
- GET `/api/servers/[id]/fm-settings/smtp-password`
- Display in input, allow editing
- Encrypt on save via PATCH

**Select Dropdowns**:
```tsx
// Auth Type
<Select value={smtpAuthType} onValueChange={setSmtpAuthType}>
  <SelectItem value="0">None</SelectItem>
  <SelectItem value="1">Login</SelectItem>
  <SelectItem value="2">Plain</SelectItem>
  <SelectItem value="3">CRAM-MD5</SelectItem>
</Select>

// Security Type
<Select value={smtpSecurity} onValueChange={setSmtpSecurity}>
  <SelectItem value="0">None</SelectItem>
  <SelectItem value="1">SSL</SelectItem>
  <SelectItem value="2">TLS</SelectItem>
  <SelectItem value="3">STARTTLS</SelectItem>
</Select>

// Notification Level
<Select value={notifyLevel} onValueChange={setNotifyLevel}>
  <SelectItem value="0">None</SelectItem>
  <SelectItem value="1">Errors Only</SelectItem>
  <SelectItem value="2">All Events</SelectItem>
</Select>
```

#### Integration with Server Edit Dialog

**File**: `app/dashboard/components/server-edit-dialog.tsx`

**Add New Tab**:
```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="backup">Backup Monitoring</TabsTrigger>
    <TabsTrigger value="metadata">FileMaker Metadata</TabsTrigger>
    <TabsTrigger value="settings">FileMaker Settings</TabsTrigger> {/* NEW */}
  </TabsList>
  
  {/* ... existing tabs ... */}
  
  <TabsContent value="settings">
    <SettingsPanel serverId={server.id} />
  </TabsContent>
</Tabs>
```

### Step 5: Audit Trail Implementation

**Migration Update**: Add to event_type enum (already in Step 1)

**Event Creation**: In PATCH handler of `fm-settings/route.ts`

```typescript
// After successful setting update
await supabaseAdmin.from('server_events').insert({
  server_id: serverId,
  event_type: 'setting_change',
  event_source: 'admin_console',
  status: 'info',
  message: `${category}.${settingKey} changed by ${user.email}`,
  payload: {
    category,
    settingKey,
    oldValue: oldSettings[category][settingKey],
    newValue: value,
    changedByEmail: user.email,
    changedById: user.id
  }
});
```

**Display in UI**: Recent Changes accordion in `settings-panel.tsx`

```typescript
// Fetch events
const { data: events } = await fetch(
  `/api/servers/${serverId}/events?type=setting_change&limit=10`
);

// Display
{events.map(event => (
  <div key={event.id} className="flex justify-between py-2">
    <div>
      <span className="font-medium">
        {event.payload.category} → {event.payload.settingKey}
      </span>
      <p className="text-sm text-muted-foreground">
        by {event.payload.changedByEmail}
      </p>
    </div>
    <div className="text-right">
      <Badge variant="outline">{event.payload.oldValue}</Badge>
      <span className="mx-2">→</span>
      <Badge>{event.payload.newValue}</Badge>
      <p className="text-sm text-muted-foreground">
        {formatTimestamp(event.created_at)}
      </p>
    </div>
  </div>
))}
```

**RLS Policy**: Ensure admin-only access to setting_change events

```sql
-- If not already covered by existing RLS
CREATE POLICY "Admin users can view setting changes"
  ON server_events FOR SELECT
  USING (
    event_type = 'setting_change' AND
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

## Validation Rules Reference

All validation rules hardcoded based on FileMaker Server 19 documentation:

| Setting | Type | Min | Max | Notes |
|---------|------|-----|-----|-------|
| cacheSize | number | 1 | 1024 | MB, default 100 |
| maxFiles | number | 1 | 125 | FM19 limit |
| maxProConnections | number | 0 | 2000 | 0 = unlimited |
| maxPSOS | number | 0 | 1000 | 0 = disabled |
| useSchedules | boolean | - | - | - |
| smtpServerPort | number | 1 | 65535 | Standard port range |
| smtpAuthType | enum | 0 | 3 | See mapping below |
| smtpSecurity | enum | 0 | 3 | See mapping below |
| notifyLevel | enum | 0 | 2 | See mapping below |
| emailSenderAddress | email | - | - | RFC 5322 validation |
| emailRecipients | string | - | - | Comma-separated emails |

**Enum Mappings**:
- **smtpAuthType**: 0=None, 1=Login, 2=Plain, 3=CRAM-MD5
- **smtpSecurity**: 0=None, 1=SSL, 2=TLS, 3=STARTTLS
- **notifyLevel**: 0=None, 1=Errors, 2=All

## Security Considerations

1. **Authentication**
   - All endpoints require `isAdmin(user)` check
   - Use existing `getCurrentUser()` from `lib/auth/session.ts`
   - Return 403 Forbidden if not admin

2. **Credential Handling**
   - Admin credentials decrypted only in API routes, never sent to client
   - SMTP password encrypted separately in `fm_smtp_password` column
   - Password fetch requires separate API call (not in default GET)
   - Both use `encrypt()/decrypt()` from `lib/crypto.ts`

3. **API Token Security**
   - JWT tokens cached in server memory only (not persisted)
   - 15-minute TTL, auto-purged
   - Never sent to client
   - Single retry on 401, then fail with clear error

4. **Audit Trail**
   - All setting changes logged to `server_events`
   - Includes old/new values, timestamp, user
   - Admin-only access via RLS
   - Immutable log (no updates/deletes)

5. **Concurrent Updates**
   - Check `fm_settings_updated_by` before returning PATCH response
   - If changed by different user, set `concurrentUpdateWarning: true`
   - Display warning banner prompting refresh
   - Last-write-wins (no locking), but user informed

## Error Handling

### FileMaker API Errors

Common error codes and user-friendly messages:

| Code | Scenario | Message |
|------|----------|---------|
| 401 | Invalid credentials | "Authentication failed. Check admin username/password." |
| 403 | Insufficient privileges | "FileMaker admin account lacks required privileges." |
| 404 | Endpoint not found | "Setting not available on this FileMaker version." |
| 500 | Server error | "FileMaker Server error. Check server logs." |
| Network | Connection failed | "Unable to connect to FileMaker Server." |

### Validation Errors

Display inline next to each field:
```tsx
{errors.cacheSize && (
  <p className="text-sm text-destructive">
    Cache size must be between 1 and 1024 MB
  </p>
)}
```

### Auto-Retry Logic

```typescript
try {
  return await makeRequest();
} catch (error) {
  if (error.code === 401) {
    tokenCache.delete(serverId); // Clear cached token
    return await makeRequest(); // Single retry
  }
  throw error; // Re-throw other errors
}
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Settings fetch displays all categories correctly
- [ ] Last updated timestamp and user shown
- [ ] Validation prevents invalid values
- [ ] Each setting saves individually
- [ ] Concurrent update warning appears when appropriate
- [ ] SMTP password requires separate fetch
- [ ] Recent changes displays correctly
- [ ] Token auto-retry works on expiration
- [ ] Non-admin users get 403 errors
- [ ] FileMaker API errors display user-friendly messages

### Test FileMaker Servers

- Development: `https://dev.neptunecloud.co.uk`
- Staging: TBD
- Production: Test on non-critical servers only

### Mock API (Optional)

For development without live FileMaker servers:
- Create `lib/filemaker/__mocks__/api-client.ts`
- Return static settings data
- Simulate delays and errors
- Toggle via env var `MOCK_FILEMAKER_API=true`

## Future Enhancements (Out of Scope)

1. **Additional Settings Categories**
   - Client session timeouts
   - Database/backup folder paths
   - External authentication providers
   - Plugin management
   - Certificate management

2. **Batch Operations**
   - Apply settings to multiple servers
   - Setting templates/profiles
   - Import/export configurations

3. **Advanced Features**
   - Setting comparison between servers
   - Change history with rollback
   - Scheduled setting backups
   - Alert on setting drift from baseline

4. **Performance**
   - Cache settings in Redis for faster display
   - Optimistic UI updates
   - Background refresh every N minutes

## Dependencies

### Existing
- `@azure/msal-node` - Auth (already installed)
- `zod` - Validation (already installed)
- `shadcn/ui` components (already installed)
- `lib/crypto.ts` - Encryption utilities
- `lib/auth/*` - Permission checking

### New
None - all functionality built on existing stack

## File Checklist

### New Files (9)
- [ ] `supabase/migrations/YYYYMMDDHHMMSS_add_fm_settings.sql`
- [ ] `lib/filemaker/api-client.ts`
- [ ] `app/api/servers/[id]/fm-settings/route.ts`
- [ ] `app/api/servers/[id]/fm-settings/smtp-password/route.ts`
- [ ] `app/dashboard/components/fm-settings/settings-panel.tsx`
- [ ] `app/dashboard/components/fm-settings/general-config-section.tsx`
- [ ] `app/dashboard/components/fm-settings/web-publishing-section.tsx`
- [ ] `app/dashboard/components/fm-settings/security-section.tsx`
- [ ] `app/dashboard/components/fm-settings/email-section.tsx`

### Modified Files (2)
- [ ] `lib/supabase.ts` - Add type definitions
- [ ] `app/dashboard/components/server-edit-dialog.tsx` - Add settings tab

## Implementation Order

1. **Database & Types** (Step 1)
   - Run migration
   - Update type definitions
   - Verify with local Supabase

2. **API Client** (Step 2)
   - Implement token caching
   - Test against dev FileMaker server
   - Verify auto-retry logic

3. **Backend Routes** (Step 3)
   - GET/PATCH settings endpoint
   - SMTP password endpoint
   - Test with Postman/curl

4. **UI Components** (Step 4)
   - General config section first (simplest)
   - Then web publishing, security
   - Email section last (most complex)
   - Integrate into server edit dialog

5. **Testing & Polish**
   - Manual testing checklist
   - Error handling verification
   - UI/UX refinement

## Success Criteria

- [ ] Admin can fetch current settings for any server with admin credentials
- [ ] All 4 categories display with correct values
- [ ] Individual settings can be updated and changes persist
- [ ] SMTP password encrypted and requires explicit fetch
- [ ] Concurrent updates trigger warning banner
- [ ] Setting changes logged to audit trail
- [ ] Non-admin users cannot access any settings functionality
- [ ] Client-side validation prevents invalid values
- [ ] FileMaker API errors display meaningful messages
- [ ] Token expiration handled transparently with auto-retry

## Documentation Updates

After implementation:
- [ ] Update `docs/QUICKSTART.md` with settings management instructions
- [ ] Update `docs/PROJECT_SUMMARY.md` with feature status
- [ ] Add screenshots to this document
- [ ] Document any FileMaker version-specific limitations discovered

## References

- **FileMaker Admin API Docs**: https://dev.neptunecloud.co.uk/fmi/admin/apidoc/
- **Existing Metadata Fetch**: `app/api/servers/[id]/fetch-metadata/route.ts`
- **Credential Encryption**: `lib/crypto.ts`
- **Permission Checks**: `lib/auth/permissions.ts`
- **Server Edit Dialog**: `app/dashboard/components/server-edit-dialog.tsx`
