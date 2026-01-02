# Component Test Plan Matrix

This document outlines what needs to be tested for each component in the application.

## Dashboard Components

### `dashboard-client.tsx`
- [ ] Renders loading skeleton initially
- [ ] Fetches and displays servers on mount
- [ ] Displays servers grouped by host
- [ ] Displays all servers in flat view
- [ ] Toggles between host view and all servers view
- [ ] Filters servers by status (all/up/down/degraded/maintenance)
- [ ] Filters servers by host
- [ ] Searches servers by name
- [ ] Polls for updates every 30 seconds
- [ ] Stops polling on unmount
- [ ] Shows empty state when no servers
- [ ] Handles API errors gracefully
- [ ] Shows correct actions based on user role (viewer/editor/admin)

### `host-server-table.tsx`
- [ ] Groups servers by host correctly
- [ ] Displays host name and description
- [ ] Shows server count per host
- [ ] Renders server rows with correct status
- [ ] Shows relative time for last check
- [ ] Expands/collapses host groups
- [ ] Shows edit button for editors/admins only
- [ ] Opens edit host dialog
- [ ] Opens add server dialog for specific host
- [ ] Handles empty host gracefully

### `all-servers-table.tsx`
- [ ] Displays all servers in flat list
- [ ] Shows correct status badges
- [ ] Displays server type icons
- [ ] Shows last checked time
- [ ] Renders host name column
- [ ] Opens server event history dialog
- [ ] Opens server edit dialog (editor/admin)
- [ ] Sorts by column (name, status, type, host, last checked)
- [ ] Handles pagination if implemented

### `add-server-dialog.tsx`
- [ ] Opens dialog on trigger
- [ ] Validates required fields (name, URL)
- [ ] Validates URL format
- [ ] Shows host selection dropdown
- [ ] Shows server type selection
- [ ] Shows optional UptimeRobot monitor ID field
- [ ] Shows optional admin credentials fields
- [ ] Validates form on submit
- [ ] Calls create API with correct data
- [ ] Shows success message on create
- [ ] Shows error message on failure
- [ ] Clears form after successful create
- [ ] Closes dialog after create
- [ ] Disables submit during loading

### `server-edit-dialog.tsx`
- [ ] Pre-fills form with server data
- [ ] Allows editing all server fields
- [ ] Validates changes
- [ ] Calls update API with changes
- [ ] Shows success message on update
- [ ] Shows error message on failure
- [ ] Shows delete confirmation
- [ ] Calls delete API on confirm
- [ ] Closes dialog after save/delete
- [ ] Only visible to editors/admins

### `add-host-dialog.tsx`
- [ ] Opens dialog on trigger
- [ ] Validates required fields (name, region)
- [ ] Shows region selection dropdown
- [ ] Shows optional description field
- [ ] Calls create API with correct data
- [ ] Shows success message on create
- [ ] Shows error message on failure
- [ ] Clears form after create
- [ ] Closes dialog after create

### `edit-host-dialog.tsx`
- [ ] Pre-fills form with host data
- [ ] Allows editing name, region, description
- [ ] Calls update API with changes
- [ ] Shows success message on update
- [ ] Shows delete confirmation with warning about servers
- [ ] Prevents delete if host has servers (or cascades)
- [ ] Closes dialog after save/delete

### `server-event-history-dialog.tsx`
- [ ] Fetches events for specific server
- [ ] Displays events in chronological order
- [ ] Shows event type, source, status, message
- [ ] Displays relative timestamps
- [ ] Shows event payload in expandable section
- [ ] Paginates events if many
- [ ] Shows loading state
- [ ] Shows empty state for no events
- [ ] Auto-refreshes events

### `dashboard-header.tsx`
- [ ] Displays page title
- [ ] Shows filter controls
- [ ] Shows search input
- [ ] Shows view toggle (host/all)
- [ ] Shows add server button (editor/admin)
- [ ] Shows add host button (editor/admin)
- [ ] Hides action buttons for viewers
- [ ] Shows user menu
- [ ] Shows logout option

### `relative-time.tsx`
- [ ] Displays "just now" for recent times
- [ ] Displays "X minutes ago"
- [ ] Displays "X hours ago"
- [ ] Displays "X days ago"
- [ ] Updates over time
- [ ] Handles invalid dates gracefully

