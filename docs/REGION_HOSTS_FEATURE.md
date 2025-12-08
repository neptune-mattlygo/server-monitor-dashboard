# Region Support for Hosts - Implementation Summary

## Overview
Added the ability to assign Hosts to Regions and automatically include all servers in a Region when creating incidents.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/20241208000000_add_region_to_hosts.sql`
- Added `region_id` column to `hosts` table
- Created index for better query performance
- Links hosts to existing `regions` table

### 2. TypeScript Interfaces
Updated `Host` interface to include `region_id` in:
- `lib/supabase.ts`
- `app/dashboard/components/dashboard-client.tsx`
- `app/dashboard/components/edit-host-dialog.tsx`
- `app/dashboard/components/host-server-table.tsx`

### 3. UI Components

#### Add Host Dialog (`app/dashboard/components/add-host-dialog.tsx`)
- Added region dropdown selector
- Fetches available regions from `/api/admin/regions`
- Optional field - hosts can exist without a region

#### Edit Host Dialog (`app/dashboard/components/edit-host-dialog.tsx`)
- Added region dropdown selector
- Shows currently assigned region
- Allows changing or removing region assignment

### 4. API Endpoints

#### `/api/hosts` (POST)
- Accepts `region_id` in request body
- Creates host with region assignment

#### `/api/hosts/[id]` (PATCH)
- Accepts `region_id` in request body
- Updates host's region assignment

### 5. Incident Management

#### `/api/admin/incidents` (POST)
- **Key Feature**: When creating an incident with selected regions, automatically includes ALL servers in those regions
- Combines manually selected servers with region servers
- Removes duplicates from the final list

#### `/api/admin/incidents/[id]` (PATCH)
- **Key Feature**: When updating an incident, recalculates affected servers based on selected regions
- Ensures region changes automatically update the affected servers list

## How It Works

### Creating an Incident with Regions

1. User selects "Affected Regions" in the incident form (e.g., "US East", "EU West")
2. User can also manually select individual "Affected Servers"
3. Backend queries the database for all servers with `region_id` matching the selected regions
4. Combines manually selected servers with all servers from selected regions
5. Stores the complete list in `affected_servers` array
6. Also stores the selected region IDs in `affected_regions` array

### Example Flow

```
User creates incident:
- Selected Regions: ["US East Region"]
- Selected Servers: ["Manual Server 1"]

Backend processing:
- Finds all servers where region_id = "US East Region" 
  → ["Server A", "Server B", "Server C"]
- Combines: ["Manual Server 1"] + ["Server A", "Server B", "Server C"]
- Final affected_servers: ["Manual Server 1", "Server A", "Server B", "Server C"]
```

## Migration Instructions

### Local Development
The migration file has been created. To apply it:

```bash
# Option 1: If using Supabase CLI (may have version issues)
npx supabase db reset

# Option 2: Manual SQL in Supabase Studio
# Open http://localhost:54323
# Go to SQL Editor
# Run the contents of: supabase/migrations/20241208000000_add_region_to_hosts.sql
```

### Production (Vercel/Supabase)
```bash
# Connect to your Supabase project
npx supabase link --project-ref your-project-ref

# Push the migration
npx supabase db push
```

Or manually in Supabase Studio:
1. Go to your project dashboard
2. Navigate to SQL Editor
3. Copy and run the migration SQL

## Testing Checklist

- [ ] Add a new host with a region assigned
- [ ] Edit an existing host to assign/change region
- [ ] Create an incident and select a region
- [ ] Verify all servers in that region are automatically included
- [ ] Create an incident with both manual servers AND regions selected
- [ ] Verify no duplicate servers appear
- [ ] Edit an incident and change the selected regions
- [ ] Verify affected servers list updates accordingly

## Benefits

1. **Faster Incident Creation**: No need to manually select every server in a region
2. **Reduced Errors**: Automatic inclusion ensures no servers are missed
3. **Better Organization**: Hosts can be grouped by geographic or logical regions
4. **Scalability**: Easy to affect entire regions (e.g., "All US servers are down")
5. **Flexibility**: Can still manually select specific servers alongside regions

## Notes

- Hosts can exist without a region (region_id can be NULL)
- Servers already have region_id support (from previous migration)
- The incident UI already supports region selection
- Regions are managed in `/dashboard/admin/regions`
