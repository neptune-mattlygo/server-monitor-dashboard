# Feature: Disabled Backup Monitoring Message

## Branch
`feat-disabled-backup-monitoring-message`

## Overview
This feature adds mandatory tracking for servers with disabled backup monitoring to prevent them from being forgotten. When backup monitoring is disabled for a server, users must now provide:
1. **Reason** - Why backup monitoring is being disabled
2. **Review Date** - When the decision should be reviewed

Both fields are **required** when disabling backup monitoring.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20251219000000_add_backup_monitoring_disabled_fields.sql`

- Added `backup_monitoring_disabled_reason` (TEXT) column to `servers` table
- Added `backup_monitoring_review_date` (DATE) column to `servers` table
- Added database constraint to enforce:
  - When `backup_monitoring_excluded = true`: Both reason and review date must be provided
  - When `backup_monitoring_excluded = false`: Both fields must be NULL
  - Prevents partial data entry

### 2. TypeScript Types
**File:** `lib/supabase.ts`

Updated `Server` type to include:
```typescript
backup_monitoring_excluded?: boolean;
backup_monitoring_disabled_reason?: string | null;
backup_monitoring_review_date?: string | null;
```

### 3. UI Components

#### Server Edit Dialog
**File:** `app/dashboard/components/server-edit-dialog.tsx`

- Added conditional UI that shows reason and review date fields when backup monitoring is toggled off
- Implemented client-side validation:
  - Reason field is required (textarea for longer explanations)
  - Review date is required (date picker with min value = today)
  - Shows asterisk (*) to indicate required fields
  - Displays validation errors prominently
- Auto-clears reason and review date when re-enabling backup monitoring

#### Server Tables
**Files:** 
- `app/dashboard/components/host-server-table.tsx`
- `app/dashboard/components/all-servers-table.tsx`

- Updated Server interfaces to include new fields
- Enhanced hover cards on the "eye-off" icon to display:
  - Reason for disabling
  - Review date
  - Wider hover card (w-80) to accommodate longer reason text

### 4. API Validation
**Files:**
- `app/api/servers/route.ts` (POST)
- `app/api/servers/[id]/route.ts` (PATCH)

Added server-side validation for both create and update operations:
- Returns 400 error if `backup_monitoring_excluded = true` but reason is missing
- Returns 400 error if `backup_monitoring_excluded = true` but review date is missing
- Auto-clears both fields when `backup_monitoring_excluded = false`

## Testing Instructions

### Prerequisites
1. Start Docker Desktop
2. Start local Supabase:
   ```bash
   cd apps/client-server/server-monitor
   npm run supabase:start
   ```

### Apply Migration
```bash
cd apps/client-server/server-monitor
npm run supabase:migration:apply
# Or manually:
supabase migration up
```

### Test Cases

#### Test 1: Edit Existing Server - Disable Backup Monitoring
1. Start dev server: `npm run dev`
2. Navigate to dashboard
3. Click edit on any server
4. Toggle "Exclude from Backup Monitoring" to ON
5. **Expected:** Reason and Review Date fields appear
6. Try to save without filling them
7. **Expected:** Error message displayed
8. Fill in both fields and save
9. **Expected:** Save succeeds
10. Hover over eye-off icon on server row
11. **Expected:** Hover card shows reason and review date

#### Test 2: Re-enable Backup Monitoring
1. Edit a server with backup monitoring disabled
2. Toggle "Exclude from Backup Monitoring" to OFF
3. Save
4. **Expected:** Save succeeds, reason/date fields cleared
5. **Expected:** Eye-off icon no longer shown

#### Test 3: API Validation
Using curl or Postman:
```bash
# Should fail - reason missing
curl -X PATCH http://localhost:3000/api/servers/{server_id} \
  -H "Content-Type: application/json" \
  -H "Cookie: server_monitor_session=YOUR_SESSION" \
  -d '{
    "backup_monitoring_excluded": true,
    "backup_monitoring_review_date": "2025-01-15"
  }'
# Expected: 400 error

# Should succeed - both fields provided
curl -X PATCH http://localhost:3000/api/servers/{server_id} \
  -H "Content-Type: application/json" \
  -H "Cookie: server_monitor_session=YOUR_SESSION" \
  -d '{
    "backup_monitoring_excluded": true,
    "backup_monitoring_disabled_reason": "Server being decommissioned",
    "backup_monitoring_review_date": "2025-02-01"
  }'
# Expected: 200 success
```

#### Test 4: Database Constraint
Connect to database and try to violate constraint:
```sql
-- Should fail - excluded but no reason
UPDATE servers 
SET backup_monitoring_excluded = true,
    backup_monitoring_disabled_reason = NULL,
    backup_monitoring_review_date = '2025-02-01'
WHERE id = 'some-server-id';
-- Expected: Constraint violation error

-- Should succeed
UPDATE servers 
SET backup_monitoring_excluded = true,
    backup_monitoring_disabled_reason = 'Valid reason',
    backup_monitoring_review_date = '2025-02-01'
WHERE id = 'some-server-id';
```

### Visual Verification
- [ ] Reason textarea shows multiple lines
- [ ] Date picker has minimum date = today
- [ ] Required asterisks (*) are visible
- [ ] Error messages are clear and readable
- [ ] Hover card is wide enough for long reasons
- [ ] Dark mode styling looks good

## Production Deployment

### 1. Merge Branch
```bash
git add .
git commit -m "feat: Add required reason and review date for disabled backup monitoring"
git push origin feat-disabled-backup-monitoring-message
# Create PR and merge
```

### 2. Apply Migration to Production
```bash
cd apps/client-server/server-monitor
# Apply to production Supabase
npm run supabase:migration:apply:prod
```

### 3. Update Existing Data (if needed)
If there are servers with `backup_monitoring_excluded = true` but no reason/date:
```sql
-- Temporarily disable constraint
ALTER TABLE servers DROP CONSTRAINT backup_monitoring_exclusion_check;

-- Update servers with default values
UPDATE servers 
SET backup_monitoring_disabled_reason = 'Legacy exclusion - please review and update',
    backup_monitoring_review_date = CURRENT_DATE + INTERVAL '30 days'
WHERE backup_monitoring_excluded = true 
  AND (backup_monitoring_disabled_reason IS NULL OR backup_monitoring_review_date IS NULL);

-- Re-enable constraint
ALTER TABLE servers
ADD CONSTRAINT backup_monitoring_exclusion_check 
CHECK (
  (backup_monitoring_excluded = true AND backup_monitoring_disabled_reason IS NOT NULL AND backup_monitoring_review_date IS NOT NULL)
  OR
  (backup_monitoring_excluded = false AND backup_monitoring_disabled_reason IS NULL AND backup_monitoring_review_date IS NULL)
  OR
  (backup_monitoring_excluded IS NULL AND backup_monitoring_disabled_reason IS NULL AND backup_monitoring_review_date IS NULL)
);
```

## Future Enhancements (Optional)
- [ ] Add cron job to send reminders when review dates are approaching
- [ ] Add admin dashboard showing all servers with disabled monitoring and their review dates
- [ ] Add bulk update capability for review dates
- [ ] Add history/audit log of reason changes

## Rollback Plan
If issues arise, revert by:
1. Rolling back the migration:
   ```bash
   supabase migration down
   ```
2. Reverting code changes:
   ```bash
   git revert <commit-hash>
   ```