### `logo-upload-settings.tsx`
- [ ] Shows current logo if exists
- [ ] Shows file upload input
- [ ] Validates file type (images only)
- [ ] Validates file size
- [ ] Shows preview before upload
- [ ] Uploads to Supabase Storage
- [ ] Shows upload progress
- [ ] Shows success message
- [ ] Shows error message
- [ ] Updates logo URL in database
- [ ] Only visible to admins

### `metadata-refresh-settings.tsx`
- [ ] Shows current refresh interval
- [ ] Shows interval selection dropdown
- [ ] Updates refresh interval
- [ ] Validates interval (min/max)
- [ ] Shows success message
- [ ] Shows error message
- [ ] Only visible to admins

## Events Components

### `events-page-client.tsx`
- [ ] Renders loading skeleton initially
- [ ] Fetches and displays events
- [ ] Shows filter controls
- [ ] Filters by server
- [ ] Filters by event source
- [ ] Filters by event type
- [ ] Filters by status
- [ ] Filters by date range
- [ ] Searches event messages
- [ ] Paginates results
- [ ] Shows page size selector
- [ ] Auto-refreshes events
- [ ] Stops refresh on unmount

### `events-table-client.tsx`
- [ ] Displays events in table format
- [ ] Shows all event columns
- [ ] Expands row to show payload
- [ ] Shows relative timestamps
- [ ] Shows status badges
- [ ] Shows source badges
- [ ] Links to related server
- [ ] Handles empty state
- [ ] Handles loading state
- [ ] Handles error state

### `events-skeleton.tsx`
- [ ] Shows loading skeleton
- [ ] Matches table structure
- [ ] Animates correctly

## Status Page Components

### `status-page-client.tsx`
- [ ] Accessible without authentication
- [ ] Displays custom logo if configured
- [ ] Shows all server statuses
- [ ] Groups servers by host
- [ ] Shows active incidents
- [ ] Shows incident timeline
- [ ] Auto-refreshes every 30 seconds
- [ ] Shows last updated time
- [ ] Shows overall system status
- [ ] Calculates uptime percentage
- [ ] Shows degraded status if any server down
- [ ] Shows maintenance mode if configured
- [ ] Mobile responsive

## Admin Components

### User Management
- [ ] Lists all users
- [ ] Shows user role badges
- [ ] Shows auth type (Azure/local)
- [ ] Allows creating new users
- [ ] Validates email format
- [ ] Validates password strength
- [ ] Allows editing user details
- [ ] Allows changing user roles
- [ ] Prevents self-demotion (admin can't remove own admin role)
- [ ] Allows deleting users
- [ ] Shows confirmation before delete
- [ ] Only visible to admins

### Incident Management
- [ ] Lists all incidents
- [ ] Shows active/resolved status
- [ ] Allows creating incidents
- [ ] Validates incident fields
- [ ] Allows editing incidents
- [ ] Allows resolving incidents
- [ ] Shows incident history
- [ ] Links incidents to servers
- [ ] Only visible to admins

## UI Components (Customized)

### `multi-select.tsx`
- [ ] Displays selected items
- [ ] Opens dropdown on click
- [ ] Allows selecting multiple items
- [ ] Allows deselecting items
- [ ] Shows search input for filtering
- [ ] Handles keyboard navigation
- [ ] Closes on outside click
- [ ] Handles disabled state
- [ ] Handles empty state

## API Routes Testing

### Authentication Routes
- [ ] POST `/api/auth/local/login` - Local login
- [ ] POST `/api/auth/local/signup` - Local signup
- [ ] GET `/api/auth/azure/login` - Azure AD redirect
- [ ] GET `/api/auth/azure/callback` - Azure AD callback
- [ ] GET `/api/auth/logout` - Session termination

### Server Routes
- [ ] GET `/api/servers` - List servers
- [ ] POST `/api/servers` - Create server
- [ ] PUT `/api/servers/[id]` - Update server
- [ ] DELETE `/api/servers/[id]` - Delete server
- [ ] GET `/api/servers/[id]/events` - Get server events

### Host Routes
- [ ] GET `/api/hosts` - List hosts
- [ ] POST `/api/hosts` - Create host
- [ ] PUT `/api/hosts/[id]` - Update host
- [ ] DELETE `/api/hosts/[id]` - Delete host

### Webhook Routes
- [ ] POST `/api/webhooks/uptimerobot` - UptimeRobot webhook
- [ ] POST `/api/webhooks/filemaker` - FileMaker webhook
- [ ] POST `/api/webhooks/backup` - Backup webhook
- [ ] POST `/api/webhooks/n8n` - n8n webhook

### User Routes
- [ ] GET `/api/users` - List users (admin)
- [ ] POST `/api/users` - Create user (admin)
- [ ] PUT `/api/users/[id]` - Update user (admin)
- [ ] DELETE `/api/users/[id]` - Delete user (admin)

### Event Routes
- [ ] GET `/api/events` - List events with filters
- [ ] GET `/api/events/[id]` - Get event details

## Library Functions Testing

### Authentication (`lib/auth/`)
- [ ] `getCurrentUser()` - Retrieves user from session
- [ ] `createSession()` - Creates new session
- [ ] `deleteSession()` - Deletes session
- [ ] `hashToken()` - Hashes session token
- [ ] `hasRole()` - Checks role hierarchy
- [ ] `canView()` - Permission check
- [ ] `canCreate()` - Permission check
- [ ] `canUpdate()` - Permission check
- [ ] `canDelete()` - Permission check

### Webhooks (`lib/webhooks/`)
- [ ] `parseUptimeRobotWebhook()` - Parse UR payload
- [ ] `parseFileMakerWebhook()` - Parse FM payload
- [ ] `parseBackupWebhook()` - Parse backup payload
- [ ] `parseN8nWebhook()` - Parse n8n payload
- [ ] `validateWebhookSignature()` - Validate secret
- [ ] `isRateLimited()` - Check rate limit
- [ ] `extractServerName()` - Extract from payload
- [ ] `determineStatus()` - Map to status enum

### Crypto (`lib/crypto.ts`)
- [ ] `encrypt()` - AES-256-GCM encryption
- [ ] `decrypt()` - AES-256-GCM decryption
- [ ] `generateIV()` - Random IV generation
- [ ] Error handling for invalid keys
- [ ] Error handling for corrupted data

### Polling (`lib/polling/`)
- [ ] `fetchUptimeRobotMonitors()` - Fetch monitors
- [ ] `updateServerStatuses()` - Update from monitors
- [ ] `matchMonitorToServer()` - Match by ID
- [ ] Rate limiting compliance
- [ ] Error handling for API failures

## E2E User Journeys

### Authentication Flow
1. [ ] User visits app (redirects to login)
2. [ ] User enters credentials
3. [ ] User clicks submit
4. [ ] User is redirected to dashboard
5. [ ] Session persists across page loads
6. [ ] User logs out
7. [ ] User is redirected to login

### Dashboard Management
1. [ ] Admin logs in
2. [ ] Admin adds new host
3. [ ] Admin adds server to host
4. [ ] Server appears in dashboard
5. [ ] Admin edits server details
6. [ ] Admin views event history
7. [ ] Admin deletes server
8. [ ] Admin deletes host

### Webhook Integration
1. [ ] External system sends webhook
2. [ ] Webhook is validated
3. [ ] Event is created
4. [ ] Server status is updated
5. [ ] Dashboard reflects new status
6. [ ] Event appears in events page

### Admin Operations
1. [ ] Admin creates new user
2. [ ] Admin assigns editor role
3. [ ] Editor logs in
4. [ ] Editor can create/edit servers
5. [ ] Editor cannot access admin panel
6. [ ] Admin changes editor to viewer
7. [ ] Viewer can only view data

### Public Status Page
1. [ ] User visits /status (no auth)
2. [ ] Status page loads
3. [ ] Shows all servers
4. [ ] Shows incidents
5. [ ] Auto-refreshes
6. [ ] Custom branding appears

## Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Event list handles 1000+ events
- [ ] Polling doesn't block UI
- [ ] Webhooks process in < 500ms
- [ ] Database queries are optimized
- [ ] Images are optimized
- [ ] Bundle size is reasonable

## Security Testing

- [ ] Authentication required for protected routes
- [ ] Role-based access enforced
- [ ] Webhook signatures validated
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection enabled
- [ ] Secrets not exposed in client
- [ ] Passwords hashed with bcrypt
- [ ] Sessions expire appropriately
- [ ] HTTP-only cookies used

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Form errors announced
- [ ] Skip links present
- [ ] Semantic HTML used
